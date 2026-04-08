import os
import json
import time
import requests
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# --- Configuration ---
# 1. Environment URL (The SupportAgent Space)
# The judges will likely provide this as API_BASE_URL
ENV_URL = os.getenv("API_BASE_URL", "http://localhost:3000").rstrip("/")

# 2. LLM Provider Configuration
# We support OpenAI and Gemini (via OpenAI-compatible endpoint)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Default to Gemini if in AI Studio and no OpenAI key is provided
if not OPENAI_API_KEY and GEMINI_API_KEY:
    LLM_API_KEY = GEMINI_API_KEY
    LLM_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"
    DEFAULT_MODEL = "gemini-3-flash-preview"
else:
    LLM_API_KEY = OPENAI_API_KEY or os.getenv("HF_TOKEN")
    LLM_BASE_URL = os.getenv("LLM_API_BASE") # Optional custom base URL
    DEFAULT_MODEL = "gpt-4o"

MODEL_NAME = os.getenv("MODEL_NAME", DEFAULT_MODEL)

if not LLM_API_KEY:
    print("Warning: No LLM API key found (OPENAI_API_KEY or GEMINI_API_KEY).")

client = OpenAI(
    api_key=LLM_API_KEY,
    base_url=LLM_BASE_URL
)

def log_start(task_id):
    print(f"[START] Task: {task_id}")

def log_step(step_num, action, observation, reward):
    log_data = {
        "step": step_num,
        "action": action,
        "observation": observation,
        "reward": reward
    }
    print(f"[STEP] {json.dumps(log_data)}")

def log_end(task_id, score, total_reward):
    print(f"[END] Task: {task_id} | Score: {score} | Total Reward: {total_reward}")

def run_task(task_id):
    log_start(task_id)
    
    # Reset environment
    try:
        response = requests.post(f"{ENV_URL}/reset", json={"task_id": task_id})
        response.raise_for_status()
        obs = response.json()
    except Exception as e:
        print(f"Error resetting environment: {e}")
        return 0.0
    
    total_reward = 0.0
    done = False
    step_count = 0
    max_steps = 10
    
    system_prompt = f"""You are a customer support agent. Your goal is to resolve the ticket: {obs.get('description', 'No description')}
Available actions:
- search_kb(query: str): Search the knowledge base.
- get_user(user_id: str): Get user details.
- get_order(order_id: str): Get order details.
- reply(message: str): Send a message to the customer.
- resolve(): Mark the ticket as resolved.

Respond ONLY with a JSON object representing the action:
{{"action_type": "...", "parameters": {{...}}}}
"""

    messages = [{"role": "system", "content": system_prompt}]
    
    while not done and step_count < max_steps:
        step_count += 1
        
        # Get action from LLM
        messages.append({"role": "user", "content": f"Current Observation: {json.dumps(obs)}"})
        
        try:
            # Note: Gemini 3 series models work best with response_format
            completion = client.chat.completions.create(
                model=MODEL_NAME,
                messages=messages,
                response_format={"type": "json_object"}
            )
            content = completion.choices[0].message.content
            # Clean up potential markdown blocks if the model ignores the "ONLY JSON" instruction
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            action_data = json.loads(content)
        except Exception as e:
            print(f"Error getting action: {e}")
            # Fallback: try to resolve if stuck
            action_data = {"action_type": "resolve", "parameters": {}}
            
        # Execute action
        try:
            step_response = requests.post(f"{ENV_URL}/step", json=action_data)
            step_response.raise_for_status()
            step_result = step_response.json()
        except Exception as e:
            print(f"Error executing step: {e}")
            break
        
        obs = step_result["observation"]
        reward = step_result["reward"]["value"]
        done = step_result["done"]
        total_reward += reward
        
        log_step(step_count, action_data, obs, reward)
        
        messages.append({"role": "assistant", "content": json.dumps(action_data)})
        
    # Get final score
    try:
        grade_response = requests.post(f"{ENV_URL}/grade")
        grade_response.raise_for_status()
        score = grade_response.json()["score"]
    except Exception as e:
        print(f"Error getting grade: {e}")
        score = 0.0
    
    log_end(task_id, score, total_reward)
    return score

def main():
    # Wait for server to start if running locally
    if "localhost" in ENV_URL:
        time.sleep(2)
    
    print(f"Connecting to environment at: {ENV_URL}")
    print(f"Using LLM Model: {MODEL_NAME}")

    try:
        tasks_response = requests.get(f"{ENV_URL}/tasks")
        tasks_response.raise_for_status()
        tasks = tasks_response.json()
    except Exception as e:
        print(f"Could not connect to environment: {e}")
        return

    overall_scores = []
    for task in tasks:
        score = run_task(task["id"])
        overall_scores.append(score)
        
    if overall_scores:
        avg_score = sum(overall_scores) / len(overall_scores)
        print(f"\nOverall Baseline Score: {avg_score:.2f}")
    else:
        print("\nNo tasks were completed.")

if __name__ == "__main__":
    main()
