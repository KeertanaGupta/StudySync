import React, { useState, useEffect } from 'react';
import { createSession, getFriends, getGroups } from '../../services/sessionApi';
import { Video, Calendar, Clock, Users, Shield } from 'lucide-react';
import { toast } from 'sonner';

const CreateSession: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    topic: '',
    description: '',
    scheduled_time: '',
    duration: 60,
    group: '',
    invited_members: [] as number[]
  });

  useEffect(() => {
    fetchdata();
  }, []);

  const fetchdata = async () => {
    try {
      const [fRes, gRes] = await Promise.all([getFriends(), getGroups()]);
      setFriends(fRes.data);
      setGroups(gRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.scheduled_time) {
      toast.error("Please fill in title and time");
      return;
    }
    setLoading(true);
    try {
      // Create session
      const res = await createSession({
        ...formData,
        group: formData.group || null
      });
      
      toast.success("Study session created! Waiting for friends...");
      onSuccess();
    } catch (error) {
       toast.error("Failed to create session");
    } finally {
      setLoading(false);
    }
  };

  const toggleInvite = (id: number) => {
    const current = [...formData.invited_members];
    if (current.includes(id)) {
      setFormData({...formData, invited_members: current.filter(fid => fid !== id)});
    } else {
      setFormData({...formData, invited_members: [...current, id]});
    }
  };

  return (
    <div className="neo-card" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{
          width: '80px', height: '80px', background: 'var(--neo-black)', color: 'var(--white)',
          borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', boxShadow: '4px 4px 0 var(--neo-black)', border: '3px solid var(--neo-black)'
        }}>
          <Video size={40} />
        </div>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'Outfit', marginBottom: '10px' }}>Host Live Session</h2>
        <p style={{ color: 'var(--neo-black)', opacity: 0.8, fontWeight: 'bold' }}>Create a multi-user room for coordinated learning.</p>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        {/* Row 1: Title and Topic */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '24px',
          width: '100%'
        }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="stat-label" style={{ color: 'var(--neo-black)', fontSize: '0.8rem', marginBottom: '10px', display: 'block', textTransform: 'uppercase' }}>Room Title</label>
            <input 
              className="neo-input"
              style={{ width: '100%', boxSizing: 'border-box', background: 'var(--neo-white)' }}
              placeholder="e.g. Quantum Physics Review"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="stat-label" style={{ color: 'var(--neo-black)', fontSize: '0.8rem', marginBottom: '10px', display: 'block', textTransform: 'uppercase' }}>Specific Topic</label>
            <input 
              className="neo-input"
              style={{ width: '100%', boxSizing: 'border-box', background: 'var(--neo-white)' }}
              placeholder="e.g. Schrödinger Equation"
              value={formData.topic}
              onChange={(e) => setFormData({...formData, topic: e.target.value})}
            />
          </div>
        </div>

        {/* Row 2: Time and Duration */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '24px',
          width: '100%'
        }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="stat-label" style={{ color: 'var(--neo-black)', fontSize: '0.8rem', marginBottom: '10px', display: 'block', textTransform: 'uppercase' }}>Start Time</label>
            <div style={{ position: 'relative' }}>
              <Calendar style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.6 }} size={18} />
              <input 
                type="datetime-local"
                className="neo-input"
                style={{ width: '100%', boxSizing: 'border-box', paddingLeft: '45px', background: 'var(--neo-white)' }}
                value={formData.scheduled_time}
                onChange={(e) => setFormData({...formData, scheduled_time: e.target.value})}
              />
            </div>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="stat-label" style={{ color: 'var(--neo-black)', fontSize: '0.8rem', marginBottom: '10px', display: 'block', textTransform: 'uppercase' }}>Duration (Mins)</label>
            <div style={{ position: 'relative' }}>
              <Clock style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.6 }} size={18} />
              <input 
                type="number"
                className="neo-input"
                style={{ width: '100%', boxSizing: 'border-box', paddingLeft: '45px', background: 'var(--neo-white)' }}
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="stat-label" style={{ color: 'var(--neo-black)', fontSize: '0.8rem', marginBottom: '15px', display: 'block', textTransform: 'uppercase' }}>Invite Friends to Join</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {friends.map(friend => {
              const isSelected = formData.invited_members.includes(friend.id);
              return (
                <button 
                  key={friend.id}
                  onClick={() => toggleInvite(friend.id)}
                  className={`neo-btn ${isSelected ? 'primary' : ''}`}
                  style={{
                    padding: '8px 15px',
                    borderRadius: '10px',
                    fontSize: '0.9rem'
                  }}
                >
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '6px', 
                    background: friend.avatar_color || '#bae6fd', display: 'flex', alignItems: 'center', 
                    justifyContent: 'center', fontSize: '0.8rem', border: '1px solid var(--neo-black)',
                    color: '#000', fontWeight: 900
                  }}>
                    {friend.name?.[0] || friend.username[0]}
                  </div>
                  {friend.username}
                </button>
              );
            })}
            {friends.length === 0 && (
              <p style={{ opacity: 0.6, fontSize: '0.9rem', fontWeight: 700 }}>You don't have any study buddies to invite yet.</p>
            )}
          </div>
        </div>

        <button 
          className="neo-btn primary animate-in slide-in-from-bottom-2"
          style={{
            width: '100%', padding: '18px', marginTop: '10px',
            fontSize: '1.1rem', justifyContent: 'center',
            background: '#bbf7d0' /* Light Green */
          }}
          onClick={handleCreate}
          disabled={loading}
        >
          {loading ? 'SYNCING MATRIX...' : (
            <>
               <Shield size={22} />
               Launch Multi-User Session
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CreateSession;