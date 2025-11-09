from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet

# Note: Using DefaultRouter automatically creates URL patterns for ViewSet actions
# Custom @action decorators in ViewSet automatically get their URLs

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('', include(router.urls)),
]

# The router will automatically create these URLs:
# GET    /api/users/me/              -> UserViewSet.me()
# PUT    /api/users/update-profile/  -> UserViewSet.update_profile()
# POST   /api/users/change-password/ -> UserViewSet.change_password()
# POST   /api/users/set-api-key/     -> UserViewSet.set_api_key()
# DELETE /api/users/remove-api-key/  -> UserViewSet.remove_api_key()
# GET    /api/users/usage-stats/     -> UserViewSet.usage_stats()
# POST   /api/users/register/        -> UserViewSet.register()

