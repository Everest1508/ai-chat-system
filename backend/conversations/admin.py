from django.contrib import admin
from .models import Conversation, Message, ConversationQueryLog


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'title', 'status', 'message_count', 'created_at', 'ended_at']
    list_filter = ['status', 'created_at', 'sentiment']
    search_fields = ['user__username', 'title', 'summary']
    readonly_fields = ['created_at', 'updated_at', 'ended_at', 'duration_minutes']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'title', 'status')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'ended_at', 'duration_minutes')
        }),
        ('Analytics', {
            'fields': ('summary', 'key_topics', 'sentiment', 'message_count')
        }),
    )


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'conversation', 'role', 'content_preview', 'created_at', 'token_count']
    list_filter = ['role', 'created_at']
    search_fields = ['content', 'conversation__id']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content'


@admin.register(ConversationQueryLog)
class ConversationQueryLogAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'query_preview', 'created_at', 'processing_time_ms']
    list_filter = ['created_at']
    search_fields = ['user__username', 'query', 'response']
    readonly_fields = ['created_at', 'processing_time_ms']
    date_hierarchy = 'created_at'
    filter_horizontal = ['related_conversations']
    
    def query_preview(self, obj):
        return obj.query[:50] + '...' if len(obj.query) > 50 else obj.query
    query_preview.short_description = 'Query'
