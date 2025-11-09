"""
Conversation Intelligence Service for analysis, summarization, and insights (Multi-Provider)
"""
import json
from typing import List, Dict, Optional

# Django imports
from django.conf import settings

# Service imports
from .chat_service import ChatService
from .embedding_service import EmbeddingService


class IntelligenceService:
    """Service for conversation analysis and intelligence features using Multi-Provider AI"""
    
    def __init__(self, api_key: Optional[str] = None, provider: Optional[str] = None):
        """
        Initialize IntelligenceService with optional custom API key and provider
        
        Args:
            api_key: Optional custom API key for the AI provider
            provider: Optional provider preference ('gemini', 'groq', 'cohere')
        """
        # Try to use MultiModelService, fallback to ChatService
        try:
            from .multi_model_service import MultiModelService
            provider = provider or settings.AI_PROVIDER
            self.chat_service = MultiModelService(provider=provider, api_key=api_key)
            self.using_multi_model = True
        except Exception as e:
            print(f"MultiModelService not available, using ChatService: {str(e)}")
            self.chat_service = ChatService(api_key=api_key)
            self.using_multi_model = False
        
        self.embedding_service = EmbeddingService()
    
    def generate_conversation_summary(
        self, 
        messages: List[Dict[str, str]],
        analysis_depth: str = 'detailed'
    ) -> Dict:
        """
        Generate comprehensive summary of conversation
        
        Args:
            messages: List of conversation messages
            analysis_depth: 'basic', 'detailed', or 'comprehensive'
        
        Returns:
            Dict with summary, key_points, and metadata
        """
        if not messages:
            return {'summary': '', 'key_points': [], 'topics': []}
        
        # Prepare conversation text
        conversation_text = "\n".join([
            f"{msg['role']}: {msg['content']}" 
            for msg in messages
        ])
        
        # Create prompt based on analysis depth
        if analysis_depth == 'basic':
            prompt = f"""Provide a brief 2-3 sentence summary of this conversation:

{conversation_text}

Summary:"""
        
        elif analysis_depth == 'comprehensive':
            prompt = f"""Analyze this conversation comprehensively and provide:
1. A detailed summary (3-5 sentences)
2. Key points discussed (bullet points)
3. Main topics covered
4. Important decisions or action items
5. Overall tone and sentiment
6. Any unresolved questions or concerns

Conversation:
{conversation_text}

Provide your analysis in JSON format with keys: summary, key_points, topics, decisions, sentiment, unresolved_items"""
        
        else:  # detailed
            prompt = f"""Analyze this conversation and provide:
1. A summary (2-4 sentences)
2. Key points discussed
3. Main topics covered
4. Overall sentiment

Conversation:
{conversation_text}

Provide your analysis in JSON format with keys: summary, key_points, topics, sentiment"""
        
        try:
            response = self.chat_service.chat([
                {"role": "system", "content": "You are an expert conversation analyzer. Provide concise, accurate analysis."},
                {"role": "user", "content": prompt}
            ])
            
            if response.get('error'):
                return {'summary': 'Error generating summary', 'key_points': [], 'topics': []}
            
            content = response['content']
            
            # Try to parse as JSON
            try:
                # Remove markdown code blocks if present
                if '```json' in content:
                    content = content.split('```json')[1].split('```')[0].strip()
                elif '```' in content:
                    content = content.split('```')[1].split('```')[0].strip()
                
                analysis = json.loads(content)
                return analysis
            except json.JSONDecodeError:
                # If not JSON, return as simple summary
                return {
                    'summary': content,
                    'key_points': [],
                    'topics': []
                }
        
        except Exception as e:
            print(f"Error generating summary: {str(e)}")
            return {'summary': 'Error generating summary', 'key_points': [], 'topics': []}
    
    def extract_topics(self, messages: List[Dict[str, str]], max_topics: int = 5) -> List[str]:
        """
        Extract main topics from conversation
        
        Args:
            messages: List of conversation messages
            max_topics: Maximum number of topics to extract
        
        Returns:
            List of topic strings
        """
        if not messages:
            return []
        
        conversation_text = "\n".join([
            f"{msg['content']}" 
            for msg in messages 
            if msg['role'] != 'system'
        ])
        
        prompt = f"""Extract the {max_topics} main topics discussed in this conversation.
List them as short phrases (2-4 words each).

Conversation:
{conversation_text}

Topics (one per line):"""
        
        try:
            response = self.chat_service.chat([
                {"role": "system", "content": "You are a topic extraction expert."},
                {"role": "user", "content": prompt}
            ])
            
            if response.get('error'):
                return []
            
            topics = [
                line.strip().lstrip('- ').lstrip('• ').lstrip('* ').lstrip('1234567890. ')
                for line in response['content'].split('\n')
                if line.strip()
            ]
            
            return topics[:max_topics]
        
        except Exception as e:
            print(f"Error extracting topics: {str(e)}")
            return []
    
    def analyze_sentiment(self, messages: List[Dict[str, str]]) -> Dict:
        """
        Analyze sentiment of conversation
        
        Args:
            messages: List of conversation messages
        
        Returns:
            Dict with sentiment label and confidence
        """
        if not messages:
            return {'sentiment': 'neutral', 'confidence': 0.0}
        
        conversation_text = "\n".join([
            f"{msg['role']}: {msg['content']}" 
            for msg in messages
        ])
        
        prompt = f"""Analyze the overall sentiment of this conversation.
Classify it as: positive, negative, neutral, or mixed.
Also provide a confidence score (0-1).

Conversation:
{conversation_text}

Respond in JSON format with keys: sentiment, confidence, reasoning"""
        
        try:
            response = self.chat_service.chat([
                {"role": "system", "content": "You are a sentiment analysis expert."},
                {"role": "user", "content": prompt}
            ])
            
            if response.get('error'):
                return {'sentiment': 'neutral', 'confidence': 0.0}
            
            content = response['content']
            
            try:
                # Remove markdown code blocks if present
                if '```json' in content:
                    content = content.split('```json')[1].split('```')[0].strip()
                elif '```' in content:
                    content = content.split('```')[1].split('```')[0].strip()
                
                result = json.loads(content)
                return result
            except json.JSONDecodeError:
                # Parse from text
                content_lower = content.lower()
                if 'positive' in content_lower:
                    return {'sentiment': 'positive', 'confidence': 0.7}
                elif 'negative' in content_lower:
                    return {'sentiment': 'negative', 'confidence': 0.7}
                elif 'mixed' in content_lower:
                    return {'sentiment': 'mixed', 'confidence': 0.6}
                else:
                    return {'sentiment': 'neutral', 'confidence': 0.6}
        
        except Exception as e:
            print(f"Error analyzing sentiment: {str(e)}")
            return {'sentiment': 'neutral', 'confidence': 0.0}
    
    def query_conversations(
        self, 
        query: str,
        conversations_data: List[Dict],
        top_k: int = 5
    ) -> Dict:
        """
        Query past conversations using semantic search and AI
        
        Args:
            query: User's question about past conversations
            conversations_data: List of conversation dicts with id, summary, messages, etc.
            top_k: Number of relevant conversations to consider
        
        Returns:
            Dict with answer and related conversation references
        """
        if not conversations_data:
            return {
                'answer': "No past conversations found.",
                'related_conversations': [],
                'confidence': 0.0
            }
        
        # Get query embedding
        query_embedding = self.embedding_service.get_embedding(query)
        
        if not query_embedding:
            # Fall back to keyword-based search if embeddings fail
            print("ℹ️  Falling back to keyword search (embeddings unavailable)")
            return self._keyword_based_query(query, conversations_data, top_k)
        
        # Prepare conversation embeddings
        candidates = []
        for conv in conversations_data:
            # Use summary or first few messages for embedding
            # Skip if summary is an error message
            summary = conv.get('summary', '')
            if summary and summary != 'Error generating summary' and not summary.startswith('Error'):
                text_to_embed = summary
            else:
                # Use message content if summary is bad/missing
                messages_text = ' '.join([
                    msg.get('content', '') 
                    for msg in conv.get('messages', [])[:10]  # Use more messages
                ])
                text_to_embed = messages_text[:1000]  # More context
            
            if text_to_embed and text_to_embed.strip():
                embedding = self.embedding_service.get_embedding(text_to_embed)
                if embedding:
                    candidates.append({
                        'id': conv['id'],
                        'embedding': embedding,
                        'summary': summary if summary and summary != 'Error generating summary' else None,
                        'messages': conv.get('messages', []),  # Include messages for context
                        'created_at': conv.get('created_at', ''),
                        'message_count': conv.get('message_count', 0),
                    })
        
        # Find most similar conversations
        similar_conversations = self.embedding_service.find_similar_texts(
            query_embedding,
            candidates,
            top_k=top_k,
            threshold=0.5
        )
        
        # Generate answer using AI with context
        if similar_conversations:
            # Build context from conversations, using messages if summary is missing
            context_parts = []
            for conv in similar_conversations:
                conv_id = conv.get('id', 'Unknown')
                created_at = conv.get('created_at', 'N/A')
                summary = conv.get('summary', '')
                messages = conv.get('messages', [])
                
                if summary and summary != 'Error generating summary' and not summary.startswith('Error'):
                    context_parts.append(f"Conversation {conv_id} (created: {created_at}):\nSummary: {summary}")
                elif messages:
                    # Use message content if no good summary
                    messages_text = '\n'.join([
                        f"{msg.get('role', 'user')}: {msg.get('content', '')[:200]}"
                        for msg in messages[:5]  # First 5 messages
                    ])
                    context_parts.append(f"Conversation {conv_id} (created: {created_at}):\n{messages_text}")
                else:
                    context_parts.append(f"Conversation {conv_id} (created: {created_at}):\nNo content available")
            
            context = "\n\n".join(context_parts)
            
            prompt = f"""Based on the following past conversations, answer this query:

Query: {query}

Relevant Conversations:
{context}

Provide a helpful, specific answer based on the conversation history. If the query cannot be answered from the given conversations, clearly state that the information is not available in the conversation history."""
            
            try:
                response = self.chat_service.chat([
                    {"role": "system", "content": "You are a helpful assistant that answers questions about past conversations accurately."},
                    {"role": "user", "content": prompt}
                ])
                
                answer = response.get('content', 'Unable to generate answer.')
                
                # If answer is too generic, provide better feedback
                if "cannot be answered" in answer.lower() or "not available" in answer.lower() or "no information" in answer.lower():
                    answer = f"I couldn't find specific information about '{query}' in your past conversations. The conversations I found don't contain relevant details about this topic."
                
                return {
                    'answer': answer,
                    'related_conversations': [
                        {
                            'id': conv.get('id', conv.get('id')),
                            'similarity': conv.get('similarity', 0.0),
                            'summary': conv.get('summary') or 'No summary available',
                            'created_at': conv.get('created_at', ''),
                        }
                        for conv in similar_conversations
                    ],
                    'confidence': similar_conversations[0].get('similarity', 0.0) if similar_conversations else 0.0
                }
            
            except Exception as e:
                print(f"Error generating answer: {str(e)}")
                return {
                    'answer': 'Error generating answer.',
                    'related_conversations': [],
                    'confidence': 0.0
                }
        
        else:
            return {
                'answer': "No relevant conversations found for your query.",
                'related_conversations': [],
                'confidence': 0.0
            }
    
    def suggest_related_conversations(
        self,
        current_conversation_text: str,
        past_conversations: List[Dict],
        top_k: int = 3
    ) -> List[Dict]:
        """
        Suggest related past conversations based on current conversation
        
        Args:
            current_conversation_text: Text from current conversation
            past_conversations: List of past conversation dicts
            top_k: Number of suggestions to return
        
        Returns:
            List of related conversation dicts with similarity scores
        """
        current_embedding = self.embedding_service.get_embedding(current_conversation_text)
        
        if not current_embedding or not past_conversations:
            return []
        
        candidates = []
        for conv in past_conversations:
            text = conv.get('summary', '') or ' '.join([
                msg['content'] for msg in conv.get('messages', [])[:3]
            ])[:500]
            
            if text:
                embedding = self.embedding_service.get_embedding(text)
                if embedding:
                    candidates.append({
                        'id': conv['id'],
                        'embedding': embedding,
                        'summary': conv.get('summary', ''),
                        'created_at': conv.get('created_at', ''),
                    })
        
        return self.embedding_service.find_similar_texts(
            current_embedding,
            candidates,
            top_k=top_k,
            threshold=0.6
        )
    
    def _fallback_keyword_search(
        self,
        query: str,
        conversations_data: List[Dict],
        top_k: int = 5
    ) -> Dict:
        """
        Fallback keyword-based search when embeddings are unavailable
        
        Args:
            query: User's question
            conversations_data: List of conversation dicts
            top_k: Number of results to return
        
        Returns:
            Dict with answer and related conversations
        """
        # Simple keyword matching
        query_words = set(query.lower().split())
        scored_conversations = []
        
        for conv in conversations_data:
            summary = conv.get('summary', '').lower()
            messages_text = ' '.join([
                msg['content'].lower() 
                for msg in conv.get('messages', [])[:5]
            ])
            
            # Count matching keywords
            all_text = summary + ' ' + messages_text
            matches = sum(1 for word in query_words if word in all_text)
            
            if matches > 0:
                scored_conversations.append({
                    'id': conv['id'],
                    'summary': conv.get('summary', ''),
                    'created_at': conv.get('created_at', ''),
                    'match_score': matches,
                })
        
        # Sort by match score
        scored_conversations.sort(key=lambda x: x['match_score'], reverse=True)
        top_conversations = scored_conversations[:top_k]
        
        if top_conversations:
            # Generate answer using AI with context
            context = "\n\n".join([
                f"Conversation {conv['id']} (created: {conv.get('created_at', 'N/A')}):\n{conv.get('summary', 'No summary')}"
                for conv in top_conversations
            ])
            
            prompt = f"""Based on the following past conversations, answer this query:

Query: {query}

Relevant Conversations:
{context}

Note: Semantic search is currently unavailable, so results are based on keyword matching.

Provide a helpful answer based on the conversation history."""
            
            try:
                response = self.chat_service.chat([
                    {"role": "system", "content": "You are a helpful assistant that answers questions about past conversations."},
                    {"role": "user", "content": prompt}
                ])
                
                return {
                    'answer': response.get('content', 'Unable to generate answer.'),
                    'related_conversations': [
                        {
                            'id': conv['id'],
                            'similarity': conv['match_score'] / len(query_words),  # Normalize
                            'summary': conv.get('summary', ''),
                            'created_at': conv.get('created_at', ''),
                        }
                        for conv in top_conversations
                    ],
                    'confidence': 0.5,  # Lower confidence for keyword search
                    'note': 'Results based on keyword matching. Semantic search unavailable due to API quota.'
                }
            except Exception as e:
                print(f"Error in fallback search: {str(e)}")
                return {
                    'answer': 'Error generating answer.',
                    'related_conversations': [],
                    'confidence': 0.0,
                    'note': 'Error occurred during search'
                }
        else:
            return {
                'answer': "No relevant conversations found for your query.",
                'related_conversations': [],
                'confidence': 0.0,
                'note': 'No keyword matches found'
            }
    
    def _keyword_based_query(
        self, 
        query: str, 
        conversations_data: List[Dict],
        top_k: int = 5
    ) -> Dict:
        """
        Fallback keyword-based search when embeddings are unavailable
        
        Args:
            query: User's question
            conversations_data: List of conversations
            top_k: Number of results
        
        Returns:
            Dict with answer and related conversations
        """
        # Simple keyword matching
        query_words = set(query.lower().split())
        scored_conversations = []
        
        for conv in conversations_data:
            summary = conv.get('summary', '')
            # Skip error summaries
            if summary and (summary == 'Error generating summary' or summary.startswith('Error')):
                summary = ''
            
            messages_text = ' '.join([
                msg.get('content', '').lower() 
                for msg in conv.get('messages', [])[:10]  # Use more messages
            ])
            
            # Count matching words in both summary and messages
            text = f"{summary.lower()} {messages_text}"
            text_words = set(text.split())
            matches = len(query_words.intersection(text_words))
            
            if matches > 0:
                scored_conversations.append({
                    'id': conv['id'],
                    'summary': summary or 'No summary available',
                    'messages': conv.get('messages', []),
                    'created_at': conv.get('created_at', ''),
                    'score': matches
                })
        
        # Sort by score
        scored_conversations.sort(key=lambda x: x['score'], reverse=True)
        related = scored_conversations[:top_k]
        
        if related:
            # Generate answer using AI with context
            context_parts = []
            for conv in related:
                conv_id = conv.get('id', 'Unknown')
                summary = conv.get('summary', '')
                messages = conv.get('messages', [])
                
                if summary and summary != 'No summary available' and summary != 'Error generating summary':
                    context_parts.append(f"Conversation {conv_id}:\nSummary: {summary}")
                elif messages:
                    # Use message content if no good summary
                    messages_text = '\n'.join([
                        f"{msg.get('role', 'user')}: {msg.get('content', '')[:200]}"
                        for msg in messages[:5]
                    ])
                    context_parts.append(f"Conversation {conv_id}:\n{messages_text}")
                else:
                    context_parts.append(f"Conversation {conv_id}:\nNo content available")
            
            context = "\n\n".join(context_parts)
            
            prompt = f"""Based on these past conversations, answer this query:

Query: {query}

Relevant Conversations:
{context}

Provide a helpful answer based on the conversation history. If the information is not available, clearly state that."""
            
            try:
                response = self.chat_service.chat([
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": prompt}
                ])
                
                return {
                    'answer': response.get('content', 'Unable to generate answer.'),
                    'related_conversations': [
                        {
                            'id': conv['id'],
                            'similarity': conv['score'] / 10.0,  # Normalize score
                            'summary': conv.get('summary', ''),
                            'created_at': conv.get('created_at', ''),
                        }
                        for conv in related
                    ],
                    'confidence': 0.5,  # Lower confidence for keyword search
                    'search_method': 'keyword'  # Indicate fallback method
                }
            except Exception as e:
                print(f"Error generating answer: {str(e)}")
        
        return {
            'answer': "No relevant conversations found for your query.",
            'related_conversations': [],
            'confidence': 0.0,
            'search_method': 'keyword'
        }
