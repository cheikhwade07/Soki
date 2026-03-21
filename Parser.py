import fitz
import re
from collections import defaultdict

# step 1: extract text from PDF file
# for now, profile is chosen based on input statement. Change when it comes time to communicate with website
#

#NOTE: Obsolete??
class deck:
    def __init__(self, title_str, content_list):
        self.title_str = title_str           #A string relating to content information for a page/slide
        self.content_list = content_list     #A list containg individual points/sentences from the text block

    def set_title(self, title_str):
        self.title_str = title_str

    def set_content(self, content_list):
        self.content_list = content_list


#NOTE: using dict for now??
deck_dict = defaultdict(list)

#creates/updates deck_dict
def create_decks (doc_name):
    global deck_dict

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
                        deck_dict[current_header] += text_content_storage.copy()
                        text_content_storage.clear()

                    elif (max(text_colour, key=text_colour.get, default=0) != common_colour) and not contains_banned_chars(block_text):     #TODO: fix minor repetition
                        #print((max(text_colour, key=text_colour.get, default=0)))
                        #print(common_colour)
                        #print(block_text)
                        current_header = block_text
                        deck_dict[current_header] += text_content_storage.copy()
                        text_content_storage.clear()

                    else:
                        split_block = ""
                        if "." in block_text:
                            split_block = block_text.split(".")
                        else:
                            split_block = block_text.split("\n")

                        for current_line in split_block:          #if text is the body
                            text_content_storage.append(current_line)
    
    if len(text_content_storage) > 0:
        deck_dict[current_header] += text_content_storage.copy()

    #TODO testing del later

    for current in deck_dict:
        print("KEY: ", current)
        print("VALUE: ", deck_dict[current])

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
#HELPER FUNCTION (UNUSED)
def clean_text(text):
    text = re.sub(r'\n+', '\n', text)      # remove extra newlines
    text = re.sub(r'\s+', ' ', text)       # normalize spaces
    return text.strip()                    #remove whitespace

#TODO FIX
#HELPER FUNCTION (UNUSED)
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

# main code ----------------------------

doc_name = input ("Input name of PDF: ")

create_decks(doc_name)