"""
LLM service module for Ollama and Gemini API interactions.
"""

import os
import time
import requests
from typing import List, Dict, Any, Optional

# Try to import google.genai (new SDK), fall back gracefully if not installed
try:
    from google import genai
    from google.genai import types as genai_types
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
    """Client for Google Gemini API (google-genai SDK)."""
    
    def __init__(self, api_key: Optional[str] = None):
        self._api_key = api_key or Config.GEMINI_API_KEY
        self._available = GENAI_AVAILABLE
    
    @property
    def is_available(self) -> bool:
        """Check if Gemini API is available."""
        return self._available
    
    def _build_client(self, api_key: Optional[str] = None) -> 'genai.Client':
        """Build a Gemini client with the provided or configured API key."""
        key = api_key or self._api_key
        if not key:
            raise ValueError("Gemini API key not configured. Set GEMINI_API_KEY_ID_1 in backend/.env")
        return genai.Client(api_key=key)
    
    def query(self, prompt: str, temperature: float = 0.2,
              max_tokens: int = 3000, model_name: str = "gemini-2.0-flash",
              api_key: Optional[str] = None) -> str:
        """
        Query Gemini API using the new google-genai SDK.

        Args:
            prompt: Text prompt to send
            temperature: Sampling temperature
            max_tokens: Maximum output tokens
            model_name: Gemini model to use
            api_key: Override API key (optional)

        Returns:
            Model response text or error message
        """
        if not self._available:
            return "Error: Gemini SDK not installed. Run: pip install google-genai"

        try:
            client = self._build_client(api_key)
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=genai_types.GenerateContentConfig(
                    temperature=temperature,
                    max_output_tokens=max_tokens,
                )
            )
            text = response.text
            return text if text else "Error: Empty response from Gemini"
        except ValueError as e:
            return f"Error: {str(e)}"
        except Exception as e:
            return f"Error with Gemini: {str(e)}"


class OpenRouterClient:
    """Client for OpenRouter API - Unified access to multiple LLM providers."""
    
    def __init__(self):
        self.api_key = os.getenv('OPENROUTER_API_KEY')
        self.default_model = os.getenv('OPENROUTER_DEFAULT_MODEL', 'openai/gpt-4o-mini')
        self.site_url = os.getenv('OPENROUTER_SITE_URL', 'http://localhost:3000')
        self.site_name = os.getenv('OPENROUTER_SITE_NAME', 'Chat-DB-RAG')
        self.base_url = 'https://openrouter.ai/api/v1/chat/completions'
    
    @property
    def is_available(self) -> bool:
        """Check if OpenRouter is configured."""
        return bool(self.api_key and self.api_key.startswith('sk-or-v1-'))
    
    def query(self, messages: List[Dict[str, str]], temperature: float = 0.2,
              model: Optional[str] = None) -> str:
        """
        Query OpenRouter API.
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature
            model: Model name (uses default from .env if not specified)
            
        Returns:
            Model response text or error message
        """
        if not self.is_available:
            return "Error: OpenRouter API key not configured. Set OPENROUTER_API_KEY in backend/.env"
        
        model = model or self.default_model
        
        try:
            print(f"[OpenRouter] Sending request to model: {model}")
            
            response = requests.post(
                self.base_url,
                headers={
                    'Authorization': f'Bearer {self.api_key}',
                    'HTTP-Referer': self.site_url,
                    'X-OpenRouter-Title': self.site_name,
                    'Content-Type': 'application/json',
                },
                json={
                    'model': model,
                    'messages': messages,
                    'temperature': temperature,
                },
                timeout=120
            )
            
            if response.status_code == 200:
                data = response.json()
                content = data.get('choices', [{}])[0].get('message', {}).get('content', '')
                if not content:
                    return "Error: OpenRouter returned empty response"
                print(f"[OpenRouter] Success! Response length: {len(content)} chars")
                return content
            elif response.status_code == 429:
                error_data = response.json()
                error_msg = error_data.get('error', {}).get('message', 'Rate limit exceeded')
                return f"Error: {error_msg}"
            else:
                error_msg = f"Error: OpenRouter returned status {response.status_code}"
                try:
                    error_data = response.json()
                    if 'error' in error_data:
                        error_msg += f" - {error_data['error'].get('message', '')}"
                except:
                    pass
                print(f"[OpenRouter] {error_msg}")
                return error_msg
                
        except requests.exceptions.Timeout:
            return "Error: OpenRouter request timed out after 120 seconds"
        except requests.exceptions.ConnectionError:
            return "Error: Cannot connect to OpenRouter API"
        except Exception as e:
            return f"Error with OpenRouter: {str(e)}"


class LLMManager:
    """Manages LLM interactions across different providers."""
    
    def __init__(self):
        self.ollama = OllamaClient()
        self.gemini = GeminiClient()
        self.openrouter = OpenRouterClient()
    
    def get_available_providers(self) -> List[str]:
        """Get list of available LLM providers."""
        providers = ["ollama"]
        if self.gemini.is_available:
            providers.append("gemini")
        if self.openrouter.is_available:
            providers.append("openrouter")
        return providers
    
    def get_available_models(self, provider: str) -> List[str]:
        """
        Get available models for a provider.
        
        Args:
            provider: Provider name ('ollama', 'gemini', or 'openrouter')
            
        Returns:
            List of model names
        """
        if provider == "ollama":
            return self.ollama.get_available_models()
        elif provider == "gemini" and self.gemini.is_available:
            return ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.5-flash-lite-preview-09-2025"]
        elif provider == "openrouter" and self.openrouter.is_available:
            # Return the configured default model
            return [self.openrouter.default_model]
        return []
    
    def query(self, provider: str, model: str, messages: List[Dict[str, str]], 
              temperature: float = 0.2, api_key: Optional[str] = None) -> str:
        """
        Query LLM with unified interface.
        
        Args:
            provider: Provider name ('ollama', 'gemini', or 'openrouter')
            model: Model name
            messages: List of message dicts (for Ollama/OpenRouter) or single prompt (for Gemini)
            temperature: Sampling temperature
            api_key: API key for cloud providers
            
        Returns:
            Model response text
        """
        if provider == "ollama":
            return self.ollama.query(model, messages, temperature)
        
        elif provider == "gemini":
            if not self.gemini.is_available:
                return "Error: Gemini SDK not installed. Run: pip install google-genai"
            # Convert messages list to a single concatenated prompt for Gemini
            prompt = "\n".join([m.get("content", "") for m in messages])
            return self.gemini.query(prompt, temperature, api_key=api_key)
        
        elif provider == "openrouter":
            # For OpenRouter, model parameter is optional (uses default from .env)
            # We pass None to let OpenRouterClient use OPENROUTER_DEFAULT_MODEL
            return self.openrouter.query(messages, temperature, model=None)
        
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
