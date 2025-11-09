'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { 
  fetchConversation, 
  sendMessage, 
  setCurrentConversation,
  endConversation 
} from '@/features/conversations/conversationSlice';
import { Message } from '@/features/conversations/conversationSlice';
import SidebarLayout from '@/components/SidebarLayout';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ChatSkeleton from '@/components/skeletons/ChatSkeleton';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const conversationId = parseInt(params.id as string);
  
  const { currentConversation, isLoading } = useAppSelector((state) => state.conversations);
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (conversationId) {
      dispatch(fetchConversation(conversationId));
    }
  }, [conversationId, isAuthenticated, dispatch, router]);

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending || !conversationId) return;

    const messageToSend = message.trim();
    setMessage('');
    setIsSending(true);

    try {
      await dispatch(sendMessage({
        conversationId,
        message: messageToSend,
      })).unwrap();
      
      // Refetch conversation to get updated messages
      await dispatch(fetchConversation(conversationId));
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleEndConversation = async () => {
    if (!conversationId) return;
    
    try {
      await dispatch(endConversation({
        id: conversationId,
        generate_summary: true,
        analysis_depth: 'detailed',
      })).unwrap();
      
      router.push('/');
    } catch (error) {
      console.error('Error ending conversation:', error);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading && !currentConversation) {
    return (
      <SidebarLayout>
        <ChatSkeleton />
      </SidebarLayout>
    );
  }

  if (!currentConversation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-4">Conversation not found</p>
          <Link href="/" className="text-blue-600 hover:underline">Go back home</Link>
        </div>
      </div>
    );
  }

  const messages = currentConversation.messages || [];

  return (
    <SidebarLayout>
      <div className="h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden flex flex-col">
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

      {/* Header */}
      <div className="relative z-10 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-lg">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4 max-w-7xl">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0 transform transition-transform hover:scale-110 hover:rotate-3">
                  <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">
                    {currentConversation.title || `Conversation ${conversationId}`}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-2 flex-wrap">
                    <span>{messages.length} {messages.length === 1 ? 'message' : 'messages'}</span>
                    {currentConversation.status === 'active' && (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="text-green-600 font-medium hidden sm:inline">Active</span>
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            {currentConversation.status === 'active' && (
              <button
                onClick={handleEndConversation}
                className="group px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-red-700 bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 rounded-xl transition-all duration-300 border border-red-200/50 hover:border-red-300 shadow-md hover:shadow-lg hover:shadow-red-500/30 flex-shrink-0 transform hover:-translate-y-0.5"
              >
                <span className="hidden sm:inline flex items-center gap-2">
                  <svg className="w-4 h-4 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  End Conversation
                </span>
                <span className="sm:hidden">End</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="relative z-10 flex-1 overflow-y-auto">
        <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-6 max-w-7xl">
          <div className="space-y-6">
            {messages.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-3xl mb-6 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Start a conversation</h3>
                <p className="text-gray-600">Send a message to begin chatting with AI</p>
              </div>
            ) : (
              messages.map((msg: Message, index: number) => {
                const isUser = msg.role === 'user';
                const showAvatar = index === 0 || messages[index - 1].role !== msg.role;
                const messageDate = new Date(msg.created_at);
                const showDateSeparator = index === 0 || 
                  new Date(messages[index - 1].created_at).toDateString() !== messageDate.toDateString();
                
                return (
                  <div key={msg.id}>
                    {showDateSeparator && (
                      <div className="flex items-center justify-center my-6">
                        <div className="px-4 py-1.5 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200 shadow-sm">
                          <span className="text-xs font-medium text-gray-600">
                            {messageDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className={`flex items-end gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                      {!isUser && (
                        <div className={`flex-shrink-0 ${showAvatar ? 'w-10 h-10' : 'w-10 h-10 opacity-0'}`}>
                          {showAvatar && (
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center shadow-md">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                            </div>
                          )}
                        </div>
                      )}
                             <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[75%]`}>
                        <div
                          className={`rounded-3xl px-5 py-3.5 shadow-xl transition-all duration-300 hover:shadow-2xl transform hover:scale-[1.02] ${
                            isUser
                              ? 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white rounded-br-md shadow-blue-500/30'
                              : 'bg-white/90 backdrop-blur-sm text-gray-900 border border-gray-200/50 rounded-bl-md shadow-gray-200/50'
                          }`}
                        >
                          {isUser ? (
                            <p className="whitespace-pre-wrap break-words leading-relaxed text-[15px]">
                              {msg.content}
                            </p>
                          ) : (
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  // Style code blocks
                                  code: ({ node, inline, className, children, ...props }: any) => {
                                    return inline ? (
                                      <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                                        {children}
                                      </code>
                                    ) : (
                                      <code className="block bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto text-sm font-mono" {...props}>
                                        {children}
                                      </code>
                                    );
                                  },
                                  // Style pre blocks
                                  pre: ({ children }: any) => {
                                    return <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto my-2">{children}</pre>;
                                  },
                                  // Style paragraphs
                                  p: ({ children }: any) => {
                                    return <p className="mb-2 last:mb-0 leading-relaxed text-[15px]">{children}</p>;
                                  },
                                  // Style headings
                                  h1: ({ children }: any) => {
                                    return <h1 className="text-xl font-bold mb-2 mt-3 first:mt-0">{children}</h1>;
                                  },
                                  h2: ({ children }: any) => {
                                    return <h2 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h2>;
                                  },
                                  h3: ({ children }: any) => {
                                    return <h3 className="text-base font-semibold mb-2 mt-3 first:mt-0">{children}</h3>;
                                  },
                                  // Style lists
                                  ul: ({ children }: any) => {
                                    return <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>;
                                  },
                                  ol: ({ children }: any) => {
                                    return <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>;
                                  },
                                  li: ({ children }: any) => {
                                    return <li className="ml-2">{children}</li>;
                                  },
                                  // Style links
                                  a: ({ href, children }: any) => {
                                    return (
                                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                                        {children}
                                      </a>
                                    );
                                  },
                                  // Style blockquotes
                                  blockquote: ({ children }: any) => {
                                    return (
                                      <blockquote className="border-l-4 border-gray-300 pl-4 italic my-2 text-gray-700">
                                        {children}
                                      </blockquote>
                                    );
                                  },
                                  // Style tables
                                  table: ({ children }: any) => {
                                    return <table className="border-collapse border border-gray-300 my-2 w-full">{children}</table>;
                                  },
                                  th: ({ children }: any) => {
                                    return <th className="border border-gray-300 px-3 py-2 bg-gray-100 font-semibold text-left">{children}</th>;
                                  },
                                  td: ({ children }: any) => {
                                    return <td className="border border-gray-300 px-3 py-2">{children}</td>;
                                  },
                                  // Style horizontal rules
                                  hr: () => {
                                    return <hr className="my-4 border-gray-300" />;
                                  },
                                  // Style strong/bold
                                  strong: ({ children }: any) => {
                                    return <strong className="font-semibold">{children}</strong>;
                                  },
                                  // Style emphasis/italic
                                  em: ({ children }: any) => {
                                    return <em className="italic">{children}</em>;
                                  },
                                }}
                              >
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                          )}
                        </div>
                        <span className={`text-xs text-gray-500 mt-1.5 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
                          {messageDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </div>
                      {isUser && (
                        <div className={`flex-shrink-0 ${showAvatar ? 'w-10 h-10' : 'w-10 h-10 opacity-0'}`}>
                          {showAvatar && (
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center shadow-md">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            {isSending && (
              <div className="flex items-end gap-3 justify-start">
                <div className="flex-shrink-0 w-10 h-10">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center shadow-md">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-5 py-3 shadow-lg">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1.4s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '200ms', animationDuration: '1.4s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '400ms', animationDuration: '1.4s' }}></div>
                    </div>
                    <span className="text-xs text-gray-500 ml-1">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Area */}
      {currentConversation.status === 'active' && (
        <div className="relative z-10 bg-white/80 backdrop-blur-xl border-t border-gray-200/50 shadow-xl">
          <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-5 max-w-7xl">
            <form onSubmit={handleSend} className="flex items-end gap-3">
              <div className="flex-1 relative">
                <div className="relative bg-white/90 backdrop-blur-sm border-2 border-gray-200/50 rounded-3xl shadow-lg focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100/50 focus-within:shadow-blue-500/20 transition-all duration-300">
                  <textarea
                    ref={inputRef}
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      // Auto-resize textarea
                      e.target.style.height = 'auto';
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e);
                      }
                    }}
                    placeholder="Type your message..."
                    rows={1}
                    className="w-full px-5 py-4 pr-14 bg-transparent text-gray-900 placeholder-gray-400 resize-none focus:outline-none text-[15px] leading-relaxed"
                    style={{ minHeight: '52px', maxHeight: '120px' }}
                  />
                  <div className="absolute right-3 bottom-3 flex items-center gap-2">
                    <span className="text-xs text-gray-400 hidden sm:inline">
                      {message.trim().length > 0 && `${message.trim().length} chars`}
                    </span>
                           <button
                             type="submit"
                             disabled={!message.trim() || isSending}
                             className={`p-2.5 rounded-xl transition-all duration-300 shadow-lg transform ${
                               message.trim() && !isSending
                                 ? 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 hover:shadow-xl hover:shadow-blue-500/50 hover:scale-110 active:scale-95'
                                 : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                             }`}
                           >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                </div>
                       <p className="text-xs text-gray-400 mt-2 px-1 hidden sm:block">
                         Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 font-mono text-xs">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 font-mono text-xs">Shift + Enter</kbd> for new line
                       </p>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </SidebarLayout>
  );
}

