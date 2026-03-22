import fitz
import re
import os
import tempfile
import json
from collections import defaultdict
from fsrs import State, Scheduler, Card, Rating, ReviewLog
from datetime import *
from google import genai
import math
from fastapi import Body, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware


def safe_log(*parts):
    message = " ".join(str(part) for part in parts)
    try:
        print(message)
    except UnicodeEncodeError:
        print(message.encode("ascii", errors="replace").decode("ascii"))


# PDF PARSER ---------------------------------------------------------------------------------------------------------------------------------------------------

#creates/updates deck_dict
def update_card_dict(doc_name):
    card_dict = defaultdict(list)

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

    return card_dict


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

    def to_api_dict(self):
        return {
            "title": clean_text(self.title_str),
            "card_type": "flashcard",
            "front": clean_text(self.question).strip("'\""),
            "back": clean_text(self.answer).strip("'\""),
            "review_state": {
                "card_id": self.fsrs_card.card_id,
                "stability": self.fsrs_card.stability,
                "difficulty": self.fsrs_card.difficulty,
                "due": self.fsrs_card.due.isoformat() if self.fsrs_card.due else None,
                "state": self.fsrs_card.state.name if hasattr(self.fsrs_card.state, "name") else str(self.fsrs_card.state),
                "last_review": self.fsrs_card.last_review.isoformat() if self.fsrs_card.last_review else None,
            },
        }

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
    return Scheduler()


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


def normalize_datetime(value):
    if value is None:
        return None

    if isinstance(value, datetime):
        parsed = value
    else:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))

    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)

    return parsed.astimezone(timezone.utc)


def normalize_state(value):
    lowered = str(value or "").lower()
    if lowered == "new":
        return State.Learning
    if lowered == "review":
        return State.Review
    if lowered == "relearning":
        return State.Relearning
    return State.Learning


def normalize_rating(value):
    lowered = str(value or "").lower()
    if lowered == "again":
        return Rating.Again
    if lowered == "hard":
        return Rating.Hard
    if lowered == "easy":
        return Rating.Easy
    return Rating.Good


def normalize_numeric_review_state(review_state):
    stability = review_state.get("stability")
    difficulty = review_state.get("difficulty")
    state = normalize_state(review_state.get("state"))

    normalized_stability = None
    if stability is not None:
        try:
            parsed_stability = float(stability)
            if parsed_stability > 0:
                normalized_stability = parsed_stability
        except (TypeError, ValueError):
            normalized_stability = None

    normalized_difficulty = None
    if difficulty is not None:
        try:
            parsed_difficulty = float(difficulty)
            if parsed_difficulty > 0:
                normalized_difficulty = parsed_difficulty
        except (TypeError, ValueError):
            normalized_difficulty = None

    if state == State.Learning and normalized_stability is None:
        normalized_difficulty = None if normalized_difficulty == 5 else normalized_difficulty

    return {
        "state": state,
        "stability": normalized_stability,
        "difficulty": normalized_difficulty,
    }


def serialize_review_result(card_id, updated_card, review_log):
    state_name = updated_card.state.name if hasattr(updated_card.state, "name") else str(updated_card.state)
    rating_name = review_log.rating.name if hasattr(review_log.rating, "name") else str(review_log.rating)
    return {
        "card_id": card_id,
        "review_state": {
            "stability": updated_card.stability,
            "difficulty": updated_card.difficulty,
            "due": updated_card.due.isoformat() if updated_card.due else None,
            "state": state_name,
            "last_review": updated_card.last_review.isoformat() if updated_card.last_review else None,
        },
        "review_log": {
            "rating": rating_name,
            "review_datetime": review_log.review_datetime.isoformat() if review_log.review_datetime else None,
            "review_duration": review_log.review_duration,
        },
    }


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

GENERATION_BATCH_SIZE = 6
MAX_GENERATION_SECTIONS = 18


def strip_json_fences(text):
    cleaned = text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        if len(lines) >= 3:
            lines = lines[1:]
            if lines and lines[-1].strip().startswith("```"):
                lines = lines[:-1]
            cleaned = "\n".join(lines).strip()
    return cleaned


def is_low_value_title(title):
    lowered = clean_text(title).lower()
    banned_keywords = [
        "announcement",
        "overview",
        "questions",
        "website",
        "brightspace",
        "office",
        "office hours",
        "who am i",
        "who are you",
        "words of advice",
        "artificial intelligence (ai) policy",
        "documenting use of ai",
    ]
    return any(keyword in lowered for keyword in banned_keywords)


def section_text_length(content):
    return len(clean_text(" ".join(content)))


def select_generation_sections(card_dict):
    candidates = []

    for title, content in card_dict.items():
        cleaned_title = clean_text(title)
        cleaned_content = [clean_text(item) for item in content if clean_text(item)]
        content_length = section_text_length(cleaned_content)

        if not cleaned_title or not cleaned_content:
            continue

        if is_low_value_title(cleaned_title):
            continue

        if content_length < 80:
            continue

        candidates.append(
            {
                "title": cleaned_title,
                "content": cleaned_content,
                "content_length": content_length,
            }
        )

    candidates.sort(key=lambda section: section["content_length"], reverse=True)
    return candidates[:MAX_GENERATION_SECTIONS]


def build_card_from_generated(id, title, question, answer):
    card = create_custom_card(id)
    return card_frontend(title, question, answer, card)


