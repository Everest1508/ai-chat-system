import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import conversationReducer from '../features/conversations/conversationSlice';
import uiReducer from '../features/ui/uiSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      conversations: conversationReducer,
      ui: uiReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          // Ignore these action types
          ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        },
      }),
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

