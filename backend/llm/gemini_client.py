# backend/llm/gemini_client.py

import os
import json
import google.generativeai as genai

# Configure Gemini API
API_KEY = os.getenv("GEMINI_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)

MODEL_NAME = "gemini-2.5-flash"


def analyze_policy_with_llm(policy_code: str):
    """
    Sends SPL policy to Gemini and returns structured JSON analysis.
    """

    prompt = f"""
You are a senior cybersecurity auditor specializing in access control.

You MUST analyze the SPL policy and ALWAYS return at least one item in each list.

Return ONLY the following JSON:

{{
  "risks": [{{ "description": "string", "line_number": 1 }}],
  "contradictions": [
    {{
      "rule1": "string",
      "rule2": "string",
      "reason": "string",
      "line_numbers": [1, 2]
    }}
  ],
  "broad_permissions": [{{ "description": "string", "line_number": 1 }}],
  "privilege_escalation": [{{ "description": "string", "line_number": 1 }}],
  "risk_score": 0
}}

RISK SCORE RULES:
- VALUE MUST BE BETWEEN 0 AND 100.
- 0 = No risk at all.
- 100 = Maximum possible risk.
- Higher number ALWAYS means higher risk.
- Base the score on severity AND total number of issues found.

SPL Policy:
---------------------
{policy_code}
---------------------
"""

    # Create Gemini model instance
    model = genai.GenerativeModel(MODEL_NAME)

    # Generate AI response
    response = model.generate_content(prompt)
    raw_output = response.text

    # Extract JSON from the response
    try:
        json_str = raw_output[raw_output.index("{"): raw_output.rindex("}") + 1]
        return json.loads(json_str)
    except Exception:
        return {
            "error": "Model returned non-JSON output",
            "raw_output": raw_output
        }
