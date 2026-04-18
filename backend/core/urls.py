from django.contrib import admin
from django.urls import path, include

# Import ALL the views from your unified views.py
from users.views import (
    GoogleLogin, 
    UserProfileUpdateView, 
    FindStudyMatchesView, 
    ManageUserSkillsAPIView,
    GenerateQuizView,
    SubmitQuizAPIView,
    UserSkillListView,
    LiveGroupScheduleView # <--- Your AI Bridge
)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Auth & Accounts
    path('accounts/', include('allauth.urls')), 
    path('api/auth/', include('dj_rest_auth.urls')),
    path('api/auth/registration/', include('dj_rest_auth.registration.urls')),
    path('api/auth/google/', GoogleLogin.as_view(), name='google_login'),
    
    # Profile & Skills
    path('api/user/profile/', UserProfileUpdateView.as_view(), name='update_profile'),
    path('api/user/skills/', ManageUserSkillsAPIView.as_view(), name='manage_skills'),
    path('api/user/skills/list/', UserSkillListView.as_view(), name='list_skills'),
    
    # AI Quiz
    path('api/quiz/generate/', GenerateQuizView.as_view(), name='generate_quiz'),
    path('api/quiz/submit/', SubmitQuizAPIView.as_view(), name='submit_quiz'),
    
    # AI Matchmaker & Scheduler
    path('api/matchmaking/', FindStudyMatchesView.as_view(), name='find_matches'),
    path('api/group-schedule/', LiveGroupScheduleView.as_view(), name='group_schedule'), # <--- The Missing Doorway!
]