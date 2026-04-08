import json
from pydantic import ValidationError
from models import Action, Observation, Reward, Info
from environment import SupportAgentEnv

def validate():
    env = SupportAgentEnv()
    print("Validating SupportAgent OpenEnv...")
    
    # Test Reset
    try:
        obs = env.reset()
        Observation.model_validate(obs.model_dump())
        print("✅ Reset produces valid Observation")
    except Exception as e:
        print(f"❌ Reset failed: {e}")
        return

    # Test Step
    try:
        action = Action(action_type="search_kb", parameters={"query": "password"})
        obs, reward, done, info = env.step(action)
        
        Observation.model_validate(obs.model_dump())
        Reward.model_validate(reward.model_dump())
        Info.model_validate(info.model_dump())
        
        print("✅ Step produces valid Observation, Reward, and Info")
    except Exception as e:
        print(f"❌ Step failed: {e}")
        return

    # Test State
    try:
        state = env.state()
        print("✅ State retrieval works")
    except Exception as e:
        print(f"❌ State failed: {e}")
        return

    print("\nAll OpenEnv spec checks passed!")

if __name__ == "__main__":
    validate()
