import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '@/lib/api';

export interface Message {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  token_count?: number;
}

export interface Conversation {
  id: number;
  title?: string;
  status: 'active' | 'ended';
  created_at: string;
  updated_at: string;
  ended_at?: string;
  summary?: string;
  summary_preview?: string;
  key_topics?: string[];
  sentiment?: string;
  message_count: number;
  duration_minutes?: number;
  messages?: Message[];
  last_message?: {
    role: string;
    content: string;
    created_at: string;
  };
}

export interface ConversationState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  isLoading: boolean;
  error: string | null;
  totalCount: number;
}

const initialState: ConversationState = {
  conversations: [],
  currentConversation: null,
  isLoading: false,
  error: null,
  totalCount: 0,
};

// Async thunks
export const fetchConversations = createAsyncThunk(
  'conversations/fetchAll',
  async (params?: { page?: number; status?: string; search?: string }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.search) queryParams.append('search', params.search);
      
      const queryString = queryParams.toString();
      const endpoint = queryString ? `/conversations/?${queryString}` : '/conversations/';
      
      const response = await apiClient.get<{
        count: number;
        next: string | null;
        previous: string | null;
        results: Conversation[];
      }>(endpoint);
      
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch conversations');
    }
  }
);

export const fetchConversation = createAsyncThunk(
  'conversations/fetchOne',
  async (id: number, { rejectWithValue }) => {
    try {
      const conversation = await apiClient.get<Conversation>(`/conversations/${id}/`);
      return conversation;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch conversation');
    }
  }
);

export const createConversation = createAsyncThunk(
  'conversations/create',
  async (data: { title?: string; initial_message?: string }, { rejectWithValue }) => {
    try {
      const conversation = await apiClient.post<Conversation>('/conversations/', data);
      return conversation;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create conversation');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'conversations/sendMessage',
  async (
    { conversationId, message }: { conversationId: number; message: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.post<{
        user_message: Message;
        assistant_message: Message;
        tokens_used: number;
        processing_time_ms: number;
        total_tokens_used: number;
      }>(`/conversations/${conversationId}/chat/`, { message });
      return { conversationId, ...response };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to send message');
    }
  }
);

export const endConversation = createAsyncThunk(
  'conversations/end',
  async (
    { id, generate_summary = true, analysis_depth = 'detailed' }: {
      id: number;
      generate_summary?: boolean;
      analysis_depth?: 'basic' | 'detailed' | 'comprehensive';
    },
    { rejectWithValue }
  ) => {
    try {
      const conversation = await apiClient.post<Conversation>(
        `/conversations/${id}/end/`,
        { generate_summary, analysis_depth }
      );
      return conversation;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to end conversation');
    }
  }
);

export const generateSummary = createAsyncThunk(
  'conversations/generateSummary',
  async (
    { id, analysis_depth = 'detailed' }: {
      id: number;
      analysis_depth?: 'basic' | 'detailed' | 'comprehensive';
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.post<{
        message: string;
        summary: string;
        key_topics: string[];
        sentiment: string;
      }>(`/conversations/${id}/generate-summary/`, { analysis_depth });
      return { id, ...response };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to generate summary');
    }
  }
);

export const updateConversation = createAsyncThunk(
  'conversations/update',
  async (
    { id, data }: { id: number; data: { title?: string } },
    { rejectWithValue }
  ) => {
    try {
      const conversation = await apiClient.patch<Conversation>(`/conversations/${id}/`, data);
      return conversation;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update conversation');
    }
  }
);

export const deleteConversation = createAsyncThunk(
  'conversations/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/conversations/${id}/`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete conversation');
    }
  }
);

const conversationSlice = createSlice({
  name: 'conversations',
  initialState,
  reducers: {
    setCurrentConversation: (state, action: PayloadAction<Conversation | null>) => {
      state.currentConversation = action.payload;
    },
    addMessage: (state, action: PayloadAction<{ conversationId: number; message: Message }>) => {
      if (state.currentConversation?.id === action.payload.conversationId) {
        if (!state.currentConversation.messages) {
          state.currentConversation.messages = [];
        }
        state.currentConversation.messages.push(action.payload.message);
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch conversations
      .addCase(fetchConversations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.conversations = action.payload.results;
        state.totalCount = action.payload.count;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch single conversation
      .addCase(fetchConversation.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchConversation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentConversation = action.payload;
      })
      .addCase(fetchConversation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create conversation
      .addCase(createConversation.fulfilled, (state, action) => {
        state.conversations.unshift(action.payload);
        state.currentConversation = action.payload;
      })
      // Send message
      .addCase(sendMessage.fulfilled, (state, action) => {
        if (state.currentConversation?.id === action.payload.conversationId) {
          if (!state.currentConversation.messages) {
            state.currentConversation.messages = [];
          }
          state.currentConversation.messages.push(action.payload.user_message);
          state.currentConversation.messages.push(action.payload.assistant_message);
          state.currentConversation.message_count = state.currentConversation.messages.length;
        }
      })
      // End conversation
      .addCase(endConversation.fulfilled, (state, action) => {
        const index = state.conversations.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.conversations[index] = action.payload;
        }
        if (state.currentConversation?.id === action.payload.id) {
          state.currentConversation = action.payload;
        }
      })
      // Generate summary
      .addCase(generateSummary.fulfilled, (state, action) => {
        const index = state.conversations.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.conversations[index].summary = action.payload.summary;
          state.conversations[index].key_topics = action.payload.key_topics;
          state.conversations[index].sentiment = action.payload.sentiment;
        }
        if (state.currentConversation?.id === action.payload.id) {
          state.currentConversation.summary = action.payload.summary;
          state.currentConversation.key_topics = action.payload.key_topics;
          state.currentConversation.sentiment = action.payload.sentiment;
        }
      })
      // Update conversation
      .addCase(updateConversation.fulfilled, (state, action) => {
        const index = state.conversations.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.conversations[index] = action.payload;
        }
        if (state.currentConversation?.id === action.payload.id) {
          state.currentConversation = action.payload;
        }
      })
      // Delete conversation
      .addCase(deleteConversation.fulfilled, (state, action) => {
        state.conversations = state.conversations.filter((c) => c.id !== action.payload);
        if (state.currentConversation?.id === action.payload) {
          state.currentConversation = null;
        }
      });
  },
});

export const { setCurrentConversation, addMessage, clearError } = conversationSlice.actions;
export default conversationSlice.reducer;

