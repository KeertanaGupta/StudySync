import { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useAuthStore } from './store/authStore';
import { Landing } from './components/layout/Landing';
import { AuthCard } from './components/auth/AuthCard';
import { Onboarding } from './components/onboarding/Onboarding';
import { Dashboard } from './components/dashboard/dashboard';

// ✅ NEW IMPORTS
import { Routes, Route, useParams, Navigate } from "react-router-dom";
import JoinSession from "./components/sessions/JoinSession";
import { Busted } from "./components/Busted";
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

  useEffect(() => {
    if (isAuthenticated) {
      setShowAuth(false);
    }
  }, [isAuthenticated]);

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <div className="app-wrapper">
        <Toaster richColors position="top-right" />

        <Routes>
          {/* Root Route: Landing Page or Onboarding */}
          <Route path="/" element={
            isAuthenticated ? (
              isProfileComplete ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Onboarding />
              )
            ) : (
              !showAuth ? (
                <Landing onLoginClick={() => setShowAuth(true)} />
              ) : (
                <div className="ob-container">
                  <AuthCard />
                  <button
                    onClick={() => setShowAuth(false)}
                    style={{ marginTop: '20px', cursor: 'pointer', background: 'none', border: 'none', fontWeight: 'bold' }}
                  >
                    ← Back to Home
                  </button>
                </div>
              )
            )
          } />

          {/* Dashboard Route */}
          <Route path="/dashboard" element={
            isAuthenticated ? (
              isProfileComplete ? (
                <Dashboard />
              ) : (
                <Navigate to="/" replace />
              )
            ) : (
              <Navigate to="/" replace />
            )
          } />

          {/* Session Route */}
          <Route path="/session/:id" element={
            isAuthenticated && isProfileComplete ? (
              <JoinWrapper />
            ) : (
              <Navigate to="/" replace />
            )
          } />

          {/* Busted Route */}
          <Route path="/busted" element={
            isAuthenticated && isProfileComplete ? (
              <Busted />
            ) : (
              <Navigate to="/" replace />
            )
          } />

          {/* Catch-all: Redirect to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

      </div>
    </GoogleOAuthProvider>
  );
}

export default App;