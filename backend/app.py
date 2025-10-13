
import requests
import os
import random
import json 
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv() 


API_KEY = os.getenv("GEMINI_API_KEY") 
MONGO_URI = os.getenv("MONGODB_URL")
DB_NAME = "test"
COLLECTION_NAME = "characters"
MODEL_NAME = "gemini-2.5-flash-preview-05-20"


all_characters = [] # Stores all characters fetched from the DB
remaining_character_list = [] # List of characters yet to be guessed (shuffled)
CURRENT_CHARACTER_DATA = {} # The character for the current round
total_rounds = 0

def initialize_game_state():
    """Connects to MongoDB, loads all characters, shuffles them, and sets up Round 1."""
    global all_characters
    global remaining_character_list
    global CURRENT_CHARACTER_DATA
    global total_rounds
    
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        character_collection = db[COLLECTION_NAME]

        all_characters = list(character_collection.find({}, {'_id': 0})) 

        if not all_characters:
            print("--- DATABASE WARNING ---")
            print("Database is empty. Please run the data population script first!")
            client.close()
            return

        total_rounds = len(all_characters)
        
        # Shuffle the list and copy it to the remaining list
        random.shuffle(all_characters)
        remaining_character_list = list(all_characters)
        
        start_next_round()
        
        client.close()
        print(f"Game Initialized. Total Characters: {total_rounds}")

    except Exception as e:
        print(f"Fatal Error connecting to DB or initializing game: {e}")
        CURRENT_CHARACTER_DATA = {} 


def start_next_round():
    """Selects the next character from the remaining list and updates the global state."""
    global remaining_character_list
    global CURRENT_CHARACTER_DATA
    
    if not remaining_character_list:
        # No more characters left
        CURRENT_CHARACTER_DATA = {}
        return False

    # Pop the next character (first in the shuffled list)
    next_char = remaining_character_list.pop(0) 
    CURRENT_CHARACTER_DATA = next_char
    
    print(f"Round started. Character to guess is: {CURRENT_CHARACTER_DATA['CHARACTER']}")
    return True

initialize_game_state()



def call_gemini_api(system_prompt, user_query, character_context):
    """
    Calls the Gemini API with structured instructions and character data.
    (Error handling and structure retained from original file)
    """
    if not API_KEY:
        print("⚠️ WARNING: GEMINI_API_KEY not found!")
        return "ERROR: API key not configured." 
    
    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL_NAME}:generateContent?key={API_KEY}"
    
    full_prompt = f"The user is asking: '{user_query}'\n\nCharacter Data:\n{character_context}"

    payload = {
        "contents": [{"parts": [{"text": full_prompt}]}],
        "systemInstruction": {"parts": [{"text": system_prompt}]},
    }
    
    try:
        response = requests.post(
            api_url, 
            headers={'Content-Type': 'application/json'}, 
            json=payload
        )
        response.raise_for_status()
        
        result = response.json()
        
        text = result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', 'NOT FOUND')
        
        return text.strip()

    except requests.exceptions.RequestException as e:
        print(f"Gemini API Request Error: {e}")
        return "ERROR: Could not communicate with the Gemini API."
    except Exception as e:
        print(f"Gemini API Response Parsing Error: {e}")
        return "ERROR: Invalid response from Gemini API."

app = Flask(__name__)
CORS(app)

def check_answer_with_gemini(question: str, dataset: dict) -> str:
    if not dataset:
        return "ERROR: Game not initialized. Check database connection."

    #layer1 sec
    forbidden_patterns = [
        'character', 'name', 'who is', 'who are', "who's", 
        'what is the character', 'tell me who', 'reveal',
        'character name', "character's name", 'identity',
        'what character', 'which character'
    ]
    
    question_lower = question.lower().strip()
    
    # Block any question asking about character identity
    for pattern in forbidden_patterns:
        if pattern in question_lower:
            return "NOT FOUND"
          
    #layer2 sec
    system_instruction = (
        "You are a strict trivia game master. Your task is to analyze the user's question "
        "and determine the correct response based ONLY on the provided JSON data about the character. "
        "Your response MUST adhere to one of the following formats:\n"
        "1. The character's NAME has been REMOVED from the data you receive.\n"
        "2. NEVER mention, hint at, or reveal any character identity or name.\n"
        "3. If asked 'What is the character?' or 'Who is it?' or 'What is the name?', "
        "respond ONLY with 'NOT FOUND'.\n"
        "4. For YES/NO questions (e.g., 'Is the character male?'), respond ONLY with 'TRUE' or 'FALSE'.\n"
        "5. For VALUE questions (e.g., 'What is the gender?'), respond with the exact value from JSON.\n"
        "6. If the answer is not in the provided data, respond with 'NOT FOUND'.\n"
        "7. NEVER use fields that reveal identity: 'SOURCE' .\n"
        "8. Keep responses concise - single word or very short phrase only.\n\n"
        "EXAMPLE RESPONSES:\n"
        "Q: 'Is the character male?' → 'TRUE' or 'FALSE'\n"
        "Q: 'What is the gender?' → 'MALE'\n"
        "Q: 'Is it a villain?' → 'TRUE' or 'FALSE'\n"
        "Q: 'What is the character?' → 'NOT FOUND'\n"
        "Q: 'Who is this?' → 'NOT FOUND'\n"
        "Q: 'What is the character name?' → 'NOT FOUND'"
    )
    
    #layer3 sec
    safe_dataset = {
        k: v for k, v in dataset.items() 
        if k not in ['CHARACTER', 'SOURCE', '_id']
    }
    character_context = json.dumps(safe_dataset, indent=2)

    gemini_response = call_gemini_api(system_instruction, question, character_context)
    
    if "ERROR" in gemini_response:
        return gemini_response

    # Check for BINGO! - The user guesses the name
    if question.lower().strip().replace('?', '').replace('!', '') == dataset.get("CHARACTER", "").lower():
        return "BINGO!"
        
    return gemini_response.upper() 

