from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .serializers import UserProfileUpdateSerializer
from django.contrib.auth import get_user_model

import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
User = get_user_model()

class UserProfileUpdateView(generics.UpdateAPIView):
    serializer_class = UserProfileUpdateSerializer
    permission_classes = [IsAuthenticated] # Only logged-in users can do this

    def get_object(self):
        # This ensures a user can only update their OWN profile, 
        # based on the JWT token they send in the header.
        return self.request.user

class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    callback_url = "http://localhost:3000"  # Your Next.js URL
    client_class = OAuth2Client

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