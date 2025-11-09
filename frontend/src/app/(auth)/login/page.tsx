'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { login, clearError, fetchUser } from '@/features/auth/authSlice';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [searchParams]);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    
    try {
      const result = await dispatch(login(formData)).unwrap();
      if (result) {
        // Fetch user data after login
        await dispatch(fetchUser());
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      // Error is handled by Redux state
      console.error('Login failed:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Abstract Shapes Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large Circles */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
        
        {/* Medium Circles */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-200 rounded-full opacity-15 blur-2xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-pink-200 rounded-full opacity-15 blur-2xl"></div>
      </div>

      <div className="relative z-10 max-w-md w-full px-6">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20 relative overflow-hidden">
          {/* Card Background Shapes */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Small decorative circles */}
            <div className="absolute top-4 right-4 w-20 h-20 bg-blue-100 rounded-full opacity-30 blur-xl"></div>
            <div className="absolute bottom-4 left-4 w-16 h-16 bg-purple-100 rounded-full opacity-30 blur-xl"></div>
            <div className="absolute top-1/2 right-8 w-12 h-12 bg-indigo-100 rounded-full opacity-20 blur-lg"></div>
            
            {/* Geometric shapes */}
            <div className="absolute top-8 left-8 w-8 h-8 bg-blue-200 rotate-45 opacity-20 rounded-sm"></div>
            <div className="absolute bottom-8 right-8 w-6 h-6 bg-purple-200 rotate-12 opacity-20 rounded-sm"></div>
            <div className="absolute top-1/3 left-1/4 w-4 h-4 bg-indigo-200 rotate-45 opacity-15"></div>
            
            {/* Wavy lines */}
            <svg className="absolute bottom-0 left-0 w-full h-20 opacity-10" viewBox="0 0 400 100" preserveAspectRatio="none">
              <path d="M0,50 Q100,20 200,50 T400,50 L400,100 L0,100 Z" fill="url(#waveGradient)" />
              <defs>
                <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#93c5fd" />
                  <stop offset="100%" stopColor="#c4b5fd" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Content */}
          <div className="relative z-10">
            {/* Logo/Title Section */}
            <div className="text-center mb-8">

              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
              <p className="text-gray-600">Sign in to continue to AI Chat Portal</p>
            </div>

            {showSuccess && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Registration successful! Please sign in.</span>
              </div>
            )}

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                  Username
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
                           className="w-full pl-10 pr-4 py-3 border-2 border-gray-200/50 rounded-xl focus:ring-4 focus:ring-blue-100/50 focus:border-blue-400 transition-all duration-300 bg-white/90 backdrop-blur-sm text-gray-900 placeholder-gray-400 shadow-sm focus:shadow-md"
                           placeholder="Enter your username"
                         />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
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
                           className="w-full pl-10 pr-4 py-3 border-2 border-gray-200/50 rounded-xl focus:ring-4 focus:ring-blue-100/50 focus:border-blue-400 transition-all duration-300 bg-white/90 backdrop-blur-sm text-gray-900 placeholder-gray-400 shadow-sm focus:shadow-md"
                           placeholder="Enter your password"
                         />
                </div>
              </div>

                     <button
                       type="submit"
                       disabled={isLoading}
                       className="group relative w-full py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl hover:shadow-blue-500/50 border-2 border-blue-400/30 hover:border-blue-400/50 transform hover:-translate-y-0.5 hover:scale-[1.02] disabled:transform-none overflow-hidden"
                     >
                       <span className="relative z-10 flex items-center justify-center gap-2">
                         {isLoading ? (
                           <>
                             <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                             </svg>
                             Signing in...
                           </>
                         ) : (
                           <>
                             <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                             </svg>
                             Sign In
                           </>
                         )}
                       </span>
                       <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                     </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link href="/register" className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
