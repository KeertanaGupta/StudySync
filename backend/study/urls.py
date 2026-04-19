from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StudySessionViewSet, ResourceViewSet, NotificationViewSet, 
    StudyGroupViewSet, StudyRequestViewSet, UserAvailabilityViewSet
)
from users.views import MyFriendsView

router = DefaultRouter()
router.register(r'sessions', StudySessionViewSet, basename='studysession')
router.register(r'resources', ResourceViewSet, basename='resource')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'groups', StudyGroupViewSet, basename='studygroup')
router.register(r'requests', StudyRequestViewSet, basename='studyrequest')
router.register(r'availability', UserAvailabilityViewSet, basename='availability')

urlpatterns = [
    path('friends/', MyFriendsView.as_view(), name='my_friends'),
    path('', include(router.urls)),
]
