from django.contrib import admin
from django.urls import path, include
from users.views import (
    GoogleLogin, UserProfileUpdateView, FindStudyMatchesView, 
    ManageUserSkillsAPIView, UserProfileDetailView
)
from rest_framework_simplejwt.views import TokenObtainPairView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Restore the base authentication scaffolding
    path('api/auth/', include('dj_rest_auth.urls')),
    path('api/auth/registration/', include('dj_rest_auth.registration.urls')),
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    
    # Your custom Google login endpoint
    path('api/auth/google/', GoogleLogin.as_view(), name='google_login'),
    path('api/user/profile/', UserProfileUpdateView.as_view(), name='update_profile'),
    path('api/user/profile/<int:pk>/', UserProfileDetailView.as_view(), name='user_detail'),
    path('api/match/', FindStudyMatchesView.as_view(), name='find_matches'),

    path('api/skills/', ManageUserSkillsAPIView.as_view(), name='manage-skills'),
    path('api/study/', include('study.urls')),
    path('api/', include('users.urls')), 

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
