from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class UserProfile(models.Model):
    """
    Extended user profile with multi-provider API keys and preferences
    """
    PROVIDER_CHOICES = [
        ('gemini', 'Google Gemini'),
        ('groq', 'Groq'),
        ('cohere', 'Cohere'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    # Provider API Keys
    gemini_api_key = models.CharField(
        max_length=255, 
        blank=True, 
        null=True,
        help_text="User's personal Gemini API key (optional)"
    )
    groq_api_key = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="User's personal Groq API key (optional)"
    )
    cohere_api_key = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="User's personal Cohere API key (optional)"
    )
    
    # Provider Preferences
    preferred_provider = models.CharField(
        max_length=20,
        choices=PROVIDER_CHOICES,
        default='gemini',
        help_text="Preferred AI provider"
    )
    
    # Model Preferences (provider-specific)
    preferred_gemini_model = models.CharField(
        max_length=100,
        default='models/gemini-2.5-flash',
        blank=True,
        help_text="Preferred Gemini model"
    )
    preferred_groq_model = models.CharField(
        max_length=100,
        default='llama-3.3-70b-versatile',
        blank=True,
        help_text="Preferred Groq model"
    )
    preferred_cohere_model = models.CharField(
        max_length=100,
        default='command-r',
        blank=True,
        help_text="Preferred Cohere model"
    )
    
    # Usage tracking
    total_tokens_used = models.BigIntegerField(default=0)
    total_conversations = models.IntegerField(default=0)
    total_messages = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'
    
    def __str__(self):
        return f"Profile for {self.user.username}"
    
    def increment_usage(self, tokens=0, messages=1):
        """Increment usage counters"""
        self.total_tokens_used += tokens
        self.total_messages += messages
        self.save(update_fields=['total_tokens_used', 'total_messages', 'updated_at'])
    
    def has_custom_api_key(self, provider=None):
        """Check if user has set a custom API key for a provider"""
        if provider:
            if provider == 'gemini':
                return bool(self.gemini_api_key and self.gemini_api_key.strip())
            elif provider == 'groq':
                return bool(self.groq_api_key and self.groq_api_key.strip())
            elif provider == 'cohere':
                return bool(self.cohere_api_key and self.cohere_api_key.strip())
        # Check if any API key is set
        return bool(
            (self.gemini_api_key and self.gemini_api_key.strip()) or
            (self.groq_api_key and self.groq_api_key.strip()) or
            (self.cohere_api_key and self.cohere_api_key.strip())
        )
    
    def get_api_key(self, provider):
        """Get API key for a specific provider"""
        if provider == 'gemini':
            return self.gemini_api_key
        elif provider == 'groq':
            return self.groq_api_key
        elif provider == 'cohere':
            return self.cohere_api_key
        return None
    
    def get_preferred_model(self, provider=None):
        """Get preferred model for a provider"""
        provider = provider or self.preferred_provider
        if provider == 'gemini':
            return self.preferred_gemini_model or 'models/gemini-2.5-flash'
        elif provider == 'groq':
            return self.preferred_groq_model or 'llama-3.3-70b-versatile'
        elif provider == 'cohere':
            return self.preferred_cohere_model or 'command-r'
        return None


# Signal to create profile automatically when user is created
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()
