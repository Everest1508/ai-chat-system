'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { logout } from '@/features/auth/authSlice';
import { createConversation } from '@/features/conversations/conversationSlice';

export default function Home() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  
  // Check localStorage synchronously during render to avoid flash
  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('access_token');

  useEffect(() => {
    // If token exists, redirect immediately
    if (hasToken) {
      router.replace('/dashboard');
    }
  }, [hasToken, router]);

  useEffect(() => {
    // Also check Redux state as backup
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleLogout = async () => {
    await dispatch(logout());
    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Abstract Shapes Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large Circle */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
        
        {/* Medium Circles */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-200 rounded-full opacity-15 blur-2xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-pink-200 rounded-full opacity-15 blur-2xl"></div>
        
        {/* Small Circles */}
        <div className="absolute top-1/2 right-1/3 w-32 h-32 bg-blue-300 rounded-full opacity-10 blur-xl"></div>
        <div className="absolute bottom-1/3 left-1/3 w-32 h-32 bg-purple-300 rounded-full opacity-10 blur-xl"></div>
        
        {/* Geometric Shapes */}
        <div className="absolute top-20 right-20 w-24 h-24 bg-blue-100 rotate-45 opacity-10"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-indigo-100 rotate-12 opacity-10"></div>
        <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-purple-100 rotate-45 opacity-10"></div>
        <div className="absolute bottom-1/3 left-1/4 w-16 h-16 bg-pink-100 rotate-12 opacity-10"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-6xl sm:text-7xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4 tracking-tight">
              AI Chat Portal
            </h1>
            <p className="text-xl sm:text-2xl text-gray-700 font-medium">
              Intelligent conversations with AI-powered insights
            </p>
          </div>

          {/* If token exists, show skeleton - redirect to dashboard happens in useEffect */}
          {hasToken ? (
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
              <div className="space-y-4">
                <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mx-auto"></div>
                <div className="h-5 w-64 bg-gray-200 rounded animate-pulse mx-auto"></div>
                <div className="flex gap-3 justify-center pt-4">
                  <div className="h-12 w-32 bg-gray-200 rounded-xl animate-pulse"></div>
                  <div className="h-12 w-32 bg-gray-200 rounded-xl animate-pulse"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/30 relative overflow-hidden transform transition-all duration-300 hover:shadow-3xl hover:scale-[1.02]">
              {/* Card Background Shapes */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Large blurred circles */}
                <div className="absolute top-4 right-4 w-32 h-32 bg-blue-100 rounded-full opacity-30 blur-xl"></div>
                <div className="absolute bottom-4 left-4 w-28 h-28 bg-purple-100 rounded-full opacity-30 blur-xl"></div>
                <div className="absolute top-1/3 right-8 w-22 h-22 bg-indigo-100 rounded-full opacity-20 blur-lg"></div>
                <div className="absolute bottom-1/3 left-8 w-20 h-20 bg-pink-100 rounded-full opacity-20 blur-lg"></div>
                
                {/* Medium circles */}
                <div className="absolute top-1/4 right-1/4 w-16 h-16 bg-blue-200 rounded-full opacity-15 blur-md"></div>
                <div className="absolute bottom-1/4 left-1/4 w-14 h-14 bg-purple-200 rounded-full opacity-15 blur-md"></div>
                <div className="absolute top-2/3 right-1/3 w-12 h-12 bg-indigo-200 rounded-full opacity-15 blur-md"></div>
                
                {/* Geometric shapes - squares */}
                <div className="absolute top-8 left-8 w-14 h-14 bg-blue-200 rotate-45 opacity-20 rounded-sm"></div>
                <div className="absolute bottom-8 right-8 w-12 h-12 bg-purple-200 rotate-12 opacity-20 rounded-sm"></div>
                <div className="absolute top-1/2 left-1/4 w-10 h-10 bg-indigo-200 rotate-45 opacity-15 rounded-sm"></div>
                <div className="absolute bottom-1/4 right-1/4 w-8 h-8 bg-pink-200 rotate-12 opacity-15 rounded-sm"></div>
                <div className="absolute top-1/3 left-2/3 w-6 h-6 bg-blue-300 rotate-45 opacity-15"></div>
                
                {/* Triangles */}
                <div className="absolute top-1/4 left-1/3 w-10 h-10 bg-blue-300 opacity-15" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
                <div className="absolute bottom-1/4 right-1/3 w-9 h-9 bg-purple-300 opacity-15 rotate-180" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
                <div className="absolute top-2/3 left-1/5 w-7 h-7 bg-indigo-300 opacity-12 rotate-90" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
                
                {/* Hexagons */}
                <div className="absolute top-1/2 right-1/5 w-8 h-8 bg-purple-300 opacity-10 rotate-30" style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)' }}></div>
                <div className="absolute bottom-1/3 left-1/5 w-6 h-6 bg-indigo-300 opacity-10 rotate-30" style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)' }}></div>
                
                {/* Wavy lines */}
                <svg className="absolute bottom-0 left-0 w-full h-28 opacity-10" viewBox="0 0 400 100" preserveAspectRatio="none">
                  <path d="M0,60 Q100,30 200,60 T400,60 L400,100 L0,100 Z" fill="url(#waveGradientHome2)" />
                  <defs>
                    <linearGradient id="waveGradientHome2" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#c4b5fd" />
                      <stop offset="50%" stopColor="#93c5fd" />
                      <stop offset="100%" stopColor="#fbcfe8" />
                    </linearGradient>
                  </defs>
                </svg>
                
                {/* Dots pattern */}
                <div className="absolute top-1/4 right-1/5 w-2 h-2 bg-blue-300 rounded-full opacity-20"></div>
                <div className="absolute top-1/2 left-1/5 w-2 h-2 bg-purple-300 rounded-full opacity-20"></div>
                <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-indigo-300 rounded-full opacity-20"></div>
                <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-pink-300 rounded-full opacity-20"></div>
                <div className="absolute top-1/3 right-2/5 w-1.5 h-1.5 bg-blue-400 rounded-full opacity-15"></div>
                
                {/* Curved lines */}
                <svg className="absolute top-0 right-0 w-36 h-36 opacity-10" viewBox="0 0 100 100">
                  <path d="M10,50 Q30,20 50,50 T90,50" stroke="#c4b5fd" strokeWidth="2" fill="none" />
                </svg>
                <svg className="absolute bottom-0 left-0 w-32 h-32 opacity-10" viewBox="0 0 100 100">
                  <path d="M10,50 Q30,80 50,50 T90,50" stroke="#93c5fd" strokeWidth="2" fill="none" />
                </svg>
                <svg className="absolute top-1/2 left-0 w-24 h-24 opacity-8" viewBox="0 0 100 100">
                  <path d="M20,30 Q40,50 60,30" stroke="#fbcfe8" strokeWidth="1.5" fill="none" />
                </svg>
              </div>
              
              <div className="relative z-10">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Get Started
                </h2>
                <p className="text-gray-600 mb-6">
                  Sign in or create an account to start chatting with AI
                </p>
                <div className="flex gap-4 justify-center">
                  <a
                    href="/login"
                    className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl transition-all duration-300 inline-block text-center font-semibold shadow-lg hover:shadow-2xl hover:shadow-blue-500/50 border-2 border-blue-400/30 hover:border-blue-400/50 transform hover:-translate-y-1 hover:scale-105 overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Sign In
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </a>
                  <a
                    href="/register"
                    className="group relative px-8 py-4 bg-white/80 backdrop-blur-md text-gray-800 border-2 border-gray-200/50 rounded-2xl hover:border-purple-400/50 hover:text-purple-600 transition-all duration-300 inline-block text-center font-semibold shadow-lg hover:shadow-2xl hover:shadow-purple-500/30 transform hover:-translate-y-1 hover:scale-105"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <svg className="w-5 h-5 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      Sign Up
                    </span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
