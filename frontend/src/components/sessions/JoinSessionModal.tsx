import React, { useState } from 'react';
import SessionList from './SessionList';
import { createSession } from '../../services/sessionApi';
import { Video, X, Zap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface JoinSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (id: number) => void;
  userName: string;
}

export const JoinSessionModal: React.FC<JoinSessionModalProps> = ({ isOpen, onClose, onJoin, userName }) => {
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleInstantSession = async () => {
    setIsCreating(true);
    try {
      const now = new Date();
      const res = await createSession({
        title: `Instant Session: ${userName}`,
        topic: "General Study",
        description: "Quick-start session for immediate coordination.",
        scheduled_time: now.toISOString(),
        duration: 60,
        invited_members: []
      });
      toast.success("Instant session created!");
      onJoin(res.data.id);
    } catch (err) {
      toast.error("Failed to start instant session");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000001,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(5px)', padding: '20px'
    }}>
      <div className="neo-card" style={{ 
        width: '100%', maxWidth: '600px', background: '#fffceb', 
        padding: '30px', position: 'relative', overflow: 'hidden' 
      }}>
        <button onClick={onClose} style={{ 
          position: 'absolute', top: '15px', right: '15px', 
          background: 'none', border: 'none', cursor: 'pointer', color: '#000' 
        }}>
          <X size={24} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
          <div style={{ background: '#000', padding: '10px', borderRadius: '10px', color: '#fff' }}>
            <Video size={24} />
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0 }}>Join a Session</h2>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <div style={{ fontWeight: 900, fontSize: '0.9rem', color: '#64748b', marginBottom: '15px', textTransform: 'uppercase' }}>
            Pending Sessions
          </div>
          <div style={{ maxHeight: '300px', overflowY: 'auto', border: '3px solid black', padding: '10px', background: '#fff', borderRadius: '8px' }}>
            <SessionList onJoin={onJoin} />
          </div>
        </div>

        <div style={{ borderTop: '3px dashed black', paddingTop: '20px' }}>
          <button 
            onClick={handleInstantSession}
            disabled={isCreating}
            className="neo-btn" 
            style={{ 
              width: '100%', padding: '15px', background: '#bbf7d0', 
              color: '#000', fontWeight: 900, display: 'flex', 
              alignItems: 'center', justifyContent: 'center', gap: '10px' 
            }}
          >
            {isCreating ? <Loader2 className="animate-spin" /> : <Zap size={20} />}
            {isCreating ? 'CREATING...' : 'START INSTANT SESSION'}
          </button>
          <p style={{ textAlign: 'center', fontSize: '0.75rem', marginTop: '10px', opacity: 0.6, fontWeight: 'bold' }}>
            Launch a quick room and invite friends later.
          </p>
        </div>
      </div>
    </div>
  );
};
