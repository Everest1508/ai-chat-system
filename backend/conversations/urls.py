from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConversationViewSet, MessageViewSet, ConversationQueryViewSet

router = DefaultRouter()
router.register(r'conversations', ConversationViewSet, basename='conversation')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'conversation-query', ConversationQueryViewSet, basename='conversation-query')

urlpatterns = [
    path('', include(router.urls)),
]