def generate_cards_for_batch(api, sections):
    client = genai.Client(api_key = api)
    payload_sections = [
        {
            "title": section["title"],
            "content": " ".join(section["content"]),
        }
        for section in sections
    ]

    try:
        response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents = (
            "You are generating study flashcards from lecture material. "
            "Ignore administrative, contact, scheduling, and low-value content. "
            "For each useful section, generate exactly one concise study flashcard. "
            "Return ONLY valid JSON in this exact format: "
            "{\"cards\":[{\"title\":\"...\",\"question\":\"...\",\"answer\":\"...\"}]}. "
            "If no sections are useful, return {\"cards\":[]}. "
            "Do not use markdown fences. "
            "Here are the sections now: " + json.dumps(payload_sections)
        )
        )
    except Exception as error:
        message = f"Gemini request failed: {error}"
        safe_log(message)
        return {
            "cards": [],
            "error": message,
        }

    try:
        raw_text = strip_json_fences(response.text)
        safe_log("Gemini raw response:", raw_text)
        parsed = json.loads(raw_text)
        cards = parsed.get("cards", [])
        if not isinstance(cards, list):
            return {
                "cards": [],
                "error": "Gemini returned an invalid cards payload.",
            }
        return {
            "cards": cards,
            "error": None,
        }
    except Exception as error:
        message = f"Gemini response parsing failed: {error}"
        safe_log(message)
        return {
            "cards": [],
            "error": message,
        }

#return list of card_frontend objects
def generate_all_card_infos(dict, api):
    id_counter = 0
    list_builder = []
    failures = []

    safe_log("Parsed section count:", len(dict))
    sections = select_generation_sections(dict)
    safe_log("Selected section count for generation:", len(sections))

    if len(sections) == 0:
        return {
            "cards": [],
            "failures": [
                {
                    "title": "PDF content",
                    "error": "No high-value sections were found for card generation.",
                }
            ],
            "parsed_section_count": len(dict),
        }

    for index in range(0, len(sections), GENERATION_BATCH_SIZE):
        batch = sections[index:index + GENERATION_BATCH_SIZE]
        batch_result = generate_cards_for_batch(api, batch)

        if batch_result["error"]:
            for section in batch:
                failures.append(
                    {
                        "title": section["title"],
                        "error": batch_result["error"],
                    }
                )
            continue

        returned_cards = batch_result["cards"]
        matched_titles = set()

        for raw_card in returned_cards:
            title = clean_text(raw_card.get("title", ""))
            question = clean_text(raw_card.get("question", ""))
            answer = clean_text(raw_card.get("answer", ""))

            if not title or not question or not answer:
                continue

            matched_titles.add(title)
            list_builder.append(build_card_from_generated(id_counter, title, question, answer))
            id_counter += 1

        for section in batch:
            if section["title"] not in matched_titles:
                failures.append(
                    {
                        "title": section["title"],
                        "error": "Skipped by the model or judged not useful enough for a flashcard.",
                    }
                )

    safe_log("Generated card count:", len(list_builder))
    safe_log("Failed section count:", len(failures))

    list_builder.sort(key = lambda c: c.fsrs_card.due)
    return {
        "cards": list_builder,
        "failures": failures,
        "parsed_section_count": len(dict),
    }



app = FastAPI(title="Soki Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def save_uploaded_pdf(upload: UploadFile):
    suffix = os.path.splitext(upload.filename or "")[1] or ".pdf"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        temp_file.write(upload.file.read())
        return temp_file.name


def parse_pdf_sections(file_path):
    parsed = update_card_dict(file_path)
    return [
        {
            "title": clean_text(title),
            "content": [clean_text(item) for item in content],
        }
        for title, content in parsed.items()
    ]


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/parse-pdf")
def parse_pdf(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing file name.")

    temp_path = save_uploaded_pdf(file)

    try:
        return {
            "sections": parse_pdf_sections(temp_path),
        }
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@app.post("/generate-cards")
def generate_cards(
    file: UploadFile = File(...),
    api_key: str = Form(...),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing file name.")

    temp_path = save_uploaded_pdf(file)

    try:
        parsed = update_card_dict(temp_path)
        generation_result = generate_all_card_infos(parsed, api_key)
        generated_cards = generation_result["cards"]
        failures = generation_result["failures"]

        if len(parsed) == 0:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "No usable sections were found in the PDF.",
                    "parsed_section_count": 0,
                },
            )

        if len(generated_cards) == 0:
            raise HTTPException(
                status_code=502,
                detail={
                    "error": "The AI could not generate any cards from this PDF.",
                    "parsed_section_count": generation_result["parsed_section_count"],
                    "failed_section_count": len(failures),
                    "failures": failures[:5],
                },
            )

        return {
            "parsed_section_count": generation_result["parsed_section_count"],
            "failed_section_count": len(failures),
            "failures": failures[:5],
            "cards": [card.to_api_dict() for card in generated_cards],
        }
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@app.post("/review-card")
def review_card(payload: dict = Body(...)):
    try:
        card_id = str(payload.get("card_id") or "")
        rating_value = payload.get("rating")
        review_state = payload.get("review_state") or {}
        response_ms = payload.get("response_ms")
        normalized_review_state = normalize_numeric_review_state(review_state)

        if not card_id:
            raise HTTPException(status_code=400, detail="Missing card_id.")

        if not rating_value:
            raise HTTPException(status_code=400, detail="Missing rating.")

        scheduler = create_scheduler()
        fsrs_card = create_custom_card(
            None,
            normalized_review_state["state"],
            normalized_review_state["stability"],
            normalized_review_state["difficulty"],
            normalize_datetime(review_state.get("due")),
            normalize_datetime(review_state.get("last_review")),
        )

        updated_card, review_log = scheduler.review_card(
            fsrs_card,
            normalize_rating(rating_value),
            datetime.now(timezone.utc),
            response_ms,
        )

        return serialize_review_result(card_id, updated_card, review_log)
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))
