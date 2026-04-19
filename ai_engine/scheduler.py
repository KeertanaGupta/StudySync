from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime, timedelta, timezone
import uvicorn

app = FastAPI(title="StudySync Smart CSP Scheduler")

# ==========================================
# 🧱 LAYER 1: DATA MODELS (Strict Structure)
# ==========================================
class TimeBlock(BaseModel):
    start: str  # ISO Format: "2026-04-18T09:00:00Z"
    end: str

class Preferences(BaseModel):
    morning: float = 0.0   # 08:00 - 12:00
    afternoon: float = 0.0 # 12:00 - 17:00
    evening: float = 0.0   # 17:00 - 22:00

class UserSchedule(BaseModel):
    user_id: str
    timezone: str = "UTC"
    busy_slots: List[TimeBlock]
    preferences: Preferences

class GroupScheduleRequest(BaseModel):
    users: List[UserSchedule]
    duration_hours: int = 2

# ==========================================
# 🧠 LAYER 2: CORE ENGINE (The CSP Math)
# ==========================================
def parse_iso(iso_str: str) -> datetime:
    return datetime.fromisoformat(iso_str.replace('Z', '+00:00'))

def is_overlapping(slot_start: datetime, slot_end: datetime, busy_slots: List[TimeBlock]) -> bool:
    """Checks if a proposed slot overlaps with ANY busy block."""
    for busy in busy_slots:
        busy_start = parse_iso(busy.start)
        busy_end = parse_iso(busy.end)
        # Overlap logic: Start A < End B AND End A > Start B
        if slot_start < busy_end and slot_end > busy_start:
            return True
    return False

def get_preference_score(slot_start: datetime, prefs: Preferences) -> float:
    """Determines how well a time slot matches user preferences (using your multiplier)."""
    hour = slot_start.hour
    if 8 <= hour < 12: return prefs.morning
    if 12 <= hour < 17: return prefs.afternoon
    if 17 <= hour < 22: return prefs.evening
    return 0.0 # Night slots get 0 preference bonus

def generate_and_score_slots(users: List[UserSchedule], duration_hours: int) -> List[Dict]:
    now = datetime.now(timezone.utc)
    # Start checking from the next full hour
    start_time = now.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
    
    scored_slots = []
    
    # STEP 1: Generate all possible slots for the next 7 days (168 hours)
    for hour_offset in range(168 - duration_hours):
        candidate_start = start_time + timedelta(hours=hour_offset)
        candidate_end = candidate_start + timedelta(hours=duration_hours)
        
        # Skip late night slots (midnight to 8 AM) to optimize processing
        if candidate_start.hour < 8 or candidate_end.hour > 23:
            continue
            
        slot_score = 0
        free_users = []
        conflicting_users = []
        preference_matches = 0
        
        # STEP 2 & 3: Apply Constraints & Scoring
        for user in users:
            if is_overlapping(candidate_start, candidate_end, user.busy_slots):
                slot_score -= 5  # HARD CONSTRAINT PENALTY
                conflicting_users.append(user.user_id)
            else:
                slot_score += 10 # FREE TIME REWARD
                free_users.append(user.user_id)
                
                # SOFT CONSTRAINT: Add preference weight (Multiply by 5 to give it impact)
                pref_score = get_preference_score(candidate_start, user.preferences)
                if pref_score > 0:
                    slot_score += (pref_score * 5)
                    preference_matches += 1

        # Save the analyzed slot
        scored_slots.append({
            "start": candidate_start.isoformat(),
            "end": candidate_end.isoformat(),
            "score": round(slot_score, 1),
            "free_users": free_users,
            "conflicting_users": conflicting_users,
            "metadata": {
                "attendance_ratio": f"{len(free_users)}/{len(users)}",
                "preference_matches": preference_matches
            }
        })

    # Sort from highest score to lowest
    scored_slots.sort(key=lambda x: x["score"], reverse=True)
    return scored_slots

# ==========================================
# 🌍 LAYER 3 & 4: API ENDPOINT & CATEGORIZATION
# ==========================================
@app.post("/api/schedule")
async def calculate_group_schedule(request: GroupScheduleRequest):
    all_slots = generate_and_score_slots(request.users, request.duration_hours)
    
    # Categorize into Green (Best), Yellow (Good), Red (Conflict)
    green_slots = [s for s in all_slots if len(s["conflicting_users"]) == 0][:3]
    yellow_slots = [s for s in all_slots if len(s["conflicting_users"]) == 1][:3] # 1 person misses out
    
    return {
        "status": "success",
        "total_users": len(request.users),
        "recommendations": {
            "green_best_slots": green_slots,
            "yellow_alternatives": yellow_slots
        }
    }

if __name__ == "__main__":
    print("🚀 Starting Unified CSP Scheduler on Port 8002...")
    uvicorn.run(app, host="127.0.0.1", port=8002)