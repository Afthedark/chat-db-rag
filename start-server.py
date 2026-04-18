"""
Simple startup script for Chat with MySQL.
Starts the Flask backend and shows access URLs for local network sharing.
"""

import socket
import subprocess
import sys
import os


def get_local_ip():
    """Get the local IP address for network sharing."""
    try:
        hostname = socket.gethostname()
        local_ip = socket.getaddrinfo(hostname, None, socket.AF_INET)[0][4][0]
        return local_ip
    except Exception:
        return "Unable to detect"


def main():
    """Start the server and display access information."""
    local_ip = get_local_ip()
    
    print("=" * 70)
    print("🚀 Chat with MySQL - Network Sharing Ready")
    print("=" * 70)
    print()
    print("📱 ACCESS URLs:")
    print(f"   • This computer:  http://localhost:5000")
    print(f"   • Other devices:  http://{local_ip}:5000")
    print()
    print("⚙️  REQUIREMENTS:")
    print("   1. All devices must be on the same WiFi/network")
    print("   2. Firewall may need to allow port 5000")
    print("   3. The backend must be running (this window)")
    print()
    print("🔧 QUICK START:")
    print("   1. Keep this window open (server running)")
    print(f"   2. On other devices, open: http://{local_ip}:5000")
    print("   3. The app will auto-detect the correct API endpoint")
    print()
    print("=" * 70)
    print()
    
    # Change to backend directory and start the server
    backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
    
    if not os.path.exists(backend_dir):
        print("❌ Error: backend directory not found!")
        sys.exit(1)
    
    os.chdir(backend_dir)
    
    # Start the Flask server
    try:
        subprocess.run([sys.executable, 'app.py'])
    except KeyboardInterrupt:
        print("\n\n👋 Server stopped. Goodbye!")


if __name__ == '__main__':
    main()
