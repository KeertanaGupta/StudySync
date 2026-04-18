from django.conf import settings
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, AllowAny
from .serializers import UserProfileUpdateSerializer, UserSkillSerializer
from django.contrib.auth import get_user_model
from .models import UserSkill, Skill
from rest_framework import status
import requests
from datetime import datetime, timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from allauth.socialaccount.models import SocialToken
import json

User = get_user_model()

class UserProfileUpdateView(generics.UpdateAPIView):
    serializer_class = UserProfileUpdateSerializer
    permission_classes = [IsAuthenticated] # Only logged-in users can do this

    def get_object(self):
        return self.request.user  # ✅ FIX ADDED

    def get(self, request):
        # Make sure it says 'request.user' here!
        serializer = UserProfileUpdateSerializer(request.user) 
        return Response(serializer.data, status=status.HTTP_200_OK)

class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    callback_url = "http://localhost:5173"  # Your Next.js URL
    client_class = OAuth2Client

    def get_response(self):
        serializer_class = self.get_response_serializer()
        serializer = serializer_class(instance=self.token, context={'request': self.request})
        
        # This is the standard data dj-rest-auth generates
        data = serializer.data 
        
        # We wrap it to ensure 'access' and 'is_profile_complete' are at the top level
        custom_data = {
            'access': data.get('access_token') or data.get('key'), # Support both JWT and Token
            'user': data.get('user'),
            'is_profile_complete': self.user.is_profile_complete # Grab directly from user model
        }
        return Response(custom_data)

class FindStudyMatchesView(APIView):
    permission_classes = [AllowAny] # Open for testing!

    def get(self, request):
        # 1. Pull ALL users directly from PostgreSQL
        all_users = User.objects.all()

        # 2. Format the Postgres data into the JSON the AI Engine expects
        ai_user_list = []
        for u in all_users:
            if u.learning_style: # Only include users who filled out their profile
                ai_user_list.append({
                    "user_id": str(u.id), # AI expects a string ID
                    "learning_style": u.learning_style,
                    "study_goal": u.study_goal,
                    "study_type": u.study_type,
                    "role": u.role,
                    "availability": u.availability
                })

        if not ai_user_list:
            return Response({"error": "No users found in database."})

        # For this test, we will pretend db_user_1 is the one asking for matches
        target = ai_user_list[0] 

        payload = {
            "target_user": target,
            "all_users": ai_user_list
        }

        # 3. Send the real Postgres data to your AI Engine
        try:
            ai_response = requests.post("http://127.0.0.1:8001/api/match", json=payload)
            # 4. Return the AI's math back to the browser/frontend
            return Response(ai_response.json()) 
        except requests.exceptions.ConnectionError:
            return Response({"error": "AI Engine is offline. Is it running on port 8001?"}, status=500)
        
class ManageUserSkillsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_skills = UserSkill.objects.filter(user=request.user).select_related('skill')
        serializer = UserSkillSerializer(user_skills, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        skill_name = request.data.get('name')
        if not skill_name:
            return Response({"error": "Skill name is required."}, status=status.HTTP_400_BAD_REQUEST)

        skill_name = skill_name.strip().title()
        skill_obj, _ = Skill.objects.get_or_create(name=skill_name)

        user_skill, created = UserSkill.objects.get_or_create(
            user=request.user,
            skill=skill_obj,
            defaults={'level': 'beginner', 'is_verified': False}
        )

        if not created:
            return Response({"error": "Skill already exists on your profile."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = UserSkillSerializer(user_skill)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

# --- Generate Quiz via OpenRouter ---
class GenerateQuizView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        skills_to_test = request.data.get('skills', [])
        
        if not skills_to_test:
            return Response({"error": "No skills provided for testing."}, status=status.HTTP_400_BAD_REQUEST)

        skill_name = skills_to_test[0] # Testing one skill at a time

        try:
            # 1. OpenRouter API Configuration
            openrouter_url = "https://openrouter.ai/api/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:5173", 
                "X-Title": "StudySync Arsenal"
            }

            # 2. The GPT-3.5 Prompt Payload
            payload = {
                "model": "openai/gpt-3.5-turbo",
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are an expert technical interviewer. You must return ONLY a valid JSON array. "
                            "Do NOT wrap the response in markdown blocks like ```json. Just return the raw array."
                        )
                    },
                    {
                        "role": "user",
                        "content": (
                            f"Generate a 3-question multiple choice quiz to test a user's knowledge on: {skill_name}. "
                            "Include one 'easy', one 'medium', and one 'hard' question. "
                            "Use this exact schema:\n"
                            "[\n"
                            "  {\n"
                            "    \"question\": \"The question text\",\n"
                            "    \"options\": [\"Option A\", \"Option B\", \"Option C\", \"Option D\"],\n"
                            "    \"correct_answer\": \"The exact string from options that is correct\",\n"
                            "    \"difficulty\": \"easy\"\n"
                            "  }\n"
                            "]"
                        )
                    }
                ]
            }

            # 3. Call OpenRouter
            response = requests.post(openrouter_url, headers=headers, json=payload)
            response.raise_for_status() 
            
            response_data = response.json()
            raw_text = response_data['choices'][0]['message']['content'].strip()

            # 4. Clean up the response
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            if raw_text.startswith("```"):
                raw_text = raw_text[3:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]
            
            raw_text = raw_text.strip()

            # 5. Parse the JSON and send it to React
            ai_questions = json.loads(raw_text)
            
            return Response({"questions": ai_questions}, status=status.HTTP_200_OK)

        except requests.exceptions.RequestException as e:
            print("OpenRouter API Error:", str(e))
            return Response({"error": "Failed to connect to AI engine."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except json.JSONDecodeError:
            print("Failed to parse AI response:", raw_text)
            return Response({"error": "AI generated invalid format. Please try again."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            print("Server Error:", str(e))
            return Response({"error": "An unexpected error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --- Grade & Award Level ---
class SubmitQuizAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        results = request.data.get('results', {})
        
        for skill_name, stats in results.items():
            total = stats.get('total', 1)
            correct = stats.get('correct', 0)
            percentage = (correct / total) * 100

            # Rank Logic
            if percentage >= 85:
                level = 'advanced'
            elif percentage >= 50:
                level = 'intermediate'
            else:
                level = 'beginner'

            skill_obj = Skill.objects.get(name=skill_name)
            
            # Update the user's skill level and turn on the verified flag
            UserSkill.objects.filter(user=request.user, skill=skill_obj).update(
                level=level, 
                is_verified=True
            )

        return Response({"message": "Test evaluated successfully!"}, status=status.HTTP_200_OK)

class UserSkillListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_skills = UserSkill.objects.filter(user=request.user)
        serializer = UserSkillSerializer(user_skills, many=True)
        return Response(serializer.data)

    def post(self, request):
        skill_name = request.data.get('name', '').strip()
        
        if not skill_name:
            return Response({"error": "Skill name is required"}, status=status.HTTP_400_BAD_REQUEST)

        skill_obj, _ = Skill.objects.get_or_create(name__iexact=skill_name, defaults={'name': skill_name})

        user_skill, created = UserSkill.objects.get_or_create(
            user=request.user,
            skill=skill_obj,
            defaults={'is_verified': False, 'level': 'beginner'}
        )

        if not created:
            return Response({"error": "This skill is already in your arsenal!"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = UserSkillSerializer(user_skill)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ==========================================
# UNIFIED CSP SCHEDULER BRIDGE (Layer 1 Data)
# ==========================================
def fetch_live_google_events(user):
    """Fetches real Google events and formats them for the CSP Engine."""
    try:
        token = SocialToken.objects.get(account__user=user, account__provider='google')
        headers = {'Authorization': f'Bearer {token.token}'}
        
        now = datetime.utcnow()
        time_min = now.isoformat() + 'Z'
        time_max = (now + timedelta(days=7)).isoformat() + 'Z' # Next 7 days
        
        url = f"https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin={time_min}&timeMax={time_max}&singleEvents=true"
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            events = response.json().get('items', [])
            formatted_events = []
            for event in events:
                start = event['start'].get('dateTime', event['start'].get('date'))
                end = event['end'].get('dateTime', event['end'].get('date'))
                if start and end:
                    # Map to the strict TimeBlock format the AI expects
                    formatted_events.append({"start": start, "end": end})
            return formatted_events
        return []
    except SocialToken.DoesNotExist:
        return []

def map_user_preferences(availability_string):
    """Converts a Django string ('mornings') into the AI's float math."""
    prefs = {"morning": 0.0, "afternoon": 0.0, "evening": 0.0}
    if not availability_string:
        return prefs 
        
    avail = availability_string.lower()
    if "mornings" in avail: prefs["morning"] = 1.0
    if "afternoons" in avail: prefs["afternoon"] = 1.0
    if "evenings" in avail: prefs["evening"] = 1.0
    
    return prefs

class LiveGroupScheduleView(APIView):
    permission_classes = [AllowAny] 

    def post(self, request):
        target_user_ids = request.data.get('user_ids', [])
        duration_hours = request.data.get('duration_hours', 2)

        if not target_user_ids:
            return Response({"error": "Please provide a list of user_ids."})

        users = User.objects.filter(id__in=target_user_ids)
        ai_users_payload = []
        
        for u in users:
            # 1. Fetch real Google Calendar data
            real_events = fetch_live_google_events(u)
            
            # 2. Map their preferences
            user_prefs = map_user_preferences(u.availability)
            
            # 3. Build the strict UserSchedule structure
            ai_users_payload.append({
                "user_id": u.username or str(u.id), 
                "timezone": "UTC",
                "busy_slots": real_events,
                "preferences": user_prefs
            })

        # Assemble the final payload for the AI
        ai_payload = {
            "duration_hours": duration_hours,
            "users": ai_users_payload
        }

        try:
            print("🚀 Django: Sending live data to AI Engine on Port 8002...")
            # Fire the payload to your FastApi server!
            ai_response = requests.post("http://127.0.0.1:8002/api/schedule", json=ai_payload)
            
            if ai_response.status_code != 200:
                print("❌ AI Engine rejected the payload:", ai_response.text)
                return Response({"error": "AI validation failed"}, status=500)
                
            return Response(ai_response.json())
            
        except requests.exceptions.ConnectionError:
            return Response({"error": "AI Scheduler offline (Port 8002)."}, status=500)