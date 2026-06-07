import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  createdAt?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoggedIn: boolean;
  login: (token: string, user?: User) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isLoggedIn: false,
      login: (token: string, user?: User) => set({ token, isLoggedIn: true, ...(user ? { user } : {}) }),
      setUser: (user: User) => set({ user }),
      logout: () => set({ token: null, user: null, isLoggedIn: false }),
    }),
    {
      name: 'pr-auth-storage',
    }
  )
);
