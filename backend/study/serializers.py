from rest_framework import serializers
from .models import StudySession, Resource, Notification, StudyGroup, GroupEvent
from django.contrib.auth import get_user_model

User = get_user_model()

class StudyGroupSerializer(serializers.ModelSerializer):
    member_count = serializers.IntegerField(source='members.count', read_only=True)
    class Meta:
        model = StudyGroup
        fields = '__all__'
        depth = 1

class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'profile_picture']

class StudySessionSerializer(serializers.ModelSerializer):
    creator = UserMiniSerializer(read_only=True)
    members = UserMiniSerializer(many=True, read_only=True)
    member_count = serializers.IntegerField(source='members.count', read_only=True)

    class Meta:
        model = StudySession
        fields = '__all__'

class ResourceSerializer(serializers.ModelSerializer):
    uploader = UserMiniSerializer(read_only=True)
    is_starred = serializers.SerializerMethodField()

    class Meta:
        model = Resource
        fields = '__all__'

    def get_is_starred(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.stars.filter(id=request.user.id).exists()
        return False

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

from users.models import StudyRequest, UserAvailability
class StudyRequestSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    receiver_name = serializers.CharField(source='receiver.username', read_only=True)
    class Meta:
        model = StudyRequest
        fields = '__all__'
        read_only_fields = ['sender', 'status']

class UserAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAvailability
        fields = '__all__'

class GroupEventSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.username')
    class Meta:
        model = GroupEvent
        fields = '__all__'
        extra_kwargs = {'user': {'read_only': True}}
        read_only_fields = ['user']
