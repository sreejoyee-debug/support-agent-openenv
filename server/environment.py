import uuid
from typing import Tuple, Dict, Any, List
from .models import Action, Observation, Reward, Info, State

class SupportAgentEnv:
    def __init__(self):
        self.kb = {
            "password_reset": "To reset your password, go to https://example.com/reset and enter your email.",
            "refund_policy": "Refunds are allowed within 30 days of purchase if the product is unused.",
            "shipping_delay": "Current shipping delays are 3-5 business days due to high volume.",
            "technical_support": "For technical issues, please provide your OS version and error logs."
        }
        self.users = {
            "user_123": {"name": "Alice", "email": "alice@example.com", "tier": "Gold"},
            "user_456": {"name": "Bob", "email": "bob@example.com", "tier": "Free"}
        }
        self.orders = {
            "order_999": {"id": "order_999", "user_id": "user_123", "status": "Delivered", "date": "2026-03-15"},
            "order_888": {"id": "order_888", "user_id": "user_456", "status": "Processing", "date": "2026-04-01"}
        }
        self.reset()

    def reset(self, task_config: Dict[str, Any] = None) -> Observation:
        if task_config:
            self.current_task = task_config
        else:
            # Default task
            self.current_task = {
                "ticket_id": "TKT-001",
                "description": "I forgot my password, how do I reset it?",
                "user_id": "user_123",
                "goal": "Provide password reset link"
            }
        
        self.steps = 0
        self.done = False
        self.messages_sent = []
        self.last_result = "Environment reset."
        self.kb_results = None
        self.user_data = None
        self.order_data = None
        self.reward_accumulated = 0.0
        
        return self._get_observation()

    def _get_observation(self) -> Observation:
        return Observation(
            ticket_id=self.current_task["ticket_id"],
            description=self.current_task["description"],
            status="Open" if not self.done else "Resolved",
            last_action_result=self.last_result,
            kb_results=self.kb_results,
            user_data=self.user_data,
            order_data=self.order_data,
            messages_sent=self.messages_sent
        )

    def step(self, action: Action) -> Tuple[Observation, Reward, bool, Info]:
        self.steps += 1
        reward_val = 0.0
        explanation = "Action processed."
        
        if self.done:
            return self._get_observation(), Reward(value=0.0, explanation="Episode finished."), True, self._get_info()

        if action.action_type == "search_kb":
            query = action.parameters.get("query", "").lower()
            results = [v for k, v in self.kb.items() if any(word in k or word in v.lower() for word in query.split())]
            self.kb_results = results
            self.last_result = f"Found {len(results)} KB articles."
            reward_val = 0.1 # Small reward for searching
            explanation = "Searched knowledge base."

        elif action.action_type == "get_user":
            uid = action.parameters.get("user_id")
            if uid in self.users:
                self.user_data = self.users[uid]
                self.last_result = f"Retrieved data for user {uid}."
                reward_val = 0.05
            else:
                self.last_result = f"User {uid} not found."
                reward_val = -0.05

        elif action.action_type == "get_order":
            oid = action.parameters.get("order_id")
            if oid in self.orders:
                self.order_data = self.orders[oid]
                self.last_result = f"Retrieved data for order {oid}."
                reward_val = 0.05
            else:
                self.last_result = f"Order {oid} not found."
                reward_val = -0.05

        elif action.action_type == "reply":
            msg = action.parameters.get("message", "")
            self.messages_sent.append(msg)
            self.last_result = "Reply sent to customer."
            # Check if reply is helpful (simplified logic for now, graders will handle final score)
            if "http" in msg or "reset" in msg.lower():
                reward_val = 0.2
            else:
                reward_val = 0.05

        elif action.action_type == "resolve":
            self.done = True
            self.last_result = "Ticket marked as resolved."
            # Final grading happens in task grader, but we can give a small base reward
            reward_val = 0.1
            explanation = "Resolved ticket."

        else:
            self.last_result = f"Unknown action type: {action.action_type}"
            reward_val = -0.1
            explanation = "Invalid action."

        self.reward_accumulated += reward_val
        return self._get_observation(), Reward(value=reward_val, explanation=explanation), self.done, self._get_info()

    def state(self) -> State:
        return State(
            current_ticket_id=self.current_task["ticket_id"],
            internal_data={
                "kb": self.kb,
                "users": self.users,
                "orders": self.orders,
                "current_task": self.current_task
            },
            history=[{"step": self.steps, "last_result": self.last_result}]
        )

    def _get_info(self) -> Info:
        return Info(
            progress=min(1.0, self.reward_accumulated),
            task_completed=self.done,
            steps_taken=self.steps
        )
