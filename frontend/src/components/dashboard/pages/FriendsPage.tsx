import React, { useEffect, useState } from 'react';
import { getFriends, getStudyRequests, respondToRequest } from '../../../services/sessionApi';
import { Users, User, BookOpen, Video, Shield, ChevronRight, X, Check, UserMinus, Clock, Search } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { API_BASE_URL } from '../../../config/api';
import '../Social.css';

interface Friend {
  id: number;
  username: string;
  name: string;
  institution: string;
  learning_style: string;
  role: string;
  branch: string;
  avatar_color: string;
}

interface StudyRequest {
  id: number;
  sender_name: string;
  receiver_name: string;
  sender: number;
  receiver: number;
  status: string;
  created_at: string;
}

const FriendsPage: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<StudyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'circle' | 'requests'>('circle');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        getFriends(),
        getStudyRequests()
      ]);
      setFriends(friendsRes.data);
      setRequests(requestsRes.data);
    } catch (err) {
      toast.error("Failed to sync circle data.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (id: number, action: 'accept' | 'decline') => {
    try {
      await respondToRequest(id, action);
      toast.success(`Request ${action}ed!`);
      fetchData();
    } catch (err) {
      toast.error("Failed to process request.");
    }
  };

  const viewProfile = async (id: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get(`${API_BASE_URL}/api/user/profile/${id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setSelectedFriend(res.data);
    } catch (err) {
      toast.error("Profile Data Locked or Unavailable.");
    }
  };

  const incomingRequests = requests.filter(r => r.status === 'pending' && r.sender_name !== localStorage.getItem('username')); // This is a bit hacky, better check IDs
  // Actually StudyRequestSerializer provides sender and receiver IDs
  const currentUserId = JSON.parse(localStorage.getItem('user_id') || '0');
  const incoming = requests.filter(r => r.status === 'pending' && r.receiver === currentUserId);
  const outgoing = requests.filter(r => r.status === 'pending' && r.sender === currentUserId);

  return (
    <div className="social-container">
      <div className="page-header" style={{ marginBottom: '30px' }}>
        <div>
          <h1 className="page-title"><Users size={28} /> Study Circle</h1>
          <p className="page-subtitle">Manage your academic network and study partners.</p>
        </div>
        <div className="tab-switcher neo-card" style={{ display: 'flex', padding: '5px', gap: '5px', margin: 0 }}>
          <button 
            className={`tab-btn ${activeTab === 'circle' ? 'active' : ''}`}
            onClick={() => setActiveTab('circle')}
          >
            My Circle ({friends.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            Requests {incoming.length > 0 && <span className="notif-badge">{incoming.length}</span>}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="btn-spinner" style={{ width: '40px', height: '40px' }} />
          <p>Syncing DNA Network...</p>
        </div>
      ) : activeTab === 'circle' ? (
        <>
          {friends.length === 0 ? (
            <div className="empty-state neo-card">
              <Users size={48} style={{ opacity: 0.3 }} />
              <h3>Your Circle is Empty</h3>
              <p>Scan for matches to find students with matching DNA.</p>
              <button className="neo-btn primary" onClick={() => window.location.hash = 'matches'}>
                SCAN FOR MATCHES
              </button>
            </div>
          ) : (
            <div className="friends-grid">
              {friends.map((friend) => (
                <div key={friend.id} className="friend-card neo-card">
                  <div className="friend-header">
                    <div className="friend-avatar" style={{ backgroundColor: friend.avatar_color }}>
                      {friend.name[0]}
                    </div>
                    <div className="friend-meta">
                      <h3>{friend.name}</h3>
                      <p>@{friend.username}</p>
                    </div>
                  </div>
                  
                  <div className="friend-body">
                    <div className="institution-tag">
                      <Shield size={12} /> {friend.institution}
                    </div>
                    <div className="dna-tags">
                      <span className="dna-tag style">{friend.learning_style}</span>
                      <span className="dna-tag role">{friend.role}</span>
                    </div>
                  </div>

                  <div className="friend-actions">
                    <button onClick={() => viewProfile(friend.id)} className="neo-btn primary small">
                      Explore Profile
                    </button>
                    <button className="neo-btn small icon-only" title="Start Call">
                      <Video size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="requests-container">
          <div className="request-section">
            <h3 className="section-title"><Clock size={18} /> Incoming Requests</h3>
            {incoming.length === 0 ? (
              <p className="empty-text">No pending invitations.</p>
            ) : (
              <div className="request-list">
                {incoming.map(req => (
                  <div key={req.id} className="request-card neo-card">
                    <div className="req-user">
                      <div className="avatar-mini">{req.sender_name[0]}</div>
                      <div>
                        <p className="req-name">{req.sender_name}</p>
                        <p className="req-time">Sent {new Date(req.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="req-btns">
                      <button className="neo-btn primary small" onClick={() => handleRequest(req.id, 'accept')}>
                        <Check size={16} /> Accept
                      </button>
                      <button className="neo-btn danger small" onClick={() => handleRequest(req.id, 'decline')}>
                        <X size={16} /> Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="request-section" style={{ marginTop: '40px' }}>
            <h3 className="section-title"><ChevronRight size={18} /> Sent Requests</h3>
            {outgoing.length === 0 ? (
              <p className="empty-text">No active outgoing requests.</p>
            ) : (
              <div className="request-list">
                {outgoing.map(req => (
                  <div key={req.id} className="request-card neo-card sent">
                    <div className="req-user">
                      <div className="avatar-mini">{req.receiver_name[0]}</div>
                      <div>
                        <p className="req-name">{req.receiver_name}</p>
                        <p className="req-time">Pending response...</p>
                      </div>
                    </div>
                    <button className="neo-btn small outline" onClick={() => handleRequest(req.id, 'decline')}>
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {selectedFriend && (
        <div className="nb-modal-overlay" onClick={() => setSelectedFriend(null)}>
          <div className="nb-modal" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedFriend(null)} className="close-modal">
              <X size={20} />
            </button>

            <div className="modal-content">
              <div className="profile-sidebar">
                <div className="friend-avatar large">
                  {selectedFriend.first_name?.[0] || selectedFriend.username[0]}
                </div>
                <h2 className="profile-name">{selectedFriend.first_name || selectedFriend.username}</h2>
                <p className="profile-inst">{selectedFriend.institution}</p>
                
                <div className="profile-stats">
                  <div className="p-stat">
                    <span className="p-label">DNA TYPE</span>
                    <span className="p-value">{selectedFriend.learning_style}</span>
                  </div>
                  <div className="p-stat">
                    <span className="p-label">MISSION</span>
                    <span className="p-value">{selectedFriend.study_goal}</span>
                  </div>
                </div>
              </div>

              <div className="profile-main">
                <h3 className="section-title">Shared Library</h3>
                <div className="resources-stack">
                  {selectedFriend.resources?.length > 0 ? (
                    selectedFriend.resources.map((res: any) => (
                      <div key={res.id} className="resource-item neo-card">
                        <div className="res-icon">
                          <BookOpen size={20} />
                        </div>
                        <div className="res-info">
                          <p className="res-title">{res.title}</p>
                          <p className="res-subject">{res.subject}</p>
                        </div>
                        <a href={res.file} target="_blank" rel="noreferrer" className="neo-btn primary small">
                          View
                        </a>
                      </div>
                    ))
                  ) : (
                    <div className="empty-resources">
                      <p>No public resources shared yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FriendsPage;
