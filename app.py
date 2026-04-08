from fastapi import FastAPI, HTTPException, Body, Request
from typing import Dict, Any, List, Optional
from environment import SupportAgentEnv
from models import Action, Observation, Reward, Info, State, ResetRequest
from tasks import TASKS
import os

app = FastAPI(title="SupportAgent OpenEnv")

# Global environment instance (in a real multi-user scenario, we'd use session IDs)
env = SupportAgentEnv()
current_task_id = None
history = []

@app.get("/")
async def root():
    return {"message": "SupportAgent OpenEnv is running", "spec": "openenv/v1"}

@app.get("/tasks")
async def get_tasks():
    return [{"id": t["id"], "name": t["name"], "difficulty": t["difficulty"]} for t in TASKS]

@app.post("/reset")
async def reset(request: Request):
    global current_task_id, history
    task_id = "task_easy"
    
    # Try to get task_id from body if it exists
    try:
        if await request.body():
            body = await request.json()
            if body and isinstance(body, dict) and "task_id" in body:
                task_id = body["task_id"]
    except Exception:
        # If body is not JSON or empty, we just stick with "task_easy"
        pass

    task = next((t for t in TASKS if t["id"] == task_id), None)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task '{task_id}' not found")
    
    current_task_id = task_id
    history = []
    obs = env.reset(task["config"])
    return obs

@app.post("/step")
async def step(action: Action):
    global history
    if not current_task_id:
        raise HTTPException(status_code=400, detail="No active task. Call /reset first.")
    
    obs, reward, done, info = env.step(action)
    
    # Track history for grading
    history.append({
        "action_type": action.action_type,
        "parameters": action.parameters,
        "reward": reward.value,
        "done": done
    })
    
    return {
        "observation": obs,
        "reward": reward,
        "done": done,
        "info": info
    }

@app.get("/state")
async def get_state():
    return env.state()

@app.post("/grade")
async def grade():
    if not current_task_id:
        raise HTTPException(status_code=400, detail="No active task to grade.")
    
    task = next((t for t in TASKS if t["id"] == current_task_id), None)
    obs = env._get_observation()
    score = task["grader"].grade(history, obs)
    
    return {
        "task_id": current_task_id,
        "score": score,
        "history_length": len(history)
    }

def start():
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)

if __name__ == "__main__":
    start()
