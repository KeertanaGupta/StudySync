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

def fetch_session_summary(transcript):
    api_key = getattr(settings, "GEMINI_API_KEY", None)
    # Using 1.5-flash as default, but if user specifically wants the latest it will fallback if available
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    
    prompt = f"""
    You are an AI study assistant. Analyze this study session transcript and generate:
    1. A concise summary of what was discussed.
    2. A list of actionable tasks or next steps based on the discussion.
    
    Transcript:
    {transcript}
    
    Return ONLY a raw JSON object (no markdown).
    Structure: {{"summary": "string", "tasks": ["string", "string"]}}
    """

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 2048,
            "responseMimeType": "application/json"
        }
    }

    response = requests.post(url, headers={'Content-Type': 'application/json'}, json=payload)
    
    if response.status_code != 200:
        # Try to use openrouter if gemini fails
        openrouter_key = getattr(settings, "OPENROUTER_API_KEY", None)
        if openrouter_key:
            or_url = "https://openrouter.ai/api/v1/chat/completions"
            or_headers = {
                "Authorization": f"Bearer {openrouter_key}",
                "Content-Type": "application/json"
            }
            or_payload = {
                "model": "google/gemini-pro",
                "messages": [{"role": "user", "content": prompt}],
                "response_format": {"type": "json_object"}
            }
            or_res = requests.post(or_url, headers=or_headers, json=or_payload)
            if or_res.status_code == 200:
                raw_text = or_res.json()['choices'][0]['message']['content'].strip()
                if raw_text.startswith("```json"): raw_text = raw_text[7:]
                if raw_text.startswith("```"): raw_text = raw_text[3:]
                if raw_text.endswith("```"): raw_text = raw_text[:-3]
                return json.loads(raw_text.strip())

        raise Exception(f"Gemini Error {response.status_code}: {response.text}")

    res_data = response.json()
    
    try:
        content = res_data['candidates'][0]['content']['parts'][0]['text'].strip()
        if content.startswith("```"):
            content = content.replace("```json", "").replace("```", "").strip()
        return json.loads(content)
    except Exception as e:
        print(f"RAW CONTENT FROM AI: {content[:100]}...") 
        raise e