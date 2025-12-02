import google.generativeai as genai
import os

# Load your API key
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Fetch and print all models
models = genai.list_models()

with open("gemini_models.txt", "w", encoding="utf-8") as f:
    for m in models:
        f.write(f"{m.name} | {m.supported_generation_methods}\n")

print("✓ Model list saved to gemini_models.txt")
