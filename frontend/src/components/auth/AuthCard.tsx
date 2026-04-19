import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import './AuthCard.css'; // Make sure the path is correct!

export const AuthCard = ({ onBack }: { onBack?: () => void }) => {
  const login = useAuthStore((s) => s.login);

  // 🧠 Your existing logic stays exactly the same!
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await axios.post('http://localhost:8000/api/auth/google/', {
          access_token: tokenResponse.access_token,
        });

        if (res.data.refresh) {
          localStorage.setItem('refresh_token', res.data.refresh);
        }

        // Passing the whole object to Zustand, just like we fixed earlier
        login(res.data);

      } catch (error) {
        console.error('Login Failed:', error);
        alert('Login failed. Ensure Django is running!');
      }
    },
    onError: () => {
      console.log('Google Login Widget Closed/Failed');
    },
    // 🚨 THIS IS THE NEW LINE! 🚨
    // We are explicitly asking Google for permission to read their calendar events.
    scope: 'openid email profile https://www.googleapis.com/auth/calendar.readonly',
  });

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-header">Welcome Back</h1>
        <p className="auth-subtitle">Sign in to find your perfect study group.</p>

        {/* 🚀 Our newly styled custom button triggering the Google hook */}
        <button className="neo-google-btn" onClick={() => googleLogin()}>
          {/* A clean, standard Google SVG icon */}
          <svg className="google-icon" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>

        {/* Back button mapping back to your Landing page */}
        {/* <button className="back-link" onClick={onBack}>
          ← Back to Home
        </button> */}
      </div>
    </div>
  );
};