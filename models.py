from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union

class Action(BaseModel):
    action_type: str = Field(..., description="The type of action to perform: 'search_kb', 'get_user', 'get_order', 'reply', 'resolve'")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Parameters for the action")

class Observation(BaseModel):
    ticket_id: str
    description: str
    status: str
    last_action_result: Optional[str] = None
    kb_results: Optional[List[str]] = None
    user_data: Optional[Dict[str, Any]] = None
    order_data: Optional[Dict[str, Any]] = None
    messages_sent: List[str] = []

class Reward(BaseModel):
    value: float = Field(..., ge=-1.0, le=1.0)
    explanation: str

class Info(BaseModel):
    progress: float
    task_completed: bool
    steps_taken: int

class State(BaseModel):
    current_ticket_id: str
    internal_data: Dict[str, Any]
    history: List[Dict[str, Any]]
