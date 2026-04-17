from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            # The 5 Onboarding Vectors
            'learning_style', 
            'study_goal',     # Updated from 'goals'
            'study_type',     # Updated from 'session_format'
            'role',           # Updated from 'primary_role'
            'availability', 
            
            # The Magic Flag
            'is_profile_complete',
            
            # Academic Fields (Included here so users can update them later in their settings)
            'branch',
            'semester',
            'institution'
        ]