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
    <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-50 border border-slate-100 max-w-2xl mx-auto">
      <div className="mb-10 text-center">
        <div className="bg-indigo-600 w-16 h-16 rounded-3xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-indigo-200">
          <Video size={30} />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-2">Host Live Session</h2>
        <p className="text-slate-500 font-medium">Create a multi-user room for coordinated learning.</p>
      </div>
      
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Room Title</label>
            <input 
              className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold text-slate-700 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
              placeholder="e.g. Quantum Physics Review"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Specific Topic</label>
            <input 
              className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold text-slate-700 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
              placeholder="e.g. Schrödinger Equation"
              value={formData.topic}
              onChange={(e) => setFormData({...formData, topic: e.target.value})}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Start Time</label>
            <div className="relative">
              <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="datetime-local"
                className="w-full bg-slate-50 border-none rounded-2xl pl-14 pr-6 py-4 font-bold text-slate-700 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                value={formData.scheduled_time}
                onChange={(e) => setFormData({...formData, scheduled_time: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Duration (Mins)</label>
            <div className="relative">
              <Clock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="number"
                className="w-full bg-slate-50 border-none rounded-2xl pl-14 pr-6 py-4 font-bold text-slate-700 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Invite Friends to Join</label>
          <div className="flex flex-wrap gap-3 mt-2">
            {friends.map(friend => (
              <button 
                key={friend.id}
                onClick={() => toggleInvite(friend.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                  formData.invited_members.includes(friend.id) 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <div 
                  className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-[10px]"
                  style={{ backgroundColor: formData.invited_members.includes(friend.id) ? 'rgba(255,255,255,0.2)' : friend.avatar_color }}
                >
                  {friend.name[0]}
                </div>
                {friend.username}
              </button>
            ))}
            {friends.length === 0 && (
              <p className="text-slate-400 text-sm italic">You don't have any study buddies to invite yet.</p>
            )}
          </div>
        </div>

        <button 
          className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black shadow-2xl shadow-slate-200 hover:scale-[1.02] active:scale-95 transition-all text-lg flex items-center justify-center gap-3"
          onClick={handleCreate}
          disabled={loading}
        >
          {loading ? 'Creating Matrix...' : (
            <>
               <shield size={20} className="text-indigo-400" />
               Launch Multi-User Session
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CreateSession;