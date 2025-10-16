import requests
import os
import random
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
from datetime import timedelta
from functools import lru_cache
import logging

load_dotenv()

# List of API keys for rotation (using environment variables for security)
API_KEYS = [
    os.getenv("GEMINI_API_KEY_1"),
    os.getenv("GEMINI_API_KEY_2"),
    os.getenv("GEMINI_API_KEY_3"),
    # Add more as needed
]

# Track usage per key
KEY_USAGE = {key: 0 for key in API_KEYS if key}

MONGO_URI = os.getenv("MONGODB_URL")
DB_NAME = "test"
COLLECTION_NAME = "characters"
MODEL_NAME = "gemini-2.5-flash-preview-05-20"

# Store game state per user (user_id -> game_state) - simplified for serverless
USER_GAME_STATES = {}

# Simple response cache for serverless environment
response_cache = {}

# Setup logging for serverless
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
            logger.warning("No characters found in database")
        else:
            logger.info(f"Loaded {len(ALL_CHARACTERS)} characters")
    except Exception as e:
        logger.error(f"Failed to load characters: {e}")
        ALL_CHARACTERS = []

# Load characters on startup
ALL_CHARACTERS = []
load_all_characters()

def select_available_key():
    """Select an API key with lowest usage."""
    if not API_KEYS:
        raise ValueError("No API keys available")

    available_keys = [key for key in API_KEYS if key]
    if not available_keys:
        raise ValueError("No valid API keys found")

    # Simple round-robin selection for serverless
    return min(available_keys, key=lambda k: KEY_USAGE.get(k, 0))

def get_cache_key(user_query, character_context):
    """Generate a simple cache key."""
    return f"{hash(user_query)}:{hash(character_context[:100])}"

@lru_cache(maxsize=100)
def makeAPIRequest(user_id, payload):
    """Make API request to Gemini with caching."""
    system_prompt = payload.get('system_prompt', '')
    user_query = payload.get('user_query', '')
    character_context = payload.get('character_context', '')

    cache_key = get_cache_key(user_query, character_context)
    if cache_key in response_cache:
        logger.info("Cache hit for query")
        return response_cache[cache_key]

    try:
        selected_key = select_available_key()
        KEY_USAGE[selected_key] = KEY_USAGE.get(selected_key, 0) + 1
        logger.info(f"Using API key: {selected_key[:10]}...")
    except ValueError as e:
        logger.error(f"No available keys: {e}")
        return "ERROR: No API keys available."

    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL_NAME}:generateContent?key={selected_key}"

    full_prompt = f"The user is asking: '{user_query}'\n\nCharacter Data:\n{character_context}"

    payload = {
        "contents": [{"parts": [{"text": full_prompt}]}],
        "systemInstruction": {"parts": [{"text": system_prompt}]},
    }

    try:
        response = requests.post(
            api_url,
            headers={'Content-Type': 'application/json'},
            json=payload,
            timeout=10  # Vercel timeout consideration
        )
        response.raise_for_status()

        result = response.json()
        text = result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', 'NOT FOUND')
        response_text = text.strip()

        # Cache the response
        response_cache[cache_key] = response_text

        return response_text

    except requests.exceptions.Timeout:
        logger.error("API request timed out")
        return "ERROR: Request timed out."
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 429:
            logger.error("API rate limit exceeded")
            return "ERROR: Rate limit exceeded. Please try again later."
        else:
            logger.error(f"API request failed: {e}")
            return "ERROR: API request failed."
    except Exception as e:
        logger.error(f"API request error: {e}")
        return "ERROR: Could not communicate with the API."

def initialize_user_game(user_id):
    """Initialize a new game for a user."""
    if not ALL_CHARACTERS:
        logger.error("No characters available for game initialization")
        return False

    # Select random subset of characters for this user
    num_characters = min(10, len(ALL_CHARACTERS))  # Limit for serverless
    selected_chars = random.sample(ALL_CHARACTERS, num_characters)
    random.shuffle(selected_chars)

    USER_GAME_STATES[user_id] = {
        'remaining_characters': selected_chars,
        'total_rounds': len(selected_chars),
        'current_round': 0,
        'current_character': None,
    }

    return start_next_round_for_user(user_id)

def start_next_round_for_user(user_id):
    """Start the next round for a specific user."""
    if user_id not in USER_GAME_STATES:
        initialize_user_game(user_id)
        return True

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

    logger.info(f"User {user_id}: Round {game_state['current_round']}, Character: {next_char.get('CHARACTER', 'Unknown')}")
    return True

