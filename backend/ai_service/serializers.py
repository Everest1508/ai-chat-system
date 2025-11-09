from rest_framework import serializers
from django.contrib.auth.models import User
from .models import AIConfig, EmbeddingCache


class AIConfigSerializer(serializers.ModelSerializer):
    """Serializer for AI configuration"""
    
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = AIConfig
        fields = [
            'id',
            'user',
            'preferred_model',
            'temperature',
            'max_tokens',
            'enable_sentiment_analysis',
            'enable_topic_extraction',
            'enable_semantic_search',
            'analysis_depth',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
    
    def validate_temperature(self, value):
        """Validate temperature is between 0 and 2"""
        if not 0 <= value <= 2:
            raise serializers.ValidationError("Temperature must be between 0 and 2")
        return value
    
    def validate_max_tokens(self, value):
        """Validate max_tokens is positive"""
        if value <= 0:
            raise serializers.ValidationError("Max tokens must be positive")
        return value


class AIConfigCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating AI configuration"""
    
    class Meta:
        model = AIConfig
        fields = [
            'preferred_model',
            'temperature',
            'max_tokens',
            'enable_sentiment_analysis',
            'enable_topic_extraction',
            'enable_semantic_search',
            'analysis_depth',
        ]
    
    def validate_temperature(self, value):
        """Validate temperature is between 0 and 2"""
        if not 0 <= value <= 2:
            raise serializers.ValidationError("Temperature must be between 0 and 2")
        return value
    
    def validate_max_tokens(self, value):
        """Validate max_tokens is positive"""
        if value <= 0:
            raise serializers.ValidationError("Max tokens must be positive")
        return value


class EmbeddingCacheSerializer(serializers.ModelSerializer):
    """Serializer for embedding cache (admin only)"""
    
    class Meta:
        model = EmbeddingCache
        fields = [
            'id',
            'text_hash',
            'text_preview',
            'model',
            'created_at',
            'last_accessed',
            'access_count',
        ]
        read_only_fields = ['id', 'created_at', 'last_accessed', 'access_count']

