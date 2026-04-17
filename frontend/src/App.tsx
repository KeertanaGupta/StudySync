import { GoogleOAuthProvider } from '@react-oauth/google';
import Auth from './components/auth/Auth';
import { useAuthStore } from './store/authStore';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    // We wrap the whole app in the Google Provider here!
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      
      {/* If they are NOT logged in, show our amazing Landing Page */}
      {!isAuthenticated ? (
        <Auth />
      ) : (
        // Placeholder for now! We will build the Dashboard next
        <div className="min-h-screen flex items-center justify-center bg-green-300 font-bold text-3xl font-mono border-8 border-black text-center p-4">
          🎉 YOU ARE LOGGED IN!<br/>(Dashboard coming soon)
        </div>
      )}

    </GoogleOAuthProvider>
  );
}

export default App;