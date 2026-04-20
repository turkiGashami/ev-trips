import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';
import { User } from '../types';

const storage = new MMKV({ id: 'ev-trips-auth' });

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  updateUser: (updates: Partial<User>) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,

  loadFromStorage: () => {
    try {
      const userJson = storage.getString('user');
      const accessToken = storage.getString('accessToken');
      const refreshToken = storage.getString('refreshToken');
      if (userJson && accessToken && refreshToken) {
        set({
          user: JSON.parse(userJson),
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      }
    } catch {
      // ignore
    }
  },

  setAuth: (user, accessToken, refreshToken) => {
    storage.set('user', JSON.stringify(user));
    storage.set('accessToken', accessToken);
    storage.set('refreshToken', refreshToken);
    set({ user, accessToken, refreshToken, isAuthenticated: true });
  },

  updateUser: (updates) =>
    set((state) => {
      const updated = state.user ? { ...state.user, ...updates } : null;
      if (updated) storage.set('user', JSON.stringify(updated));
      return { user: updated };
    }),

  setTokens: (accessToken, refreshToken) => {
    storage.set('accessToken', accessToken);
    storage.set('refreshToken', refreshToken);
    set({ accessToken, refreshToken });
  },

  logout: () => {
    storage.delete('user');
    storage.delete('accessToken');
    storage.delete('refreshToken');
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },
}));
