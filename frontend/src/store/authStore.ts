import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  user: any | null;
  login: (token: string, user: any) => void;
  logout: () => void;
  markProfileComplete: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: !!localStorage.getItem('access_token'),
  isProfileComplete: localStorage.getItem('is_profile_complete') === 'true',
  user: null,
  
  login: (token, user) => {
    localStorage.setItem('access_token', token);
    const isComplete = user?.is_profile_complete === true;
    localStorage.setItem('is_profile_complete', String(isComplete));
    
    set({ 
      isAuthenticated: true, 
      user,
      isProfileComplete: isComplete
    });
  },
  
  markProfileComplete: () => {
    localStorage.setItem('is_profile_complete', 'true');
    set({ isProfileComplete: true });
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('is_profile_complete');
    set({ isAuthenticated: false, isProfileComplete: false, user: null });
  },
}));