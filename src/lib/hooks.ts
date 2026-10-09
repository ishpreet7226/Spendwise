'use client';
import { useState, useEffect, useCallback } from 'react';
import { AppState } from './types';
import { getState } from './store';

export function useStore() {
  const [state, setState] = useState<AppState>(() => {
    if (typeof window === 'undefined') {
      return {
        users: [],
        groups: [],
        expenses: [],
        settlements: [],
        activities: [],
        settings: {
          currentUserId: 'user-1',
          currency: 'INR',
          theme: 'light',
          notifications: true,
          userName: '',
          userEmail: '',
          userAvatarColor: '#E9785B',
        },
      } as AppState;
    }
    return getState();
  });

  useEffect(() => {
    setState(getState());
    const handler = () => setState(getState());
    window.addEventListener('spendwise-update', handler);
    return () => window.removeEventListener('spendwise-update', handler);
  }, []);

  const refresh = useCallback(() => setState(getState()), []);

  return { state, refresh };
}

