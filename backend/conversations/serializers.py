from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Conversation, Message, ConversationQueryLog


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for Message model"""
    
    class Meta:
        model = Message
        fields = [
            'id',
            'conversation',
            'role',
            'content',
            'created_at',
            'token_count',
        ]
        read_only_fields = ['id', 'created_at', 'token_count']
    
    def validate_role(self, value):
        """Validate role is one of the allowed choices"""
        if value not in ['user', 'assistant', 'system']:
            raise serializers.ValidationError("Role must be 'user', 'assistant', or 'system'")
        return value


class MessageCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating messages"""
    
    class Meta:
        model = Message
        fields = ['role', 'content']
    
    def validate_role(self, value):
        """Validate role is one of the allowed choices"""
        if value not in ['user', 'assistant', 'system']:
            raise serializers.ValidationError("Role must be 'user', 'assistant', or 'system'")
        return value


class ConversationListSerializer(serializers.ModelSerializer):
    """Serializer for listing conversations (brief info)"""
    
    user = UserSerializer(read_only=True)
    last_message = serializers.SerializerMethodField()
    summary_preview = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = [
            'id',
            'user',
            'title',
            'status',
            'created_at',
            'updated_at',
            'ended_at',
            'message_count',
            'duration_minutes',
            'sentiment',
            'summary',
            'summary_preview',
            'key_topics',
            'last_message',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'ended_at', 'duration_minutes']
    
    def get_summary_preview(self, obj):
        """Get a preview of the summary (first 150 chars)"""
        if obj.summary:
            return obj.summary[:150] + '...' if len(obj.summary) > 150 else obj.summary
        return None
    
    def get_last_message(self, obj):
        """Get the last message in the conversation"""
        last_message = obj.messages.last()
        if last_message:
            return {
                'role': last_message.role,
                'content': last_message.content[:100] + '...' if len(last_message.content) > 100 else last_message.content,
                'created_at': last_message.created_at,
            }
        return None


class ConversationDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed conversation view with all messages"""
    
    user = UserSerializer(read_only=True)
    messages = MessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Conversation
        fields = [
            'id',
            'user',
            'title',
            'status',
            'created_at',
            'updated_at',
            'ended_at',
            'summary',
            'key_topics',
            'sentiment',
            'message_count',
            'duration_minutes',
            'messages',
        ]
        read_only_fields = [
            'id', 
            'created_at', 
            'updated_at', 
            'ended_at', 
            'duration_minutes',
            'message_count',
        ]


class ConversationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating conversations"""
    
    initial_message = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = Conversation
        fields = ['title', 'initial_message']
    
    def create(self, validated_data):
        """Create conversation and optionally add initial message"""
        initial_message = validated_data.pop('initial_message', None)
        user = self.context['request'].user
        
        conversation = Conversation.objects.create(
            user=user,
            **validated_data
        )
        
        # Add initial message if provided
        if initial_message:
            Message.objects.create(
                conversation=conversation,
                role='user',
                content=initial_message
            )
            conversation.message_count = 1
            conversation.save()
        
        return conversation


class ConversationUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating conversations"""
    
    class Meta:
        model = Conversation
        fields = ['title', 'status', 'summary', 'key_topics', 'sentiment']


class ConversationEndSerializer(serializers.Serializer):
    """Serializer for ending a conversation"""
    
    generate_summary = serializers.BooleanField(default=True)
    analysis_depth = serializers.ChoiceField(
        choices=['basic', 'detailed', 'comprehensive'],
        default='detailed'
    )


class ConversationQuerySerializer(serializers.Serializer):
    """Serializer for querying past conversations"""
    
    query = serializers.CharField(required=True, min_length=3)
    date_from = serializers.DateTimeField(required=False, allow_null=True)
    date_to = serializers.DateTimeField(required=False, allow_null=True)
    topics = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True
    )
    sentiment = serializers.ChoiceField(
        choices=['positive', 'negative', 'neutral', 'mixed'],
        required=False,
        allow_null=True
    )
    max_conversations = serializers.IntegerField(default=10, min_value=1, max_value=50)


class ConversationQueryLogSerializer(serializers.ModelSerializer):
    """Serializer for conversation query logs"""
    
    user = UserSerializer(read_only=True)
    related_conversations = ConversationListSerializer(many=True, read_only=True)
    
    class Meta:
        model = ConversationQueryLog
        fields = [
            'id',
            'user',
            'query',
            'response',
            'related_conversations',
            'created_at',
            'processing_time_ms',
        ]
        read_only_fields = ['id', 'created_at', 'processing_time_ms']


class ChatMessageSerializer(serializers.Serializer):
    """Serializer for sending chat messages"""
    
    message = serializers.CharField(required=True, min_length=1)
    conversation_id = serializers.IntegerField(required=False, allow_null=True)
    
    def validate_message(self, value):
        """Validate message is not empty"""
        if not value.strip():
            raise serializers.ValidationError("Message cannot be empty")
        return value

