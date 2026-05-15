import { useState, useEffect } from 'react';
import { Users, Plus, MessageCircle, Crown, UserPlus, MoreHorizontal, Video, Settings, Search, X, UserMinus } from 'lucide-react';
import { getGroups, joinSession, createGroup, searchUsers, inviteToGroup, removeFromGroup, discoverGroups, requestToJoinGroup, getJoinRequests, respondToJoinRequest } from '../../../services/sessionApi';
import { GroupCalendar } from '../components/GroupCalendar';
import { GroupChat } from '../components/GroupChat';
import { useAuthStore } from '../../../store/authStore';
import { toast } from 'sonner';

interface GroupMember {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  profile_picture?: string;
}

interface StudyGroup {
  id: number;
  name: string;
  description: string;
  members: GroupMember[];
  creator: number | GroupMember;
  created_at: string;
  // UI-only properties (can be derived or defaulted)
  color?: string;
  subject?: string;
  isOwner?: boolean;
}

export const GroupsPage = () => {
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [chatGroup, setChatGroup] = useState<{id: number, name: string} | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState<StudyGroup | null>(null);
  const [showManageModal, setShowManageModal] = useState<StudyGroup | null>(null);
  
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<GroupMember[]>([]);
  
  const [activeTab, setActiveTab] = useState<'my' | 'discover' | 'requests'>('my');
  const [discoverableGroups, setDiscoverableGroups] = useState<StudyGroup[]>([]);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  
  const { user } = useAuthStore();

  const loadGroups = async () => {
    try {
      const res = await getGroups();
      const colors = ['#bae6fd', '#fef08a', '#bbf7d0', '#fbcfe8', '#c4b5fd'];
      setGroups(res.data.map((g: any, idx: number) => ({
        ...g,
        color: colors[idx % colors.length],
        subject: 'General Study', 
        isOwner: typeof g.creator === 'object' ? g.creator.id === user?.id : g.creator === user?.id,
        lastActive: 'Just now',
        sessionsThisWeek: 0
      })));
    } catch (err) {
      console.error("Failed to fetch groups", err);
    }
  };

  const loadDiscoverableGroups = async () => {
    try {
      const res = await discoverGroups();
      setDiscoverableGroups(res.data.map((g: any, idx: number) => ({
        ...g,
        color: '#f1f5f9',
        subject: 'Explore'
      })));
    } catch (err) {
      console.error("Failed to fetch discoverable groups", err);
    }
  };

  const loadJoinRequests = async () => {
    try {
      const res = await getJoinRequests();
      setJoinRequests(res.data);
    } catch (err) {
      console.error("Failed to fetch join requests", err);
    }
  };

  useEffect(() => {
    loadGroups();
    loadDiscoverableGroups();
    loadJoinRequests();
  }, []);

  const handleJoinSession = async (groupId: number) => {
    try {
      await joinSession(groupId);
      window.location.href = `/session/${groupId}`;
    } catch (err) {
      console.error("Failed to join session", err);
      window.location.href = `/session/${groupId}`;
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName) return;
    try {
      await createGroup({
        name: newGroupName,
        description: newGroupDesc
      });
      setShowCreateModal(false);
      setNewGroupName('');
      setNewGroupDesc('');
      loadGroups();
      toast.success("Group created!");
    } catch (err) {
      toast.error("Failed to create group.");
    }
  };

  const handleSearchUsers = async (q: string) => {
    setUserSearch(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await searchUsers(q);
      setSearchResults(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInvite = async (groupId: number, userId: number) => {
    try {
      await inviteToGroup(groupId, userId);
      toast.success("User invited!");
      loadGroups();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to invite user.");
    }
  };

  const handleRemoveMember = async (groupId: number, userId: number) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;
    try {
      await removeFromGroup(groupId, userId);
      toast.success("Member removed.");
      loadGroups();
      // Update local state for manage modal if open
      if (showManageModal) {
        setShowManageModal({
          ...showManageModal,
          members: showManageModal.members.filter(m => m.id !== userId)
        });
      }
    } catch (err) {
      toast.error("Failed to remove member.");
    }
  };

  const handleRequestJoin = async (groupId: number) => {
    try {
      await requestToJoinGroup(groupId);
      toast.success("Join request sent! Waiting for admin approval.");
      loadDiscoverableGroups();
      loadJoinRequests(); // To show our own pending request if needed
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to send join request.");
    }
  };

  const handleRespondToJoin = async (requestId: number, action: 'approve' | 'reject') => {
    try {
      await respondToJoinRequest(requestId, action);
      toast.success(`Request ${action === 'approve' ? 'approved' : 'rejected'}.`);
      loadJoinRequests();
      loadGroups();
    } catch (err) {
      toast.error("Failed to respond to request.");
    }
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title"><Users size={28} /> Study Circles</h1>
          <p className="page-subtitle">Collaborate with your study groups or discover new ones.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="neo-btn primary" onClick={() => setShowCreateModal(!showCreateModal)}>
            <Plus size={18} /> Create Group
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          className={`neo-btn ${activeTab === 'my' ? 'primary' : ''}`} 
          onClick={() => setActiveTab('my')}
        >
          My Groups ({groups.length})
        </button>
        <button 
          className={`neo-btn ${activeTab === 'discover' ? 'primary' : ''}`} 
          onClick={() => setActiveTab('discover')}
        >
          Discover ({discoverableGroups.length})
        </button>
        <button 
          className={`neo-btn ${activeTab === 'requests' ? 'primary' : ''}`} 
          onClick={() => setActiveTab('requests')}
        >
          Requests {joinRequests.filter(r => r.status === 'pending').length > 0 && `(${joinRequests.filter(r => r.status === 'pending').length})`}
        </button>
      </div>

      {/* Stats Row */}
      <div className="groups-stats">
        <div className="neo-card stat-mini">
          <div className="stat-mini-value">{groups.length}</div>
          <div className="stat-mini-label">Active Groups</div>
        </div>
        <div className="neo-card stat-mini">
          <div className="stat-mini-value">{groups.reduce((acc, g) => acc + g.members.length, 0)}</div>
          <div className="stat-mini-label">Total Members</div>
        </div>
        <div className="neo-card stat-mini">
          <div className="stat-mini-value">{groups.filter(g => g.isOwner).length}</div>
          <div className="stat-mini-label">Groups You Lead</div>
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="neo-card" style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '15px', fontWeight: 900 }}>🆕 Create a New Study Group</h3>
          <div className="form-row" style={{ flexDirection: 'column', gap: '12px', display: 'flex' }}>
            <input 
              className="neo-input" 
              placeholder="Group Name (e.g. 'Algo Assassins')" 
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
            />
            <textarea 
              className="neo-input" 
              placeholder="Description..." 
              style={{ minHeight: '80px', resize: 'vertical' }} 
              value={newGroupDesc}
              onChange={e => setNewGroupDesc(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="neo-btn primary" onClick={handleCreateGroup}>Create Group</button>
              <button className="neo-btn" onClick={() => setShowCreateModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal Overlay */}
      {showInviteModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="neo-card" style={{ width: '400px', maxWidth: '95%', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 900 }}>Invite to {showInviteModal.name}</h3>
              <button className="neo-btn-icon small" onClick={() => setShowInviteModal(null)}><X size={18} /></button>
            </div>
            <div className="search-box neo-card" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', marginBottom: '15px' }}>
              <Search size={18} />
              <input 
                className="search-input-clean" 
                placeholder="Search by username..." 
                value={userSearch}
                onChange={e => handleSearchUsers(e.target.value)}
                autoFocus
              />
            </div>
            <div className="results-list" style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {searchResults.map(u => (
                <div key={u.id} className="neo-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px' }}>
                  <span style={{ fontWeight: 700 }}>{u.username}</span>
                  <button className="neo-btn primary small" onClick={() => handleInvite(showInviteModal.id, u.id)}>Add</button>
                </div>
              ))}
              {userSearch.length >= 2 && searchResults.length === 0 && (
                <p style={{ textAlign: 'center', opacity: 0.5 }}>No users found.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manage Modal Overlay */}
      {showManageModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="neo-card" style={{ width: '400px', maxWidth: '95%', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 900 }}>Manage Members</h3>
              <button className="neo-btn-icon small" onClick={() => setShowManageModal(null)}><X size={18} /></button>
            </div>
            <div className="members-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {showManageModal.members.map(m => (
                <div key={m.id} className="neo-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e2e8f0', border: '2px solid black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>{m.username[0].toUpperCase()}</div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{m.username}</div>
                      {m.id === (typeof showManageModal.creator === 'object' ? showManageModal.creator.id : showManageModal.creator) && <span style={{ fontSize: '0.7rem', color: 'var(--neo-primary-dark)' }}>Owner</span>}
                    </div>
                  </div>
                  {showManageModal.isOwner && m.id !== user?.id && (
                    <button className="neo-btn-icon small" style={{ color: 'red' }} onClick={() => handleRemoveMember(showManageModal.id, m.id)}>
                      <UserMinus size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Groups Grid */}
      {activeTab === 'my' && (
        <div className="groups-grid">
          {groups.map(group => (
            <div
              key={group.id}
              className={`group-card neo-card ${selectedGroup === group.id ? 'selected' : ''}`}
              onClick={() => setSelectedGroup(selectedGroup === group.id ? null : group.id)}
            >
              {/* Card Header */}
              <div className="group-card-top" style={{ background: group.color }}>
                <div className="group-card-top-inner">
                  <h3 className="group-name">{group.name}</h3>
                  {group.isOwner && (
                    <span className="owner-badge"><Crown size={12} /> Owner</span>
                  )}
                </div>
                <p className="group-subject">{group.subject}</p>
              </div>

              {/* Card Body */}
              <div className="group-card-body">
                <p className="group-description">{group.description}</p>

                {/* Members Row */}
                <div className="group-members-row">
                  <div className="member-avatars">
                    {group.members.slice(0, 4).map((m, i) => (
                      <div
                        key={i}
                        className="member-avatar"
                        style={{ background: '#f1f5f9', border: '2px solid black', zIndex: 10 - i }}
                        title={m.username}
                      >
                        {m.username[0].toUpperCase()}
                      </div>
                    ))}
                    {group.members.length > 4 && (
                      <div className="member-avatar more">+{group.members.length - 4}</div>
                    )}
                  </div>
                  <span className="member-count">{group.members.length} members</span>
                </div>

                {/* Expanded Actions */}
                {selectedGroup === group.id && (
                  <div className="group-actions">
                    <button className="neo-btn primary small" onClick={(e) => {
                      e.stopPropagation();
                      handleJoinSession(group.id);
                    }}><Video size={14} /> Start Session</button>
                    <button className="neo-btn small" onClick={(e) => {
                      e.stopPropagation();
                      setChatGroup({ id: group.id, name: group.name });
                    }}><MessageCircle size={14} /> Chat</button>
                    <button className="neo-btn small" onClick={(e) => {
                      e.stopPropagation();
                      setShowInviteModal(group);
                    }}><UserPlus size={14} /> Invite</button>
                    {group.isOwner && (
                      <button className="neo-btn small" onClick={(e) => {
                        e.stopPropagation();
                        setShowManageModal(group);
                      }}><Settings size={14} /> Manage</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {groups.length === 0 && <p style={{ textAlign: 'center', gridColumn: '1/-1', padding: '40px', opacity: 0.5 }}>You haven't joined any groups yet.</p>}
        </div>
      )}

      {activeTab === 'discover' && (
        <div className="groups-grid">
          {discoverableGroups.map(group => (
            <div
              key={group.id}
              className="group-card neo-card"
              style={{ cursor: 'default' }}
            >
              <div className="group-card-top" style={{ background: '#f8fafc' }}>
                <h3 className="group-name">{group.name}</h3>
                <p className="group-subject">Discover</p>
              </div>
              <div className="group-card-body">
                <p className="group-description">{group.description}</p>
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="member-count">{group.members.length} members</span>
                  <button 
                    className="neo-btn primary small" 
                    onClick={() => handleRequestJoin(group.id)}
                    disabled={joinRequests.some(r => r.group === group.id && r.status === 'pending')}
                  >
                    {joinRequests.some(r => r.group === group.id && r.status === 'pending') ? 'Pending...' : 'Request to Join'}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {discoverableGroups.length === 0 && <p style={{ textAlign: 'center', gridColumn: '1/-1', padding: '40px', opacity: 0.5 }}>No new groups to discover.</p>}
        </div>
      )}

      {activeTab === 'requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h3 style={{ fontWeight: 900 }}>Pending Join Requests</h3>
          {joinRequests.filter(r => r.status === 'pending' && r.user.id !== user?.id).map(request => (
            <div key={request.id} className="neo-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px' }}>
              <div>
                <div style={{ fontWeight: 900 }}>{request.user.username}</div>
                <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>wants to join <span style={{ fontWeight: 700 }}>{request.group_name}</span></div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="neo-btn primary small" onClick={() => handleRespondToJoin(request.id, 'approve')}>Approve</button>
                <button className="neo-btn small" onClick={() => handleRespondToJoin(request.id, 'reject')}>Reject</button>
              </div>
            </div>
          ))}
          {joinRequests.filter(r => r.status === 'pending' && r.user.id !== user?.id).length === 0 && (
            <p style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>No pending requests for your groups.</p>
          )}

          <h3 style={{ fontWeight: 900, marginTop: '20px' }}>Your Sent Requests</h3>
          {joinRequests.filter(r => r.user.id === user?.id).map(request => (
            <div key={request.id} className="neo-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px' }}>
              <div>
                <div style={{ fontWeight: 900 }}>{request.group_name}</div>
                <div style={{ fontSize: '0.9rem' }}>Status: <span style={{ 
                  fontWeight: 700, 
                  color: request.status === 'approved' ? 'green' : request.status === 'rejected' ? 'red' : 'orange' 
                }}>{request.status.toUpperCase()}</span></div>
              </div>
            </div>
          ))}
          {joinRequests.filter(r => r.user.id === user?.id).length === 0 && (
            <p style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>You haven't sent any join requests.</p>
          )}
        </div>
      )}

      {/* Group Intelligence Hub (Calendar) */}
      {selectedGroup && (
        <GroupCalendar 
          groupId={selectedGroup} 
          groupName={groups.find(g => g.id === selectedGroup)?.name || "Group"}
        />
      )}

      {/* Chat Overlay */}
      {chatGroup && (
        <GroupChat 
          groupId={chatGroup.id} 
          groupName={chatGroup.name} 
          onClose={() => setChatGroup(null)} 
        />
      )}
    </div>
  );
};

