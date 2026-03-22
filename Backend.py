import fitz
import re
from collections import defaultdict
from fsrs import State, Scheduler, Card, Rating, ReviewLog
from datetime import *
from google import genai
import math


# PDF PARSER ---------------------------------------------------------------------------------------------------------------------------------------------------

#main means of storing info for now
card_dict = defaultdict(list)

#creates/updates deck_dict
def update_card_dict (doc_name):
    global card_dict

    body_size = determine_body_size_and_colour(doc_name)
    common_colour = int(body_size[1])
    body_size = int(body_size[0])

    current_header = "UNSORTED"
    text_content_storage = []                       #since titles are parsed after text content, store text content here until title is found


    with fitz.open(doc_name) as doc:
        for page in doc:
            data = page.get_text("dict")
            for block in data["blocks"]:
                if block["type"] == 0:
                    block_text = ""
                    text_size = defaultdict(int)
                    text_colour = defaultdict(int)
                    for line in block["lines"]:
                        for span in line["spans"]:
                            block_text += (span["text"] + " ")
                            text_size[round(span["size"],1)] += len(span["text"])
                            text_colour[span["color"]] += 1

                    if max(text_size, key=text_size.get, default=0) > body_size:       #if text is within header size range
                        #print(max(text_size, key=text_size.get, default=0))
                        #print(body_size)
                        #print(block_text)
                        current_header = block_text
                        card_dict[current_header] += text_content_storage.copy()
                        text_content_storage.clear()

                    elif (max(text_colour, key=text_colour.get, default=0) != common_colour) and not contains_banned_chars(block_text):     #Minor repetition here, kinda bad but eh
                        #print((max(text_colour, key=text_colour.get, default=0)))
                        #print(common_colour)
                        #print(block_text)
                        current_header = block_text
                        card_dict[current_header] += text_content_storage.copy()
                        text_content_storage.clear()

                    else:                                                           #if text is the body
                        text_content_storage.append(block_text)

                        #removed for efficiency gain with question generation
                        """
                        split_block = ""
                        if "." in block_text:
                            split_block = block_text.split(".")
                        else:
                            split_block = block_text.split("\n")

                        for current_line in split_block:
                            text_content_storage.append(current_line)
                        
                        """
    if len(text_content_storage) > 0:
        card_dict[current_header] += text_content_storage.copy()

    #TODO testing del later

    #for current in card_dict:
        #print("KEY: ", current)
        #print("VALUE: ", card_dict[current])

                #print("BLOCK: " + clean_text(block[4]))  # actual text


#Return true if at least one banned character is in text
#used to assist sorting of headers
#HELPER FUNCTION
def contains_banned_chars(text):
    if ("." in text or
        "," in text or
        "figure" in text.lower() or
        "table" in text.lower()):
        return True
    return False

#removes uneeded string characters
#HELPER FUNCTION (U)
def clean_text(text):
    text = re.sub(r'\n+', '\n', text) 
    text = re.sub(r'\s+', ' ', text)       
    return text.strip()                    

#HELPER FUNCTION (UB)
def detect_tables(doc_name):
    doc = fitz.open(doc_name)

    for page in doc:
        words = page.get_text("words")  # (x0, y0, x1, y1, word, block, line, word_no)
        
        rows = dict(list)

        for w in words:
            y = round(w[1], 1)  # group by y position (row)
            rows[y].append(w)

        for y, row_words in rows.items():
            if len(row_words) >= 3:  # multiple columns
                xs = [round(w[0], 1) for w in row_words]
                
                # Check for alignment (columns)
                if len(set(xs)) >= 3:
                    print("Possible table row:", [w[4] for w in row_words])

