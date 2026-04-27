from django.db import models
from django.conf import settings
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import StudySession, Resource, Notification, StudyGroup, GroupEvent
from .serializers import (
    StudySessionSerializer, ResourceSerializer, NotificationSerializer, 
    StudyGroupSerializer, StudyRequestSerializer, UserAvailabilitySerializer,
    GroupEventSerializer
)
from users.models import UserAvailability, StudyRequest
from .services.livekit_service import LiveKitService
import uuid
import os
import io
import re

class StudySessionViewSet(viewsets.ModelViewSet):
    serializer_class = StudySessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Users only see sessions for groups they are in, or sessions they created
        return StudySession.objects.filter(
            models.Q(creator=self.request.user) | 
            models.Q(group__members=self.request.user) |
            models.Q(members=self.request.user)
        ).distinct().order_by('-scheduled_time')

    def perform_create(self, serializer):
        # Assign a unique room name for LiveKit
        room_name = f"session-{uuid.uuid4().hex[:8]}"
        session = serializer.save(creator=self.request.user, room_url=room_name)
        
        # Add invited members
        invited_ids = self.request.data.get('invited_members', [])
        if invited_ids:
            session.members.add(*invited_ids)
            # Create notifications for invited users
            for uid in invited_ids:
                Notification.objects.create(
                    user_id=uid,
                    message=f"{self.request.user.username} invited you to a live study session: {session.title}",
                    notif_type='session'
                )

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        session = self.get_object()
        session.members.add(request.user)
        return Response({'status': 'joined'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def get_token(self, request, pk=None):
        session = self.get_object()
        participant_name = request.user.username or "Anonymous"
        
        # Use room_url field as the room_name
        room_name = session.room_url or f"session-{session.id}"
        
        token = LiveKitService.generate_token(room_name, participant_name)
        livekit_url = settings.LIVEKIT_URL
        
        return Response({
            'token': token,
            'serverUrl': livekit_url,
            'roomName': room_name
        })

class ResourceViewSet(viewsets.ModelViewSet):
    serializer_class = ResourceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Find accepted friends
        friends_ids = set(StudyRequest.objects.filter(
            (models.Q(sender=user) | models.Q(receiver=user)),
            status='accepted'
        ).values_list('sender_id', 'receiver_id', flat=False))
        
        flat_friend_ids = {uid for pair in friends_ids for uid in pair}
        
        return Resource.objects.filter(
            models.Q(uploader=user) | # Mine
            models.Q(uploader_id__in=flat_friend_ids, is_public=True) | # Friends' public ones
            models.Q(group__members=user) # Shared with my groups
        ).distinct().order_by('-uploaded_at')

    def perform_create(self, serializer):
        # file_url is handled by Cloudinary storage if field is FileField
        # But here we used URLField in models.py. 
        # Let's update models.py to use FileField for better integration.
        serializer.save(uploader=self.request.user)

    @action(detail=True, methods=['post'])
    def star(self, request, pk=None):
        resource = self.get_object()
        if resource.stars.filter(id=request.user.id).exists():
            resource.stars.remove(request.user)
            return Response({'status': 'unstarred'}, status=status.HTTP_200_OK)
        else:
            resource.stars.add(request.user)
            return Response({'status': 'starred'}, status=status.HTTP_200_OK)

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'marked as read'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'all marked as read'}, status=status.HTTP_200_OK)

