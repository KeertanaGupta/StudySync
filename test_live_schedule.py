import requests
import json

URL = "http://127.0.0.1:8000/api/group-schedule/"

# Make sure ID 1 is actually your user ID in the database!
payload = {
    "duration_hours": 2,
    "user_ids": [1] 
}

print("🌐 Frontend Simulator: Asking Django to orchestrate...")
response = requests.post(URL, json=payload)

# DEBUGGING LOGIC:
print(f"\n📡 Status Code: {response.status_code}")

if response.status_code == 200:
    print("✅ Success! AI Response:")
    print(json.dumps(response.json(), indent=2))
else:
    print("🚨 Django crashed! Here is the raw error message:")
    # This will print the actual error text from Django
    print(response.text[:500]) # Only print the first 500 characters so it doesn't flood your screen