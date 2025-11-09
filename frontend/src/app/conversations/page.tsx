'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchConversations, createConversation, updateConversation, deleteConversation } from '@/features/conversations/conversationSlice';
import SidebarLayout from '@/components/SidebarLayout';
import Link from 'next/link';
import ConversationsSkeleton from '@/components/skeletons/ConversationsSkeleton';
import { apiClient } from '@/lib/api';

export default function ConversationsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { conversations, isLoading } = useAppSelector((state) => state.conversations);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    topics: '',
    sentiment: '',
  });
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState<{ id: number; summary: string; title: string } | null>(null);
  const [editingTitle, setEditingTitle] = useState<{ id: number; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; title: string } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    dispatch(fetchConversations());
  }, [isAuthenticated, dispatch, router]);

  const handleNewConversation = async () => {
    try {
      const result = await dispatch(createConversation({ title: 'New Chat' })).unwrap();
      if (result) {
        router.push(`/chat/${result.id}`);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const queryData: any = {
        query: searchQuery,
        max_conversations: 20,
      };

      if (filters.date_from) {
        queryData.date_from = new Date(filters.date_from).toISOString();
      }
      if (filters.date_to) {
        queryData.date_to = new Date(filters.date_to).toISOString();
      }
      if (filters.topics) {
        queryData.topics = filters.topics.split(',').map((t: string) => t.trim()).filter(Boolean);
      }
      if (filters.sentiment) {
        queryData.sentiment = filters.sentiment;
      }

      const result = await apiClient.post('/conversation-query/', queryData);
      setSearchResults(result.related_conversations || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setFilters({
      date_from: '',
      date_to: '',
      topics: '',
      sentiment: '',
    });
  };

  const displayConversations = searchResults.length > 0 ? searchResults : conversations;

  const handleEditTitle = async (id: number, newTitle: string) => {
    if (!newTitle.trim()) {
      setEditingTitle(null);
      return;
    }
    try {
      await dispatch(updateConversation({ id, data: { title: newTitle.trim() } })).unwrap();
      setEditingTitle(null);
      // Refresh conversations list
      dispatch(fetchConversations());
    } catch (error) {
      console.error('Error updating title:', error);
    }
  };

  const handleDeleteClick = (id: number, title: string) => {
    setDeleteConfirm({ id, title });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    
    const { id } = deleteConfirm;
    setIsDeleting(id);
    setDeleteConfirm(null);
    
    try {
      await dispatch(deleteConversation(id)).unwrap();
      // Refresh conversations list
      dispatch(fetchConversations());
      // Clear search if deleted conversation was in search results
      if (searchResults.length > 0) {
        setSearchResults(searchResults.filter((c) => c.id !== id));
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarLayout>
      <div className="h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-y-auto">
      {/* Abstract Shapes Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-200 rounded-full opacity-15 blur-2xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-pink-200 rounded-full opacity-15 blur-2xl"></div>
        <div className="absolute top-1/2 right-1/3 w-32 h-32 bg-blue-300 rounded-full opacity-10 blur-xl"></div>
        <div className="absolute bottom-1/3 left-1/3 w-32 h-32 bg-purple-300 rounded-full opacity-10 blur-xl"></div>
        <div className="absolute top-20 right-20 w-24 h-24 bg-blue-100 rotate-45 opacity-10"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-indigo-100 rotate-12 opacity-10"></div>
      </div>

      <div className="relative z-10 container mx-auto px-3 sm:px-6 py-4 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link 
              href="/"
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900">My Conversations</h1>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <Link
              href="/dashboard"
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-white text-gray-700 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:text-blue-600 transition-all font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <button
              onClick={handleNewConversation}
              className="group flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:shadow-blue-500/50 border-2 border-blue-400/30 hover:border-blue-400/50 flex items-center justify-center gap-2 text-sm sm:text-base transform hover:-translate-y-0.5 hover:scale-105"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">New Conversation</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>

        {/* Search Bar with Filters */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-6 border border-white/30 transform transition-all duration-300 hover:shadow-2xl">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                placeholder="Search conversations..."
                className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 text-sm sm:text-base"
              />
              <svg
                className="absolute left-3 sm:left-4 top-2.5 sm:top-3.5 w-4 h-4 sm:w-5 sm:h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="group flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl hover:shadow-blue-500/50 border-2 border-blue-400/30 hover:border-blue-400/50 text-sm sm:text-base transform hover:-translate-y-0.5 hover:scale-105 disabled:transform-none"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-3 sm:px-4 py-2.5 sm:py-3 bg-white text-gray-700 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:text-blue-600 transition-all font-semibold shadow-md hover:shadow-lg"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </button>
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all font-semibold text-sm sm:text-base"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date From</label>
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date To</label>
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Topics (comma-separated)</label>
                <input
                  type="text"
                  value={filters.topics}
                  onChange={(e) => setFilters({ ...filters, topics: e.target.value })}
                  placeholder="AI, machine learning"
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Sentiment</label>
                <select
                  value={filters.sentiment}
                  onChange={(e) => setFilters({ ...filters, sentiment: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                >
                  <option value="">All</option>
                  <option value="positive">Positive</option>
                  <option value="negative">Negative</option>
                  <option value="neutral">Neutral</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Found <span className="font-semibold text-gray-900">{searchResults.length}</span> conversation{searchResults.length !== 1 ? 's' : ''} matching your search
              </p>
            </div>
          )}
        </div>

        {/* Conversations List */}
        {isLoading && conversations.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                <div className="space-y-3">
                  <div className="h-6 w-3/4 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : displayConversations.length === 0 ? (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-12 border border-white/20 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </h2>
            <p className="text-gray-600 mb-6">
              {searchQuery ? 'Try adjusting your search or filters' : 'Start a new conversation to begin chatting with AI'}
            </p>
            {!searchQuery && (
              <button
                onClick={handleNewConversation}
                className="px-6 py-3 bg-blue-200 hover:bg-blue-300 text-blue-800 rounded-xl transition-all font-semibold shadow-md hover:shadow-lg border-2 border-blue-300 hover:border-blue-400"
              >
                Create First Conversation
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4">
            {displayConversations.map((conv: any) => (
              <Link
                key={conv.id}
                href={`/chat/${conv.id}`}
                className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-4 sm:p-6 border border-white/30 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 relative overflow-hidden group transform hover:-translate-y-1 hover:scale-[1.02]"
              >
                {/* Card Background Shapes */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute top-2 right-2 w-16 h-16 bg-blue-100 rounded-full opacity-20 blur-lg"></div>
                  <div className="absolute bottom-2 left-2 w-12 h-12 bg-purple-100 rounded-full opacity-20 blur-lg"></div>
                  <div className="absolute top-1/2 right-1/4 w-8 h-8 bg-indigo-100 rounded-full opacity-15 blur-md"></div>
                </div>

                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                  <div className="flex-1 min-w-0 w-full sm:w-auto">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                      {editingTitle?.id === conv.id ? (
                        <input
                          type="text"
                          value={editingTitle.title}
                          onChange={(e) => setEditingTitle({ ...editingTitle, title: e.target.value })}
                          onBlur={() => handleEditTitle(conv.id, editingTitle.title)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleEditTitle(conv.id, editingTitle.title);
                            } else if (e.key === 'Escape') {
                              setEditingTitle(null);
                            }
                          }}
                          autoFocus
                          className="text-base sm:text-lg font-semibold text-gray-900 px-2 py-1 border-2 border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-full sm:w-auto"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                          {conv.title || `Conversation ${conv.id}`}
                        </h3>
                      )}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                        conv.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {conv.status}
                      </span>
                    </div>
                    {conv.summary_preview && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {conv.summary_preview}
                      </p>
                    )}
                    {conv.last_message && (
                      <p className="text-sm text-gray-500 line-clamp-1">
                        {conv.last_message.content}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span>{conv.message_count || 0} messages</span>
                      <span>•</span>
                      <span>{new Date(conv.created_at).toLocaleDateString()}</span>
                      {conv.sentiment && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{conv.sentiment}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {/* Edit Title Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingTitle({
                          id: conv.id,
                          title: conv.title || `Conversation ${conv.id}`,
                        });
                      }}
                      className="p-1.5 sm:p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300 transform hover:scale-110 hover:rotate-12 shadow-sm hover:shadow-md"
                      title="Edit Title"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    
                    {/* Summary Button */}
                    {conv.status === 'ended' && conv.summary && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedSummary({
                            id: conv.id,
                            summary: conv.summary,
                            title: conv.title || `Conversation ${conv.id}`,
                          });
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-all border border-purple-200"
                        title="View Summary"
                      >
                        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Summary
                      </button>
                    )}
                    
                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteClick(conv.id, conv.title || `Conversation ${conv.id}`);
                      }}
                      disabled={isDeleting === conv.id}
                      className="p-1.5 sm:p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 transform hover:scale-110 hover:rotate-12 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      title="Delete Conversation"
                    >
                      {isDeleting === conv.id ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                    
                    {/* Arrow Icon */}
                    <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Summary Modal */}
        {selectedSummary && (
          <>
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setSelectedSummary(null)}
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 px-6 py-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">{selectedSummary.title}</h2>
                    <p className="text-purple-100 text-sm">Conversation Summary</p>
                  </div>
                  <button
                    onClick={() => setSelectedSummary(null)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="prose prose-lg max-w-none">
                    <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                      {selectedSummary.summary}
                    </p>
                  </div>
                </div>
                <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
                  <button
                    onClick={() => setSelectedSummary(null)}
                    className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <>
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={handleDeleteCancel}
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                <div className="bg-gradient-to-br from-red-500 to-red-600 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Delete Conversation</h2>
                      <p className="text-red-100 text-sm">This action cannot be undone</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-900 mb-2">
                    Are you sure you want to delete <span className="font-semibold">"{deleteConfirm.title}"</span>?
                  </p>
                  <p className="text-sm text-gray-600 mb-6">
                    All messages and conversation data will be permanently deleted.
                  </p>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={handleDeleteCancel}
                      className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteConfirm}
                      className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all font-semibold shadow-md hover:shadow-lg"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      </div>
    </SidebarLayout>
  );
}

