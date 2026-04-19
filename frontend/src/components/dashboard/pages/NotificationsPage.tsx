import React, { useState, useEffect } from 'react';
import { Bell, Users, Check, X, BookOpen, Calendar, MessageCircle } from 'lucide-react';
import { getNotifications, markNotifRead } from '../../../services/resourceApi';
import { getStudyRequests, respondToRequest } from '../../../services/sessionApi';
import { useAuthStore } from '../../../store/authStore';
import { toast } from 'sonner';
import '../Social.css';

interface Notification {
  id: number;
  message: string;
  is_read: boolean;
  notif_type: 'mention' | 'match' | 'session';
  created_at: string;
}

interface StudyRequest {
  id: number;
  sender_name: string;
  receiver_name: string;
  sender: number;
  receiver: number;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [requests, setRequests] = useState<StudyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'requests'>('all');
  const { user } = useAuthStore();
  const currentUserId = user?.id;

  const fetchData = async () => {
    try {
      const [notifRes, requestRes] = await Promise.all([
        getNotifications(),
        getStudyRequests()
      ]);
      setNotifications(notifRes.data);
      setRequests(requestRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await markNotifRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      toast.error("Action Failed");
    }
  };

  const handleRespond = async (id: number, action: 'accept' | 'decline') => {
    try {
      await respondToRequest(id, action);
      toast.success(action === 'accept' ? "CONNECTION ESTABLISHED" : "REQUEST DECLINED");
      fetchData();
    } catch (err) {
      toast.error("Operation Failed");
    }
  };

  return (
    <div className="social-container">
      <div className="nb-header">
        <h1 className="nb-title">Activity Feed</h1>
        <p style={{fontWeight: 900}}>STAY SYNCED WITH YOUR CIRCLE</p>
      </div>

      <div style={{display: 'flex', gap: '20px', marginBottom: '40px'}}>
        <button 
          onClick={() => setActiveTab('all')}
          className={`nb-btn ${activeTab === 'all' ? 'accent' : ''}`}
        >
          ALERTS ({notifications.filter(n => !n.is_read).length})
        </button>
        <button 
          onClick={() => setActiveTab('requests')}
          className={`nb-btn ${activeTab === 'requests' ? 'accent' : ''}`}
        >
          REQUESTS ({requests.filter(r => r.status === 'pending').length})
        </button>
      </div>

      {activeTab === 'requests' ? (
        <div className="requests-view">
          {/* 1. INCOMING REQUESTS (Can Respond) */}
          <div style={{marginBottom: '40px'}}>
            <p className="nb-label" style={{marginBottom: '10px'}}>Incoming / Actions Required</p>
            {requests.filter(r => r.status === 'pending' && r.receiver === currentUserId).map(req => (
               <div key={req.id} className="nb-card" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
                     <div className="friend-avatar" style={{marginBottom: 0, width: '60px', height: '60px', background: '#bae6fd'}}>
                        {req.sender_name[0]}
                     </div>
                     <div>
                        <h3 style={{fontWeight: 900, marginBottom: '2px'}}>{req.sender_name}</h3>
                        <p style={{fontSize: '0.7rem', fontWeight: 900, opacity: 0.6}}>WANTS TO JOIN YOUR CIRCLE</p>
                     </div>
                  </div>
                  <div style={{display: 'flex', gap: '10px'}}>
                     <button 
                        onClick={() => handleRespond(req.id, 'accept')}
                        className="nb-btn accent"
                        style={{padding: '10px'}}
                     >
                        <Check size={20} />
                     </button>
                     <button 
                        onClick={() => handleRespond(req.id, 'decline')}
                        className="nb-btn danger"
                        style={{padding: '10px'}}
                     >
                        <X size={20} />
                     </button>
                  </div>
               </div>
            ))}
            {requests.filter(r => r.status === 'pending' && r.receiver === currentUserId).length === 0 && (
               <div className="nb-card" style={{textAlign: 'center', background: '#f8fafc', borderStyle: 'dotted'}}>
                  <p style={{fontWeight: 900, opacity: 0.5}}>NO NEW INCOMING REQUESTS</p>
               </div>
            )}
          </div>

          {/* 2. OUTGOING REQUESTS (Waiting) */}
          <div style={{opacity: 0.8}}>
            <p className="nb-label" style={{marginBottom: '10px'}}>Outgoing / Pending</p>
            {requests.filter(r => r.status === 'pending' && r.sender === currentUserId).map(req => (
               <div key={req.id} className="nb-card" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', borderStyle: 'dashed'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
                     <div className="friend-avatar" style={{marginBottom: 0, width: '40px', height: '40px', background: '#f1f5f9'}}>
                        {req.receiver_name[0]}
                     </div>
                     <div>
                        <h3 style={{fontWeight: 900, marginBottom: '2px', fontSize: '0.9rem'}}>{req.receiver_name}</h3>
                        <p style={{fontSize: '0.6rem', fontWeight: 900, opacity: 0.5}}>WAITING FOR RESPONSE...</p>
                     </div>
                  </div>
                  <span style={{fontSize: '0.7rem', fontWeight: 900, color: '#64748b'}}>PENDING</span>
               </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="notifications-view">
          {notifications.map(notif => (
            <div 
              key={notif.id} 
              className="nb-card" 
              style={{
                display: 'flex', 
                gap: '20px', 
                opacity: notif.is_read ? 0.5 : 1,
                borderLeftWidth: notif.is_read ? '3px' : '10px',
                borderColor: notif.is_read ? 'black' : '#6366f1'
              }}
              onClick={() => !notif.is_read && handleMarkRead(notif.id)}
            >
               <div style={{background: '#f1f5f9', padding: '12px', border: '2px solid black'}}>
                  {notif.notif_type === 'match' ? <Users size={20} /> : notif.notif_type === 'session' ? <Calendar size={20} /> : <MessageCircle size={20} />}
               </div>
               <div>
                  <div style={{fontSize: '0.6rem', fontWeight: 900, opacity: 0.5, marginBottom: '5px'}}>
                    {new Date(notif.created_at).toLocaleString()}
                  </div>
                  <p style={{fontWeight: 900, fontSize: '1.1rem'}}>{notif.message}</p>
               </div>
            </div>
          ))}
          {notifications.length === 0 && (
             <div className="nb-card" style={{textAlign: 'center', background: '#f8fafc', borderStyle: 'dashed'}}>
                <p style={{fontWeight: 900, opacity: 0.5}}>NOTHING TO SHOW</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
