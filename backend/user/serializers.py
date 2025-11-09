from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for User Profile"""
    
    has_custom_api_key = serializers.BooleanField(read_only=True)
    has_gemini_key = serializers.BooleanField(read_only=True)
    has_groq_key = serializers.BooleanField(read_only=True)
    has_cohere_key = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = [
            'id',
            'gemini_api_key',
            'groq_api_key',
            'cohere_api_key',
            'preferred_provider',
            'preferred_gemini_model',
            'preferred_groq_model',
            'preferred_cohere_model',
            'has_custom_api_key',
            'has_gemini_key',
            'has_groq_key',
            'has_cohere_key',
            'total_tokens_used',
            'total_conversations',
            'total_messages',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'total_tokens_used', 'total_conversations', 'total_messages', 'created_at', 'updated_at']
        extra_kwargs = {
            'gemini_api_key': {'write_only': True},
            'groq_api_key': {'write_only': True},
            'cohere_api_key': {'write_only': True},
        }
    
    def to_representation(self, instance):
        """Customize representation to show boolean flags"""
        data = super().to_representation(instance)
        data['has_gemini_key'] = bool(instance.gemini_api_key and instance.gemini_api_key.strip())
        data['has_groq_key'] = bool(instance.groq_api_key and instance.groq_api_key.strip())
        data['has_cohere_key'] = bool(instance.cohere_api_key and instance.cohere_api_key.strip())
        return data


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    
    profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'date_joined', 'profile']
        read_only_fields = ['id', 'date_joined']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'first_name', 'last_name']
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False},
            'email': {'required': True}
        }
    
    def validate(self, attrs):
        """Validate passwords match"""
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
    
    def create(self, validated_data):
        """Create user with hashed password"""
        validated_data.pop('password2')
        
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile"""
    
    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name']


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change"""
    
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password2 = serializers.CharField(required=True)
    
    def validate(self, attrs):
        """Validate new passwords match"""
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({"new_password": "Password fields didn't match."})
        return attrs


class SetAPIKeySerializer(serializers.Serializer):
    """Serializer for setting API keys for any provider"""
    
    provider = serializers.ChoiceField(
        choices=['gemini', 'groq', 'cohere'],
        required=True,
        help_text="AI provider: 'gemini', 'groq', or 'cohere'"
    )
    api_key = serializers.CharField(required=True, min_length=20)
    
    def validate(self, attrs):
        """Validate API key format based on provider"""
        provider = attrs.get('provider')
        api_key = attrs.get('api_key')
        
        if provider == 'gemini':
            if not api_key.startswith('AIza'):
                raise serializers.ValidationError({
                    'api_key': "Invalid Gemini API key format. Key should start with 'AIza'"
                })
        elif provider == 'groq':
            if len(api_key) < 30:
                raise serializers.ValidationError({
                    'api_key': "Invalid Groq API key format. Key should be at least 30 characters."
                })
        elif provider == 'cohere':
            if len(api_key) < 30:
                raise serializers.ValidationError({
                    'api_key': "Invalid Cohere API key format. Key should be at least 30 characters."
                })
        
        return attrs


class SetProviderPreferencesSerializer(serializers.Serializer):
    """Serializer for setting provider and model preferences"""
    
    preferred_provider = serializers.ChoiceField(
        choices=['gemini', 'groq', 'cohere'],
        required=False,
        help_text="Preferred AI provider"
    )
    preferred_gemini_model = serializers.CharField(required=False, allow_blank=True)
    preferred_groq_model = serializers.CharField(required=False, allow_blank=True)
    preferred_cohere_model = serializers.CharField(required=False, allow_blank=True)


class UsageStatsSerializer(serializers.Serializer):
    """Serializer for usage statistics"""
    
    total_tokens_used = serializers.IntegerField()
    total_conversations = serializers.IntegerField()
    total_messages = serializers.IntegerField()
    has_custom_api_key = serializers.BooleanField()
    quota_info = serializers.DictField(required=False)

