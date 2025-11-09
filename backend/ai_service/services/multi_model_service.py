"""
Multi-Model Service - Support for multiple AI providers
Supports: Gemini, Groq, Cohere, and more
"""
import os
from typing import List, Dict, Optional
from django.conf import settings
import time

# Import different AI providers
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False

try:
    import cohere
    COHERE_AVAILABLE = True
except ImportError:
    COHERE_AVAILABLE = False


class MultiModelService:
    """
    Universal chat service supporting multiple AI providers
    
    Supported Providers:
    - Gemini (Google) - Free: 60 req/min, 1500/day
    - Groq - Free: 30 req/min, 14,400/day ⭐ BEST FREE TIER
    - Cohere - Free: 100 req/min
    """
    
    def __init__(self, provider: str = 'gemini', api_key: Optional[str] = None, model: Optional[str] = None):
        """
        Initialize multi-model service
        
        Args:
            provider: 'gemini', 'groq', 'cohere'
            api_key: Optional API key (uses env if not provided)
            model: Optional model name (uses default if not provided)
        """
        self.provider = provider.lower()
        self.api_key = api_key
        self.user_model = model  # Store user's preferred model
        self._initialize_provider()
    
    def _initialize_provider(self):
        """Initialize the selected AI provider"""
        if self.provider == 'gemini' and GEMINI_AVAILABLE:
            api_key = self.api_key or getattr(settings, 'GEMINI_API_KEY', None)
            if api_key:
                genai.configure(api_key=api_key)
                # Use user's model if provided, otherwise use default
                self.model_name = self.user_model or getattr(settings, 'AI_MODEL', 'models/gemini-2.5-flash')
        
        elif self.provider == 'groq' and GROQ_AVAILABLE:
            # Check settings first, then env
            api_key = self.api_key or getattr(settings, 'GROQ_API_KEY', None) or os.getenv('GROQ_API_KEY', '')
            if api_key:
                self.client = Groq(api_key=api_key)
                # Use user's model if provided, otherwise use default
                self.model_name = self.user_model or getattr(settings, 'GROQ_MODEL', None) or os.getenv('GROQ_MODEL', 'llama-3.3-70b-versatile')
        
        elif self.provider == 'cohere' and COHERE_AVAILABLE:
            # Check settings first, then env
            api_key = self.api_key or getattr(settings, 'COHERE_API_KEY', None) or os.getenv('COHERE_API_KEY', '')
            if api_key:
                self.client = cohere.Client(api_key)
                # Use user's model if provided, otherwise use default
                self.model_name = self.user_model or getattr(settings, 'COHERE_MODEL', None) or os.getenv('COHERE_MODEL', 'command-r-08-2024')
        
        else:
            raise ValueError(f"Provider '{self.provider}' not available or not installed")
    
    def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> Dict:
        """
        Universal chat method supporting all providers
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Temperature (0-1)
            max_tokens: Max response tokens
        
        Returns:
            Dict with 'content', 'tokens', 'processing_time'
        """
        start_time = time.time()
        
        try:
            if self.provider == 'gemini':
                return self._chat_gemini(messages, temperature, max_tokens, start_time)
            elif self.provider == 'groq':
                return self._chat_groq(messages, temperature, max_tokens, start_time)
            elif self.provider == 'cohere':
                return self._chat_cohere(messages, temperature, max_tokens, start_time)
            else:
                return {
                    'content': None,
                    'error': f'Unknown provider: {self.provider}',
                    'processing_time': 0
                }
        
        except Exception as e:
            return {
                'content': None,
                'error': str(e),
                'processing_time': int((time.time() - start_time) * 1000),
            }
    
    def _chat_gemini(self, messages, temperature, max_tokens, start_time):
        """Chat using Google Gemini"""
        # Convert messages to Gemini format
        system_instruction = None
        history = []
        
        for msg in messages:
            role = msg['role']
            content = msg['content']
            
            if role == 'system':
                system_instruction = content
            elif role == 'user':
                history.append({'role': 'user', 'parts': [content]})
            elif role == 'assistant':
                history.append({'role': 'model', 'parts': [content]})
        
        # Configure model
        generation_config = genai.GenerationConfig(
            temperature=temperature or 0.7,
            max_output_tokens=max_tokens or 2048,
        )
        
        # Gemini API needs the models/ prefix
        model = genai.GenerativeModel(
            model_name=self.model_name,
            generation_config=generation_config,
            system_instruction=system_instruction if system_instruction else None
        )
        
        # Generate response
        if len(history) > 1:
            chat_history = history[:-1]
            current_message = history[-1]['parts'][0] if history else ""
            chat = model.start_chat(history=chat_history)
            response = chat.send_message(current_message)
        else:
            current_message = history[0]['parts'][0] if history else ""
            response = model.generate_content(current_message)
        
        processing_time = int((time.time() - start_time) * 1000)
        estimated_tokens = len(response.text) // 4
        
        return {
            'content': response.text,
            'tokens': estimated_tokens,
            'processing_time': processing_time,
            'model': self.model_name,
            'provider': 'gemini'
        }
    
    def _chat_groq(self, messages, temperature, max_tokens, start_time):
        """Chat using Groq (very fast, generous free tier!)"""
        # Groq uses OpenAI-compatible format
        response = self.client.chat.completions.create(
            model=self.model_name,
            messages=messages,
            temperature=temperature or 0.7,
            max_tokens=max_tokens or 2048,
        )
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return {
            'content': response.choices[0].message.content,
            'tokens': response.usage.total_tokens,
            'processing_time': processing_time,
            'model': self.model_name,
            'provider': 'groq'
        }
    
    def _chat_cohere(self, messages, temperature, max_tokens, start_time):
        """Chat using Cohere"""
        # Convert messages to Cohere format
        chat_history = []
        current_message = ""
        
        for msg in messages:
            if msg['role'] == 'user':
                current_message = msg['content']
            elif msg['role'] == 'assistant':
                chat_history.append({
                    'role': 'CHATBOT',
                    'message': msg['content']
                })
        
        response = self.client.chat(
            message=current_message,
            chat_history=chat_history if chat_history else None,
            model=self.model_name,
            temperature=temperature or 0.7,
            max_tokens=max_tokens or 2048,
        )
        
        processing_time = int((time.time() - start_time) * 1000)
        estimated_tokens = len(response.text) // 4
        
        return {
            'content': response.text,
            'tokens': estimated_tokens,
            'processing_time': processing_time,
            'model': self.model_name,
            'provider': 'cohere'
        }
    
    @staticmethod
    def get_available_providers() -> Dict:
        """Get list of available providers and their status"""
        return {
            'gemini': {
                'available': GEMINI_AVAILABLE and bool(getattr(settings, 'GEMINI_API_KEY', None)),
                'free_tier': '60 req/min, 1500/day',
                'models': ['models/gemini-2.5-flash', 'models/gemini-2.0-flash', 'models/gemini-pro-latest'],
                'best_for': 'Balanced performance and features'
            },
            'groq': {
                'available': GROQ_AVAILABLE and bool(getattr(settings, 'GROQ_API_KEY', None) or os.getenv('GROQ_API_KEY')),
                'free_tier': '30 req/min, 14,400/day ⭐ BEST',
                'models': ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
                'best_for': 'Very fast responses, generous limits'
            },
            'cohere': {
                'available': COHERE_AVAILABLE and bool(getattr(settings, 'COHERE_API_KEY', None) or os.getenv('COHERE_API_KEY')),
                'free_tier': '100 req/min (trial)',
                'models': ['command-r-08-2024', 'command-r-plus-08-2024', 'command-r7b-12-2024'],
                'best_for': 'High rate limits'
            }
        }
    
    @staticmethod
    def get_recommended_provider() -> str:
        """Get recommended provider based on availability"""
        providers = MultiModelService.get_available_providers()
        
        # Prefer Groq (best free tier)
        if providers['groq']['available']:
            return 'groq'
        # Fallback to Gemini
        elif providers['gemini']['available']:
            return 'gemini'
        # Last resort Cohere
        elif providers['cohere']['available']:
            return 'cohere'
        else:
            return 'gemini'  # Default


