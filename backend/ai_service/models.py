from django.db import models
from django.contrib.auth.models import User


class AIConfig(models.Model):
    """
    Model to store AI configuration and preferences
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='ai_config')
    
    # Model preferences
    preferred_model = models.CharField(max_length=100, default='gpt-4')
    temperature = models.FloatField(default=0.7)
    max_tokens = models.IntegerField(default=2000)
    
    # Analysis preferences
    enable_sentiment_analysis = models.BooleanField(default=True)
    enable_topic_extraction = models.BooleanField(default=True)
    enable_semantic_search = models.BooleanField(default=True)
    analysis_depth = models.CharField(
        max_length=20,
        choices=[('basic', 'Basic'), ('detailed', 'Detailed'), ('comprehensive', 'Comprehensive')],
        default='detailed'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'AI Configuration'
        verbose_name_plural = 'AI Configurations'
    
    def __str__(self):
        return f"AI Config for {self.user.username}"


class EmbeddingCache(models.Model):
    """
    Cache for text embeddings to avoid redundant API calls
    """
    text_hash = models.CharField(max_length=64, unique=True, db_index=True)
    text_preview = models.CharField(max_length=200)
    embedding = models.JSONField()
    model = models.CharField(max_length=100)
    
    created_at = models.DateTimeField(auto_now_add=True)
    last_accessed = models.DateTimeField(auto_now=True)
    access_count = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['-last_accessed']
        indexes = [
            models.Index(fields=['text_hash']),
            models.Index(fields=['-last_accessed']),
        ]
    
    def __str__(self):
        return f"Embedding cache: {self.text_preview[:50]}"
