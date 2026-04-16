"""
LLM service module for Ollama and Gemini API interactions.
"""

import os
import time
import requests
from typing import List, Dict, Any, Optional

# Try to import google.generativeai, but don't fail if not available
try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

# Import config
from config import Config


class OllamaClient:
    """Client for Ollama local LLM API."""
    
    def __init__(self, base_url: str = None):
        self.base_url = base_url or Config.OLLAMA_URL
        self.timeout = Config.OLLAMA_TIMEOUT
        self.max_retries = Config.OLLAMA_MAX_RETRIES
        self.retry_delay = Config.OLLAMA_RETRY_DELAY
    
    def get_available_models(self) -> List[str]:
        """
        Get list of available Ollama models.
        
        Returns:
            List of model names
        """
        try:
            response = requests.get("http://localhost:11434/api/tags", timeout=5)
            if response.status_code == 200:
                models = response.json().get("models", [])
                return [m["name"] for m in models]
        except Exception as e:
            print(f"[Ollama] Error fetching models: {e}")
        
        # Return defaults if can't fetch
        return ["llama3.1:8b", "gemma3", "deepseek-r1:14b"]
    
    def is_model_available(self, model_name: str) -> bool:
        """
        Check if a specific model is available.
        
        Args:
            model_name: Name of the model to check
            
        Returns:
            True if model is available
        """
        available = self.get_available_models()
        return model_name in available
    
    def query(self, model: str, messages: List[Dict[str, str]], 
              temperature: float = 0.2, timeout: Optional[int] = None) -> str:
        """
        Query Ollama API with retry logic.
        
        Args:
            model: Model name to use
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature
            timeout: Request timeout in seconds
            
        Returns:
            Model response text or error message
        """
        timeout = timeout or self.timeout
        
        # Log para debugging
        print(f"[Ollama] Sending request to model: {model}")
        print(f"[Ollama] Timeout: {timeout}s, Max retries: {self.max_retries}")
        print(f"[Ollama] Context limit: {Config.OLLAMA_CONTEXT_LIMIT}")
        
        for attempt in range(self.max_retries):
            try:
                print(f"[Ollama] Attempt {attempt + 1}/{self.max_retries}...")
                start_time = time.time()
                
                response = requests.post(
                    self.base_url,
                    json={
                        "model": model,
                        "messages": messages,
                        "stream": False,
                        "options": {
                            "temperature": temperature,
                            "num_ctx": Config.OLLAMA_CONTEXT_LIMIT
                        }
                    },
                    timeout=timeout
                )
                
                elapsed = time.time() - start_time
                print(f"[Ollama] Response received in {elapsed:.2f}s")
                
                if response.status_code == 200:
                    content = response.json().get("message", {}).get("content", "")
                    if not content:
                        return "Error: Model returned empty response"
                    print(f"[Ollama] Success! Response length: {len(content)} chars")
                    return content
                else:
                    error_msg = f"Error: Ollama returned status {response.status_code}"
                    print(f"[Ollama] {error_msg}")
                    if attempt < self.max_retries - 1:
                        wait_time = self.retry_delay * (2 ** attempt)
                        print(f"[Ollama] Retrying in {wait_time}s...")
                        time.sleep(wait_time)
                        continue
                    return error_msg
                    
            except requests.exceptions.Timeout:
                error_msg = f"Error: Request timed out after {timeout} seconds"
                print(f"[Ollama] {error_msg}")
                if attempt < self.max_retries - 1:
                    wait_time = self.retry_delay * (2 ** attempt)
                    print(f"[Ollama] Retrying in {wait_time}s...")
                    time.sleep(wait_time)
                    continue
                return error_msg
                
            except requests.exceptions.ConnectionError:
                error_msg = "Error: Cannot connect to Ollama. Make sure Ollama is running on localhost:11434"
                print(f"[Ollama] {error_msg}")
                if attempt < self.max_retries - 1:
                    wait_time = self.retry_delay * (2 ** attempt)
                    time.sleep(wait_time)
                    continue
                return error_msg
                
            except Exception as e:
                error_msg = f"Error querying Ollama: {str(e)}"
                print(f"[Ollama] {error_msg}")
                if attempt < self.max_retries - 1:
                    wait_time = self.retry_delay * (2 ** attempt)
                    time.sleep(wait_time)
                    continue
                return error_msg
        
        return "Error: Max retries exceeded"


