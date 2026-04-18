from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .services.ai_handler import fetch_ai_quiz
from .models import UserSkill, Skill

class GenerateQuizView(APIView):
    def post(self, request):
        # Expecting { "skills": ["Python", "Django"] } from React
        skills = request.data.get('skills', [])
        
        if not skills:
            return Response({"error": "No skills provided"}, status=400)

        try:
            # Call our new Gemini handler
            questions = fetch_ai_quiz(skills)
            return Response({"questions": questions})
        except Exception as e:
            import traceback
            traceback.print_exc() # Still keep this for debugging
            return Response({"error": str(e)}, status=500)
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