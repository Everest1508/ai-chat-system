from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class Conversation(models.Model):
    """
    Model to store conversation metadata
    """
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('ended', 'Ended'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations')
    title = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    
    # Summary and metadata
    summary = models.TextField(blank=True, null=True)
    key_topics = models.JSONField(default=list, blank=True)
    sentiment = models.CharField(max_length=50, blank=True, null=True)
    
    # Conversation analytics
    message_count = models.IntegerField(default=0)
    duration_minutes = models.IntegerField(default=0, help_text="Duration in minutes")
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"Conversation {self.id} - {self.user.username} - {self.status}"
    
    def end_conversation(self):
        """Mark conversation as ended and calculate duration"""
        self.status = 'ended'
        self.ended_at = timezone.now()
        if self.created_at:
            duration = self.ended_at - self.created_at
            self.duration_minutes = int(duration.total_seconds() / 60)
        self.save()


class Message(models.Model):
    """
    Model to store individual messages in a conversation
    """
    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
        ('system', 'System'),
    ]
    
    conversation = models.ForeignKey(
        Conversation, 
        on_delete=models.CASCADE, 
        related_name='messages'
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    
    # Message metadata
    created_at = models.DateTimeField(auto_now_add=True)
    token_count = models.IntegerField(default=0)
    
    # For semantic search
    embedding = models.JSONField(null=True, blank=True)
    
    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['conversation', 'created_at']),
            models.Index(fields=['role']),
        ]
    
    def __str__(self):
        return f"{self.role}: {self.content[:50]}..."


class ConversationQueryLog(models.Model):
    """
    Model to log queries made about past conversations
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='query_logs')
    query = models.TextField()
    response = models.TextField()
    
    # Related conversations found
    related_conversations = models.ManyToManyField(
        Conversation, 
        related_name='query_references',
        blank=True
    )
    
    # Query metadata
    created_at = models.DateTimeField(auto_now_add=True)
    processing_time_ms = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
        ]
    
    def __str__(self):
        return f"Query by {self.user.username}: {self.query[:50]}..."
