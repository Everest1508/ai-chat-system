"""
Embedding Service for semantic search and conversation analysis (Google Gemini)
"""
import google.generativeai as genai
import hashlib
import numpy as np
from django.conf import settings
from typing import List, Dict, Optional
from sklearn.metrics.pairwise import cosine_similarity
from ..models import EmbeddingCache


class EmbeddingService:
    """Service for generating and managing text embeddings using Google Gemini"""
    
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = settings.EMBEDDING_MODEL
    
    def _get_text_hash(self, text: str) -> str:
        """Generate hash for text to use as cache key"""
        return hashlib.sha256(text.encode()).hexdigest()
    
    def get_embedding(self, text: str, use_cache: bool = True) -> Optional[List[float]]:
        """
        Get embedding for text using Gemini
        
        Args:
            text: Text to embed
            use_cache: Whether to use cached embeddings
        
        Returns:
            List of floats representing the embedding, or None if quota exceeded
        """
        if not text or not text.strip():
            return None
        
        text_hash = self._get_text_hash(text)
        
        # Check cache first
        if use_cache:
            try:
                cache = EmbeddingCache.objects.get(text_hash=text_hash, model=self.model)
                cache.access_count += 1
                cache.save(update_fields=['access_count', 'last_accessed'])
                return cache.embedding
            except EmbeddingCache.DoesNotExist:
                pass
        
        # Generate new embedding
        try:
            result = genai.embed_content(
                model=self.model,
                content=text,
                task_type="retrieval_document"
            )
            
            embedding = result['embedding']
            
            # Cache the embedding
            if use_cache:
                EmbeddingCache.objects.update_or_create(
                    text_hash=text_hash,
                    defaults={
                        'text_preview': text[:200],
                        'embedding': embedding,
                        'model': self.model,
                        'access_count': 1,
                    }
                )
            
            return embedding
        
        except Exception as e:
            error_msg = str(e)
            
            # Check if it's a quota error
            if '429' in error_msg or 'quota' in error_msg.lower() or 'rate limit' in error_msg.lower():
                print(f"⚠️  Embedding quota exceeded. Semantic search will be limited.")
                print(f"   Consider: 1) Using cached embeddings only, 2) Adding your own API key")
                return None
            else:
                print(f"Error generating embedding: {error_msg}")
                return None
    
    def get_embeddings_batch(self, texts: List[str], use_cache: bool = True) -> List[Optional[List[float]]]:
        """
        Get embeddings for multiple texts efficiently
        
        Args:
            texts: List of texts to embed
            use_cache: Whether to use cached embeddings
        
        Returns:
            List of embeddings (or None for failed embeds)
        """
        embeddings = []
        texts_to_embed = []
        indices_to_embed = []
        
        for i, text in enumerate(texts):
            if not text or not text.strip():
                embeddings.append(None)
                continue
            
            text_hash = self._get_text_hash(text)
            
            # Check cache
            if use_cache:
                try:
                    cache = EmbeddingCache.objects.get(text_hash=text_hash, model=self.model)
                    cache.access_count += 1
                    cache.save(update_fields=['access_count', 'last_accessed'])
                    embeddings.append(cache.embedding)
                    continue
                except EmbeddingCache.DoesNotExist:
                    pass
            
            # Mark for batch embedding
            texts_to_embed.append(text)
            indices_to_embed.append(i)
            embeddings.append(None)  # Placeholder
        
        # Generate embeddings for uncached texts (one by one for Gemini)
        if texts_to_embed:
            try:
                for idx, text in enumerate(texts_to_embed):
                    result = genai.embed_content(
                        model=self.model,
                        content=text,
                        task_type="retrieval_document"
                    )
                    
                    embedding = result['embedding']
                    original_idx = indices_to_embed[idx]
                    embeddings[original_idx] = embedding
                    
                    # Cache the embedding
                    if use_cache:
                        text_hash = self._get_text_hash(text)
                        EmbeddingCache.objects.update_or_create(
                            text_hash=text_hash,
                            defaults={
                                'text_preview': text[:200],
                                'embedding': embedding,
                                'model': self.model,
                                'access_count': 1,
                            }
                        )
            
            except Exception as e:
                print(f"Error generating batch embeddings: {str(e)}")
        
        return embeddings
    
    def calculate_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """
        Calculate cosine similarity between two embeddings
        
        Args:
            embedding1: First embedding
            embedding2: Second embedding
        
        Returns:
            Similarity score between -1 and 1
        """
        if not embedding1 or not embedding2:
            return 0.0
        
        vec1 = np.array(embedding1).reshape(1, -1)
        vec2 = np.array(embedding2).reshape(1, -1)
        
        return float(cosine_similarity(vec1, vec2)[0][0])
    
    def find_similar_texts(
        self, 
        query_embedding: List[float],
        candidate_embeddings: List[Dict],
        top_k: int = 5,
        threshold: float = 0.7
    ) -> List[Dict]:
        """
        Find most similar texts to query
        
        Args:
            query_embedding: Embedding of query text
            candidate_embeddings: List of dicts with 'id', 'embedding', and optional metadata
            top_k: Number of top results to return
            threshold: Minimum similarity threshold
        
        Returns:
            List of dicts with similarity scores
        """
        if not query_embedding or not candidate_embeddings:
            return []
        
        results = []
        query_vec = np.array(query_embedding).reshape(1, -1)
        
        for candidate in candidate_embeddings:
            if not candidate.get('embedding'):
                continue
            
            candidate_vec = np.array(candidate['embedding']).reshape(1, -1)
            similarity = float(cosine_similarity(query_vec, candidate_vec)[0][0])
            
            if similarity >= threshold:
                results.append({
                    **candidate,
                    'similarity': similarity
                })
        
        # Sort by similarity and return top k
        results.sort(key=lambda x: x['similarity'], reverse=True)
        return results[:top_k]
