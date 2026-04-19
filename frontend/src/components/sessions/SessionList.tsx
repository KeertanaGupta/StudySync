import { useEffect, useState } from "react";
import { getSessions } from "../../services/sessionApi";
import { Video, Clock, User } from "lucide-react";

interface SessionListProps {
  onJoin?: (id: number) => void;
}

export default function SessionList({ onJoin }: SessionListProps) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await getSessions();
      setSessions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p style={{ opacity: 0.5 }}>Loading sessions...</p>;
  if (sessions.length === 0) return <p style={{ opacity: 0.5 }}>No active sessions at the moment.</p>;

  return (
    <div className="session-stack" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      {sessions.map((s) => (
        <div key={s.id} className="session-item-clean" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '10px',
          borderBottom: '1px solid rgba(0,0,0,0.05)'
        }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: '1rem' }}>{s.title}</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.6, display: 'flex', gap: '10px', marginTop: '4px' }}>
               <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Video size={12}/> {s.topic}</span>
               <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12}/> {s.duration} min</span>
               <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={12}/> {s.creator?.username}</span>
            </div>
          </div>
          <button 
            className="neo-btn small primary"
            onClick={() => onJoin ? onJoin(s.id) : (window.location.href = `/session/${s.id}`)}
          >
            JOIN LIVE
          </button>
        </div>
      ))}
    </div>
  );
}