from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .services.ai_handler import fetch_ai_quiz
import traceback
from rest_framework import status
from .models import UserSkill, Skill

class GenerateQuizView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        skills = request.data.get('skills') or request.data.get('skill')
        
        # Ensure it's a list
        if isinstance(skills, str):
            skills = [skills]

        if not skills:
            return Response({"error": "No skills provided for testing."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 🚀 THIS IS THE MAGIC LINE: It calls your Gemini setup!
            questions = fetch_ai_quiz(skills)
            return Response({"questions": questions}, status=status.HTTP_200_OK)

        except Exception as e:
            error_msg = str(e)
            print(f"--- AI CRASH: {error_msg} ---")
            
            # Proper error handling for the frontend
            if "429" in error_msg or "Quota" in error_msg:
                return Response({"error": "API Quota Reached. Please wait a minute."}, status=status.HTTP_429_TOO_MANY_REQUESTS)
            if "503" in error_msg:
                return Response({"error": "AI is busy. Retrying..."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
                
            traceback.print_exc()
            return Response({"error": error_msg}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SubmitQuizAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # React is sending: { skill: "Ruby", correct_count: 8, total: 10 }
        skill_name = request.data.get('skill')
        correct = int(request.data.get('correct_count', 0))
        total = int(request.data.get('total', 1)) # avoid division by zero
        
        if not skill_name:
             return Response({"error": "Skill name is required"}, status=status.HTTP_400_BAD_REQUEST)

        percentage = (correct / total) * 100

        # Rank Logic
        if percentage >= 85:
            level = 'advanced'
        elif percentage >= 50:
            level = 'intermediate'
        else:
            level = 'beginner'

        try:
            skill_obj = Skill.objects.get(name__iexact=skill_name)
            
            # Update the user's skill level and turn on the verified flag
            UserSkill.objects.filter(user=request.user, skill=skill_obj).update(
                level=level, 
                is_verified=True
            )
            return Response({
                "message": f"Test evaluated! Scored {percentage}%. Level set to {level}."
            }, status=status.HTTP_200_OK)
            
        except Skill.DoesNotExist:
            return Response({"error": "Skill not found in database."}, status=status.HTTP_404_NOT_FOUND)