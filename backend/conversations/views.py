from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q
from django.conf import settings
import time

from .models import Conversation, Message, ConversationQueryLog
from .serializers import (
    ConversationListSerializer,
    ConversationDetailSerializer,
    ConversationCreateSerializer,
    ConversationUpdateSerializer,
    ConversationEndSerializer,
    ConversationQuerySerializer,
    ConversationQueryLogSerializer,
    MessageSerializer,
    MessageCreateSerializer,
    ChatMessageSerializer,
)
from ai_service.services import ChatService, IntelligenceService
from ai_service.services.multi_model_service import MultiModelService
from user.models import UserProfile


class ConversationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Conversation CRUD operations
    
    Endpoints:
    - GET /api/conversations/ - List all conversations
    - GET /api/conversations/{id}/ - Get specific conversation with messages
    - POST /api/conversations/ - Create new conversation
    - PUT/PATCH /api/conversations/{id}/ - Update conversation
    - DELETE /api/conversations/{id}/ - Delete conversation
    - POST /api/conversations/{id}/end/ - End conversation with AI summary
    - POST /api/conversations/{id}/chat/ - Send message in conversation
    """
    
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return conversations for current user"""
        return Conversation.objects.filter(user=self.request.user).prefetch_related('messages')
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return ConversationListSerializer
        elif self.action == 'retrieve':
            return ConversationDetailSerializer
        elif self.action == 'create':
            return ConversationCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ConversationUpdateSerializer
        elif self.action == 'end':
            return ConversationEndSerializer
        elif self.action == 'chat':
            return ChatMessageSerializer
        return ConversationDetailSerializer
    
    def list(self, request, *args, **kwargs):
        """List all conversations for user"""
        queryset = self.get_queryset()
        
        # Filter by status if provided
        status_filter = request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by date range
        date_from = request.query_params.get('date_from', None)
        date_to = request.query_params.get('date_to', None)
        
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)
        
        # Search by title or summary
        search = request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(summary__icontains=search)
            )
        
        queryset = queryset.order_by('-created_at')
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        """Create new conversation"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        conversation = serializer.save()
        
        # Return detailed conversation view
        detail_serializer = ConversationDetailSerializer(conversation)
        return Response(detail_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def end(self, request, pk=None):
        """
        End a conversation and generate AI summary
        
        POST /api/conversations/{id}/end/
        Body: {
            "generate_summary": true,
            "analysis_depth": "detailed"
        }
        """
        conversation = self.get_object()
        
        if conversation.status == 'ended':
            return Response(
                {'error': 'Conversation already ended'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # End the conversation
        conversation.end_conversation()
        
        # Generate AI summary if requested
        if serializer.validated_data.get('generate_summary', True):
            try:
                # Get user's preferred provider and API key
                custom_api_key = None
                ai_provider = settings.AI_PROVIDER
                
                try:
                    from user.models import UserProfile
                    profile = UserProfile.objects.filter(user=request.user).first()
                    if profile:
                        ai_provider = profile.preferred_provider or settings.AI_PROVIDER
                        custom_api_key = profile.get_api_key(ai_provider)
                        if not custom_api_key:
                            if ai_provider == 'gemini':
                                custom_api_key = settings.GEMINI_API_KEY
                            elif ai_provider == 'groq':
                                custom_api_key = settings.GROQ_API_KEY
                            elif ai_provider == 'cohere':
                                custom_api_key = settings.COHERE_API_KEY
                except Exception:
                    pass
                
                intelligence_service = IntelligenceService(api_key=custom_api_key, provider=ai_provider)
                
                # Get all messages
                messages = conversation.messages.all().values('role', 'content')
                messages_list = [
                    {'role': msg['role'], 'content': msg['content']}
                    for msg in messages
                ]
                
                if not messages_list:
                    # No messages, create basic summary
                    conversation.summary = "Empty conversation with no messages."
                    conversation.key_topics = []
                    conversation.sentiment = 'neutral'
                    conversation.save()
                else:
                    # Generate summary
                    analysis_depth = serializer.validated_data.get('analysis_depth', 'detailed')
                    analysis = intelligence_service.generate_conversation_summary(
                        messages_list,
                        analysis_depth=analysis_depth
                    )
                    
                    # Extract topics
                    topics = intelligence_service.extract_topics(messages_list)
                    
                    # Analyze sentiment
                    sentiment_result = intelligence_service.analyze_sentiment(messages_list)
                    
                    # Get summary, with fallback if AI failed
                    summary = analysis.get('summary', '')
                    if not summary or summary == 'Error generating summary':
                        # Generate basic fallback summary from messages
                        user_messages = [msg['content'] for msg in messages_list if msg['role'] == 'user']
                        if user_messages:
                            first_message = user_messages[0][:200]  # First 200 chars
                            summary = f"Conversation about: {first_message}..."
                        else:
                            summary = "Conversation with no user messages."
                    
                    # Update conversation
                    conversation.summary = summary
                    conversation.key_topics = topics or analysis.get('topics', [])
                    conversation.sentiment = sentiment_result.get('sentiment', 'neutral')
                    conversation.save(update_fields=['summary', 'key_topics', 'sentiment'])
                    print(f"Successfully generated summary for conversation {conversation.id}")
                    print(f"Summary: {summary[:100]}...")
                
            except Exception as e:
                # Log error and create basic fallback summary
                import traceback
                error_trace = traceback.format_exc()
                print(f"Error generating summary: {str(e)}")
                print(f"Traceback: {error_trace}")
                try:
                    messages = conversation.messages.all().values('role', 'content')
                    if messages:
                        user_messages = [msg['content'] for msg in messages if msg['role'] == 'user']
                        if user_messages:
                            first_message = user_messages[0][:200]
                            conversation.summary = f"Conversation about: {first_message}..."
                        else:
                            conversation.summary = "Conversation with assistant messages only."
                    else:
                        conversation.summary = "Empty conversation with no messages."
                    # Ensure summary is saved
                    conversation.save(update_fields=['summary'])
                    print(f"Saved fallback summary for conversation {conversation.id}: {conversation.summary}")
                except Exception as save_error:
                    print(f"Error saving fallback summary: {str(save_error)}")
                    import traceback
                    print(traceback.format_exc())
        
        # Return updated conversation
        detail_serializer = ConversationDetailSerializer(conversation)
        return Response(detail_serializer.data)
    
    @action(detail=True, methods=['post'], url_path='generate-summary')
    def generate_summary(self, request, pk=None):
        """
        Generate or regenerate summary for a conversation (active or ended)
        
        POST /api/conversations/{id}/generate-summary/
        Body: {
            "analysis_depth": "detailed"  // optional: basic, detailed, comprehensive
        }
        """
        conversation = self.get_object()
        
        analysis_depth = request.data.get('analysis_depth', 'detailed')
        
        try:
            # Get user's preferred provider and API key
            custom_api_key = None
            ai_provider = settings.AI_PROVIDER
            
            try:
                from user.models import UserProfile
                profile = UserProfile.objects.filter(user=request.user).first()
                if profile:
                    ai_provider = profile.preferred_provider or settings.AI_PROVIDER
                    custom_api_key = profile.get_api_key(ai_provider)
                    if not custom_api_key:
                        if ai_provider == 'gemini':
                            custom_api_key = settings.GEMINI_API_KEY
                        elif ai_provider == 'groq':
                            custom_api_key = settings.GROQ_API_KEY
                        elif ai_provider == 'cohere':
                            custom_api_key = settings.COHERE_API_KEY
            except Exception as e:
                print(f"Error getting user profile: {str(e)}")
            
            intelligence_service = IntelligenceService(api_key=custom_api_key, provider=ai_provider)
            
            # Get all messages
            messages = conversation.messages.all().values('role', 'content')
            messages_list = [
                {'role': msg['role'], 'content': msg['content']}
                for msg in messages
            ]
            
            if not messages_list:
                return Response(
                    {'error': 'Cannot generate summary for conversation with no messages.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Generate summary
            analysis = intelligence_service.generate_conversation_summary(
                messages_list,
                analysis_depth=analysis_depth
            )
            
            # Extract topics
            topics = intelligence_service.extract_topics(messages_list)
            
            # Analyze sentiment
            sentiment_result = intelligence_service.analyze_sentiment(messages_list)
            
            # Get summary, with fallback if AI failed
            summary = analysis.get('summary', '')
            if not summary or summary == 'Error generating summary':
                # Generate basic fallback summary from messages
                user_messages = [msg['content'] for msg in messages_list if msg['role'] == 'user']
                if user_messages:
                    first_message = user_messages[0][:200]  # First 200 chars
                    summary = f"Conversation about: {first_message}..."
                else:
                    summary = "Conversation with no user messages."
            
            # Update conversation
            conversation.summary = summary
            conversation.key_topics = topics or analysis.get('topics', [])
            conversation.sentiment = sentiment_result.get('sentiment', 'neutral')
            conversation.save(update_fields=['summary', 'key_topics', 'sentiment'])
            
            return Response({
                'message': 'Summary generated successfully.',
                'summary': summary,
                'key_topics': conversation.key_topics,
                'sentiment': conversation.sentiment,
            })
            
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f"Error generating summary: {str(e)}")
            print(f"Traceback: {error_trace}")
            
            # Create fallback summary
            try:
                messages = conversation.messages.all().values('role', 'content')
                if messages:
                    user_messages = [msg['content'] for msg in messages if msg['role'] == 'user']
                    if user_messages:
                        first_message = user_messages[0][:200]
                        fallback_summary = f"Conversation about: {first_message}..."
                    else:
                        fallback_summary = "Conversation with assistant messages only."
                else:
                    fallback_summary = "Empty conversation with no messages."
                
                conversation.summary = fallback_summary
                conversation.save(update_fields=['summary'])
                
                return Response({
                    'message': 'Summary generated with fallback method.',
                    'summary': fallback_summary,
                    'warning': f'AI summary generation failed: {str(e)}',
                }, status=status.HTTP_206_PARTIAL_CONTENT)
            except Exception as save_error:
                return Response(
                    {'error': f'Failed to generate summary: {str(save_error)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
    
    @action(detail=True, methods=['post'])
    def chat(self, request, pk=None):
        """
        Send a message in a conversation and get AI response
        
        POST /api/conversations/{id}/chat/
        Body: {
            "message": "User message here"
        }
        """
        conversation = self.get_object()
        
        if conversation.status == 'ended':
            return Response(
                {'error': 'Cannot send messages to ended conversation'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = ChatMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user_message = serializer.validated_data['message']
        
        # Create user message
        user_msg = Message.objects.create(
            conversation=conversation,
            role='user',
            content=user_message
        )
        
        # Get conversation history
        messages = conversation.messages.all().order_by('created_at')
        message_history = [
            {'role': msg.role, 'content': msg.content}
            for msg in messages
        ]
        
        # Get AI response with user's preferred model and API key if configured
        try:
            from ai_service.models import AIConfig
            from user.models import UserProfile
            
            # Try to get user's AI config for preferred model
            preferred_model = None
            custom_api_key = None
            
            try:
                ai_config = AIConfig.objects.get(user=request.user)
                preferred_model = ai_config.preferred_model
            except AIConfig.DoesNotExist:
                pass
            
            # Get user's preferred provider, model, and API key
            custom_api_key = None
            ai_provider = settings.AI_PROVIDER  # Default from settings
            user_model = None
            
            try:
                from user.models import UserProfile
                profile = UserProfile.objects.filter(user=request.user).first()
                if profile:
                    # Get user's preferred provider
                    ai_provider = profile.preferred_provider or settings.AI_PROVIDER
                    
                    # Get user's preferred model for the provider
                    user_model = profile.get_preferred_model(ai_provider)
                    
                    # Get user's API key for the provider
                    custom_api_key = profile.get_api_key(ai_provider)
                    
                    # If no custom key for preferred provider, try to use system default
                    if not custom_api_key:
                        # Fall back to system default for this provider
                        if ai_provider == 'gemini':
                            custom_api_key = settings.GEMINI_API_KEY
                        elif ai_provider == 'groq':
                            custom_api_key = settings.GROQ_API_KEY
                        elif ai_provider == 'cohere':
                            custom_api_key = settings.COHERE_API_KEY
            except Exception as e:
                print(f"Error getting user profile: {str(e)}")
                # Use system defaults
                if ai_provider == 'gemini':
                    custom_api_key = settings.GEMINI_API_KEY
                elif ai_provider == 'groq':
                    custom_api_key = settings.GROQ_API_KEY
                elif ai_provider == 'cohere':
                    custom_api_key = settings.COHERE_API_KEY
            
            # Use preferred model if available, otherwise use system default
            model_to_use = user_model or preferred_model
            
            # Use multi-model service with user's preferences
            try:
                multi_service = MultiModelService(
                    provider=ai_provider, 
                    api_key=custom_api_key,
                    model=model_to_use
                )
                response = multi_service.chat(message_history)
            except Exception as e:
                # Fallback to original ChatService
                print(f"Multi-model error, falling back: {str(e)}")
                chat_service = ChatService(api_key=custom_api_key)
                response = chat_service.chat(message_history, model=model_to_use)
            
            if response.get('error'):
                return Response(
                    {'error': f"AI service error: {response['error']}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Create assistant message
            assistant_msg = Message.objects.create(
                conversation=conversation,
                role='assistant',
                content=response['content'],
                token_count=response.get('tokens', 0)
            )
            
            # Update conversation
            conversation.message_count = conversation.messages.count()
            conversation.save()
            
            # Update user profile usage statistics
            try:
                from user.models import UserProfile
                profile, created = UserProfile.objects.get_or_create(user=request.user)
                profile.increment_usage(
                    tokens=response.get('tokens', 0),
                    messages=2  # user message + assistant message
                )
            except Exception as e:
                # Don't fail if profile update fails
                print(f"Error updating profile usage: {str(e)}")
            
            # Get total tokens safely
            total_tokens = 0
            try:
                from user.models import UserProfile
                profile = UserProfile.objects.filter(user=request.user).first()
                if profile:
                    total_tokens = profile.total_tokens_used
            except Exception:
                pass
            
            return Response({
                'user_message': MessageSerializer(user_msg).data,
                'assistant_message': MessageSerializer(assistant_msg).data,
                'tokens_used': response.get('tokens', 0),
                'processing_time_ms': response.get('processing_time', 0),
                'total_tokens_used': total_tokens,
            })
        
        except Exception as e:
            return Response(
                {'error': f"Error processing message: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MessageViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Message operations (read-only)
    
    Messages are created through the conversation chat endpoint
    """
    
    permission_classes = [IsAuthenticated]
    serializer_class = MessageSerializer
    
    def get_queryset(self):
        """Return messages from user's conversations"""
        return Message.objects.filter(
            conversation__user=self.request.user
        ).select_related('conversation')


