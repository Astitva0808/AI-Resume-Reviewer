import os
from openai import OpenAI
from openai import AuthenticationError

# Load your API key from environment or paste directly
api_key = os.getenv("OPENAI_API_KEY")  # or replace with your key: "sk-..."

client = OpenAI(api_key=api_key)

def check_key_and_models():
    try:
        models = client.models.list()
        print("✅ API key is valid.")
        print("📦 Available models:")
        for model in models.data:
            print("-", model.id)
    except AuthenticationError:
        print("❌ Invalid API key or missing permissions.")
    except Exception as e:
        print("⚠️ Error checking models:", str(e))

check_key_and_models()