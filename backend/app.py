import requests
import os
import random
import json 
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
from datetime import timedelta

load_dotenv() 

API_KEY = os.getenv("GEMINI_API_KEY") 
MONGO_URI = os.getenv("MONGODB_URL")
DB_NAME = "test"
COLLECTION_NAME = "characters"
MODEL_NAME = "gemini-2.5-flash-preview-05-20"
FRONTEND_URL = os.getenv("FRONTEND_URL")

ALL_CHARACTERS = []

# Store game state per user (user_id -> game_state)
USER_GAME_STATES = {}

def load_all_characters():
    """Load all characters from MongoDB once at startup."""
    global ALL_CHARACTERS
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        character_collection = db[COLLECTION_NAME]
        ALL_CHARACTERS = list(character_collection.find({}, {'_id': 0}))
        client.close()
        
        if not ALL_CHARACTERS:
            print("--- DATABASE WARNING ---")
            print("Database is empty. Please run the data population script first!")
        else:
            print(f"Loaded {len(ALL_CHARACTERS)} characters from database")
    except Exception as e:
        print(f"Fatal Error connecting to DB: {e}")

load_all_characters()


def initialize_user_game(user_id):
    """Initialize game state for a specific user."""
    if not ALL_CHARACTERS:
        return False
    
    # Create a shuffled copy for this user
    shuffled_characters = list(ALL_CHARACTERS)
    random.shuffle(shuffled_characters)
    
    USER_GAME_STATES[user_id] = {
        'remaining_characters': shuffled_characters,
        'total_rounds': len(shuffled_characters),
        'current_round': 0,
        'current_character': None,
    }
    
    return start_next_round_for_user(user_id)


def start_next_round_for_user(user_id):
    """Start the next round for a specific user."""
    if user_id not in USER_GAME_STATES:
        initialize_user_game(user_id)
    
    game_state = USER_GAME_STATES[user_id]
    remaining = game_state.get('remaining_characters', [])
    
    if not remaining:
        game_state['current_character'] = None
        return False
    
    # Pop the next character
    next_char = remaining.pop(0)
    game_state['remaining_characters'] = remaining
    game_state['current_character'] = next_char
    game_state['current_round'] = game_state.get('current_round', 0) + 1
    
    print(f"User {user_id}: Round {game_state['current_round']}, Character: {next_char.get('CHARACTER')}")
    return True


def call_gemini_api(system_prompt, user_query, character_context):
    """Calls the Gemini API with structured instructions and character data."""
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


CORS_ORIGINS = ["http://localhost:3000"] 

if FRONTEND_URL:
    origins_to_add = [url.strip().rstrip('/') for url in FRONTEND_URL.split(',') if url.strip()]
    CORS_ORIGINS.extend(origins_to_add)
    
CORS_ORIGINS.append("https://clockout3.vercel.app") 

app = Flask(__name__)
CORS(app, origins=CORS_ORIGINS, supports_credentials=True)


def check_answer_with_gemini(question: str, dataset: dict) -> str:
    if not dataset:
        return "ERROR: Game not initialized. Check database connection."

    forbidden_patterns = [
        'character', 'name', 'who is', 'who are', "who's", 
        'what is the character', 'tell me who', 'reveal',
        'character name', "character's name", 'identity',
        'what character', 'which character'
    ]
    
    question_lower = question.lower().strip()
    
    for pattern in forbidden_patterns:
        if pattern in question_lower:
            return "NOT FOUND"
          
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


def generate_hint(past_answers, current_dataset):
    if len(past_answers) < 2:
        return "Ask more questions to get hints!"

    past_answer_strings = [str(item.get('answer', '')) for item in past_answers]
    last_two_negative = all("FALSE" in ans or "NOT FOUND" in ans for ans in past_answer_strings[-2:])

    if last_two_negative:
        keys = [k for k in current_dataset.keys() if k not in ['CHARACTER', 'SOURCE', 'PORTRAYED_BY', '_id']]
        if keys:
            random_key = random.choice(keys)
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
    user_id = data.get('user_id')  # NEW: Get user ID from request
    question = data.get('question', '')
    past_answers = data.get('pastAnswers', [])

    # Validate user_id
    if not user_id:
        return jsonify({
            'answer': "ERROR: User ID is required.",
            'hint': "Invalid request.",
            'gameOver': True
        }), 400

    # Get user's game state
    if user_id not in USER_GAME_STATES:
        initialize_user_game(user_id)
    
    game_state = USER_GAME_STATES[user_id]
    current_character = game_state.get('current_character')
    
    if not current_character:
        return jsonify({
            'answer': "ERROR: No character loaded for this round. Try /api/next_character.",
            'hint': "Game Error.",
            'gameOver': True
        }), 400
    
    if not question.strip():
        return jsonify({
            'answer': "ERROR: Please ask a question.",
            'hint': "Try again!",
            'gameOver': False
        })

    answer = check_answer_with_gemini(question, current_character)
    hint = generate_hint(past_answers, current_character)

    response = {
        'answer': answer,
        'hint': hint,
        'gameOver': "BINGO!" in answer
    }
    return jsonify(response)


@app.route('/api/next_character', methods=['GET'])
def get_next_character_round():
    """Starts the next round after a BINGO!"""
    user_id = request.args.get('user_id')  # NEW: Get user ID from query params
    
    if not user_id:
        return jsonify({
            "status": "ERROR",
            "message": "User ID is required."
        }), 400

    if user_id not in USER_GAME_STATES:
        initialize_user_game(user_id)
    
    game_state = USER_GAME_STATES[user_id]
    remaining = game_state.get('remaining_characters', [])
    
    if not remaining:
        return jsonify({
            "status": "GAME_OVER_ALL_ROUNDS",
            "message": f"Congratulations! You guessed all characters."
        }), 200

    if start_next_round_for_user(user_id):
        total = game_state.get('total_rounds', 0)
        current_round = game_state.get('current_round', 0)
        
        return jsonify({
            "status": "NEXT_ROUND_STARTED",
            "remaining_rounds": len(remaining) + 1,
            "total_rounds": total,
            "current_round": current_round,
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
    user_id = request.args.get('user_id')  # NEW: Get user ID from query params
    
    if not user_id:
        return jsonify({
            "error": "User ID is required."
        }), 400

    if user_id not in USER_GAME_STATES:
        initialize_user_game(user_id)
    
    game_state = USER_GAME_STATES[user_id]
    total_rounds = game_state.get('total_rounds', 0)
    remaining = game_state.get('remaining_characters', [])
    current_char = game_state.get('current_character')
    current_round = game_state.get('current_round', 0)
    
    return jsonify({
        "total_rounds": total_rounds,
        "remaining_rounds": len(remaining) + (1 if current_char else 0),
        "current_round": current_round,
        "game_ready": True if current_char else False
    })


if __name__ == '__main__':
    print("🚀 Starting Flask server...")
    print("📊 Server: http://127.0.0.1:5000")
    app.run(host='0.0.0.0', port=os.environ.get('PORT', 5000), debug=True)