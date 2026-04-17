from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .serializers import UserProfileUpdateSerializer
from django.contrib.auth import get_user_model

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