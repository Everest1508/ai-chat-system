"""
Model Service for listing and managing available Gemini models
"""
import google.generativeai as genai
from django.conf import settings
from typing import List, Dict


class ModelService:
    """Service for managing Gemini models"""
    
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
    
    def list_available_models(self) -> List[Dict]:
        """
        List all available Gemini models
        
        Returns:
            List of model dictionaries with name, description, and capabilities
        """
        try:
            models = []
            
            # Get all models from Gemini API
            for model in genai.list_models():
                # Filter for models that support generateContent
                if 'generateContent' in model.supported_generation_methods:
                    models.append({
                        'name': model.name,
                        'display_name': model.display_name,
                        'description': model.description,
                        'input_token_limit': model.input_token_limit,
                        'output_token_limit': model.output_token_limit,
                        'supported_generation_methods': model.supported_generation_methods,
                        'temperature': getattr(model, 'temperature', None),
                        'top_p': getattr(model, 'top_p', None),
                        'top_k': getattr(model, 'top_k', None),
                    })
            
            return models
        
        except Exception as e:
            print(f"Error listing models: {str(e)}")
            return []
    
    def get_model_info(self, model_name: str) -> Dict:
        """
        Get detailed information about a specific model
        
        Args:
            model_name: Name of the model (e.g., 'models/gemini-pro')
        
        Returns:
            Dictionary with model information
        """
        try:
            model = genai.get_model(model_name)
            
            return {
                'name': model.name,
                'display_name': model.display_name,
                'description': model.description,
                'input_token_limit': model.input_token_limit,
                'output_token_limit': model.output_token_limit,
                'supported_generation_methods': model.supported_generation_methods,
            }
        
        except Exception as e:
            print(f"Error getting model info: {str(e)}")
            return {}
    
    def get_recommended_models(self) -> Dict:
        """
        Get recommended models for different use cases
        
        Returns:
            Dictionary with recommended models
        """
        return {
            'chat': {
                'recommended': 'models/gemini-pro',
                'alternatives': [
                    'models/gemini-1.5-pro',
                    'models/gemini-1.5-flash'
                ],
                'description': 'Best models for conversational AI'
            },
            'fast': {
                'recommended': 'models/gemini-1.5-flash',
                'description': 'Fastest responses, lower cost'
            },
            'advanced': {
                'recommended': 'models/gemini-1.5-pro',
                'description': 'Enhanced reasoning and understanding'
            },
            'embedding': {
                'recommended': 'models/embedding-001',
                'description': 'For semantic search and embeddings'
            }
        }
    
    def validate_model(self, model_name: str) -> bool:
        """
        Validate if a model name is valid and supports generateContent
        
        Args:
            model_name: Name of the model to validate
        
        Returns:
            True if valid, False otherwise
        """
        try:
            model = genai.get_model(model_name)
            return 'generateContent' in model.supported_generation_methods
        except Exception:
            return False




