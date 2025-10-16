import requests
import os
import random
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from pymongo import MongoClient
from dotenv import load_dotenv
from datetime import timedelta
from functools import lru_cache
import logging

load_dotenv() 

# List of API keys for rotation
API_KEYS = [
    os.getenv("AIzaSyAXF11XmMks9jRJl6dzi6dLM-9et2iSfFs"),
    os.getenv("AIzaSyBRfdMq1v1Wqf4iqSr6LHrtrhWo2yy7zOM"),
    os.getenv("AIzaSyBUwYxJA6ajlyFlo7Z2wvjCfwhQnnr6qSY"),
    # Add more as needed
]

# Track usage per key
KEY_USAGE = {key: 0 for key in API_KEYS if key}

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

# Function to select the least used available key
def select_available_key():
    if not API_KEYS:
        raise ValueError("No API keys available")
    
    # Find keys that are not exhausted (assuming a limit, e.g., 60 per key)
    available_keys = [key for key in API_KEYS if KEY_USAGE.get(key, 0) < 60]
    if not available_keys:
        raise ValueError("All API keys have reached their limit")
    
    # Select the one with the least usage
    selected_key = min(available_keys, key=lambda k: KEY_USAGE.get(k, 0))
    KEY_USAGE[selected_key] += 1
    return selected_key

# Simple in-memory cache for responses
response_cache = {}

def get_cache_key(question, character_context):
    import hashlib
    content = f"{question}:{character_context}"
    return hashlib.md5(content.encode()).hexdigest()

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Sticky API Assignment Functions
def assignAPIToPlayer(playerID):
    """Assigns an API key to a player based on least load, skipping rate-limited APIs."""
    if playerID in playerToAPI:
        return playerToAPI[playerID]
    
    minLoad = float('inf')
    selectedAPIIndex = -1
    
    for i in range(len(API_KEYS)):
        status = apiRateLimitStatus[i]
        if status["isLimited"]:
            if datetime.now() < status["resetTime"]:
                continue
            else:
                status["isLimited"] = False  # Reset expired
        
        if apiLoadCount[i] < minLoad:
            minLoad = apiLoadCount[i]
            selectedAPIIndex = i
    
    if selectedAPIIndex == -1:
        raise ValueError("All APIs rate limited")
    
    playerToAPI[playerID] = selectedAPIIndex
    apiLoadCount[selectedAPIIndex] += 1
    logger.info(f"Assigned player {playerID} to API {selectedAPIIndex}")
    return selectedAPIIndex

def makeAPIRequest(playerID, questionData):
    """Makes an API request using the player's assigned key, with rate limit handling."""
    apiIndex = assignAPIToPlayer(playerID)
    apiKey = API_KEYS[apiIndex]
    
    try:
        response = callGeminiAPIWithAssignment(apiKey, questionData)
        return response
    except RateLimitError:
        apiRateLimitStatus[apiIndex]["isLimited"] = True
        apiRateLimitStatus[apiIndex]["resetTime"] = datetime.now() + timedelta(seconds=60)
        return handleRateLimit(playerID, questionData)
    except Exception as e:
        logger.error(f"API Error for player {playerID}: {e}")
        # Retry with backoff
        time.sleep(1)
        return makeAPIRequest(playerID, questionData)

def removePlayer(playerID):
    """Removes a player and decreases load count."""
    if playerID in playerToAPI:
        apiIndex = playerToAPI[playerID]
        apiLoadCount[apiIndex] -= 1
        del playerToAPI[playerID]
        logger.info(f"Removed player {playerID} from API {apiIndex}")

def handleRateLimit(playerID, questionData):
    """Handles rate limits by waiting or queuing."""
    apiIndex = playerToAPI[playerID]
    waitTime = (apiRateLimitStatus[apiIndex]["resetTime"] - datetime.now()).total_seconds()
    if waitTime < 60:
        time.sleep(waitTime)
        return makeAPIRequest(playerID, questionData)
    else:
        return "Request queued due to high traffic."

def callGeminiAPIWithAssignment(apiKey, questionData):
    """Calls Gemini API with the assigned key, including caching."""
    cache_key = get_cache_key(questionData['user_query'], questionData['character_context'])
    if cache_key in response_cache:
        logger.info("Cache hit for query")
        return response_cache[cache_key]
    
    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL_NAME}:generateContent?key={apiKey}"
    
    full_prompt = f"The user is asking: '{questionData['user_query']}'\n\nCharacter Data:\n{questionData['character_context']}"

    payload = {
        "contents": [{"parts": [{"text": full_prompt}]}],
        "systemInstruction": {"parts": [{"text": questionData['system_prompt']}]},
    }
    
    try:
        response = requests.post(api_url, headers={'Content-Type': 'application/json'}, json=payload)
        response.raise_for_status()
        
        result = response.json()
        text = result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', 'NOT FOUND')
        response_text = text.strip()
        
        # Cache the response
        response_cache[cache_key] = response_text
        
        return response_text

    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 429:
            raise RateLimitError("API rate limit exceeded")
        else:
            raise
    except Exception as e:
        logger.error(f"Gemini API Error: {e}")
        return "ERROR: API issue."

