from django.db import models
from django.conf import settings
import uuid

class StudyGroup(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='study_groups')
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='owned_groups', null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class StudySession(models.Model):
    title = models.CharField(max_length=255)
    topic = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_sessions')
    group = models.ForeignKey(StudyGroup, on_delete=models.CASCADE, related_name='sessions', null=True, blank=True)
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='study_sessions', blank=True)
    scheduled_time = models.DateTimeField()
    duration = models.IntegerField(default=60) # in minutes
    is_active = models.BooleanField(default=False)
    room_url = models.URLField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Resource(models.Model):
    RESOURCE_TYPES = [
        ('pdf', 'PDF Document'),
        ('video', 'Video'),
        ('link', 'External Link'),
        ('notes', 'Study Notes'),
    ]
    title = models.CharField(max_length=255)
    file_type = models.CharField(max_length=20, choices=RESOURCE_TYPES)
    file = models.FileField(upload_to='resources/') # Cloudinary handles this
    subject = models.CharField(max_length=100)
    uploader = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='uploaded_resources')
    group = models.ForeignKey(StudyGroup, on_delete=models.CASCADE, related_name='resources', null=True, blank=True)
    is_public = models.BooleanField(default=True)
    stars = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='starred_resources', blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Notification(models.Model):
    NOTIF_TYPES = [
        ('mention', 'Mention'),
        ('match', 'New Match'),
        ('session', 'Session Update'),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    notif_type = models.CharField(max_length=20, choices=NOTIF_TYPES)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.notif_type}"

class GroupEvent(models.Model):
    group = models.ForeignKey(StudyGroup, on_delete=models.CASCADE, related_name='group_calendar_events')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    day_of_week = models.IntegerField() # 0-6
    start_hour = models.IntegerField() # 0-23
    duration = models.IntegerField(default=1)
    color = models.CharField(max_length=50, default='#e2e8f0')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.group.name} - {self.title}"
