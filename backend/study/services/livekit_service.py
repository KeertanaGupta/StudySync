import os
from livekit import api
from django.conf import settings

class LiveKitService:
    @staticmethod
    def generate_token(room_name, participant_name):
        """
        Generates a JWT token for a participant to join a LiveKit room.
        """
        url = settings.LIVEKIT_URL
        api_key = settings.LIVEKIT_API_KEY
        api_secret = settings.LIVEKIT_API_SECRET
        
        if not api_key or not api_secret:
            print("⚠️ LIVEKIT_API_KEY or LIVEKIT_API_SECRET not set in settings.")
            return None
            
        token = api.AccessToken(api_key, api_secret) \
            .with_identity(participant_name) \
            .with_name(participant_name) \
            .with_grants(api.VideoGrants(
                room_join=True,
                room=room_name,
                can_publish_data=True,
                can_subscribe=True
            ))
            
        return token.to_jwt()
