from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .services.ai_handler import fetch_ai_quiz
from .models import UserSkill, Skill

class GenerateQuizView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        skill_name = request.data.get('skills')
        try:
            questions = fetch_ai_quiz(skill_name)
            return Response({"questions": questions})
        except Exception as e:
            return Response({"error": "AI could not generate quiz"}, status=500)

class SubmitQuizView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        skill_name = request.data.get('skill')
        correct_count = request.data.get('correct_count')
        total = request.data.get('total')
        
        score = (correct_count / total) * 100
        level = 'beginner'
        if score == 100: level = 'advanced'
        elif score >= 60: level = 'intermediate'

        # Update User's Arsenal
        skill_obj = Skill.objects.get(name__iexact=skill_name)
        user_skill = UserSkill.objects.get(user=request.user, skill=skill_obj)
        user_skill.is_verified = True
        user_skill.level = level
        user_skill.save()

        return Response({"status": "verified", "level": level})