class StudyGroupViewSet(viewsets.ModelViewSet):
    serializer_class = StudyGroupSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Users only see groups they are members of
        return StudyGroup.objects.filter(members=self.request.user)

    def perform_create(self, serializer):
        group = serializer.save(creator=self.request.user)
        group.members.add(self.request.user)

    @action(detail=True, methods=['get', 'post'])
    def calendar_events(self, request, pk=None):
        group = self.get_object()
        if request.method == 'GET':
            events = GroupEvent.objects.filter(group=group)
            serializer = GroupEventSerializer(events, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            serializer = GroupEventSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(user=request.user, group=group)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def get_optimal_slots(self, request, pk=None):
        group = self.get_object()
        members = group.members.all()
        
        # Simplified Optimization Algorithm
        availabilities = UserAvailability.objects.filter(user__in=members)
        
        scores = {} # (day, hour) -> [user_ids]
        
        for avail in availabilities:
            start_hour = avail.start_time.hour
            # Handle end time (might be midnight or cross hours)
            end_hour = avail.end_time.hour
            if avail.end_time.minute > 0 or avail.end_time.hour == 0:
                # If it ends at 00:00, it usually means end of day
                pass 
                
            # Loop through hours
            curr = start_hour
            while curr != end_hour:
                key = (avail.day_of_week, curr)
                if key not in scores:
                    scores[key] = []
                if avail.user.id not in scores[key]:
                    scores[key].append(avail.user.id)
                curr = (curr + 1) % 24
        
        # Sort by number of users available
        sorted_slots = sorted(scores.items(), key=lambda x: len(x[1]), reverse=True)
        
        # Format suggestions
        suggestions = []
        for (day, hour), user_ids in sorted_slots[:5]:
            suggestions.append({
                'day_of_week': day,
                'day_name': dict(UserAvailability.DAYS_OF_WEEK).get(day),
                'hour': hour,
                'count': len(user_ids),
                'total_members': members.count()
            })
            
        return Response(suggestions)

class StudyRequestViewSet(viewsets.ModelViewSet):
    serializer_class = StudyRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return StudyRequest.objects.filter(
            models.Q(sender=self.request.user) | models.Q(receiver=self.request.user)
        )

    def perform_create(self, serializer):
        receiver = serializer.validated_data.get('receiver')
        if receiver == self.request.user:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("You cannot send a study request to yourself.")
        
        request_obj = serializer.save(sender=self.request.user)
        
        # Notify the receiver
        Notification.objects.create(
            user=receiver,
            message=f"{self.request.user.username} sent you a study request! Check your social tab.",
            notif_type='match'
        )

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        study_request = self.get_object()
        if study_request.receiver != request.user:
            return Response({"error": "Unauthorized"}, status=403)
        
        study_request.status = 'accepted'
        study_request.save()
        
        # Create a group automatically
        group_name = f"{study_request.sender.username} & {study_request.receiver.username} Study Circle"
        group = StudyGroup.objects.create(name=group_name, creator=request.user)
        group.members.add(study_request.sender, study_request.receiver)
        
        # Notify both users
        Notification.objects.create(
            user=study_request.sender,
            message=f"{request.user.username} accepted your study request! You are now friends.",
            notif_type='match'
        )
        
        return Response({"status": "Accepted. Group and Friendship established."}, status=200)

class UserAvailabilityViewSet(viewsets.ModelViewSet):
    serializer_class = UserAvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserAvailability.objects.filter(user=self.request.user)

    @action(detail=False, methods=['post'])
    def ocr_upload(self, request):
        import google.generativeai as genai
        from PIL import Image
        import json
        
        image_file = request.FILES.get('file')
        if not image_file:
            return Response({"error": "No file uploaded"}, status=400)
            
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key or api_key == 'your_gemini_api_key_here':
             return Response({"error": "GEMINI_API_KEY not configured. Please add a valid Google AI API key to the .env file."}, status=500)

        try:
            # 1. Initialize Gemini
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-2.5-flash")
            
            # 2. Process Image
            img = Image.open(io.BytesIO(image_file.read()))
            
            prompt = """
            Return a JSON array of objects representing the classes in this timetable.
            Each object MUST have:
            - "day_of_week": integer (0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun)
            - "start_time": string (HH:MM format, 24h)
            - "end_time": string (HH:MM format, 24h)

            Return ONLY the raw JSON array.
            """
            
            response = model.generate_content([prompt, img])
            text_response = response.text.replace('```json', '').replace('```', '').strip()
            
            # Clean possible trailing markups
            if '[' in text_response and ']' in text_response:
                text_response = text_response[text_response.find('['):text_response.rfind(']')+1]
            
            print(f"DEBUG: AI Raw Response: {text_response}")
            
            try:
                detected_slots = json.loads(text_response)
            except json.JSONDecodeError:
                return Response({
                    "error": "AI response was not valid JSON. Try again with a clearer image.",
                    "raw": text_response
                }, status=500)

            if not isinstance(detected_slots, list):
                 raise ValueError("AI response is not a valid list")

            # Bulk Update
            UserAvailability.objects.filter(user=request.user).delete()
            objs = [
                UserAvailability(
                    user=request.user,
                    day_of_week=slot['day_of_week'],
                    start_time=slot.get('start_time', '09:00'),
                    end_time=slot.get('end_time', '10:00')
                ) for slot in detected_slots
            ]
            UserAvailability.objects.bulk_create(objs)
            
            return Response({
                "status": "OCR Success",
                "count": len(detected_slots),
                "slots": detected_slots
            }, status=200)

        except Exception as e:
            return Response({"error": f"AI Engine Error: {str(e)}"}, status=500)

    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        # Data format: [{day_of_week: 0, start_time: "09:00", end_time: "10:00"}, ...]
        new_slots = request.data
        
        # 1. Clear existing for this user
        UserAvailability.objects.filter(user=request.user).delete()
        
        # 2. Bulk create
        objs = [
            UserAvailability(
                user=request.user,
                day_of_week=slot['day_of_week'],
                start_time=slot['start_time'],
                end_time=slot['end_time']
            ) for slot in new_slots
        ]
        UserAvailability.objects.bulk_create(objs)
        
        return Response({"status": "Availability updated via OCR"}, status=200)
