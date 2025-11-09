from django.contrib import admin
from .models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'has_custom_api_key', 'total_tokens_used', 'total_conversations', 'total_messages', 'created_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['total_tokens_used', 'total_conversations', 'total_messages', 'created_at', 'updated_at']
    
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('API Configuration', {
            'fields': ('gemini_api_key',),
            'description': 'User\'s personal Gemini API key (optional)'
        }),
        ('Usage Statistics', {
            'fields': ('total_tokens_used', 'total_conversations', 'total_messages')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    def has_custom_api_key(self, obj):
        return obj.has_custom_api_key()
    has_custom_api_key.boolean = True
    has_custom_api_key.short_description = 'Has API Key'
