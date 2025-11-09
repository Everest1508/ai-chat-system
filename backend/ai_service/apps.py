from django.apps import AppConfig


class AiServiceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'ai_service'
    verbose_name = 'AI Service'
    
    def ready(self):
        # Import any signals or startup code
        pass
