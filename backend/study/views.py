from django.db import models
from django.conf import settings
import math
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import StudySession, Resource, Notification, StudyGroup, GroupEvent, GroupMessage
from .serializers import (
    StudySessionSerializer, ResourceSerializer, NotificationSerializer, 
    StudyGroupSerializer, StudyRequestSerializer, UserAvailabilitySerializer,
    GroupEventSerializer, GroupMessageSerializer
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

    @action(detail=False, methods=['get'])
    def search_users(self, request):
        query = request.query_params.get('q', '')
        if not query:
            return Response([])
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        users = User.objects.filter(
            models.Q(username__icontains=query) | 
            models.Q(email__icontains=query)
        ).exclude(id=request.user.id)[:10]
        
        from .serializers import UserMiniSerializer
        serializer = UserMiniSerializer(users, many=True)
        return Response(serializer.data)

class StudyGroupViewSet(viewsets.ModelViewSet):
    serializer_class = StudyGroupSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Users only see groups they are members of
        return StudyGroup.objects.filter(members=self.request.user)

    def perform_create(self, serializer):
        group = serializer.save(creator=self.request.user)
        group.members.add(self.request.user)

    @action(detail=True, methods=['get', 'post', 'delete'])
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

        elif request.method == 'DELETE':
            event_id = request.query_params.get('event_id')
            if not event_id:
                return Response({"error": "event_id is required in query parameters."}, status=status.HTTP_400_BAD_REQUEST)
            try:
                event = GroupEvent.objects.get(id=event_id, group=group)
                if event.user != request.user:
                    return Response({"error": "Only the creator can remove this event."}, status=status.HTTP_403_FORBIDDEN)
                event.delete()
                return Response(status=status.HTTP_204_NO_CONTENT)
            except GroupEvent.DoesNotExist:
                return Response({"error": "Event not found."}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get'])
    def get_optimal_slots(self, request, pk=None):
        group = self.get_object()
        members = group.members.all()
        
        # CSP Approach
        # Hard constraint: Users must not be in a class (UserAvailability = BUSY)
        # Soft constraint: Users' preferred study times (availability field)
        
        # 1. Build busy sets for each user
        busy_slots = {m.id: set() for m in members}
        
        # 1.1. Add Class Schedule (UserAvailability)
        availabilities = UserAvailability.objects.filter(user__in=members)
        for avail in availabilities:
            start_hour = avail.start_time.hour
            end_hour = avail.end_time.hour
            curr = start_hour
            while curr != end_hour:
                busy_slots[avail.user.id].add((avail.day_of_week, curr))
                curr = (curr + 1) % 24
        
        # 1.2. Add Individual Study Sessions
        from .models import StudySession
        sessions = StudySession.objects.filter(
            models.Q(members__in=members) | models.Q(creator__in=members)
        ).distinct()
        for sess in sessions:
            # StudySessions use DateTimeField, convert to day_of_week and hour
            # Note: This handles weekly recurrences conceptually by marking the slot
            d = sess.scheduled_time
            day = (d.weekday()) # 0=Mon
            start_h = d.hour
            duration_h = math.ceil(sess.duration / 60)
            for i in range(duration_h):
                busy_slots[sess.creator.id].add((day, (start_h + i) % 24))
                for m in sess.members.all():
                    if m.id in busy_slots:
                        busy_slots[m.id].add((day, (start_h + i) % 24))

        # 1.3. Add Existing Group Events (All groups members belong to)
        group_events_all = GroupEvent.objects.filter(group__members__in=members).distinct()
        for ge in group_events_all:
            for i in range(ge.duration):
                slot = (int(ge.day_of_week), (int(ge.start_hour) + i) % 24)
                # Mark as busy for all members in THAT group who are also in OUR group
                intersecting_members = ge.group.members.filter(id__in=members.values_list('id', flat=True))
                for m in intersecting_members:
                    busy_slots[m.id].add(slot)

        # 1.5. Build busy set for existing group events and sessions
        group_busy_slots = set()
        
        # Add Group Events
        group_events = GroupEvent.objects.filter(group=group)
        for event in group_events:
            for i in range(event.duration):
                group_busy_slots.add((int(event.day_of_week), (int(event.start_hour) + i) % 24))
        
        # Add Group Study Sessions
        group_sessions = StudySession.objects.filter(group=group)
        for sess in group_sessions:
            d = sess.scheduled_time
            day = d.weekday()
            start_h = d.hour
            duration_h = math.ceil(sess.duration / 60)
            for i in range(duration_h):
                group_busy_slots.add((day, (start_h + i) % 24))

        # 2. Score all possible slots (day 0-6, hour 8-22 for realistic study times)
        scores = {}
        for day in range(7):
            for hour in range(8, 23):
                # Skip if there's already a group event at this time
                if (day, hour) in group_busy_slots:
                    continue

                slot_score = 0
                available_count = 0
                
                for member in members:
                    if (day, hour) not in busy_slots[member.id]:
                        # They are free! (Hard constraint met)
                        available_count += 1
                        slot_score += 10 # Base score for being free
                        
                        # Soft constraints: Add bonus if it matches preference
                        pref = member.availability
                        if pref == 'mornings' and 6 <= hour < 12:
                            slot_score += 5
                        elif pref == 'afternoons' and 12 <= hour < 17:
                            slot_score += 5
                        elif pref == 'evenings' and 17 <= hour < 22:
                            slot_score += 5
                        elif pref == 'weekends' and day in [5, 6]:
                            slot_score += 5
                            
                # Only consider slots where EVERYONE is available
                if available_count == len(members):
                    scores[(day, hour)] = {
                        'score': slot_score,
                        'available_count': available_count
                    }
        
        # 3. Sort by score (primary) and available count (secondary)
        sorted_slots = sorted(scores.items(), key=lambda x: (x[1]['score'], x[1]['available_count']), reverse=True)
        
        # 4. Format suggestions
        suggestions = []
        for (day, hour), data in sorted_slots[:5]:
            suggestions.append({
                'day_of_week': day,
                'day_name': dict(UserAvailability.DAYS_OF_WEEK).get(day),
                'hour': hour,
                'count': data['available_count'],
                'total_members': members.count(),
                'score': data['score']
            })
            
        return Response(suggestions)

    @action(detail=True, methods=['get', 'post'])
    def messages(self, request, pk=None):
        group = self.get_object()
        if request.method == 'GET':
            messages = group.messages.all().order_by('created_at')
            serializer = GroupMessageSerializer(messages, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            serializer = GroupMessageSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(user=request.user, group=group)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def invite_member(self, request, pk=None):
        group = self.get_object()
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({"error": "user_id is required"}, status=400)
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            user_to_invite = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
        
        if group.members.filter(id=user_id).exists():
            return Response({"error": "User is already a member"}, status=400)
        
        group.members.add(user_to_invite)
        
        # Notify
        Notification.objects.create(
            user=user_to_invite,
            message=f"You have been added to the study group: {group.name} by {request.user.username}",
            notif_type='session'
        )
        
        return Response({"status": f"Added {user_to_invite.username} to group"}, status=200)

    @action(detail=True, methods=['post'])
    def remove_member(self, request, pk=None):
        group = self.get_object()
        if group.creator != request.user:
            return Response({"error": "Only the creator can remove members"}, status=403)
        
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({"error": "user_id is required"}, status=400)
        
        if int(user_id) == group.creator.id:
            return Response({"error": "Cannot remove the creator"}, status=400)
            
        group.members.remove(user_id)
        return Response({"status": "Member removed"}, status=200)


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
