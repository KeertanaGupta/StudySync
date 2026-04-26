import json
import requests
from django.conf import settings

# users/services/ai_handler.py

def fetch_ai_quiz(skills_list):
    api_key = getattr(settings, "GEMINI_API_KEY", None)
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    
    # 1. Shorter Prompt = Shorter Response = No cutting off
    prompt = f"""
    Create a 10-question quiz for: {', '.join(skills_list)}. 
    Return ONLY a raw JSON array. Keep question text concise.
    Structure: [{{"skill_name":"","question":"","options":["","","",""],"correct_answer":"","difficulty":""}}]
    """

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2, # 👈 Keep it very focused
            "maxOutputTokens": 4096, # 👈 Doubled this so it doesn't cut off mid-string
            "responseMimeType": "application/json"
        }
    }

    response = requests.post(url, headers={'Content-Type': 'application/json'}, json=payload)
    
    if response.status_code != 200:
        raise Exception(f"Gemini Error {response.status_code}: {response.text}")

    res_data = response.json()
    
    try:
        content = res_data['candidates'][0]['content']['parts'][0]['text'].strip()
        
        # 2. Advanced Cleaning (Removes any accidental markdown)
        if content.startswith("```"):
            content = content.replace("```json", "").replace("```", "").strip()
            
        return json.loads(content)
    except Exception as e:
        # If it still fails, let's see what it sent in the terminal
        print(f"RAW CONTENT FROM AI: {content[:100]}...") 
        raise e