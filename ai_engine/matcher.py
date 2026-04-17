from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer, util

app = FastAPI(title="StudySync AI Matchmaker")

print("Loading Transformer Model... 🚀")
model = SentenceTransformer('all-MiniLM-L6-v2') 
print("Model loaded successfully!")

# 1. UPDATED: This now perfectly matches Django's models.py
class UserProfile(BaseModel):
    user_id: str
    learning_style: str
    study_goal: str
    study_type: str
    role: str
    availability: str

# 2. UPDATED MOCK DB: Simulating what Django will eventually send us
mock_django_db = [
    {
        "user_id": "user_101",
        "profile_text": "Style: visual. Goal: exam. Type: silent. Role: problem_solver. Availability: evenings."
    },
    {
        "user_id": "user_102",
        "profile_text": "Style: auditory. Goal: project. Type: discussion. Role: explainer. Availability: mornings."
    },
    {
        "user_id": "user_103",
        "profile_text": "Style: visual. Goal: exam. Type: mixed. Role: note_taker. Availability: evenings."
    }
]

db_texts = [user["profile_text"] for user in mock_django_db]
db_embeddings = model.encode(db_texts, convert_to_tensor=True)

# 3. UPDATED: Formats the new Django fields into a sentence
def stringify_profile(profile: UserProfile) -> str:
    return f"Style: {profile.learning_style}. Goal: {profile.study_goal}. Type: {profile.study_type}. Role: {profile.role}. Availability: {profile.availability}."

@app.post("/api/match")
async def find_matches(user: UserProfile):
    target_text = stringify_profile(user)
    target_embedding = model.encode(target_text, convert_to_tensor=True)
    
    cosine_scores = util.cos_sim(target_embedding, db_embeddings)[0]
    
    matches = []
    for i in range(len(mock_django_db)):
        score_percentage = round(float(cosine_scores[i]) * 100, 1)
        matches.append({
            "matched_user_id": mock_django_db[i]["user_id"],
            "compatibility_score": score_percentage,
            "profile_snippet": mock_django_db[i]["profile_text"]
        })
    
    matches = sorted(matches, key=lambda x: x["compatibility_score"], reverse=True)
    
    return {
        "target_user_id": user.user_id,
        "matches": matches
    }