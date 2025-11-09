#!/usr/bin/env python
"""
Quick script to test if user endpoints are registered
Run: python backend/user/test_urls.py
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.urls import get_resolver

print("\n=== Testing User URL Patterns ===\n")

resolver = get_resolver()
user_urls = []

def extract_patterns(patterns, prefix=''):
    for pattern in patterns:
        current_path = prefix + str(pattern.pattern)
        
        if hasattr(pattern, 'url_patterns'):
            extract_patterns(pattern.url_patterns, current_path)
        else:
            if 'user' in current_path.lower():
                user_urls.append(current_path)

extract_patterns(resolver.url_patterns)

if user_urls:
    print("✅ Found User URLs:")
    for url in sorted(user_urls):
        print(f"   {url}")
else:
    print("❌ No user URLs found!")

print("\n=== Checking Specific Endpoints ===\n")

endpoints_to_check = [
    '/api/users/me/',
    '/api/users/register/',
    '/api/users/set-api-key/',
    '/api/users/remove-api-key/',
    '/api/users/usage-stats/',
    '/api/users/change-password/',
    '/api/users/update-profile/',
]

for endpoint in endpoints_to_check:
    found = any(endpoint in url for url in user_urls)
    status = "✅" if found else "❌"
    print(f"{status} {endpoint}")

print("\n" + "="*50 + "\n")




