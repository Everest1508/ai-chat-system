'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { restoreSession, fetchUser } from '@/features/auth/authSlice';

export default function SessionRestore() {
  const dispatch = useAppDispatch();
  const { token, isAuthenticated, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Restore session from localStorage
    dispatch(restoreSession());
  }, [dispatch]);

  useEffect(() => {
    // If authenticated but no user data, fetch user
    if (isAuthenticated && token && !user) {
      dispatch(fetchUser());
    }
  }, [isAuthenticated, token, user, dispatch]);

  return null; // This component doesn't render anything
}

