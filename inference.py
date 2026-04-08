import os
import json
import time
import requests
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# Environment variables provided by the platform
API_BASE_URL = os.getenv("API_BASE_URL")
MODEL_NAME = os.getenv("MODEL_NAME")
HF_TOKEN = os.getenv("HF_TOKEN")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", HF_TOKEN) # Fallback to HF_TOKEN if OPENAI_API_KEY is not set

if not OPENAI_API_KEY:
    print("Warning: Neither OPENAI_API_KEY nor HF_TOKEN is set.")

client = OpenAI(
    api_key=OPENAI_API_KEY,
    base_url=API_BASE_URL
)

ENV_URL = "http://localhost:3000"

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
    response = requests.post(f"{ENV_URL}/reset", json={"task_id": task_id})
    obs = response.json()
    
    total_reward = 0.0
    done = False
    step_count = 0
    max_steps = 10
    
    system_prompt = f"""You are a customer support agent. Your goal is to resolve the ticket: {obs['description']}
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
            completion = client.chat.completions.create(
                model=MODEL_NAME,
                messages=messages,
                response_format={"type": "json_object"}
            )
            action_data = json.loads(completion.choices[0].message.content)
        except Exception as e:
            print(f"Error getting action: {e}")
            break
            
        # Execute action
        step_response = requests.post(f"{ENV_URL}/step", json=action_data)
        step_result = step_response.json()
        
        obs = step_result["observation"]
        reward = step_result["reward"]["value"]
        done = step_result["done"]
        total_reward += reward
        
        log_step(step_count, action_data, obs, reward)
        
        messages.append({"role": "assistant", "content": json.dumps(action_data)})
        
    # Get final score
    grade_response = requests.post(f"{ENV_URL}/grade")
    score = grade_response.json()["score"]
    
    log_end(task_id, score, total_reward)
    return score

def main():
    # Wait for server to start if needed
    time.sleep(2)
    
    try:
        tasks_response = requests.get(f"{ENV_URL}/tasks")
        tasks = tasks_response.json()
    except Exception as e:
        print(f"Could not connect to environment: {e}")
        return

    overall_scores = []
    for task in tasks:
        score = run_task(task["id"])
        overall_scores.append(score)
        
    avg_score = sum(overall_scores) / len(overall_scores)
    print(f"\nOverall Baseline Score: {avg_score:.2f}")

if __name__ == "__main__":
    main()
