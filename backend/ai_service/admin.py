from django.contrib import admin
from .models import AIConfig, EmbeddingCache


@admin.register(AIConfig)
class AIConfigAdmin(admin.ModelAdmin):
    list_display = ['user', 'preferred_model', 'temperature', 'max_tokens', 'analysis_depth']
    list_filter = ['preferred_model', 'analysis_depth', 'enable_sentiment_analysis']
    search_fields = ['user__username']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Model Settings', {
            'fields': ('preferred_model', 'temperature', 'max_tokens')
        }),
        ('Analysis Settings', {
            'fields': (
                'enable_sentiment_analysis',
                'enable_topic_extraction',
                'enable_semantic_search',
                'analysis_depth'
            )
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(EmbeddingCache)
class EmbeddingCacheAdmin(admin.ModelAdmin):
    list_display = ['id', 'text_preview', 'model', 'access_count', 'last_accessed']
    list_filter = ['model', 'created_at']
    search_fields = ['text_preview', 'text_hash']
    readonly_fields = ['created_at', 'last_accessed', 'access_count']
    date_hierarchy = 'created_at'
