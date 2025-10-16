import time
import requests

def simulate_players():
    base_url = "http://127.0.0.1:5000/api"
    
    # Initialize 5 players (simulates your 37-user scenario)
    players = [f"player{i}" for i in range(5)]
    for player in players:
        # Status check assigns API
        response = requests.get(f"{base_url}/status?user_id={player}")
        print(f"Player {player} status: {response.json()}")
    
    # Simulate questions (sticky in action)
    for player in players:
        for q in ["Is the character male?", "What is the gender?"]:
            response = requests.post(f"{base_url}/ask", json={"user_id": player, "question": q})
            print(f"Player {player} question '{q}': {response.json().get('answer')}")
            time.sleep(1)  # Simulate delay
    
    # Complete games to trigger cleanup
    for player in players:
        response = requests.get(f"{base_url}/next_character?user_id={player}")
        if response.json().get("status") == "GAME_OVER_ALL_ROUNDS":
            print(f"Player {player} finished game")

if __name__ == "__main__":
    simulate_players()
