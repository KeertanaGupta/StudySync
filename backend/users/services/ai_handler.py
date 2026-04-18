import json
import requests
from django.conf import settings

def fetch_ai_quiz(skill_name):
    url = "https://openrouter.ai/api/v1/chat/completions"
    
    # Check if key exists
    api_key = getattr(settings, "OPENROUTER_API_KEY", None)
    if not api_key:
        raise Exception("OPENROUTER_API_KEY is missing in settings.py")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173", # Required by OpenRouter
        "X-Title": "StudySync"
    }
    
    prompt = f"Generate 3 multiple choice questions for {skill_name}. Return ONLY a JSON array of objects with: question, options (list of 4), correct_answer, difficulty."

    payload = {
        "model": "openai/gpt-3.5-turbo",
        "messages": [{"role": "user", "content": prompt}]
    }

    response = requests.post(url, headers=headers, json=payload)
    
    # 🚩 If this fails, it's likely a 401 (Unauthorized) or 429 (Rate Limit)
    if response.status_code != 200:
        raise Exception(f"OpenRouter Error: {response.status_code} - {response.text}")

    content = response.json()['choices'][0]['message']['content'].strip()
    
    # 🧼 Clean markdown backticks
    if "```" in content:
        content = content.split("```")[1].replace("json", "").strip()
    
    return json.loads(content)