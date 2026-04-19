import { useState, useEffect } from 'react';
import { Users, Plus, MessageCircle, Crown, UserPlus, MoreHorizontal, Video, Settings } from 'lucide-react';
import { getSessions, createSession, joinSession } from '../../../services/sessionApi';
import { GroupCalendar } from '../components/GroupCalendar';
import { useAuthStore } from '../../../store/authStore';

interface GroupMember {
  id: number;
  name: string;
  role: string;
  avatar_color: string;
  online: boolean;
}

interface StudyGroup {
  id: number;
  name: string;
  description: string;
  subject: string;
  members: GroupMember[];
  maxMembers: number;
  isOwner: boolean;
  color: string;
  lastActive: string;
  sessionsThisWeek: number;
}

const MOCK_GROUPS: StudyGroup[] = [
  {
    id: 1, name: 'DSA Warriors', description: 'Solving LeetCode problems daily and prepping for interviews.',
    subject: 'Data Structures & Algorithms', maxMembers: 8, isOwner: true, color: '#bae6fd',
    lastActive: '2 hours ago', sessionsThisWeek: 3,
    members: [
      { id: 999, name: 'You', role: 'Admin', avatar_color: '#fef08a', online: true },
      { id: 101, name: 'Aria Chen', role: 'Member', avatar_color: '#bae6fd', online: true },
      { id: 102, name: 'Marcus J.', role: 'Member', avatar_color: '#bbf7d0', online: false },
      { id: 103, name: 'Priya S.', role: 'Member', avatar_color: '#fbcfe8', online: true },
    ]
  },
  {
    id: 2, name: 'React Builders', description: 'Building projects together with React, Next.js, and TypeScript.',
    subject: 'Web Development', maxMembers: 6, isOwner: false, color: '#fef08a',
    lastActive: '30 mins ago', sessionsThisWeek: 5,
    members: [
      { id: 104, name: 'Lucas M.', role: 'Admin', avatar_color: '#c4b5fd', online: true },
      { id: 999, name: 'You', role: 'Member', avatar_color: '#fef08a', online: true },
      { id: 105, name: 'Jin Park', role: 'Member', avatar_color: '#fca5a5', online: false },
    ]
  },
  {
    id: 3, name: 'ML Study Lab', description: 'Deep dives into machine learning papers and implementations.',
    subject: 'Machine Learning', maxMembers: 10, isOwner: false, color: '#bbf7d0',
    lastActive: 'Yesterday', sessionsThisWeek: 2,
    members: [
      { name: 'Emma W.', role: 'Admin', avatar_color: '#c4b5fd', online: false },
      { name: 'You', role: 'Member', avatar_color: '#fef08a', online: true },
      { name: 'Aria Chen', role: 'Member', avatar_color: '#bae6fd', online: false },
      { name: 'Jin Park', role: 'Member', avatar_color: '#fca5a5', online: true },
      { name: 'Marcus J.', role: 'Member', avatar_color: '#bbf7d0', online: false },
    ]
  },
];

export const GroupsPage = () => {
  const [groups, setGroups] = useState<StudyGroup[]>(MOCK_GROUPS);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupSubject, setNewGroupSubject] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');

  const loadSessions = async () => {
    try {
      const res = await getSessions();
      if (res.data && res.data.length > 0) {
        const dynamicGroups: StudyGroup[] = res.data.map((s: any, idx: number) => ({
          id: s.id,
          name: s.title || `Session ${s.id}`,
          description: s.description || 'Live study session from backend',
          subject: s.topic || 'General',
          maxMembers: 10,
          isOwner: true, 
          color: ['#bae6fd', '#fef08a', '#bbf7d0', '#fbcfe8'][idx % 4],
          lastActive: 'Just now',
          sessionsThisWeek: 1,
          members: [
            { id: 999, name: 'You', role: 'Admin', avatar_color: '#fef08a', online: true }
          ]
        }));
        // Use only dynamic groups if available to avoid key collisions
        setGroups(dynamicGroups);
      } else {
        setGroups(MOCK_GROUPS);
      }
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleCreateGroup = async () => {
    if (!newGroupName) return;
    try {
      await createSession({
        title: newGroupName,
        topic: newGroupSubject || 'General Study',
        description: newGroupDesc,
        duration: 60,
        scheduled_time: new Date().toISOString(),
      });
      setShowCreateModal(false);
      loadSessions(); // Refresh after creation
    } catch (err) {
      alert("Failed to create group/session. Make sure the backend is running.");
    }
  };

  const handleJoinSession = async (groupId: number) => {
    try {
      await joinSession(groupId);
      // Redirect to video room
      window.location.href = `/session/${groupId}`;
    } catch (err) {
      console.error("Failed to join session", err);
      // Let's redirect anyway for demo purposes if backend fails joining locally
      window.location.href = `/session/${groupId}`;
    }
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title"><Users size={28} /> My Groups</h1>
          <p className="page-subtitle">Collaborate with your study circles and manage your teams.</p>
        </div>
        <button className="neo-btn primary" onClick={() => setShowCreateModal(!showCreateModal)}>
          <Plus size={18} /> Create Group
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
          <div className="stat-mini-value">{groups.reduce((acc, g) => acc + g.sessionsThisWeek, 0)}</div>
          <div className="stat-mini-label">Sessions This Week</div>
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
          <div className="form-row" style={{ flexDirection: 'column', gap: '12px' }}>
            <input 
              className="neo-input" 
              placeholder="Group Name (e.g. 'Algo Assassins')" 
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
            />
            <input 
              className="neo-input" 
              placeholder="Subject (e.g. 'Competitive Programming')" 
              value={newGroupSubject}
              onChange={e => setNewGroupSubject(e.target.value)}
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

      {/* Groups Grid */}
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
                      className={`member-avatar ${m.online ? 'online' : ''}`}
                      style={{ background: m.avatar_color, zIndex: 10 - i }}
                      title={m.name}
                    >
                      {m.name[0]}
                    </div>
                  ))}
                  {group.members.length > 4 && (
                    <div className="member-avatar more">+{group.members.length - 4}</div>
                  )}
                </div>
                <span className="member-count">{group.members.length}/{group.maxMembers}</span>
              </div>

              {/* Meta Row */}
              <div className="group-meta-row">
                <span className="meta-item">📅 {group.sessionsThisWeek} sessions/week</span>
                <span className="meta-item">🕐 {group.lastActive}</span>
              </div>

              {/* Expanded Actions */}
              {selectedGroup === group.id && (
                <div className="group-actions">
                  <button className="neo-btn primary small" onClick={(e) => {
                    e.stopPropagation();
                    handleJoinSession(group.id);
                  }}><Video size={14} /> Start Session</button>
                  <button className="neo-btn small" onClick={(e) => e.stopPropagation()}><MessageCircle size={14} /> Chat</button>
                  <button className="neo-btn small" onClick={(e) => e.stopPropagation()}><UserPlus size={14} /> Invite</button>
                  {group.isOwner && (
                    <button className="neo-btn small" onClick={(e) => e.stopPropagation()}><Settings size={14} /> Manage</button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Group Intelligence Hub (Calendar) */}
      {selectedGroup && (
        <GroupCalendar 
          groupId={selectedGroup} 
          groupName={groups.find(g => g.id === selectedGroup)?.name || "Group"}
          memberIds={groups.find(g => g.id === selectedGroup)?.members.map(m => m.id) || []}
        />
      )}
    </div>
  );
};
