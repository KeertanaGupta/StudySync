import { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useAuthStore } from './store/authStore';
import { Landing } from './components/layout/Landing';
import { AuthCard } from './components/auth/AuthCard';
import { Onboarding } from './components/onboarding/Onboarding';
import { Dashboard } from './components/dashboard/dashboard';

// ✅ NEW IMPORTS
import { Routes, Route, useParams } from "react-router-dom";
import JoinSession from "./components/sessions/JoinSession";
import { Toaster } from 'sonner';

// ✅ WRAPPER (for dynamic id)
function JoinWrapper() {
  const { id } = useParams();
  return <JoinSession id={id!} />;
}

function App() {
  const { isAuthenticated, isProfileComplete, initialize } = useAuthStore();
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    initialize();
  }, []);

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <div className="app-wrapper">
        <Toaster richColors position="top-right" />
        
        {/* 1. NOT LOGGED IN */}
        {!isAuthenticated && (
          !showAuth ? (
            <Landing onLoginClick={() => setShowAuth(true)} />
          ) : (
            <div className="ob-container">
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
        {isAuthenticated && isProfileComplete && (
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/session/:id" element={<JoinWrapper />} />
          </Routes>
        )}

      </div>
    </GoogleOAuthProvider>
  );
}

export default App;