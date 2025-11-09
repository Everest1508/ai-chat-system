'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { logout, fetchUser, UserProfile } from '@/features/auth/authSlice';
import { apiClient } from '@/lib/api';
import SidebarLayout from '@/components/SidebarLayout';
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton';

interface UsageStats {
  total_tokens_used: number;
  total_conversations: number;
  total_messages: number;
  has_custom_api_key: boolean;
  quota_info?: any;
}

export default function DashboardPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState<'settings' | 'usage' | 'profile'>('settings');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // API Key form state
  const [apiKeyForm, setApiKeyForm] = useState({
    provider: 'gemini' as 'gemini' | 'groq' | 'cohere',
    apiKey: '',
  });
  
  // Provider preferences state
  const [preferences, setPreferences] = useState({
    preferred_provider: 'gemini' as 'gemini' | 'groq' | 'cohere',
    preferred_gemini_model: 'models/gemini-2.5-flash',
    preferred_groq_model: 'llama-3.3-70b-versatile',
    preferred_cohere_model: 'command-r',
  });
  
  // Usage stats state
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);

  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    // Fetch user data if not available
    if (!user) {
      dispatch(fetchUser());
    }
    
    // Load preferences from user profile
    if (user?.profile) {
      setPreferences({
        preferred_provider: user.profile.preferred_provider,
        preferred_gemini_model: user.profile.preferred_gemini_model || 'models/gemini-2.5-flash',
        preferred_groq_model: user.profile.preferred_groq_model || 'llama-3.3-70b-versatile',
        preferred_cohere_model: user.profile.preferred_cohere_model || 'command-r',
      });
    }
    
    // Load usage stats
    loadUsageStats();
  }, [isAuthenticated, user, dispatch, router]);

  useEffect(() => {
    // Set active tab from URL query parameter
    const tab = searchParams?.get('tab');
    if (tab && ['settings', 'usage', 'profile'].includes(tab)) {
      setActiveTab(tab as 'settings' | 'usage' | 'profile');
    }
  }, [searchParams]);

  const loadUsageStats = async () => {
    try {
      const stats = await apiClient.get<UsageStats>('/users/usage-stats/');
      setUsageStats(stats);
    } catch (err: any) {
      console.error('Failed to load usage stats:', err);
    }
  };

  const handleSetAPIKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await apiClient.post('/users/set-api-key/', {
        provider: apiKeyForm.provider,
        api_key: apiKeyForm.apiKey,
      });
      
      setSuccess(`API key for ${apiKeyForm.provider} saved successfully!`);
      setApiKeyForm({ ...apiKeyForm, apiKey: '' });
      
      // Refresh user data
      await dispatch(fetchUser());
      await loadUsageStats();
    } catch (err: any) {
      setError(err.message || 'Failed to save API key');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAPIKey = async (provider: 'gemini' | 'groq' | 'cohere') => {
    if (!confirm(`Are you sure you want to remove your ${provider} API key?`)) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // DELETE with query parameter
      await apiClient.delete(`/users/remove-api-key/?provider=${provider}`);
      
      setSuccess(`${provider} API key removed successfully!`);
      
      // Refresh user data
      await dispatch(fetchUser());
      await loadUsageStats();
    } catch (err: any) {
      setError(err.message || 'Failed to remove API key');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await apiClient.post('/users/set-provider-preferences/', preferences);
      
      setSuccess('Preferences updated successfully!');
      
      // Refresh user data
      await dispatch(fetchUser());
    } catch (err: any) {
      setError(err.message || 'Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await dispatch(logout());
    router.push('/');
    router.refresh();
  };

  if (!isAuthenticated) {
    return null;
  }

  // Show skeleton while loading user data
  if (!user && isAuthenticated) {
    return (
      <SidebarLayout>
        <DashboardSkeleton />
      </SidebarLayout>
    );
  }

  function DashboardContent() {
    return (
      <div className="h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-y-auto">
        <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-600">Welcome back, {user?.username || 'User'}!</p>
          </div>

        {/* Tabs */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl mb-4 sm:mb-6 border border-white/30">
          <div className="flex border-b border-gray-200/50 overflow-x-auto">
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 sm:px-6 py-3 sm:py-4 font-semibold transition-all whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'settings'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              AI Configuration
            </button>
            <button
              onClick={() => setActiveTab('usage')}
              className={`px-4 sm:px-6 py-3 sm:py-4 font-semibold transition-all whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'usage'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Usage Statistics
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 sm:px-6 py-3 sm:py-4 font-semibold transition-all whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'profile'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Profile
            </button>
          </div>

          <div className="p-4 sm:p-6">
            {/* Error/Success Messages */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">{success}</span>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6 sm:space-y-8">
                {/* API Key Configuration */}
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">API Key Configuration</h2>
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-3xl p-4 sm:p-6 space-y-4 border border-gray-200/30 shadow-lg">
                    <form onSubmit={handleSetAPIKey} className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Provider
                        </label>
                        <select
                          value={apiKeyForm.provider}
                          onChange={(e) => setApiKeyForm({ ...apiKeyForm, provider: e.target.value as any })}
                          className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                          style={{ color: '#111827' }}
                        >
                          <option value="gemini" style={{ color: '#111827' }}>Google Gemini</option>
                          <option value="groq" style={{ color: '#111827' }}>Groq</option>
                          <option value="cohere" style={{ color: '#111827' }}>Cohere</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          API Key
                        </label>
                        <input
                          type="password"
                          value={apiKeyForm.apiKey}
                          onChange={(e) => setApiKeyForm({ ...apiKeyForm, apiKey: e.target.value })}
                          placeholder={`Enter your ${apiKeyForm.provider} API key`}
                          className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="group px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-300 disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl hover:shadow-blue-500/50 transform hover:-translate-y-0.5 hover:scale-105 disabled:transform-none"
                      >
                        {loading ? 'Saving...' : 'Save API Key'}
                      </button>
                    </form>

                    {/* Current API Keys Status */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Current API Keys</h3>
                      <div className="space-y-2">
                        {['gemini', 'groq', 'cohere'].map((provider) => {
                          const hasKey = user?.profile?.[`has_${provider}_key` as keyof UserProfile] as boolean;
                          return (
                            <div key={provider} className="flex items-center justify-between p-3 bg-white rounded-lg">
                              <div className="flex items-center gap-3">
                                <span className="font-medium capitalize text-gray-900">{provider}</span>
                                {hasKey ? (
                                  <span className="text-green-600 text-sm flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Configured
                                  </span>
                                ) : (
                                  <span className="text-gray-500 text-sm">Not configured</span>
                                )}
                              </div>
                              {hasKey && (
                                <button
                                  onClick={() => handleRemoveAPIKey(provider as any)}
                                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Provider Preferences */}
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">Provider Preferences</h2>
                  <form onSubmit={handleUpdatePreferences} className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-3xl p-4 sm:p-6 space-y-4 border border-gray-200/30 shadow-lg">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Preferred AI Provider
                      </label>
                      <select
                        value={preferences.preferred_provider}
                        onChange={(e) => setPreferences({ ...preferences, preferred_provider: e.target.value as any })}
                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                        style={{ color: '#111827' }}
                      >
                        <option value="gemini" style={{ color: '#111827' }}>Google Gemini</option>
                        <option value="groq" style={{ color: '#111827' }}>Groq</option>
                        <option value="cohere" style={{ color: '#111827' }}>Cohere</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Preferred Gemini Model
                      </label>
                      <input
                        type="text"
                        value={preferences.preferred_gemini_model}
                        onChange={(e) => setPreferences({ ...preferences, preferred_gemini_model: e.target.value })}
                        placeholder="models/gemini-2.5-flash"
                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Preferred Groq Model
                      </label>
                      <input
                        type="text"
                        value={preferences.preferred_groq_model}
                        onChange={(e) => setPreferences({ ...preferences, preferred_groq_model: e.target.value })}
                        placeholder="llama-3.3-70b-versatile"
                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Preferred Cohere Model
                      </label>
                      <input
                        type="text"
                        value={preferences.preferred_cohere_model}
                        onChange={(e) => setPreferences({ ...preferences, preferred_cohere_model: e.target.value })}
                        placeholder="command-r"
                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="group px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl transition-all duration-300 disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl hover:shadow-purple-500/50 transform hover:-translate-y-0.5 hover:scale-105 disabled:transform-none"
                    >
                      {loading ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Usage Statistics Tab */}
            {activeTab === 'usage' && (
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">Usage Statistics</h2>
                {usageStats ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                    <div className="bg-blue-50 rounded-xl p-4 sm:p-6 border-2 border-blue-200">
                      <div className="text-xs sm:text-sm text-blue-600 font-semibold mb-2">Total Tokens Used</div>
                      <div className="text-2xl sm:text-3xl font-bold text-blue-900">{usageStats.total_tokens_used.toLocaleString()}</div>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4 sm:p-6 border-2 border-purple-200">
                      <div className="text-xs sm:text-sm text-purple-600 font-semibold mb-2">Total Conversations</div>
                      <div className="text-2xl sm:text-3xl font-bold text-purple-900">{usageStats.total_conversations}</div>
                    </div>
                    <div className="bg-indigo-50 rounded-xl p-4 sm:p-6 border-2 border-indigo-200">
                      <div className="text-xs sm:text-sm text-indigo-600 font-semibold mb-2">Total Messages</div>
                      <div className="text-2xl sm:text-3xl font-bold text-indigo-900">{usageStats.total_messages}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">Loading usage statistics...</div>
                )}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">Profile Information</h2>
                <div className="bg-gray-50 rounded-xl p-4 sm:p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                    <div className="p-3 bg-white rounded-xl border-2 border-gray-200 text-gray-900">{user?.username}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <div className="p-3 bg-white rounded-xl border-2 border-gray-200 text-gray-900">{user?.email}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                    <div className="p-3 bg-white rounded-xl border-2 border-gray-200 text-gray-900">
                      {user?.first_name || user?.last_name
                        ? `${user?.first_name || ''} ${user?.last_name || ''}`.trim()
                        : 'Not set'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Member Since</label>
                    <div className="p-3 bg-white rounded-xl border-2 border-gray-200 text-gray-900">
                      {user?.date_joined
                        ? new Date(user.date_joined).toLocaleDateString()
                        : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    );
  }

  return (
    <SidebarLayout>
      <Suspense fallback={
        <div className="h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }>
        <DashboardContent />
      </Suspense>
    </SidebarLayout>
  );
}

