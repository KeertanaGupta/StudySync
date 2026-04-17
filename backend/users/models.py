from django.contrib.auth.models import AbstractUser
from django.db import models

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