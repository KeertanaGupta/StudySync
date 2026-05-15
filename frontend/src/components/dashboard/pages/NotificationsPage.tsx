import React, { useState, useEffect } from 'react';
import { Bell, Users, Check, X, BookOpen, Calendar, MessageCircle, Clock } from 'lucide-react';
import { getNotifications, markNotifRead } from '../../../services/resourceApi';
import { getStudyRequests, respondToRequest } from '../../../services/sessionApi';
import { useAuthStore } from '../../../store/authStore';
import { toast } from 'sonner';
import '../Social.css';

interface Notification {
  id: number;
  message: string;
  is_read: boolean;
  notif_type: 'mention' | 'match' | 'session' | 'join_request' | 'request_approved';
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
      <div className="page-header" style={{ marginBottom: '30px' }}>
        <div>
          <h1 className="page-title"><Bell size={28} /> Activity Feed</h1>
          <p className="page-subtitle">Stay synced with your circle and academic alerts.</p>
        </div>
        <div className="tab-switcher neo-card" style={{ display: 'flex', padding: '5px', gap: '5px', margin: 0 }}>
          <button 
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Alerts ({notifications.filter(n => !n.is_read).length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            Requests ({requests.filter(r => r.status === 'pending').length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="btn-spinner" style={{ width: '40px', height: '40px' }} />
          <p>Syncing Activity DNA...</p>
        </div>
      ) : activeTab === 'requests' ? (
        <div className="requests-container" style={{ gridTemplateColumns: '1fr' }}>
          {/* 1. INCOMING REQUESTS (Can Respond) */}
          <div className="request-section">
            <h3 className="section-title"><Users size={18} /> Incoming / Actions Required</h3>
            {requests.filter(r => r.status === 'pending' && r.receiver === currentUserId).length === 0 ? (
               <div className="empty-text">No new incoming requests.</div>
            ) : (
              <div className="request-list">
                {requests.filter(r => r.status === 'pending' && r.receiver === currentUserId).map(req => (
                  <div key={req.id} className="request-card neo-card">
                    <div className="req-user">
                      <div className="avatar-mini" style={{ background: '#bae6fd' }}>
                        {req.sender_name?.[0] || '?'}
                      </div>
                      <div>
                        <p className="req-name">{req.sender_name || 'Anonymous User'}</p>
                        <p className="req-time">wants to join your circle</p>
                      </div>
                    </div>
                    <div className="req-btns">
                      <button className="neo-btn primary small" onClick={() => handleRespond(req.id, 'accept')}>
                        <Check size={16} /> Accept
                      </button>
                      <button className="neo-btn danger small" onClick={() => handleRespond(req.id, 'decline')}>
                        <X size={16} /> Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. OUTGOING REQUESTS (Waiting) */}
          <div className="request-section" style={{ marginTop: '40px', opacity: 0.8 }}>
            <h3 className="section-title"><Clock size={18} /> Outgoing / Pending Response</h3>
            {requests.filter(r => r.status === 'pending' && r.sender === currentUserId).length === 0 ? (
               <div className="empty-text">No active outgoing requests.</div>
            ) : (
              <div className="request-list">
                {requests.filter(r => r.status === 'pending' && r.sender === currentUserId).map(req => (
                  <div key={req.id} className="request-card neo-card sent">
                    <div className="req-user">
                      <div className="avatar-mini" style={{ background: '#f1f5f9' }}>
                        {req.receiver_name?.[0] || '?'}
                      </div>
                      <div>
                        <p className="req-name">{req.receiver_name || 'Anonymous User'}</p>
                        <p className="req-time">Waiting for response...</p>
                      </div>
                    </div>
                    <span className="dna-tag" style={{ borderStyle: 'dashed', opacity: 0.6 }}>Pending</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="notifications-view" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {notifications.length === 0 ? (
             <div className="empty-text">Nothing to show in your feed yet.</div>
          ) : (
            notifications.map(notif => (
              <div 
                key={notif.id} 
                className={`neo-card notification-card ${notif.is_read ? 'read' : 'unread'}`}
                style={{
                  display: 'flex', 
                  gap: '20px', 
                  alignItems: 'center',
                  opacity: notif.is_read ? 0.6 : 1,
                  borderLeft: notif.is_read ? '4px solid var(--neo-black)' : '10px solid #6366f1',
                  cursor: notif.is_read ? 'default' : 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => !notif.is_read && handleMarkRead(notif.id)}
              >
                 <div className="res-icon" style={{ background: '#f1f5f9' }}>
                    {notif.notif_type === 'match' || notif.notif_type === 'join_request' ? <Users size={20} /> : notif.notif_type === 'session' ? <Calendar size={20} /> : notif.notif_type === 'request_approved' ? <Check size={20} /> : <MessageCircle size={20} />}
                 </div>
                 <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 900, opacity: 0.5, marginBottom: '4px' }}>
                      {notif.created_at ? new Date(notif.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Recently'}
                    </div>
                    <p style={{ fontWeight: 900, fontSize: '1.1rem', margin: 0 }}>{notif.message}</p>
                 </div>
                 {!notif.is_read && <div className="unread-dot" style={{ width: '12px', height: '12px', background: '#6366f1', borderRadius: '50%' }} />}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
