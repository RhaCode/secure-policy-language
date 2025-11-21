import os
import openai  # or Azure OpenAI SDK
from config import Config

class SecurityScanner:
    """LLM-powered security risk analysis"""
    
    def __init__(self):
        self.client = openai.AzureOpenAI(
            api_key=Config.AZURE_OPENAI_KEY,
            api_version="2023-12-01-preview",
            azure_endpoint=Config.AZURE_OPENAI_ENDPOINT
        )
    
    def analyze(self, spl_code):
        """Analyze SPL code for security risks using LLM"""
        
        prompt = f"""
        Analyze this Secure Policy Language code for security risks:
        
        {spl_code}
        
        Identify:
        1. Privilege escalation risks
        2. Overly permissive policies  
        3. Logical conflicts
        4. Security best practice violations
        5. Risk score (0-100)
        
        Format as JSON with: risks[], recommendations[], risk_score
        """
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1
            )
            
            return self._parse_llm_response(response.choices[0].message.content)
        except Exception as e:
            return {"error": str(e), "risks": [], "risk_score": 0}
    
    def _parse_llm_response(self, response):
        # Parse LLM JSON response
        import json
        try:
            return json.loads(response)
        except:
            return {"risks": [response], "risk_score": 50}