def check_answer_with_gemini(question: str, dataset: dict) -> str:
    """Check user answer using Gemini API."""
    if not dataset:
        return "ERROR: Game not initialized."

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
        "1. NEVER mention, hint at, or reveal any character identity or name.\n"
        "2. If asked 'What is the character?' or 'Who is it?' or 'What is the name?', "
        "respond ONLY with 'NOT FOUND'.\n"
        "3. For YES/NO questions (e.g., 'Is the character male?'), respond ONLY with 'TRUE' or 'FALSE'.\n"
        "4. For VALUE questions (e.g., 'What is the gender?'), respond with the exact value from JSON.\n"
        "5. If the answer is not in the provided data, respond with 'NOT FOUND'.\n"
        "6. NEVER use fields that reveal identity: 'CHARACTER', 'SOURCE'.\n"
        "7. Keep responses concise - single word or very short phrase only.\n\n"
        "EXAMPLE RESPONSES:\n"
        "Q: 'Is the character male?' → 'TRUE' or 'FALSE'\n"
        "Q: 'What is the gender?' → 'MALE'\n"
        "Q: 'Is it a villain?' → 'TRUE' or 'FALSE'\n"
        "Q: 'What is the character?' → 'NOT FOUND'\n"
        "Q: 'Who is this?' → 'NOT FOUND'"
    )

    safe_dataset = {
        k: v for k, v in dataset.items()
        if k not in ['CHARACTER', 'SOURCE', '_id']
    }
    character_context = json.dumps(safe_dataset, indent=2)

    gemini_response = makeAPIRequest("user_id", {
        'system_prompt': system_instruction,
        'user_query': question,
        'character_context': character_context
    })

    if "ERROR" in gemini_response:
        return gemini_response

    # Check for BINGO! - The user guesses the name
    if question.lower().strip().replace('?', '').replace('!', '') == dataset.get("CHARACTER", "").lower():
        return "BINGO!"

    return gemini_response.upper()

def generate_hint(past_answers, current_dataset):
    """Generate hints based on past answers."""
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
            return "Try asking about the character's origin!"
    else:
        return "You're going in the right direction! Keep the good questions coming."

# Flask app setup for Vercel
app = Flask(__name__)

# CORS setup for Vercel deployment
CORS_ORIGINS = [
    "http://localhost:3000",
    "https://clockout3.vercel.app"
]

if os.getenv("FRONTEND_URL"):
    origins_to_add = [url.strip().rstrip('/') for url in os.getenv("FRONTEND_URL").split(',') if url.strip()]
    CORS_ORIGINS.extend(origins_to_add)

CORS(app, origins=CORS_ORIGINS, supports_credentials=True)

@app.route('/api/hello')
def hello():
    """Simple test endpoint."""
    return jsonify({"message": "Hello from Flask!"})

@app.route('/api/ask', methods=['POST'])
def ask_question():
    """Handles user questions for the current character."""
    try:
        data = request.json
        user_id = data.get('user_id')
        question = data.get('question', '')
        past_answers = data.get('pastAnswers', [])

        logger.info(f"User {user_id} asked: {question}")

        if not user_id:
            return jsonify({
                'answer': "ERROR: User ID is required.",
                'hint': "Invalid request.",
                'gameOver': True
            }), 400

        # Get user's game state
        if user_id not in USER_GAME_STATES:
            if not initialize_user_game(user_id):
                return jsonify({
                    'answer': "ERROR: Could not initialize game.",
                    'hint': "Game Error.",
                    'gameOver': True
                }), 500

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

    except Exception as e:
        logger.error(f"Error in ask_question: {e}")
        return jsonify({
            'answer': "ERROR: Internal server error.",
            'hint': "Please try again.",
            'gameOver': False
        }), 500

@app.route('/api/next_character', methods=['GET'])
def get_next_character_round():
    """Starts the next round after a BINGO!"""
    try:
        user_id = request.args.get('user_id')

        logger.info(f"User {user_id} requesting next character")

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
                "message": "Congratulations! You guessed all characters."
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

    except Exception as e:
        logger.error(f"Error in next_character: {e}")
        return jsonify({
            "status": "ERROR",
            "message": "Internal server error."
        }), 500

@app.route('/api/status', methods=['GET'])
def get_game_status():
    """Provides initial game status for the Next.js frontend."""
    try:
        user_id = request.args.get('user_id')

        logger.info(f"User {user_id} requesting game status")

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

        response = {
            "total_rounds": total_rounds,
            "remaining_rounds": len(remaining) + (1 if current_char else 0),
            "current_round": current_round,
            "game_ready": True if current_char else False
        }

        return jsonify(response)

    except Exception as e:
        logger.error(f"Error in status: {e}")
        return jsonify({
            "error": "Internal server error."
        }), 500

# This is important for Vercel
if __name__ == '__main__':
    app.run()
