from typing import Dict, Any, List
from .models import Observation, Action

class BaseGrader:
    def grade(self, history: List[Dict[str, Any]], final_obs: Observation) -> float:
        raise NotImplementedError

class PasswordResetGrader(BaseGrader):
    def grade(self, history: List[Dict[str, Any]], final_obs: Observation) -> float:
        # Easy: Check if the reset link was sent and ticket resolved
        score = 0.0
        link_sent = any("https://example.com/reset" in msg for msg in final_obs.messages_sent)
        if link_sent:
            score += 0.7
        if final_obs.status == "Resolved":
            score += 0.3
        return min(1.0, score)

class RefundGrader(BaseGrader):
    def grade(self, history: List[Dict[str, Any]], final_obs: Observation) -> float:
        # Medium: Check if order was looked up, policy checked, and correct answer given
        score = 0.0
        order_looked_up = any(h.get("action_type") == "get_order" for h in history)
        kb_searched = any(h.get("action_type") == "search_kb" and "refund" in h.get("parameters", {}).get("query", "").lower() for h in history)
        
        if order_looked_up:
            score += 0.3
        if kb_searched:
            score += 0.2
            
        # Check if the agent correctly identified that order_999 is too old (March 15 vs April 8)
        # Or if it's order_888 (Processing)
        correct_answer = any("30 days" in msg or "unused" in msg.lower() for msg in final_obs.messages_sent)
        if correct_answer:
            score += 0.3
            
        if final_obs.status == "Resolved":
            score += 0.2
            
        return min(1.0, score)

class TechnicalIssueGrader(BaseGrader):
    def grade(self, history: List[Dict[str, Any]], final_obs: Observation) -> float:
        # Hard: Requires multiple steps and specific info gathering
        score = 0.0
        asked_for_logs = any("logs" in msg.lower() or "os version" in msg.lower() for msg in final_obs.messages_sent)
        kb_searched = any(h.get("action_type") == "search_kb" and "technical" in h.get("parameters", {}).get("query", "").lower() for h in history)
        
        if asked_for_logs:
            score += 0.4
        if kb_searched:
            score += 0.3
        if final_obs.status == "Resolved":
            score += 0.3
            
        return min(1.0, score)

TASKS = [
    {
        "id": "task_easy",
        "name": "Password Reset Request",
        "description": "A user forgot their password and needs the reset link.",
        "config": {
            "ticket_id": "TKT-001",
            "description": "Hi, I can't log in. I forgot my password. Can you help?",
            "user_id": "user_123",
            "goal": "Provide the password reset link from the KB."
        },
        "grader": PasswordResetGrader(),
        "difficulty": "easy"
    },
    {
        "id": "task_medium",
        "name": "Refund Eligibility Check",
        "description": "A user wants a refund for order_999. Check if they are eligible.",
        "config": {
            "ticket_id": "TKT-002",
            "description": "I want a refund for my order order_999. Is it possible?",
            "user_id": "user_123",
            "order_id": "order_999",
            "goal": "Check order date and refund policy, then inform the user."
        },
        "grader": RefundGrader(),
        "difficulty": "medium"
    },
    {
        "id": "task_hard",
        "name": "Complex Technical Support",
        "description": "A user is reporting a technical glitch. Follow the protocol.",
        "config": {
            "ticket_id": "TKT-003",
            "description": "Your app keeps crashing when I try to upload a file. Fix it!",
            "user_id": "user_456",
            "goal": "Search KB for technical support protocol, ask for logs/OS, and resolve."
        },
        "grader": TechnicalIssueGrader(),
        "difficulty": "hard"
    }
]
