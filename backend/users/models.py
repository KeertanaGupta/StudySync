from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings


class User(AbstractUser):
    # ==========================================
    # 1. AUTH DATA (From Google)
    # ==========================================
    google_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    profile_picture = models.URLField(max_length=500, blank=True, null=True)
    is_profile_complete = models.BooleanField(default=False)

    # ==========================================
    # 2. ACADEMIC DATA (Optional / Post-login)
    # ==========================================
    branch = models.CharField(max_length=100, blank=True, null=True)
    semester = models.IntegerField(null=True, blank=True)
    institution = models.CharField(max_length=255, blank=True, null=True)

    # ==========================================
    # 3. ONBOARDING DATA (The 5 Questions x 4 Choices)
    # ==========================================
    LEARNING_STYLES = [
        ('visual', 'Visual (Videos & Diagrams)'),
        ('auditory', 'Auditory (Talking & Listening)'),
        ('reading', 'Reading (Notes & Textbooks)'),
        ('kinesthetic', 'Kinesthetic (Practice Problems)'),
    ]
    learning_style = models.CharField(max_length=50, choices=LEARNING_STYLES, blank=True, null=True)

    GOALS = [
        ('exam', 'Exam Prep'),
        ('project', 'Project Help'),
        ('concept', 'Concept Clarity'),
        ('practice', 'Practice Problems'),
    ]
    study_goal = models.CharField(max_length=50, choices=GOALS, blank=True, null=True)

    STUDY_TYPES = [
        ('silent', 'Silent Co-working'),
        ('discussion', 'Active Discussion'),
        ('mixed', 'Independent but checking in'),
        ('pomodoro', 'Pomodoro sprints'),
    ]
    study_type = models.CharField(max_length=50, choices=STUDY_TYPES, blank=True, null=True)

    ROLES = [
        ('explainer', 'Explainer'),
        ('problem_solver', 'Problem Solver'),
        ('note_taker', 'Note-Taker'),
        ('questioner', 'Questioner'),
    ]
    role = models.CharField(max_length=50, choices=ROLES, blank=True, null=True)

    AVAILABILITY = [
        ('mornings', 'Early Bird (Mornings)'),
        ('afternoons', 'Afternoon Grind'),
        ('evenings', 'Night Owl (Evenings)'),
        ('weekends', 'Weekends Only'),
    ]
    availability = models.CharField(max_length=50, choices=AVAILABILITY, blank=True, null=True)

    # ==========================================
    # 4. SYSTEM DATA (Calculated later)
    # ==========================================
    study_dna = models.JSONField(default=dict, blank=True)
    stats = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return self.email or self.username
    
    
class Skill(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class UserSkill(models.Model):
    LEVEL_CHOICES = (
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    )
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='skills')
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE)
    
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='beginner')
    is_verified = models.BooleanField(default=False) # Remains false until they pass the AI test
    last_tested_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'skill') # Prevents adding "React" twice for the same user

    def __str__(self):
        return f"{self.user.email} - {self.skill.name} ({self.level})"

class UserAvailability(models.Model):
    DAYS_OF_WEEK = [
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='detailed_availability')
    day_of_week = models.IntegerField(choices=DAYS_OF_WEEK)
    start_time = models.TimeField()
    end_time = models.TimeField()

    class Meta:
        verbose_name_plural = "User Availabilities"

    def __str__(self):
        return f"{self.user.username} - {self.get_day_of_week_display()} ({self.start_time}-{self.end_time})"
class StudyRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
    ]
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_requests')
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_requests')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('sender', 'receiver')

    def __str__(self):
        return f'{self.sender.username} -> {self.receiver.username} ({self.status})'

