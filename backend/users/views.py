from django.db import models
from django.conf import settings
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from rest_framework import status, views, generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
import requests
from datetime import datetime, timedelta
from django.contrib.auth import get_user_model
from allauth.socialaccount.models import SocialToken
import json

from .models import UserAvailability, UserSkill, Skill
from .serializers import UserProfileUpdateSerializer, UserSkillSerializer

User = get_user_model()

# ==========================================
# AUTHENTICATION & PROFILE
# ==========================================

class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    callback_url = "http://localhost:5173"
    client_class = OAuth2Client

    def get_response(self):
        serializer_class = self.get_response_serializer()
        serializer = serializer_class(instance=self.token, context={'request': self.request})
        data = serializer.data 
        
        custom_data = {
            'access': data.get('access_token') or data.get('key'), 
            'user': data.get('user'),
            'is_profile_complete': self.user.is_profile_complete 
        }
        return Response(custom_data)

class UserProfileUpdateView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "institution": user.institution,
            "branch": user.branch,
            "learning_style": user.learning_style,
            "study_goal": user.study_goal,
            "study_type": user.study_type,
            "role": user.role,
            "availability": user.availability,
            "profile_picture": user.profile_picture.url if user.profile_picture else None,
            "is_profile_complete": user.is_profile_complete
        })

    def patch(self, request):
        user = request.user
        data = request.data

        for attr, value in data.items():
            if hasattr(user, attr):
                setattr(user, attr, value)
        
        explicit_complete_flag = data.get('is_profile_complete')
        if explicit_complete_flag in ['true', 'True', True]:
            user.is_profile_complete = True
            
        elif user.learning_style and user.role and user.study_goal:
            user.is_profile_complete = True
            
        user.save()
        print(f"DEBUG: User {user.username} profile completion status: {user.is_profile_complete}")
        return Response({"status": "updated", "is_profile_complete": user.is_profile_complete})

class UserProfileDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        from users.models import StudyRequest
        target_user = User.objects.get(pk=pk)
        
        is_friend = StudyRequest.objects.filter(
            (models.Q(sender=request.user, receiver=target_user) | 
             models.Q(sender=target_user, receiver=request.user)),
            status='accepted'
        ).exists()

        data = {
            "id": target_user.id,
            "username": target_user.username,
            "first_name": target_user.first_name,
            "institution": target_user.institution,
            "is_friend": is_friend
        }

        if is_friend:
            from study.models import Resource
            from study.serializers import ResourceSerializer
            user_resources = Resource.objects.filter(uploader=target_user, is_public=True)
            
            data.update({
                "learning_style": target_user.get_learning_style_display(),
                "study_goal": target_user.get_study_goal_display(),
                "skills": list(target_user.skills.values_list('skill__name', flat=True)),
                "role": target_user.get_role_display(),
                "branch": target_user.branch,
                "resources": ResourceSerializer(user_resources, many=True).data
            })
        else:
            data.update({
                "learning_style": "Locked",
                "skills": ["Hidden"],
                "role": "Locked"
            })
        return Response(data)

# ==========================================
# SKILLS & ARSENAL
# ==========================================

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
# OPENROUTER QUIZ GENERATION
# ==========================================

class GenerateQuizView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        skills_to_test = request.data.get('skills', [])
        
        if not skills_to_test:
            return Response({"error": "No skills provided for testing."}, status=status.HTTP_400_BAD_REQUEST)

        skill_name = skills_to_test[0] 

        try:
            openrouter_url = "https://openrouter.ai/api/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:5173", 
                "X-Title": "StudySync Arsenal"
            }

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

            response = requests.post(openrouter_url, headers=headers, json=payload)
            response.raise_for_status() 
            
            response_data = response.json()
            raw_text = response_data['choices'][0]['message']['content'].strip()

            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            if raw_text.startswith("```"):
                raw_text = raw_text[3:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]
            
            raw_text = raw_text.strip()

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

class SubmitQuizAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        results = request.data.get('results', {})
        
        for skill_name, stats in results.items():
            total = stats.get('total', 1)
            correct = stats.get('correct', 0)
            percentage = (correct / total) * 100

            if percentage >= 85:
                level = 'advanced'
            elif percentage >= 50:
                level = 'intermediate'
            else:
                level = 'beginner'

            skill_obj = Skill.objects.get(name=skill_name)
            
            UserSkill.objects.filter(user=request.user, skill=skill_obj).update(
                level=level, 
                is_verified=True
            )

        return Response({"message": "Test evaluated successfully!"}, status=status.HTTP_200_OK)

# ==========================================
# CONNECTIONS & MATCHMAKING
# ==========================================

class MyFriendsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from users.models import StudyRequest
        requests = StudyRequest.objects.filter(
            (models.Q(sender=request.user) | models.Q(receiver=request.user)),
            status='accepted'
        )
        friends = []
        for req in requests:
            friend = req.receiver if req.sender == request.user else req.sender
            friends.append({
                "id": friend.id,
                "username": friend.username,
                "name": f"{friend.first_name} {friend.last_name}" if friend.first_name else friend.username,
                "institution": friend.institution,
                "learning_style": friend.get_learning_style_display(),
                "role": friend.get_role_display(),
                "branch": friend.branch,
                "avatar_color": "#bae6fd"
            })
        return Response(friends)

class FindStudyMatchesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from users.models import StudyRequest
        existing_connections = StudyRequest.objects.filter(
            models.Q(sender=request.user) | models.Q(receiver=request.user)
        ).values_list('sender_id', 'receiver_id')
        
        excluded_ids = {request.user.id}
        for s, r in existing_connections:
            excluded_ids.add(s)
            excluded_ids.add(r)
            
        other_users = User.objects.exclude(id__in=excluded_ids).prefetch_related('skills')
        
        target_user = request.user

        ai_user_list = []
        for u in other_users:
            ai_user_list.append({
                "user_id": str(u.id),
                "learning_style": u.learning_style,
                "study_goal": u.study_goal,
                "study_type": u.study_type,
                "role": u.role,
                "availability": u.availability
            })

        if not ai_user_list:
            return Response({"matches": [], "message": "No other completed profiles found yet."})

        payload = {
            "target_user": {
                "user_id": str(target_user.id),
                "learning_style": target_user.learning_style,
                "study_goal": target_user.study_goal,
                "study_type": target_user.study_type,
                "role": target_user.role,
                "availability": target_user.availability
            },
            "all_users": ai_user_list
        }

        try:
            ai_response = requests.post("http://127.0.0.1:8001/api/match", json=payload, timeout=2)
            return Response(ai_response.json()) 
        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout):
            matches = []
            for u in other_users:
                score = 50 
                if u.learning_style == target_user.learning_style: score += 20
                if u.study_goal == target_user.study_goal: score += 20
                if u.branch == target_user.branch: score += 10
                
                matches.append({
                    "user_id": u.id,
                    "name": f"{u.first_name} {u.last_name}" if u.first_name else u.username,
                    "institution": u.institution or "Independent",
                    "score": score,
                    "shared_skills": list(u.skills.values_list('skill__name', flat=True)[:3]),
                    "learning_style": u.get_learning_style_display() or "Incomplete Profile",
                    "study_goal": u.get_study_goal_display() or "Flexible",
                    "role": u.get_role_display() or "Member",
                    "availability": u.get_availability_display() or "TBD",
                    "is_profile_complete": u.is_profile_complete
                })
            
            matches.sort(key=lambda x: x['score'], reverse=True)
            return Response({"matches": matches[:10], "engine": "Native Engine"})

# ==========================================
# UNIFIED CSP SCHEDULER BRIDGE (Layer 1 Data)
# ==========================================

def fetch_live_google_events(user):
    try:
        token = SocialToken.objects.get(account__user=user, account__provider='google')
        headers = {'Authorization': f'Bearer {token.token}'}
        
        now = datetime.utcnow()
        time_min = now.isoformat() + 'Z'
        time_max = (now + timedelta(days=7)).isoformat() + 'Z'
        
        url = f"https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin={time_min}&timeMax={time_max}&singleEvents=true"
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            events = response.json().get('items', [])
            formatted_events = []
            for event in events:
                start = event['start'].get('dateTime', event['start'].get('date'))
                end = event['end'].get('dateTime', event['end'].get('date'))
                if start and end:
                    formatted_events.append({"start": start, "end": end})
            return formatted_events
        return []
    except SocialToken.DoesNotExist:
        return []

def map_user_preferences(availability_string):
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
            real_events = fetch_live_google_events(u)
            user_prefs = map_user_preferences(u.availability)
            
            ai_users_payload.append({
                "user_id": u.username or str(u.id), 
                "timezone": "UTC",
                "busy_slots": real_events,
                "preferences": user_prefs
            })

        ai_payload = {
            "duration_hours": duration_hours,
            "users": ai_users_payload
        }

        try:
            print("🚀 Django: Sending live data to AI Engine on Port 8002...")
            ai_response = requests.post("http://127.0.0.1:8002/api/schedule", json=ai_payload)
            
            if ai_response.status_code != 200:
                print("❌ AI Engine rejected the payload:", ai_response.text)
                return Response({"error": "AI validation failed"}, status=500)
                
            return Response(ai_response.json())
            
        except requests.exceptions.ConnectionError:
            return Response({"error": "AI Scheduler offline (Port 8002)."}, status=500)

# ==========================================
# MISSING GROUPS APP LOGIC GOES HERE LATER!
# ==========================================
# class CreateStudyGroupView(APIView): ...
# class MyStudyGroupsView(APIView): ...