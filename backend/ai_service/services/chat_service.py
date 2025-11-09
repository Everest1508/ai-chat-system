"""
AI Chat Service for handling real-time conversations with LLM (Google Gemini)
"""
import google.generativeai as genai
from django.conf import settings
from typing import List, Dict, Optional
import time


class ChatService:
    """Service for handling AI chat interactions using Google Gemini"""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize ChatService with optional custom API key
        
        Args:
            api_key: Custom Gemini API key (uses default if None)
        """
        self.api_key = api_key or settings.GEMINI_API_KEY
        genai.configure(api_key=self.api_key)
        self.model_name = settings.AI_MODEL
        self.temperature = settings.AI_TEMPERATURE
        self.max_tokens = settings.AI_MAX_TOKENS
        
        # Configure generation config
        self.generation_config = genai.GenerationConfig(
            temperature=self.temperature,
            max_output_tokens=self.max_tokens,
        )
    
    def _convert_messages_to_gemini_format(self, messages: List[Dict[str, str]]) -> tuple:
        """
        Convert OpenAI-style messages to Gemini format
        
        Gemini uses a different format: history + current message
        """
        system_instruction = None
        history = []
        
        for msg in messages:
            role = msg['role']
            content = msg['content']
            
            if role == 'system':
                system_instruction = content
            elif role == 'user':
                history.append({
                    'role': 'user',
                    'parts': [content]
                })
            elif role == 'assistant':
                history.append({
                    'role': 'model',  # Gemini uses 'model' instead of 'assistant'
                    'parts': [content]
                })
        
        return system_instruction, history
    
    def chat(
        self, 
        messages: List[Dict[str, str]], 
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        model: Optional[str] = None
    ) -> Dict:
        """
        Send messages to Gemini LLM and get response
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Override default temperature
            max_tokens: Override default max tokens
            model: Override default model
        
        Returns:
            Dict with 'content', 'tokens', and 'processing_time'
        """
        start_time = time.time()
        
        try:
            # Convert messages to Gemini format
            system_instruction, history = self._convert_messages_to_gemini_format(messages)
            
            # Configure generation
            generation_config = genai.GenerationConfig(
                temperature=temperature if temperature is not None else self.temperature,
                max_output_tokens=max_tokens or self.max_tokens,
            )
            
            # Create model
            model_instance = genai.GenerativeModel(
                model_name=model or self.model_name,
                generation_config=generation_config,
                system_instruction=system_instruction if system_instruction else None
            )
            
            # If there's history, use chat mode
            if len(history) > 1:
                # Separate last message
                chat_history = history[:-1]
                current_message = history[-1]['parts'][0] if history else ""
                
                # Start chat with history
                chat = model_instance.start_chat(history=chat_history)
                response = chat.send_message(current_message)
            else:
                # Single message - use generate_content
                current_message = history[0]['parts'][0] if history else ""
                response = model_instance.generate_content(current_message)
            
            processing_time = int((time.time() - start_time) * 1000)  # Convert to milliseconds
            
            # Estimate token count (Gemini doesn't provide exact count in basic tier)
            # Rough estimate: ~4 characters per token
            estimated_tokens = len(response.text) // 4
            
            return {
                'content': response.text,
                'tokens': estimated_tokens,
                'processing_time': processing_time,
                'model': model or self.model_name,
            }
        
        except Exception as e:
            return {
                'content': None,
                'error': str(e),
                'processing_time': int((time.time() - start_time) * 1000),
            }
    
    def chat_with_context(
        self, 
        user_message: str,
        conversation_history: List[Dict[str, str]],
        system_prompt: Optional[str] = None
    ) -> Dict:
        """
        Chat with full conversation context
        
        Args:
            user_message: Current user message
            conversation_history: Previous messages in conversation
            system_prompt: Optional system prompt to set context
        
        Returns:
            Dict with response data
        """
        messages = []
        
        # Add system prompt if provided
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        
        # Add conversation history
        messages.extend(conversation_history)
        
        # Add current user message
        messages.append({"role": "user", "content": user_message})
        
        return self.chat(messages)
    
    def stream_chat(self, messages: List[Dict[str, str]]):
        """
        Stream chat responses (for real-time updates)
        
        Args:
            messages: List of message dicts
        
        Yields:
            Chunks of response text
        """
        try:
            # Convert messages to Gemini format
            system_instruction, history = self._convert_messages_to_gemini_format(messages)
            
            # Create model
            model_instance = genai.GenerativeModel(
                model_name=self.model_name,
                generation_config=self.generation_config,
                system_instruction=system_instruction if system_instruction else None
            )
            
            # If there's history, use chat mode
            if len(history) > 1:
                chat_history = history[:-1]
                current_message = history[-1]['parts'][0] if history else ""
                
                chat = model_instance.start_chat(history=chat_history)
                response = chat.send_message(current_message, stream=True)
            else:
                current_message = history[0]['parts'][0] if history else ""
                response = model_instance.generate_content(current_message, stream=True)
            
            # Stream chunks
            for chunk in response:
                if chunk.text:
                    yield chunk.text
        
        except Exception as e:
            yield f"Error: {str(e)}"
