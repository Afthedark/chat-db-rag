"""
Encryption service for secure password storage.
Uses Fernet symmetric encryption.
"""

from cryptography.fernet import Fernet
import os
import base64

# Generate or load encryption key
# In production, this should be loaded from a secure environment variable
def get_encryption_key():
    """Get or generate encryption key."""
    key = os.getenv('ENCRYPTION_KEY')
    if key:
        # Ensure the key is properly formatted for Fernet
        try:
            # Try to use the key as-is first
            Fernet(key)
            return key
        except ValueError:
            # If that fails, try to encode it properly
            try:
                # If it's a base64 string, use it
                decoded = base64.urlsafe_b64decode(key + '=' * (4 - len(key) % 4))
                if len(decoded) == 32:
                    return base64.urlsafe_b64encode(decoded).decode()
            except:
                pass
            # Generate a new key from the string
            key_bytes = key.encode()
            # Pad or truncate to 32 bytes
            key_bytes = key_bytes[:32].ljust(32, b'\0')
            return base64.urlsafe_b64encode(key_bytes).decode()
    else:
        # Generate a new key (only for development!)
        key = Fernet.generate_key()
        print("WARNING: Generated new encryption key. Set ENCRYPTION_KEY in .env for persistence.")
        print(f"ENCRYPTION_KEY={key.decode()}")
        return key.decode()


# Initialize cipher suite
cipher_suite = Fernet(get_encryption_key().encode())


def encrypt_password(password: str) -> str:
    """
    Encrypt a password.
    
    Args:
        password: Plain text password
        
    Returns:
        Encrypted password string
    """
    if not password:
        return ''
    return cipher_suite.encrypt(password.encode()).decode()


def decrypt_password(encrypted: str) -> str:
    """
    Decrypt a password.
    
    Args:
        encrypted: Encrypted password string
        
    Returns:
        Decrypted plain text password
    """
    if not encrypted:
        return ''
    try:
        return cipher_suite.decrypt(encrypted.encode()).decode()
    except Exception as e:
        print(f"Error decrypting password: {e}")
        return ''


def generate_key():
    """Generate a new encryption key."""
    return Fernet.generate_key().decode()