#returns the text size of the "body" content. Text size is determined by finding the 3 most common text sizes (calculated by character count) and returning the largest
#Return Tuple("most" common text size (int), most common colour (int))
#HELPER FUNCTION
def determine_body_size_and_colour(doc_name):
    with fitz.open(doc_name) as doc:
        size_dict = defaultdict(int)
        colour_dict = defaultdict(int)

        for page in doc:
            data = page.get_text("dict")
        
            for block in data["blocks"]:
                if block["type"] == 0:
                    for line in block["lines"]:
                        for span in line["spans"]:
                            size = round(span["size"], 1)
                            text_length = len(span["text"])
                            colour = span["color"]

                            size_dict[size] += text_length
                            colour_dict[colour] += 1
    

    output = sorted(size_dict.items(), key=lambda x: x[1], reverse=True)
    output2 = sorted(colour_dict.items(), key=lambda x: x[1], reverse = True)

    #for x, y in output2:
        #print("TEST KEY: ", x, "TEST VALUE: ", y)

    #for x, y in output:
        #print("TEST KEY: ", x, "TEST VALUE: ", y)

    return (max(output[0][0], output[1][0], output[2][0]), output2[0][0])



# FSRS ALGORITHM ------------------------------------------------------------------------------------------------------------------------

#SEND SOME INFO TO FRONTEND AS APPLICABLE
class card_frontend:
    def __init__(self, title_str, question, answer, fsrs_card, review_log = []):
        self.title_str = title_str           #Overall topic of card. Should be key from card_dict.
        self.question = question             #A string containing the question. Should be generated by AI
        self.answer = answer                 #A string containing the answer to the question. Should be generated by AI
        self.fsrs_card = fsrs_card           #An FSRS card object. Should be generated from FSRS. Backend only
        if review_log is not None:
            self.review_log = review_log     #history of card reviews. Backend only

    def set_title(self, title_str):
        self.title_str = title_str

    def set_question(self, question):
        self.question = question

    def set_answer(self, answer):
        self.answer = answer

    def set_content(self, content_list):
        self.content_list = content_list

    def set_fsrs_card(self, fsrs_card):
        self.fsrs_card = fsrs_card

    def set_review_log(self, log):
        self.review_log = log

    def append_review_log(self, log):
        self.review_log.append(log)

#constants
DESIRED_RETENTION = 0.9
MAX_RETENTION_INTERVAL = 365

#suggested default weights for FSRS for average person
DEFAULT_WEIGHTS = (0.212, 1.2931, 2.3065, 8.2956, 6.4133, 0.8334, 3.0194, 0.001, 1.8722, 0.1666, 0.796, 1.4835, 0.0614, 0.2629, 1.6483, 0.6014, 1.8729, 0.5425, 0.0912, 0.0658, 0.1542)

DEFAULT_LEARNING = timedelta(minutes=5)


#Assume desired retention rate will always be 90%
#Assume fuzz will always be on
#@param parameters (list): contains 21 floats that represent the optimized weights for user. Determines impact of calculations
#@param learning_steps (list): contains datetime objects that represent initial learning scheduling times. The number of initial review times (before FSRS takes over) corresponds to length of list
#@param relearning_steps (list): contains datetime objects that represent "relapse" relearning scheduling times. The number of "relapse" review times (before FSRS takes over) corresponds to length of list
#Return: Scheduler object
def create_custom_scheduler(parameters, learning_steps, relearning_steps):
    return Scheduler(parameters, DESIRED_RETENTION, learning_steps, relearning_steps, MAX_RETENTION_INTERVAL, True)

#create scheduler with default values
def create_scheduler():
    return Scheduler(DEFAULT_WEIGHTS, DESIRED_RETENTION, DEFAULT_LEARNING, DEFAULT_LEARNING, MAX_RETENTION_INTERVAL, True)


#Assume only 1 step is needed
#@param id (int): id of the card
#@param state (State): current enum state (learning, relearning, review)
    #learning = never-before seen info
    #relearning = user answered "Again" when reviewing card
    #review = user successfully remembered information
