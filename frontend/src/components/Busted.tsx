import { useNavigate } from 'react-router-dom';

export const Busted = () => {
  const navigate = useNavigate();
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0,
      width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', 
      alignItems: 'center', justifyContent: 'center', backgroundColor: '#ef4444', 
      color: 'white', fontFamily: 'monospace', zIndex: 9999999
    }}>
      <h1 style={{ fontSize: '4rem', fontWeight: 900, textShadow: '4px 4px 0 #000', textAlign: 'center' }}>
        🚨 TEST TERMINATED 🚨
      </h1>
      <p style={{ fontSize: '1.5rem', fontWeight: 'bold', background: '#000', padding: '10px 20px', marginTop: '20px', textAlign: 'center' }}>
        You have exceeded the maximum allowed violations (3).
      </p>
      <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#000', marginTop: '10px', textAlign: 'center' }}>
        (Tab switching or cell phone usage detected)
      </p>
      <div style={{ marginTop: '40px' }}>
        <button 
          onClick={() => navigate('/')}
          style={{ background: '#000', color: '#fff', border: '4px solid #000', padding: '15px 40px', fontWeight: 900, fontSize: '1.2rem', cursor: 'pointer', boxShadow: '6px 6px 0 #000' }}
        >
          RETURN TO DASHBOARD
        </button>
      </div>
    </div>
  );
};
