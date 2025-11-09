from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User
from django.contrib.auth import update_session_auth_hash
import google.generativeai as genai

from .models import UserProfile
from .serializers import (
    UserSerializer,
    UserRegistrationSerializer,
    UserUpdateSerializer,
    ChangePasswordSerializer,
    SetAPIKeySerializer,
    SetProviderPreferencesSerializer,
    UsageStatsSerializer
)


class UserViewSet(viewsets.ViewSet):
    """
    ViewSet for User management
    
    Endpoints:
    - POST /api/users/register/ - Register new user
    - GET /api/users/me/ - Get current user profile
    - PUT /api/users/me/ - Update current user profile
    - POST /api/users/change-password/ - Change password
    """
    
    def get_permissions(self):
        """Allow any user to register, require auth for others"""
        if self.action == 'register':
            return [AllowAny()]
        return [IsAuthenticated()]
    
    @action(detail=False, methods=['post'])
    def register(self, request):
        """
        Register a new user
        
        POST /api/users/register/
        Body: {
            "username": "john_doe",
            "email": "john@example.com",
            "password": "SecurePassword123!",
            "password2": "SecurePassword123!",
            "first_name": "John",
            "last_name": "Doe"
        }
        """
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        response_serializer = UserSerializer(user)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """
        Get current user profile
        
        GET /api/users/me/
        """
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['put', 'patch'], url_path='update-profile')
    def update_profile(self, request):
        """
        Update current user profile
        
        PUT /api/users/update-profile/
        Body: {
            "email": "newemail@example.com",
            "first_name": "John",
            "last_name": "Doe"
        }
        """
        serializer = UserUpdateSerializer(
            request.user,
            data=request.data,
            partial=request.method == 'PATCH'
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        response_serializer = UserSerializer(request.user)
        return Response(response_serializer.data)
    
    @action(detail=False, methods=['post'], url_path='change-password')
    def change_password(self, request):
        """
        Change user password
        
        POST /api/users/change-password/
        Body: {
            "old_password": "OldPassword123!",
            "new_password": "NewPassword123!",
            "new_password2": "NewPassword123!"
        }
        """
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Check old password
        if not request.user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'old_password': 'Wrong password.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set new password
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        
        # Update session to prevent logout
        update_session_auth_hash(request, request.user)
        
        return Response({'message': 'Password updated successfully.'})
    
    @action(detail=False, methods=['post'], url_path='set-api-key')
    def set_api_key(self, request):
        """
        Set user's personal API key for a provider
        
        POST /api/users/set-api-key/
        Body: {
            "provider": "gemini",  // or "groq" or "cohere"
            "api_key": "AIzaSyC..." // or Groq/Cohere API key
        }
        """
        serializer = SetAPIKeySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        provider = serializer.validated_data['provider']
        api_key = serializer.validated_data['api_key']
        
        # Validate the API key by testing it
        try:
            if provider == 'gemini':
                import google.generativeai as genai
                genai.configure(api_key=api_key)
                # Try to list models to verify key works
                list(genai.list_models())
            elif provider == 'groq':
                from groq import Groq
                client = Groq(api_key=api_key)
                # Test by listing models
                client.models.list()
            elif provider == 'cohere':
                import cohere
                client = cohere.Client(api_key=api_key)
                # Test by checking API key
                # Cohere doesn't have a simple test endpoint, so we'll just save it
                pass
            
            # Save to user profile
            profile, created = UserProfile.objects.get_or_create(user=request.user)
            
            if provider == 'gemini':
                profile.gemini_api_key = api_key
            elif provider == 'groq':
                profile.groq_api_key = api_key
            elif provider == 'cohere':
                profile.cohere_api_key = api_key
            
            profile.save()
            
            return Response({
                'message': f'{provider.capitalize()} API key saved successfully.',
                'provider': provider,
                'has_custom_api_key': profile.has_custom_api_key(provider)
            })
        
        except Exception as e:
            return Response(
                {'error': f'Invalid {provider} API key: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['delete'], url_path='remove-api-key')
    def remove_api_key(self, request):
        """
        Remove user's personal API key for a provider
        
        DELETE /api/users/remove-api-key/?provider=gemini
        Query params: provider (gemini, groq, or cohere)
        """
        provider = request.query_params.get('provider', 'gemini')
        
        if provider not in ['gemini', 'groq', 'cohere']:
            return Response(
                {'error': 'Invalid provider. Must be: gemini, groq, or cohere'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            profile, created = UserProfile.objects.get_or_create(user=request.user)
            
            if provider == 'gemini':
                profile.gemini_api_key = None
            elif provider == 'groq':
                profile.groq_api_key = None
            elif provider == 'cohere':
                profile.cohere_api_key = None
            
            profile.save()
            
            return Response({
                'message': f'{provider.capitalize()} API key removed successfully.',
                'provider': provider,
                'has_custom_api_key': profile.has_custom_api_key(provider)
            })
        except Exception as e:
            return Response(
                {'error': f'Error removing API key: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post', 'put', 'patch'], url_path='set-provider-preferences')
    def set_provider_preferences(self, request):
        """
        Set user's preferred provider and model preferences
        
        POST /api/users/set-provider-preferences/
        Body: {
            "preferred_provider": "groq",  // gemini, groq, or cohere
            "preferred_gemini_model": "models/gemini-2.5-flash",
            "preferred_groq_model": "llama-3.3-70b-versatile",
            "preferred_cohere_model": "command-r"
        }
        """
        serializer = SetProviderPreferencesSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        
        # Update preferred provider
        if 'preferred_provider' in serializer.validated_data:
            profile.preferred_provider = serializer.validated_data['preferred_provider']
        
        # Update model preferences
        if 'preferred_gemini_model' in serializer.validated_data:
            profile.preferred_gemini_model = serializer.validated_data['preferred_gemini_model']
        if 'preferred_groq_model' in serializer.validated_data:
            profile.preferred_groq_model = serializer.validated_data['preferred_groq_model']
        if 'preferred_cohere_model' in serializer.validated_data:
            profile.preferred_cohere_model = serializer.validated_data['preferred_cohere_model']
        
        profile.save()
        
        return Response({
            'message': 'Provider preferences updated successfully.',
            'preferred_provider': profile.preferred_provider,
            'preferred_gemini_model': profile.preferred_gemini_model,
            'preferred_groq_model': profile.preferred_groq_model,
            'preferred_cohere_model': profile.preferred_cohere_model,
        })
    
    @action(detail=False, methods=['get'], url_path='usage-stats')
    def usage_stats(self, request):
        """
        Get user's usage statistics
        
        GET /api/users/usage-stats/
        """
        try:
            profile = request.user.profile
            
            # Get quota info if user has custom API key
            quota_info = None
            if profile.has_custom_api_key():
                try:
                    genai.configure(api_key=profile.gemini_api_key)
                    # Note: Gemini API doesn't provide quota info directly
                    # This is a placeholder for future implementation
                    quota_info = {
                        'note': 'Quota information not available from Gemini API',
                        'using_custom_key': True
                    }
                except Exception as e:
                    quota_info = {'error': str(e)}
            else:
                quota_info = {
                    'note': 'Using default API key',
                    'using_custom_key': False
                }
            
            serializer = UsageStatsSerializer({
                'total_tokens_used': profile.total_tokens_used,
                'total_conversations': profile.total_conversations,
                'total_messages': profile.total_messages,
                'has_custom_api_key': profile.has_custom_api_key(),
                'quota_info': quota_info
            })
            
            return Response(serializer.data)
        
        except UserProfile.DoesNotExist:
            # Create profile if doesn't exist
            profile = UserProfile.objects.create(user=request.user)
            return Response({
                'total_tokens_used': 0,
                'total_conversations': 0,
                'total_messages': 0,
                'has_custom_api_key': False
            })