#@param step (int): current learning or relearning step
#@param stability (float): math calculation
#@param difficulty (float): math calculation
#@param due (datetime): date when the card should be reviewed next
#@param last_review (datetime): date when the card was last reviewed
#Return: Card object
#HELPER FUNCTION
def create_custom_card(id, state = State.Learning, stability = None, difficulty = None, due = None, last_review = None):
    return Card(id, state, 1, stability, difficulty, due, last_review)


#Use after user reviews card. Returns updated card information according to FSRS
#@param scheduler (Scheduler): the scheduler object information
#@param card_info (Card_info): the custom Card_info object that contains the card
#@param rating (Rating): the user feedback on rating
#@param date (datetime): the date in which the user reviewed the card
#Return: updated card_info information
def card_feedback(scheduler, card_info, rating, date):
    new_card_info = scheduler.review_card(card_info.fsrs_card, rating, date)
    card_info.append_review_log(new_card_info[1])
    card_info.set_fsrs_card(new_card_info[0])
    return card_info

#Use when optimizing scheduler to determine new review date
#@param scheduler (Scheduler): the scheduler object information
#@param card_info (Card_info): the custom Card_info object that contains the card
#@param review_logs (list): list containing Datetimes that correspond to all review times
def update_card(scheduler, card_info, review_logs):
    new_card_info = scheduler.review_card(card_info.fsrs_card, review_logs)
    card_info.set_fsrs_card(new_card_info)
    return card_info

#@param rating (int) represents user feedback
#@param stability (float) represents previous stability
#return new S value
#HELPER FUNCTION (U)
def calculate_stability(stability, rating):
    exponent = DEFAULT_WEIGHTS[17] * (rating - 3 + DEFAULT_WEIGHTS[18]) * (stability ** DEFAULT_WEIGHTS[19])
    return stability * (math.e ** exponent)



# QUESTION GENERATION ---------------------------------------------------------------------------------------------------------------

#Return: tuple of strings in format of (question, answer)
#@param api the API key
#@param content the content to generate a question/answer from
#HELPER FUNCTION
def generate_question_and_answer(api, content):
    client = genai.Client(api_key = api)

    temp_content = " ".join(content)

    try:
        response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents = "Generate a question and answer based on the following content. YOUR RESPONSE MUST ONLY BE A SINGLE TUPLE IN THE FORMAT OF 'question', 'answer' WITHOUT ANY OTHER TEXT BEING PRESENT. If the content is unsuitable for the generation of a question, simply return 'Error, Error' Here is the content now: " + temp_content
        )
    except:
        return ("Error", "Error")

    #print(response.text)
    try:
        to_return = response.text.split(",")
    except:
        return ("Error", "Error")
    
    return (to_return[0], to_return[1])

#create card_frontend from scratch
#stability and difficulty are placeholder values for now (0 and 10 respectively)
def generate_card_info(id, title_str, content, api):
    question_and_answer = generate_question_and_answer(api, content)
    question = question_and_answer[0]
    answer = question_and_answer[1]

    if "Error" in question or "Error" in answer:
        return "Error"

    card = create_custom_card(id)

    return card_frontend(title_str, question, answer, card)

#return list of card_frontend objects
def generate_all_card_infos(dict, api):
    id_counter = 0
    list_builder = []

    for current_key in dict:
        to_append = generate_card_info(id_counter, current_key, dict[current_key], api)
        if type(to_append) != str:
            list_builder.append(to_append)
            id_counter += 1
    
    list_builder.sort(key = lambda c: c.fsrs_card.due)
    return list_builder



# main code ---------------------------------------------------------------------------------------------------------------------------

update_card_dict("test2.pdf")

for current in card_dict:
    print("KEY: ", current)
    print("VALUE: ", card_dict[current])

##value = generate_all_card_infos(card_dict, "AIzaSyBMg6Rp00Oe38fGxRpjAeHfk5wFr6tZzmE")

print("SWEET MOSES IT WORKS")

#for x in value:
    #print(x.fsrs_card.card_id)
    #print(x.title_str)
    #print(x.question)
    #print(x.answer)