from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AIConfigViewSet, ModelViewSet
from .views_providers import AIProvidersViewSet

router = DefaultRouter()
router.register(r'ai-config', AIConfigViewSet, basename='ai-config')
router.register(r'models', ModelViewSet, basename='model')
router.register(r'ai-providers', AIProvidersViewSet, basename='ai-providers')

urlpatterns = [
    path('', include(router.urls)),
]

