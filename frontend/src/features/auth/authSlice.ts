import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '@/lib/api';

export interface User {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  date_joined?: string;
  profile?: UserProfile;
}

export interface UserProfile {
  id: number;
  preferred_provider: 'gemini' | 'groq' | 'cohere';
  preferred_gemini_model?: string;
  preferred_groq_model?: string;
  preferred_cohere_model?: string;
  has_custom_api_key: boolean;
  has_gemini_key: boolean;
  has_groq_key: boolean;
  has_cohere_key: boolean;
  total_tokens_used: number;
  total_conversations: number;
  total_messages: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Load initial state from localStorage
const getInitialState = (): AuthState => {
  if (typeof window === 'undefined') {
    return {
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    };
  }

  const token = localStorage.getItem('access_token');
  return {
    user: null,
    token: token,
    isAuthenticated: !!token,
    isLoading: false,
    error: null,
  };
};

const initialState: AuthState = getInitialState();

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { username: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<{ access: string; refresh: string }>(
        '/auth/token/',
        credentials
      );
      apiClient.setToken(response.access);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: {
    username: string;
    email: string;
    password: string;
    password2: string;
    first_name?: string;
    last_name?: string;
  }, { rejectWithValue }) => {
    try {
      const user = await apiClient.post<User>('/users/register/', userData);
      return user;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Registration failed');
    }
  }
);

export const fetchUser = createAsyncThunk(
  'auth/fetchUser',
  async (_, { rejectWithValue }) => {
    try {
      const user = await apiClient.get<User>('/users/me/');
      return user;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch user');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  apiClient.setToken(null);
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<string | null>) => {
      state.token = action.payload;
      state.isAuthenticated = !!action.payload;
      apiClient.setToken(action.payload);
      // Store in localStorage
      if (typeof window !== 'undefined') {
        if (action.payload) {
          localStorage.setItem('access_token', action.payload);
        } else {
          localStorage.removeItem('access_token');
        }
      }
    },
    restoreSession: (state) => {
      // This will be called by a component on mount
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token');
        if (token) {
          state.token = token;
          state.isAuthenticated = true;
          apiClient.setToken(token);
        }
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.access;
        state.isAuthenticated = true;
        state.error = null;
        // Store token in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', action.payload.access);
        }
        // Fetch user data after successful login
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.token = null;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch user
      .addCase(fetchUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        // Remove token from localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
        }
      });
  },
});

export const { setToken, clearError, restoreSession } = authSlice.actions;
export default authSlice.reducer;

