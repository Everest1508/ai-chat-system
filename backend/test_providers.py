#!/usr/bin/env python
"""
Quick test script for AI providers
Run: python test_providers.py
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from ai_service.services.multi_model_service import MultiModelService

def test_provider(provider_name):
    """Test a specific provider"""
    print(f"\n{'='*60}")
    print(f"Testing {provider_name.upper()}...")
    print('='*60)
    
    try:
        service = MultiModelService(provider=provider_name)
        response = service.chat([
            {"role": "user", "content": "Say 'Hello from {}'!".format(provider_name.upper())}
        ])
        
        if response.get('error'):
            print(f"❌ Error: {response['error']}")
        else:
            print(f"✅ Success!")
            print(f"   Model: {response.get('model')}")
            print(f"   Response: {response.get('content', '')[:100]}")
            print(f"   Tokens: {response.get('tokens')}")
            print(f"   Time: {response.get('processing_time')}ms")
    
    except Exception as e:
        print(f"❌ Exception: {str(e)}")

def main():
    """Test all providers"""
    print("\n🧪 AI Provider Test Script")
    print("Testing all configured providers...\n")
    
    # Get available providers
    providers = MultiModelService.get_available_providers()
    
    print("📋 Provider Status:")
    for name, info in providers.items():
        status = "✅ Available" if info['available'] else "❌ Not configured"
        print(f"   {name}: {status}")
        if info['available']:
            print(f"      Free tier: {info['free_tier']}")
            print(f"      Models: {', '.join(info['models'][:2])}")
    
    # Test each available provider
    for name, info in providers.items():
        if info['available']:
            test_provider(name)
    
    # Get recommendation
    print(f"\n{'='*60}")
    recommended = MultiModelService.get_recommended_provider()
    print(f"🌟 Recommended Provider: {recommended.upper()}")
    print('='*60)
    print("\n✨ Testing complete!")

if __name__ == '__main__':
    main()
