from django.urls import path
from . import views
from . import quiz_views # Import your new file

urlpatterns = [
    path('quiz/generate/', quiz_views.GenerateQuizView.as_view(), name='quiz-generate'),
   
    path('quiz/submit/', quiz_views.SubmitQuizView.as_view(), name='quiz-submit'),
]