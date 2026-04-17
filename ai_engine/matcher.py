from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer, util

app = FastAPI(title="StudySync AI Matchmaker")

print("Loading Transformer Model... 🚀")
model = SentenceTransformer('all-MiniLM-L6-v2') 
print("Model loaded successfully!")

class UserProfile(BaseModel):
    user_id: str
    learning_style: str
    study_goal: str
    study_type: str
    role: str
    availability: str

# 🚨 THE MAGIC FIX: We now tell FastAPI to expect BOTH the target user and the DB list
class MatchRequest(BaseModel):
    target_user: UserProfile
    all_users: list[UserProfile]

def stringify_profile(profile: UserProfile) -> str:
    return f"Style: {profile.learning_style}. Goal: {profile.study_goal}. Type: {profile.study_type}. Role: {profile.role}. Availability: {profile.availability}."

@app.post("/api/match")
async def find_matches(request: MatchRequest):
    # 1. Process the Target User
    target_text = stringify_profile(request.target_user)
    target_embedding = model.encode(target_text, convert_to_tensor=True)
    
    # 2. Process ALL Users sent from Postgres via Django
    db_texts = [stringify_profile(user) for user in request.all_users]
    db_embeddings = model.encode(db_texts, convert_to_tensor=True)
    
    # 3. Calculate Math
    cosine_scores = util.cos_sim(target_embedding, db_embeddings)[0]
    
    matches = []
    for i in range(len(request.all_users)):
        # Don't match the user with themselves!
        if request.all_users[i].user_id != request.target_user.user_id:
            score_percentage = round(float(cosine_scores[i]) * 100, 1)
            matches.append({
                "matched_user_id": request.all_users[i].user_id,
                "compatibility_score": score_percentage,
            })
    
    matches = sorted(matches, key=lambda x: x["compatibility_score"], reverse=True)
    
    return {"target_user_id": request.target_user.user_id, "matches": matches}