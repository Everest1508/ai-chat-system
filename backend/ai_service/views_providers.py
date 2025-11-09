"""
Views for managing AI providers and models
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .services.multi_model_service import MultiModelService


class AIProvidersViewSet(viewsets.ViewSet):
    """
    ViewSet for AI Provider management
    
    Endpoints:
    - GET /api/ai-providers/ - List available providers
    - GET /api/ai-providers/recommended/ - Get recommended provider
    - POST /api/ai-providers/test/ - Test a provider
    """
    
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        """
        List all available AI providers
        
        GET /api/ai-providers/
        """
        try:
            providers = MultiModelService.get_available_providers()
            return Response({
                'providers': providers,
                'current': request.query_params.get('provider', 'gemini')
            })
        except Exception as e:
            return Response(
                {'error': f'Error fetching providers: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def recommended(self, request):
        """
        Get recommended provider based on availability
        
        GET /api/ai-providers/recommended/
        """
        try:
            recommended = MultiModelService.get_recommended_provider()
            providers = MultiModelService.get_available_providers()
            
            return Response({
                'recommended': recommended,
                'details': providers.get(recommended, {}),
                'all_providers': providers
            })
        except Exception as e:
            return Response(
                {'error': f'Error getting recommendation: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def test(self, request):
        """
        Test an AI provider
        
        POST /api/ai-providers/test/
        Body: {
            "provider": "groq",
            "api_key": "optional-key",
            "test_message": "optional-message"
        }
        """
        provider = request.data.get('provider', 'gemini')
        api_key = request.data.get('api_key')
        test_message = request.data.get('test_message', 'Hello! Please respond with just "OK" if you receive this.')
        
        try:
            service = MultiModelService(provider=provider, api_key=api_key)
            response = service.chat([
                {"role": "user", "content": test_message}
            ])
            
            if response.get('error'):
                return Response({
                    'success': False,
                    'error': response['error'],
                    'provider': provider
                }, status=status.HTTP_400_BAD_REQUEST)
            
            return Response({
                'success': True,
                'provider': provider,
                'model': response.get('model'),
                'response': response.get('content', '')[:100],  # First 100 chars
                'processing_time_ms': response.get('processing_time'),
                'tokens_used': response.get('tokens')
            })
        
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e),
                'provider': provider
            }, status=status.HTTP_400_BAD_REQUEST)


