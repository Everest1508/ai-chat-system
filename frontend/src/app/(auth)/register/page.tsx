'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { register, clearError } from '@/features/auth/authSlice';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    setValidationErrors({});

    // Validate passwords match
    if (formData.password !== formData.password2) {
      setValidationErrors({ password2: 'Passwords do not match' });
      return;
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setValidationErrors({ password: 'Password must be at least 8 characters long' });
      return;
    }

    try {
      const result = await dispatch(register(formData)).unwrap();
      if (result) {
        // After registration, redirect to login
        router.push('/login?registered=true');
      }
    } catch (err) {
      // Error is handled by Redux state
      console.error('Registration failed:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear validation error for this field
    if (validationErrors[e.target.name]) {
      setValidationErrors({
        ...validationErrors,
        [e.target.name]: '',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden py-8">
      {/* Abstract Shapes Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large Circles */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-200 rounded-full opacity-20 blur-3xl"></div>
        
        {/* Medium Circles */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blue-200 rounded-full opacity-15 blur-2xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-pink-200 rounded-full opacity-15 blur-2xl"></div>
      </div>

      <div className="relative z-10 max-w-md w-full px-6">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20 relative overflow-hidden">
          {/* Card Background Shapes */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Small decorative circles */}
            <div className="absolute top-4 right-4 w-24 h-24 bg-purple-100 rounded-full opacity-30 blur-xl"></div>
            <div className="absolute bottom-4 left-4 w-20 h-20 bg-indigo-100 rounded-full opacity-30 blur-xl"></div>
            <div className="absolute top-1/3 right-8 w-16 h-16 bg-blue-100 rounded-full opacity-20 blur-lg"></div>
            <div className="absolute bottom-1/4 left-8 w-14 h-14 bg-pink-100 rounded-full opacity-20 blur-lg"></div>
            
            {/* Geometric shapes */}
            <div className="absolute top-8 left-8 w-10 h-10 bg-purple-200 rotate-45 opacity-20 rounded-sm"></div>
            <div className="absolute bottom-8 right-8 w-8 h-8 bg-indigo-200 rotate-12 opacity-20 rounded-sm"></div>
            <div className="absolute top-1/2 left-1/4 w-6 h-6 bg-blue-200 rotate-45 opacity-15"></div>
            <div className="absolute bottom-1/3 right-1/4 w-5 h-5 bg-pink-200 rotate-12 opacity-15"></div>
            
            {/* Wavy lines */}
            <svg className="absolute bottom-0 left-0 w-full h-24 opacity-10" viewBox="0 0 400 100" preserveAspectRatio="none">
              <path d="M0,60 Q100,30 200,60 T400,60 L400,100 L0,100 Z" fill="url(#waveGradient2)" />
              <defs>
                <linearGradient id="waveGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#c4b5fd" />
                  <stop offset="50%" stopColor="#93c5fd" />
                  <stop offset="100%" stopColor="#fbcfe8" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Dots pattern */}
            <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-blue-300 rounded-full opacity-20"></div>
            <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-purple-300 rounded-full opacity-20"></div>
            <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-indigo-300 rounded-full opacity-20"></div>
          </div>

          {/* Content */}
          <div className="relative z-10">
            {/* Logo/Title Section */}
            <div className="text-center mb-8">

              <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
              <p className="text-gray-600">Join AI Chat Portal and start chatting</p>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                  Username *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                           className="w-full pl-10 pr-4 py-3 border-2 border-gray-200/50 rounded-xl focus:ring-4 focus:ring-purple-100/50 focus:border-purple-400 transition-all duration-300 bg-white/90 backdrop-blur-sm text-gray-900 placeholder-gray-400 shadow-sm focus:shadow-md"
                    placeholder="Choose a username"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                           className="w-full pl-10 pr-4 py-3 border-2 border-gray-200/50 rounded-xl focus:ring-4 focus:ring-purple-100/50 focus:border-purple-400 transition-all duration-300 bg-white/90 backdrop-blur-sm text-gray-900 placeholder-gray-400 shadow-sm focus:shadow-md"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-semibold text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition-all bg-white text-gray-900 placeholder-gray-400"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label htmlFor="last_name" className="block text-sm font-semibold text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition-all bg-white text-gray-900 placeholder-gray-400"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                           className="w-full pl-10 pr-4 py-3 border-2 border-gray-200/50 rounded-xl focus:ring-4 focus:ring-purple-100/50 focus:border-purple-400 transition-all duration-300 bg-white/90 backdrop-blur-sm text-gray-900 placeholder-gray-400 shadow-sm focus:shadow-md"
                    placeholder="At least 8 characters"
                  />
                </div>
                {validationErrors.password && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {validationErrors.password}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password2" className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    id="password2"
                    name="password2"
                    value={formData.password2}
                    onChange={handleChange}
                    required
                           className="w-full pl-10 pr-4 py-3 border-2 border-gray-200/50 rounded-xl focus:ring-4 focus:ring-purple-100/50 focus:border-purple-400 transition-all duration-300 bg-white/90 backdrop-blur-sm text-gray-900 placeholder-gray-400 shadow-sm focus:shadow-md"
                    placeholder="Confirm your password"
                  />
                </div>
                {validationErrors.password2 && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {validationErrors.password2}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full py-3.5 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl hover:shadow-purple-500/50 border-2 border-purple-400/30 hover:border-purple-400/50 transform hover:-translate-y-0.5 hover:scale-[1.02] disabled:transform-none overflow-hidden mt-6"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating account...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      Create Account
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/login" className="text-purple-600 font-semibold hover:text-purple-700 hover:underline transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
