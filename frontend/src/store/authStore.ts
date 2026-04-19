import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  user: any | null;
  initialize: () => Promise<void>;
  login: (data: any) => void;
  logout: () => void;
  markProfileComplete: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: !!localStorage.getItem('access_token'),
  isProfileComplete: localStorage.getItem('is_profile_complete') === 'true',
  user: null,

  initialize: async () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/user/profile/', {
          headers: { 'Authorization': `Token ${token}` }
        });
        if (response.ok) {
          const profile = await response.json();
          const isComplete = Boolean(profile.is_profile_complete);
          localStorage.setItem('is_profile_complete', String(isComplete));
          set({ isProfileComplete: isComplete, user: profile });
        }
      } catch (err) {
        console.error("Init sync failed", err);
      }
    }
  },

  login: async (data: any) => {
    // 1. Unpack the object (Handle both JWT 'access' and DRF 'key')
    const token = data.access || data.key;

    if (typeof token === 'string') {
      // Save the token immediately so our fetch request works
      localStorage.setItem('access_token', token);

      // 🚨 2. THE FIX: Immediately ping Django for the REAL database status
      try {
        const response = await fetch('http://127.0.0.1:8000/api/user/profile/', {
          headers: { 'Authorization': `Token ${token}` } // (Change to Bearer if using JWT)
        });

        if (response.ok) {
          const profile = await response.json();
          const isComplete = Boolean(profile.is_profile_complete);

          localStorage.setItem('is_profile_complete', String(isComplete));

          // 3. Update state with the absolute truth from the database
          set({
            isAuthenticated: true,
            user: profile,
            isProfileComplete: isComplete
          });

          console.log(`✅ Google Login Verified. DB Status: Complete=${isComplete}`);
        } else {
          // Fallback if the profile fetch fails for some reason
          console.warn("⚠️ Could not fetch profile on login, defaulting to incomplete.");
          set({ isAuthenticated: true, user: data.user || null, isProfileComplete: false });
        }
      } catch (err) {
        console.error("❌ Login sync failed", err);
        set({ isAuthenticated: true, user: data.user || null, isProfileComplete: false });
      }

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