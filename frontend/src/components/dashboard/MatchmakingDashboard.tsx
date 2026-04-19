import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

export const MatchmakingDashboard = () => {
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const token = localStorage.getItem('access_token');
        // This hits Django (8000), which queries Postgres, then asks FastAPI (8001) for the math!
        const res = await axios.get('http://localhost:8000/api/matchmaking/', {
          headers: { 'Authorization': `Token ${token}` }
        });
        
        setMatches(res.data.matches);
      } catch (err) {
        toast.error("Failed to power up the Matchmaker AI.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchMatches();
  }, []);

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '2.5rem', fontWeight: 900, borderBottom: '4px solid #000', paddingBottom: '10px' }}>
        AI Partner Math 🧬
      </h2>
      
      {isLoading ? (
        <h3 style={{ animation: 'pulse 1.5s infinite' }}>Analyzing user embeddings...</h3>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
          {matches.map((match, idx) => (
            <div key={idx} style={{ border: '4px solid #000', padding: '20px', borderRadius: '12px', background: '#fffceb', boxShadow: '6px 6px 0 #000' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>User ID: {match.matched_user_id}</h3>
                <div style={{ background: '#22c55e', color: '#fff', padding: '5px 15px', fontWeight: 'bold', borderRadius: '20px', border: '2px solid #000' }}>
                  {match.compatibility_score}% Match
                </div>
              </div>
              <button style={{ marginTop: '20px', width: '100%', padding: '10px', background: '#000', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
                CONNECT
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};