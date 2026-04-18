from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Skill, UserSkill

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

class UserSkillSerializer(serializers.ModelSerializer):
    # This 'source' tells Django to look at the 'name' inside the linked 'skill' model
    name = serializers.CharField(source='skill.name', read_only=True)

    class Meta:
        model = UserSkill
        fields = ['id', 'name', 'is_verified', 'level']