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
  
  login: (data: any) => {
    // 1. Unpack the object
    const token = data.access; 
    const user = data.user;
    const isComplete = Boolean(data.is_profile_complete); 

    // 2. Safety Check: Only save it if it's a real string
    if (typeof token === 'string') {
      localStorage.setItem('access_token', token);
      localStorage.setItem('is_profile_complte', String(isComplete));
      
      set({ 
        isAuthenticated: true, 
        user: user,
        isProfileComplete: isComplete 
      });
      
      console.log("✅ Store Updated Properly!");
    } else {
      console.error("❌ Token Extraction Failed. Received:", data);
    }
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