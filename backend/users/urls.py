from django.urls import path
from . import views
from . import quiz_views

urlpatterns = [
    path('quiz/generate/', quiz_views.GenerateQuizView.as_view(), name='quiz-generate'),
<<<<<<< HEAD
   
    path('quiz/submit/', quiz_views.SubmitQuizAPIView.as_view(), name='quiz-submit'),
=======
    path('quiz/submit/', quiz_views.SubmitQuizView.as_view(), name='quiz-submit'),
    path('live-group-schedule/', views.LiveGroupScheduleView.as_view(), name='live-group-schedule'),
>>>>>>> 261d2ef0509af1e22943532f38e095dac841055e
]