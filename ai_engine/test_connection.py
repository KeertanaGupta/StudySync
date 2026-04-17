import requests
import json

# We use port 8001 so we don't crash Django (which uses 8000)
AI_URL = "http://127.0.0.1:8001/api/match"

# This perfectly matches the choices in their models.py!
fake_django_request = {
    "user_id": "new_student_99",
    "learning_style": "visual",
    "study_goal": "exam",
    "study_type": "silent",
    "role": "problem_solver",
    "availability": "evenings"
}

print("🌐 Django Backend Simulator: Sending data to AI Engine...")

try:
    response = requests.post(AI_URL, json=fake_django_request)
    
    if response.status_code == 200:
        print("✅ SUCCESS! The AI Engine processed the Django data!")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"❌ ERROR: {response.text}")

except requests.exceptions.ConnectionError:
    print("🚨 FATAL ERROR: Make sure uvicorn is running on port 8001 in your other terminal!")