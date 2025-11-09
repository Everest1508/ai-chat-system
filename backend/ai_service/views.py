from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from .models import AIConfig
from .serializers import AIConfigSerializer, AIConfigCreateUpdateSerializer
from .services import ModelService


class AIConfigViewSet(viewsets.ViewSet):
    """
    ViewSet for AI Configuration management
    
    Endpoints:
    - GET /api/ai-config/me/ - Get current user's AI configuration
    - POST /api/ai-config/me/ - Create or update AI configuration
    - PATCH /api/ai-config/me/ - Partially update AI configuration
    - GET /api/ai-config/defaults/ - Get default AI configuration values
    """
    
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        """Get current user's AI configuration (fallback)"""
        try:
            config = AIConfig.objects.get(user=request.user)
            serializer = AIConfigSerializer(config)
            return Response(serializer.data)
        except AIConfig.DoesNotExist:
            return Response(
                {'detail': 'AI configuration not found. Use POST /api/ai-config/me/ to create one.'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get', 'post', 'put', 'patch'])
    def me(self, request):
        """
        Get, create, or update current user's AI configuration
        
        GET /api/ai-config/me/ - Get config
        POST /api/ai-config/me/ - Create or update config (upsert)
        PUT /api/ai-config/me/ - Update config
        PATCH /api/ai-config/me/ - Partially update config
        """
        if request.method == 'GET':
            try:
                config = AIConfig.objects.get(user=request.user)
                serializer = AIConfigSerializer(config)
                return Response(serializer.data)
            except AIConfig.DoesNotExist:
                return Response(
                    {'detail': 'AI configuration not found. Use POST to create one.'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        elif request.method in ['POST', 'PUT', 'PATCH']:
            # Get or create config
            config, created = AIConfig.objects.get_or_create(
                user=request.user,
                defaults={
                    'preferred_model': 'models/gemini-pro',
                    'temperature': 0.7,
                    'max_tokens': 2048,
                    'enable_sentiment_analysis': True,
                    'enable_topic_extraction': True,
                    'enable_semantic_search': True,
                    'analysis_depth': 'detailed',
                }
            )
            
            # Update with provided data
            partial = request.method == 'PATCH'
            serializer = AIConfigCreateUpdateSerializer(
                config, 
                data=request.data, 
                partial=partial
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            
            response_serializer = AIConfigSerializer(config)
            status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
            return Response(response_serializer.data, status=status_code)
    
    @action(detail=False, methods=['get'])
    def defaults(self, request):
        """Get default AI configuration values"""
        from django.conf import settings
        
        return Response({
            'preferred_model': settings.AI_MODEL,  # gemini-pro
            'temperature': settings.AI_TEMPERATURE,
            'max_tokens': settings.AI_MAX_TOKENS,
            'enable_sentiment_analysis': True,
            'enable_topic_extraction': True,
            'enable_semantic_search': True,
            'analysis_depth': 'detailed',
        })
    
    @action(detail=False, methods=['post'])
    def reset(self, request):
        """Reset AI configuration to defaults"""
        from django.conf import settings
        
        try:
            config = AIConfig.objects.get(user=request.user)
            config.preferred_model = settings.AI_MODEL
            config.temperature = settings.AI_TEMPERATURE
            config.max_tokens = settings.AI_MAX_TOKENS
            config.enable_sentiment_analysis = True
            config.enable_topic_extraction = True
            config.enable_semantic_search = True
            config.analysis_depth = 'detailed'
            config.save()
            
            serializer = AIConfigSerializer(config)
            return Response(serializer.data)
        except AIConfig.DoesNotExist:
            return Response(
                {'error': 'AI configuration not found.'},
                status=status.HTTP_404_NOT_FOUND
            )


class ModelViewSet(viewsets.ViewSet):
    """
    ViewSet for AI Model management and discovery
    
    Endpoints:
    - GET /api/models/ - List all available Gemini models
    - GET /api/models/recommended/ - Get recommended models
    - POST /api/models/validate/ - Validate a model name
    - GET /api/models/{model_name}/ - Get specific model info
    """
    
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        """
        List all available Gemini models
        
        GET /api/models/
        """
        try:
            model_service = ModelService()
            models = model_service.list_available_models()
            
            return Response({
                'count': len(models),
                'models': models
            })
        except Exception as e:
            return Response(
                {'error': f'Error fetching models: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def recommended(self, request):
        """
        Get recommended models for different use cases
        
        GET /api/models/recommended/
        """
        try:
            model_service = ModelService()
            recommendations = model_service.get_recommended_models()
            
            return Response(recommendations)
        except Exception as e:
            return Response(
                {'error': f'Error fetching recommendations: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def validate(self, request):
        """
        Validate if a model name is valid
        
        POST /api/models/validate/
        Body: {
            "model_name": "models/gemini-pro"
        }
        """
        model_name = request.data.get('model_name')
        
        if not model_name:
            return Response(
                {'error': 'model_name is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            model_service = ModelService()
            is_valid = model_service.validate_model(model_name)
            
            if is_valid:
                model_info = model_service.get_model_info(model_name)
                return Response({
                    'valid': True,
                    'model': model_info
                })
            else:
                return Response({
                    'valid': False,
                    'error': 'Model not found or does not support generateContent'
                })
        except Exception as e:
            return Response(
                {'error': f'Error validating model: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def retrieve(self, request, pk=None):
        """
        Get detailed information about a specific model
        
        GET /api/models/{model_name}/
        Note: model_name should be URL-encoded (e.g., models%2Fgemini-pro)
        """
        try:
            # pk contains the model name (URL encoded)
            model_name = pk.replace('%2F', '/')  # Decode slashes
            
            model_service = ModelService()
            model_info = model_service.get_model_info(model_name)
            
            if model_info:
                return Response(model_info)
            else:
                return Response(
                    {'error': 'Model not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        except Exception as e:
            return Response(
                {'error': f'Error fetching model info: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