class ConversationQueryViewSet(viewsets.ViewSet):
    """
    ViewSet for querying past conversations using AI
    
    Endpoints:
    - POST /api/conversation-query/ - Query past conversations
    - GET /api/conversation-query/history/ - Get query history
    """
    
    permission_classes = [IsAuthenticated]
    
    def create(self, request):
        """
        Query past conversations using natural language
        
        POST /api/conversation-query/
        Body: {
            "query": "What did we discuss about AI last week?",
            "date_from": "2024-01-01T00:00:00Z",
            "date_to": "2024-01-31T23:59:59Z",
            "topics": ["AI", "machine learning"],
            "sentiment": "positive",
            "max_conversations": 10
        }
        """
        serializer = ConversationQuerySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        query = serializer.validated_data['query']
        date_from = serializer.validated_data.get('date_from')
        date_to = serializer.validated_data.get('date_to')
        topics = serializer.validated_data.get('topics', [])
        sentiment_filter = serializer.validated_data.get('sentiment')
        max_conversations = serializer.validated_data.get('max_conversations', 10)
        
        start_time = time.time()
        
        try:
            # Get user's conversations with filters
            conversations = Conversation.objects.filter(
                user=request.user,
                status='ended'
            ).prefetch_related('messages')
            
            if date_from:
                conversations = conversations.filter(created_at__gte=date_from)
            if date_to:
                conversations = conversations.filter(created_at__lte=date_to)
            if sentiment_filter:
                conversations = conversations.filter(sentiment=sentiment_filter)
            if topics:
                # Filter by topics (JSON field contains)
                for topic in topics:
                    conversations = conversations.filter(key_topics__icontains=topic)
            
            conversations = conversations[:max_conversations]
            
            # Prepare conversation data
            conversations_data = []
            for conv in conversations:
                messages = conv.messages.all().values('role', 'content')
                conversations_data.append({
                    'id': conv.id,
                    'summary': conv.summary,
                    'created_at': conv.created_at.isoformat(),
                    'message_count': conv.message_count,
                    'messages': [
                        {'role': msg['role'], 'content': msg['content']}
                        for msg in messages
                    ]
                })
            
            # Get user's preferred provider, model, and API key
            custom_api_key = None
            ai_provider = settings.AI_PROVIDER
            
            try:
                from user.models import UserProfile
                profile = UserProfile.objects.filter(user=request.user).first()
                if profile:
                    # Get user's preferred provider
                    ai_provider = profile.preferred_provider or settings.AI_PROVIDER
                    
                    # Get user's API key for the provider
                    custom_api_key = profile.get_api_key(ai_provider)
                    
                    # If no custom key for preferred provider, try to use system default
                    if not custom_api_key:
                        if ai_provider == 'gemini':
                            custom_api_key = settings.GEMINI_API_KEY
                        elif ai_provider == 'groq':
                            custom_api_key = settings.GROQ_API_KEY
                        elif ai_provider == 'cohere':
                            custom_api_key = settings.COHERE_API_KEY
            except Exception as e:
                print(f"Error getting user profile: {str(e)}")
                # Use system defaults
                if ai_provider == 'gemini':
                    custom_api_key = settings.GEMINI_API_KEY
                elif ai_provider == 'groq':
                    custom_api_key = settings.GROQ_API_KEY
                elif ai_provider == 'cohere':
                    custom_api_key = settings.COHERE_API_KEY
            
            # Query using AI with user's preferences
            # IntelligenceService will use MultiModelService internally
            intelligence_service = IntelligenceService(api_key=custom_api_key, provider=ai_provider)
            result = intelligence_service.query_conversations(
                query,
                conversations_data,
                top_k=5
            )
            
            processing_time = int((time.time() - start_time) * 1000)
            
            # Ensure result has required fields
            answer = result.get('answer', 'Unable to generate answer.')
            if not answer or answer.strip() == '':
                answer = 'Unable to generate answer.'
            
            # Save query log
            query_log = ConversationQueryLog.objects.create(
                user=request.user,
                query=query,
                response=answer,
                processing_time_ms=processing_time
            )
            
            # Add related conversations to log
            related_conv_ids = [conv['id'] for conv in result.get('related_conversations', [])]
            if related_conv_ids:
                query_log.related_conversations.set(
                    Conversation.objects.filter(id__in=related_conv_ids)
                )
            
            return Response({
                'query': query,
                'answer': answer,
                'related_conversations': result.get('related_conversations', []),
                'confidence': result.get('confidence', 0.0),
                'processing_time_ms': processing_time,
                'query_log_id': query_log.id,
            })
        
        except Exception as e:
            return Response(
                {'error': f"Error processing query: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def history(self, request):
        """
        Get user's query history
        
        GET /api/conversation-query/history/
        """
        logs = ConversationQueryLog.objects.filter(
            user=request.user
        ).prefetch_related('related_conversations')[:20]
        
        serializer = ConversationQueryLogSerializer(logs, many=True)
        return Response(serializer.data)