class RateLimitError(Exception):
    pass


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
    """Calls the Gemini API with structured instructions and character data, using key rotation and caching."""
    cache_key = get_cache_key(user_query, character_context)
    if cache_key in response_cache:
        logger.info("Cache hit for query")
        return response_cache[cache_key]
    
    try:
        selected_key = select_available_key()
        logger.info(f"Using API key: {selected_key[:10]}...")  # Log partial key for monitoring
    except ValueError as e:
        logger.error(f"No available keys: {e}")
        # Fallback to OpenAI or another service
        return fallback_to_openai(system_prompt, user_query, character_context)
    
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
            json=payload
        )
        response.raise_for_status()
        
        result = response.json()
        text = result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', 'NOT FOUND')
        response_text = text.strip()
        
        # Cache the response
        response_cache[cache_key] = response_text
        
        return response_text

    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 429:
            raise RateLimitError("API rate limit exceeded")
        else:
            raise
    except requests.exceptions.RequestException as e:
        logger.error(f"Gemini API Request Error: {e}")
        return "ERROR: Could not communicate with the Gemini API."
    except Exception as e:
        logger.error(f"Gemini API Response Parsing Error: {e}")
        return "ERROR: Invalid response from Gemini API."

def fallback_to_openai(system_prompt, user_query, character_context):
    """Fallback to OpenAI if Gemini keys are exhausted."""
    import openai  # Assuming OpenAI is installed
    openai.api_key = os.getenv("OPENAI_API_KEY")
    if not openai.api_key:
        return "ERROR: No fallback API key available."
    
    full_prompt = f"{system_prompt}\nThe user is asking: '{user_query}'\n\nCharacter Data:\n{character_context}"
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": full_prompt}]
        )
        text = response.choices[0].message.content.strip()
        return text
    except Exception as e:
        logger.error(f"OpenAI Fallback Error: {e}")
        return "ERROR: Fallback service unavailable."


CORS_ORIGINS = ["http://localhost:3000"] 

if FRONTEND_URL:
    origins_to_add = [url.strip().rstrip('/') for url in FRONTEND_URL.split(',') if url.strip()]
    CORS_ORIGINS.extend(origins_to_add)
    
CORS_ORIGINS.append("https://clockout3.vercel.app") 

app = Flask(__name__)
CORS(app, origins=CORS_ORIGINS, supports_credentials=True)

# Rate limiting: 5 requests per minute per IP
limiter = Limiter(get_remote_address, app=app, default_limits=["5 per minute"])


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

    gemini_response = makeAPIRequest(user_id, {'system_prompt': system_instruction, 'user_query': question, 'character_context': character_context})
    
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
@limiter.limit("10 per minute")  # Custom limit for this endpoint
def ask_question():
    """Handles user questions for the current character."""
    data = request.json
    user_id = data.get('user_id')  # NEW: Get user ID from request
    question = data.get('question', '')
    past_answers = data.get('pastAnswers', [])

    logger.info(f"User {user_id} asked: {question}")

    # Validate user_id
    if not user_id:
        logger.warning("Request without user_id")
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
        logger.error(f"User {user_id} has no current character")
        return jsonify({
            'answer': "ERROR: No character loaded for this round. Try /api/next_character.",
            'hint': "Game Error.",
            'gameOver': True
        }), 400
    
    if not question.strip():
        logger.warning(f"User {user_id} sent empty question")
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
    logger.info(f"Response for user {user_id}: {answer}")
    return jsonify(response)


@app.route('/api/next_character', methods=['GET'])
def get_next_character_round():
    """Starts the next round after a BINGO!"""
    user_id = request.args.get('user_id')  # NEW: Get user ID from query params
    
    logger.info(f"User {user_id} requesting next character")
    
    if not user_id:
        logger.warning("Next character request without user_id")
        return jsonify({
            "status": "ERROR",
            "message": "User ID is required."
        }), 400

    if user_id not in USER_GAME_STATES:
        initialize_user_game(user_id)
    
    game_state = USER_GAME_STATES[user_id]
    remaining = game_state.get('remaining_characters', [])
    
    if not remaining:
        logger.info(f"User {user_id} completed all rounds")
        removePlayer(user_id)  # Clean up assignment
        return jsonify({
            "status": "GAME_OVER_ALL_ROUNDS",
            "message": f"Congratulations! You guessed all characters."
        }), 200

    if start_next_round_for_user(user_id):
        total = game_state.get('total_rounds', 0)
        current_round = game_state.get('current_round', 0)
        
        logger.info(f"User {user_id} started round {current_round}")
        return jsonify({
            "status": "NEXT_ROUND_STARTED",
            "remaining_rounds": len(remaining) + 1,
            "total_rounds": total,
            "current_round": current_round,
            "message": "New round started! Start asking questions."
        }), 200
    else:
        logger.error(f"Failed to start next round for user {user_id}")
        return jsonify({
            "status": "GAME_OVER_ALL_ROUNDS",
            "message": "No characters remaining."
        }), 200


@app.route('/api/status', methods=['GET'])
def get_game_status():
    """Provides initial game status for the Next.js frontend on load."""
    user_id = request.args.get('user_id')  # NEW: Get user ID from query params
    
    logger.info(f"User {user_id} requesting game status")
    
    if not user_id:
        logger.warning("Status request without user_id")
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
    logger.info(f"Status for user {user_id}: {response}")
    return jsonify(response)


@app.route('/')
def home():
    return jsonify({"message": "Backend is running! Use /api/* endpoints for the game."})


if __name__ == '__main__':
    print("🚀 Starting Flask server...")
    print("📊 Server: http://127.0.0.1:5000")
    app.run(host='0.0.0.0', port=os.environ.get('PORT', 5000), debug=True)