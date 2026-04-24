from django.urls import path
from . import views
from . import quiz_views

urlpatterns = [
    path('quiz/generate/', quiz_views.GenerateQuizView.as_view(), name='quiz-generate'),
    path('quiz/submit/', quiz_views.SubmitQuizAPIView.as_view(), name='quiz-submit'),
    path('live-group-schedule/', views.LiveGroupScheduleView.as_view(), name='live-group-schedule'),
    path('sync-google-calendar/', views.SyncGoogleCalendarView.as_view(), name='sync-google-calendar'),
]