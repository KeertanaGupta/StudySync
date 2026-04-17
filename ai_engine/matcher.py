from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer, util
import numpy as np

# --- 1. INITIALIZATION ---
app = FastAPI(title="StudySync AI Matchmaker")

print("Loading Transformer Model... (This takes a few seconds on first run)")
# This downloads a small, fast AI model specifically trained for semantic matching
model = SentenceTransformer('all-MiniLM-L6-v2') 
print("Model loaded successfully! 🚀")

# --- 2. DATA MODELS ---
# This tells FastAPI exactly what data format to expect from the frontend/backend
class UserProfile(BaseModel):
    user_id: str
    subjects: list[str]
    goals: str
    learning_style: str
    preferred_time: str

# --- 3. MOCK DATABASE ---
# We use this to test the AI immediately before the backend team finishes the real DB
mock_db = [
    {
        "user_id": "user_2",
        "profile_text": "Subjects: DBMS, SQL. Goal: Exam Prep. Style: Visual. Time: Evening."
    },
    {
        "user_id": "user_3",
        "profile_text": "Subjects: Operating Systems, C++. Goal: Project. Style: Practical. Time: Night."
    },
    {
        "user_id": "user_4",
        "profile_text": "Subjects: Database Management, Postgres. Goal: Revision. Style: Visual. Time: Evening."
    }
]

# Pre-compute the math (vectors) for our mock DB so the API responds instantly
db_texts = [user["profile_text"] for user in mock_db]
db_embeddings = model.encode(db_texts, convert_to_tensor=True)

# --- 4. HELPER LOGIC ---
# Converts the incoming JSON into a single descriptive sentence for the AI to read
def stringify_profile(profile: UserProfile) -> str:
    subjects_str = ", ".join(profile.subjects)
    return f"Subjects: {subjects_str}. Goal: {profile.goals}. Style: {profile.learning_style}. Time: {profile.preferred_time}."

# --- 5. THE AI ENDPOINT ---
@app.post("/api/match")
async def find_matches(user: UserProfile):
    # 1. Convert new user to text
    target_text = stringify_profile(user)
    
    # 2. Convert text to a mathematical vector
    target_embedding = model.encode(target_text, convert_to_tensor=True)
    
    # 3. Calculate Cosine Similarity (How close are the vectors?)
    cosine_scores = util.cos_sim(target_embedding, db_embeddings)[0]
    
    matches = []
    for i in range(len(mock_db)):
        # Convert the raw math score (e.g., 0.854) into a clean percentage (85.4)
        score_percentage = round(float(cosine_scores[i]) * 100, 1)
        
        matches.append({
            "matched_user_id": mock_db[i]["user_id"],
            "compatibility_score": score_percentage,
            "profile_snippet": mock_db[i]["profile_text"]
        })
    
    # Sort matches so the highest percentage is at the top
    matches = sorted(matches, key=lambda x: x["compatibility_score"], reverse=True)
    
    return {
        "target_user_id": user.user_id,
        "matches": matches
    }