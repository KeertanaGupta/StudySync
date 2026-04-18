import { useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useAuthStore } from './store/authStore';
import { Landing } from './components/layout/Landing';
import { AuthCard } from './components/auth/AuthCard'; // Import your login card!
import { Onboarding } from './components/onboarding/Onboarding';
import { Dashboard } from './components/dashboard/dashboard';

function App() {
  const { isAuthenticated, isProfileComplete } = useAuthStore();
  const [showAuth, setShowAuth] = useState(false);

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <div className="app-wrapper">
        
        {/* 1. NOT LOGGED IN */}
        {!isAuthenticated && (
          !showAuth ? (
            <Landing onLoginClick={() => setShowAuth(true)} />
          ) : (
            <div className="ob-container">
               {/* This shows the Google Login Card */}
               <AuthCard /> 
               <button 
                 onClick={() => setShowAuth(false)} 
                 style={{marginTop: '20px', cursor: 'pointer', background: 'none', border: 'none', fontWeight: 'bold'}}
               >
                 ← Back to Home
               </button>
            </div>
          )
        )}

        {/* 2. LOGGED IN, INCOMPLETE PROFILE */}
        {isAuthenticated && !isProfileComplete && <Onboarding />}

        {/* 3. LOGGED IN & COMPLETE */}
        {isAuthenticated && isProfileComplete && <Dashboard />}

      </div>
    </GoogleOAuthProvider>
  );
}

export default App;