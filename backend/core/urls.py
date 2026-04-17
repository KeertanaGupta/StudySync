"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from users.views import GoogleLogin, UserProfileUpdateView, FindStudyMatchesView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Restore the base authentication scaffolding
    path('api/auth/', include('dj_rest_auth.urls')),
    path('api/auth/registration/', include('dj_rest_auth.registration.urls')),
    
    # Your custom Google login endpoint
    path('api/auth/google/', GoogleLogin.as_view(), name='google_login'),
    path('api/user/profile/',UserProfileUpdateView.as_view(),name='update_profile'),
    path('api/match/', FindStudyMatchesView.as_view(), name='find_matches'),
]
