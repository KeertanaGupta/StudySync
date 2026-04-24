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
        <div className="form-row" style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 900, marginBottom: '10px', textTransform: 'uppercase', fontSize: '0.85rem' }}>Room Title</label>
            <input 
              className="neo-input"
              style={{ width: '100%', padding: '15px', background: 'var(--white)', color: 'var(--neo-black)' }}
              placeholder="e.g. Quantum Physics Review"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 900, marginBottom: '10px', textTransform: 'uppercase', fontSize: '0.85rem' }}>Specific Topic</label>
            <input 
              className="neo-input"
              style={{ width: '100%', padding: '15px', background: 'var(--white)', color: 'var(--neo-black)' }}
              placeholder="e.g. Schrödinger Equation"
              value={formData.topic}
              onChange={(e) => setFormData({...formData, topic: e.target.value})}
            />
          </div>
        </div>

        <div className="form-row" style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 900, marginBottom: '10px', textTransform: 'uppercase', fontSize: '0.85rem' }}>Start Time</label>
            <div style={{ position: 'relative' }}>
              <Calendar style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} size={20} />
              <input 
                type="datetime-local"
                className="neo-input"
                style={{ width: '100%', padding: '15px 15px 15px 45px', background: 'var(--white)', color: 'var(--neo-black)' }}
                value={formData.scheduled_time}
                onChange={(e) => setFormData({...formData, scheduled_time: e.target.value})}
              />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 900, marginBottom: '10px', textTransform: 'uppercase', fontSize: '0.85rem' }}>Duration (Mins)</label>
            <div style={{ position: 'relative' }}>
              <Clock style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} size={20} />
              <input 
                type="number"
                className="neo-input"
                style={{ width: '100%', padding: '15px 15px 15px 45px', background: 'var(--white)', color: 'var(--neo-black)' }}
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
              />
            </div>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 900, marginBottom: '15px', textTransform: 'uppercase', fontSize: '0.85rem' }}>Invite Friends to Join</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
            {friends.map(friend => {
              const isSelected = formData.invited_members.includes(friend.id);
              return (
                <button 
                  key={friend.id}
                  onClick={() => toggleInvite(friend.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 20px',
                    background: isSelected ? 'var(--neo-black)' : 'var(--white)',
                    color: isSelected ? 'var(--white)' : 'var(--neo-black)',
                    border: '3px solid var(--neo-black)',
                    borderRadius: '12px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    boxShadow: isSelected ? 'none' : '4px 4px 0 var(--neo-black)',
                    transform: isSelected ? 'translate(4px, 4px)' : 'none',
                    transition: 'all 0.1s'
                  }}
                >
                  <div style={{
                    width: '30px', height: '30px', borderRadius: '8px', 
                    background: friend.avatar_color, display: 'flex', alignItems: 'center', 
                    justifyContent: 'center', fontSize: '1rem', border: '2px solid var(--neo-black)',
                    color: '#000'
                  }}>
                    {friend.name[0]}
                  </div>
                  {friend.username}
                </button>
              );
            })}
            {friends.length === 0 && (
              <p style={{ opacity: 0.6, fontStyle: 'italic', fontWeight: 'bold' }}>You don't have any study buddies to invite yet.</p>
            )}
          </div>
        </div>

        <button 
          className="neo-btn"
          style={{
            width: '100%', padding: '20px', marginTop: '20px',
            background: '#bbf7d0',
            color: '#0f172a',
            fontSize: '1.2rem', justifyContent: 'center'
          }}
          onClick={handleCreate}
          disabled={loading}
        >
          {loading ? 'Creating Matrix...' : (
            <>
               <Shield size={24} />
               Launch Multi-User Session
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CreateSession;