# Function to generate hints (using the dynamically loaded character data)
def generate_hint(past_answers, current_dataset):
    if len(past_answers) < 2:
        return "Ask more questions to get hints!"

    past_answer_strings = [str(item.get('answer', '')) for item in past_answers]

    # Check if the last two answers were FALSE or NOT FOUND
    last_two_negative = all("FALSE" in ans or "NOT FOUND" in ans for ans in past_answer_strings[-2:])

    if last_two_negative:
        # Get a random attribute key for a subtle hint
        keys = [k for k in current_dataset.keys() if k not in ['CHARACTER', 'SOURCE', 'PORTRAYED_BY', '_id']]
        if keys:
            random_key = random.choice(keys)
            # Make the hint subtle, converting snake_case to readable text
            hint_text = random_key.lower().replace('_', ' ')
            return f"Hint: Maybe focus on the character's **{hint_text}**..."
        else:
            return "Try asking about the character's origin film!"
    else:
        return "You're going in the right direction! Keep the good questions coming."

@app.route('/api/ask', methods=['POST'])
def ask_question():
    """Handles user questions for the current character."""
    data = request.json
    question = data.get('question', '')
    past_answers = data.get('pastAnswers', [])

    if not CURRENT_CHARACTER_DATA:
         return jsonify({
            'answer': "ERROR: No character loaded for this round. Try /api/next_character.",
            'hint': "Game Error.",
            'gameOver': True
        })
    if not question.strip():
        return jsonify({
            'answer': "ERROR: Please ask a question.",
            'hint': "Try again!",
            'gameOver': False
        })
        
    # complex question to Gemini
    answer = check_answer_with_gemini(question, CURRENT_CHARACTER_DATA)

    hint = generate_hint(past_answers, CURRENT_CHARACTER_DATA)

    response = {
        'answer': answer,
        'hint': hint,
        'gameOver': "BINGO!" in answer
    }

    return jsonify(response) 

@app.route('/api/next_character', methods=['GET'])
def get_next_character_round():
    """Starts the next round after a BINGO! and returns the game status."""
    
    if not remaining_character_list:
        return jsonify({
            "status": "GAME_OVER_ALL_ROUNDS",
            "message": f"Congratulations! You guessed all {total_rounds} characters."
        }), 200

    # Start the next round
    if start_next_round():
        # Success
        return jsonify({
            "status": "NEXT_ROUND_STARTED",
            # "character_name": CURRENT_CHARACTER_DATA.get('CHARACTER', 'Unknown'),
            "remaining_rounds": len(remaining_character_list) + 1, # +1 because CURRENT_CHARACTER_DATA is the current round
            "total_rounds": total_rounds,
            "message": "New round started! Start asking questions."
        }), 200
    else:
        return jsonify({
            "status": "GAME_OVER_ALL_ROUNDS",
            "message": "No characters remaining."
        }), 200


@app.route('/api/status', methods=['GET'])
def get_game_status():
    """Provides initial game status for the Next.js frontend on load."""
    return jsonify({
        # "current_character": CURRENT_CHARACTER_DATA.get('CHARACTER', 'N/A') if CURRENT_CHARACTER_DATA else 'N/A',
        "total_rounds": total_rounds,
        "remaining_rounds": len(remaining_character_list) + (1 if CURRENT_CHARACTER_DATA else 0),
        "game_ready": True if CURRENT_CHARACTER_DATA else False
    })


if __name__ == '__main__':
    print("🚀 Starting Flask server...")
    print("📊 Server: http://127.0.0.1:5000")
    app.run(host='127.0.0.1', debug=True, port=5000, use_reloader=False)