class GeminiClient:
    """Client for Google Gemini API."""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or Config.GEMINI_API_KEY
        self._available = GENAI_AVAILABLE
        if self._available and self.api_key:
            genai.configure(api_key=self.api_key)
    
    @property
    def is_available(self) -> bool:
        """Check if Gemini API is available."""
        return self._available
    
    def query(self, prompt: str, temperature: float = 0.2, 
              max_tokens: int = 3000, model_name: str = "gemini-1.0-pro") -> str:
        """
        Query Gemini API.
        
        Args:
            prompt: Text prompt to send
            temperature: Sampling temperature
            max_tokens: Maximum output tokens
            model_name: Gemini model to use
            
        Returns:
            Model response text or error message
        """
        if not self._available:
            return "Error: Gemini API not available. Install google-generativeai package."
        
        try:
            generation_config = {
                "temperature": temperature,
                "top_p": 1,
                "top_k": 1,
                "max_output_tokens": max_tokens
            }
            model = genai.GenerativeModel(
                model_name=model_name,
                generation_config=generation_config
            )
            response = model.generate_content(prompt)
            return response.text if response.text else "Error: Empty response from Gemini"
        except Exception as e:
            return f"Error with Gemini: {str(e)}"


class LLMManager:
    """Manages LLM interactions across different providers."""
    
    def __init__(self):
        self.ollama = OllamaClient()
        self.gemini = GeminiClient()
    
    def get_available_providers(self) -> List[str]:
        """Get list of available LLM providers."""
        providers = ["ollama"]
        if self.gemini.is_available:
            providers.append("gemini")
        return providers
    
    def get_available_models(self, provider: str) -> List[str]:
        """
        Get available models for a provider.
        
        Args:
            provider: Provider name ('ollama' or 'gemini')
            
        Returns:
            List of model names
        """
        if provider == "ollama":
            return self.ollama.get_available_models()
        elif provider == "gemini" and self.gemini.is_available:
            return ["gemini-1.0-pro", "gemini-1.5-flash", "gemini-1.5-pro"]
        return []
    
    def query(self, provider: str, model: str, messages: List[Dict[str, str]], 
              temperature: float = 0.2, api_key: Optional[str] = None) -> str:
        """
        Query LLM with unified interface.
        
        Args:
            provider: Provider name ('ollama' or 'gemini')
            model: Model name
            messages: List of message dicts (for Ollama) or single prompt (for Gemini)
            temperature: Sampling temperature
            api_key: API key for cloud providers
            
        Returns:
            Model response text
        """
        if provider == "ollama":
            return self.ollama.query(model, messages, temperature)
        
        elif provider == "gemini":
            if not self.gemini.is_available:
                return "Error: Gemini not available"
            if api_key:
                genai.configure(api_key=api_key)
            # Convert messages to prompt for Gemini
            prompt = "\n".join([m.get("content", "") for m in messages])
            return self.gemini.query(prompt, temperature)
        
        return "Error: Unknown provider"


# Singleton instance
llm_manager = LLMManager()


# Convenience functions
def get_ollama_models() -> List[str]:
    """Get available Ollama models (backward compatibility)."""
    return llm_manager.ollama.get_available_models()


def query_ollama(model: str, messages: List[Dict[str, str]], 
                 temperature: float = 0.2, timeout: Optional[int] = None) -> str:
    """Query Ollama (backward compatibility)."""
    return llm_manager.ollama.query(model, messages, temperature, timeout)


def is_gemini_available() -> bool:
    """Check if Gemini is available (backward compatibility)."""
    return llm_manager.gemini.is_available
