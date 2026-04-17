import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
    <path fill="#FF3D00" d="M6.3 14.1l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.1z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.2 0-9.6-3.1-11.3-7.6l-6.5 5C9.6 39.6 16.3 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2C40.9 35.5 44 30.2 44 24c0-1.2-.1-2.3-.4-3.5z"/>
  </svg>
);

export const AuthCard = () => {
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      setStatus(null);
      
      try {
        const res = await axios.post('http://localhost:8000/api/auth/google/', {
          access_token: tokenResponse.access_token, 
        });
        
        if (res.data.refresh) {
          localStorage.setItem('refresh_token', res.data.refresh);
        }
        
        login(res.data.access, res.data.user || { email: "Logged in via Google" });
        
      } catch (error) {
        console.error('Login Failed:', error);
        setStatus('Login failed. Ensure Django is running!');
        setIsLoading(false);
      }
    },
    onError: () => {
      setStatus('Google Login Widget Closed/Failed');
      setIsLoading(false);
    },
  });

  return (
    <div className="flex flex-col gap-4 text-center">
      <h2 className="text-3xl font-black text-black uppercase mb-2">Welcome Back</h2>
      <p className="font-bold text-gray-600 mb-6">Sign in to find your perfect study group.</p>

      <button 
        type="button" 
        onClick={() => handleGoogleLogin()}
        disabled={isLoading}
        className="bg-white border-4 border-black text-black font-bold uppercase px-6 py-4 rounded-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex justify-center items-center gap-3 disabled:opacity-70 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
      >
        {isLoading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-4 border-black border-t-transparent" />
        ) : (
          <GoogleIcon />
        )}
        {isLoading ? "Authenticating..." : "Continue with Google"}
      </button>

      {status && (
        <p className="text-sm font-bold text-red-600 mt-4 animate-pulse">
          {status}
        </p>
      )}
    </div>
  );
};