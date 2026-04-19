import os
import django
from django.utils import timezone
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from study.models import StudySession, Resource, Notification
from users.models import Skill

User = get_user_model()

def seed():
    # 1. Create a demo user if it doesn't exist
    user, created = User.objects.get_or_create(
        username='demo_student',
        email='demo@studysync.app',
        defaults={'first_name': 'Demo', 'last_name': 'Student'}
    )
    if created:
        user.set_password('password123')
        user.save()
    
    # 2. Create some Sessions
    StudySession.objects.get_or_create(
        title='DSA Mastery Workshop',
        topic='Data Structures',
        description='Solving hard LeetCode problems together.',
        creator=user,
        scheduled_time=timezone.now() + timedelta(days=1, hours=2),
        duration=120
    )
    
    StudySession.objects.get_or_create(
        title='React Builders Night',
        topic='Web Dev',
        description='Building a real-world app with React and Vite.',
        creator=user,
        scheduled_time=timezone.now() + timedelta(days=2, hours=5),
        duration=90
    )

    # 3. Create some Resources
    Resource.objects.get_or_create(
        title='Python Cheat Sheet',
        file_type='pdf',
        file='https://res.cloudinary.com/demo/image/upload/sample.jpg', # Mock URL
        subject='Python',
        uploader=user
    )
    
    Resource.objects.get_or_create(
        title='Fullstack Roadmap 2024',
        file_type='link',
        file='https://roadmap.sh/full-stack',
        subject='Career',
        uploader=user
    )

    # 4. Create some Notifications
    Notification.objects.get_or_create(
        user=user,
        message='Welcome to <strong>StudySync</strong>! Start by finding a match.',
        notif_type='match'
    )
    
    Notification.objects.get_or_create(
        user=user,
        message='Your group <strong>React Builders</strong> has a new session.',
        notif_type='session'
    )

    print("Successfully seeded dynamic dummy data!")

if __name__ == '__main__':
    seed()
