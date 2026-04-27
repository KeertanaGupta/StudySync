import React, { useEffect, useState, type FormEvent } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { useAuthStore } from '../../store/authStore';
import { SmartTestBrowser } from '../SmartBrowser';
import { 
  Home, Calendar, Users, BookOpen, Bell, Settings, 
  Search, Sun, Moon, User, Layout, SearchCode, Video, PlusCircle
} from 'lucide-react';
import './Dashboard.css';
import SessionList from "../sessions/SessionList";
import CreateSession from "../sessions/CreateSession";
import { JoinSessionModal } from "../sessions/JoinSessionModal";

// Pages
import { SchedulePage } from "./pages/SchedulePage";
import { MatchesPage } from "./pages/MatchesPage";
import { GroupsPage } from "./pages/GroupsPage";
import { ResourcesPage } from "./pages/ResourcesPage";
import NotificationsPage from "./pages/NotificationsPage";
import FriendsPage from "./pages/FriendsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { LiveKitVideoChat } from "./LiveKitVideoChat";

const DNA_MAPS = {
  style: { visual: "Visual", auditory: "Auditory", reading: "Reading", practice: "Practice" },
  role: { explainer: "Explainer", problem_solver: "Solver", note_taker: "Note-Taker", questioner: "Questioner" },
  goal: { exam: "Exam Prep", project: "Projects", concept: "Clarity", practice: "Practice" }
};

export const Dashboard = () => {
  const { user, logout } = useAuthStore();
  
  // State
  const [profileData, setProfileData] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [newSkillStr, setNewSkillStr] = useState("");
  const [testingSkill, setTestingSkill] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState("home");
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle Theme Toggle
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const fetchSkills = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get(`${API_BASE_URL}/api/skills/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setSkills(res.data);
    } catch (err) {
      console.error("Failed to fetch skills:", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get(`${API_BASE_URL}/api/study/notifications/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`${API_BASE_URL}/api/study/notifications/mark_all_read/`, {}, {
        headers: { 'Authorization': `Token ${token}` }
      });
      fetchNotifications();
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  };

  const handleDeleteSkill = async (skillName: string) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`${API_BASE_URL}/api/skills/?name=${encodeURIComponent(skillName)}`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      fetchSkills();
      toast.success('Skill removed');
    } catch (err) {
      toast.error('Failed to remove skill');
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get(`${API_BASE_URL}/api/user/profile/`, {
          headers: { 'Authorization': `Token ${token}` }
        });
        setProfileData(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch profile", err);
        setLoading(false);
      }
    };

    fetchProfile();
    fetchSkills();
    fetchNotifications();
  }, []);

  const handleAddSkill = async (e: FormEvent) => {
    e.preventDefault();
    if (!newSkillStr.trim()) return;
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`${API_BASE_URL}/api/skills/`, 
        { name: newSkillStr },
        { headers: { 'Authorization': `Token ${token}` } }
      );
      setNewSkillStr("");
      fetchSkills(); 
    } catch (err) {
      alert("Failed to add skill. It might already exist on your profile.");
    }
  };

  if (loading) {
    return <div className="dash-wrapper" style={{alignItems: 'center', justifyContent: 'center'}}><h1>LOADING WORKSPACE...</h1></div>;
  }

  return (
    <>
      {testingSkill && (
        <SmartTestBrowser 
          skillsToTest={[testingSkill]} 
          onCancel={() => setTestingSkill(null)}
          onComplete={() => {
            setTestingSkill(null);
            fetchSkills(); 
          }}
        />
      )}

      <JoinSessionModal 
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        userName={user?.name || user?.username || "Student"}
        onJoin={(id) => {
          setSelectedSessionId(id);
          setCurrentPage('video-chat');
          setShowJoinModal(false);
        }}
      />

      <div className="dash-wrapper">
        
        {/* 👈 LEFT SIDEBAR */}
        <aside className="dash-sidebar">
          <div className="brand-title">
            <div className="brand-icon">S</div>
            StudySync
          </div>
          
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '10px' }}>Menu</div>
          <nav className="sidebar-menu">
            <div className={`sidebar-link ${currentPage === 'home' ? 'active' : ''}`} onClick={() => setCurrentPage('home')}><Home size={18}/> Home</div>
            <div className={`sidebar-link ${currentPage === 'schedule' ? 'active' : ''}`} onClick={() => setCurrentPage('schedule')}><Calendar size={18}/> Schedule</div>
            <div className={`sidebar-link ${currentPage === 'matches' ? 'active' : ''}`} onClick={() => setCurrentPage('matches')}><SearchCode size={18}/> Matches</div>
            <div className={`sidebar-link ${currentPage === 'groups' ? 'active' : ''}`} onClick={() => setCurrentPage('groups')}><Users size={18}/> My Groups</div>
            <div className={`sidebar-link ${currentPage === 'resources' ? 'active' : ''}`} onClick={() => setCurrentPage('resources')}><BookOpen size={18}/> Resources</div>
            <div className={`sidebar-link ${currentPage === 'social' ? 'active' : ''}`} onClick={() => setCurrentPage('social')}><Users size={18}/> Social</div>
            <div className={`sidebar-link ${currentPage === 'notifications' ? 'active' : ''}`} onClick={() => setCurrentPage('notifications')}><Bell size={18}/> Notifications</div>
            <div className={`sidebar-link ${currentPage === 'settings' ? 'active' : ''}`} onClick={() => setCurrentPage('settings')}><Settings size={18}/> Settings</div>
          </nav>

          <div style={{ marginTop: 'auto' }}>
             <button className="sidebar-link" style={{color: 'red', width: '100%', background: 'transparent'}} onClick={logout}>
               Log Out
             </button>
          </div>
        </aside>

        {/* 👉 MAIN CONTENT */}
        <main className="dash-main">
          
          {/* Top Navbar */}
          <header className="top-nav">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}>
              <Layout size={20} /> Dashboard
            </div>
            <div className="top-nav-icons" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              {/* 1. Search */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {isSearchExpanded && (
                  <input 
                    type="text" 
                    placeholder="Search anything..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      padding: '8px 15px',
                      borderRadius: '8px',
                      border: '2px solid var(--neo-black)',
                      outline: 'none',
                      fontFamily: 'inherit',
                      width: '200px',
                      animation: 'fadeIn 0.2s ease-in-out',
                      background: 'var(--neo-card-bg)',
                      color: 'var(--neo-black)'
                    }}
                    autoFocus
                  />
                )}
                <div className="icon-btn" onClick={() => setIsSearchExpanded(!isSearchExpanded)} title="Search">
                  <Search size={18}/>
                </div>
              </div>

              {/* 2. Notifications */}
              <div className="icon-btn" onClick={() => setCurrentPage('notifications')} title="Notifications">
                <Bell size={18}/>
              </div>

              {/* 3. Theme Toggle */}
              <div className="icon-btn" onClick={() => setIsDarkMode(!isDarkMode)} title="Toggle Theme">
                {isDarkMode ? <Moon size={18}/> : <Sun size={18}/>}
              </div>

              {/* 4. User Profile */}
              <div className="icon-btn" style={{ background: '#fef08a' }} onClick={() => setCurrentPage('settings')} title="Profile/Settings">
                <User size={18} color="#000" />
              </div>
            </div>
          </header>

          {/* Welcome Text, Top Cards, etc. will only show if currentPage === 'home' */}
          {currentPage === 'home' && (
            <>
              {/* Welcome Text */}
              <div className="welcome-header">
                <h1>Welcome back, {user?.first_name || user?.username || "Student"}! :D</h1>
                <p>Here's what's happening with your Study DNA and Arsenal today.</p>
              </div>

          {/* Top 4 Cards: STUDY DNA mapped to the stat block style */}
          <div className="dna-stats-grid">
            <div className="neo-card">
              <div className="stat-icon-wrapper" style={{ background: '#bae6fd' }}>📺</div>
              <div className="stat-value">{DNA_MAPS.style[profileData?.learning_style as keyof typeof DNA_MAPS.style] || "N/A"}</div>
              <div className="stat-label">Learning Style</div>
            </div>
            <div className="neo-card">
              <div className="stat-icon-wrapper" style={{ background: '#fef08a' }}>🧩</div>
              <div className="stat-value">{DNA_MAPS.role[profileData?.role as keyof typeof DNA_MAPS.role] || "N/A"}</div>
              <div className="stat-label">Group Role</div>
            </div>
            <div className="neo-card">
              <div className="stat-icon-wrapper" style={{ background: '#bbf7d0' }}>🎯</div>
              <div className="stat-value">{DNA_MAPS.goal[profileData?.study_goal as keyof typeof DNA_MAPS.goal] || "N/A"}</div>
              <div className="stat-label">Primary Goal</div>
            </div>
            <div className="neo-card">
              <div className="stat-icon-wrapper" style={{ background: '#fbcfe8' }}>🏛️</div>
              <div className="stat-value" style={{ fontSize: '1.2rem', marginTop: '5px' }}>{profileData?.institution || "N/A"}</div>
              <div className="stat-label" style={{ marginTop: '8px' }}>Institution</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '15px' }}>:v Quick Actions</div>
          <div className="quick-actions-grid">
            <div className="action-card" onClick={() => setCurrentPage('matches')} style={{ cursor: 'pointer' }}>
              <div className="action-icon"><SearchCode size={24}/></div>
              <h3 style={{ margin: '0 0 5px 0' }}>Find a Match</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7 }}>Discover new study partners</p>
            </div>
            <div className="action-card dark" onClick={() => setShowJoinModal(true)} style={{ cursor: 'pointer' }}>
              <div className="action-icon"><Video size={24}/></div>
              <h3 style={{ margin: '0 0 5px 0' }}>Join Session</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7 }}>Enter active study room</p>
            </div>
            <div className="action-card" onClick={() => setCurrentPage('groups')} style={{ cursor: 'pointer' }}>
              <div className="action-icon"><PlusCircle size={24}/></div>
              <h3 style={{ margin: '0 0 5px 0' }}>Create Group</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7 }}>Start your own study circle</p>
            </div>
          </div>
          {/* 🎥 GROUP STUDY SESSIONS */}
<div style={{ marginTop: "30px" }}>
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: '15px' }}>
    <div style={{ fontWeight: 900, fontSize: '1.2rem' }}>
       +__+ GROUP STUDY SESSIONS
    </div>
    <button className="nb-btn primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }} onClick={() => setShowCreateSession(!showCreateSession)}>
      {showCreateSession ? 'CANCEL' : 'LAUNCH NEW SESSION'}
    </button>
  </div>

  {showCreateSession && (
    <div className="neo-card" style={{ marginBottom: "20px" }}>
      <CreateSession onSuccess={() => setShowCreateSession(false)} />
    </div>
  )}

  <div className="neo-card">
    <SessionList onJoin={(id) => {
      setSelectedSessionId(id);
      setCurrentPage('video-chat');
    }} />
  </div>
</div>
          {/* Bottom Split Area */}
          <br></br>
          <div className="bottom-split-grid">
            
            {/* Left: Technical Arsenal */}
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '15px' }}>~/ Technical Arsenal</div>
              <div className="neo-card">
                
                <div className="skill-legend">
                  <div className="legend-item"><div className="legend-color level-unverified"></div> Unverified</div>
                  <div className="legend-item"><div className="legend-color level-beginner"></div> Beginner</div>
                  <div className="legend-item"><div className="legend-color level-intermediate"></div> Intermediate</div>
                  <div className="legend-item"><div className="legend-color level-advanced"></div> Advanced</div>
                </div>

                <form onSubmit={handleAddSkill} className="add-skill-form">
                  <input 
                    type="text" 
                    className="add-skill-input" 
                    placeholder="Add a new skill (e.g. Python)..." 
                    value={newSkillStr}
                    onChange={(e) => setNewSkillStr(e.target.value)}
                  />
                  <button type="submit" className="btn-primary">ADD SKILL</button>
                </form>

                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                  {skills.length === 0 && <p style={{ opacity: 0.5 }}>No skills added yet.</p>}
                  
                  {skills.map((skill) => {
                    const colorClass = skill.is_verified ? `level-${skill.level}` : 'level-unverified';
                    return (
                      <div key={skill.id} className={`skill-tag ${colorClass}`} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {skill.name}
                        {!skill.is_verified && (
                          <button 
                            className="verify-btn"
                            onClick={() => {
                              if (document.documentElement.requestFullscreen) {
                                document.documentElement.requestFullscreen().catch(e => console.log("Fullscreen blocked:", e));
                              }
                              setTestingSkill(skill.name);
                            }}
                          >
                            VERIFY
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteSkill(skill.name)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.6, padding: '0 4px', fontSize: '1.2rem', lineHeight: 1 }}
                          title="Delete skill"
                        >
                          &times;
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Notifications / Recent */}
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>[ Notifications ]</span>
                <span onClick={handleMarkAllRead} style={{ fontSize: '0.8rem', cursor: 'pointer', opacity: 0.6, fontWeight: 'normal' }}>Mark all read</span>
              </div>
              
              <div className="neo-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '20px' }}>
                {notifications.filter(n => !n.is_read).length === 0 ? (
                  <div style={{ opacity: 0.6, textAlign: 'center', padding: '20px 0' }}>No new notifications.</div>
                ) : (
                  notifications.filter(n => !n.is_read).slice(0, 4).map((notif, idx) => (
                    <div key={notif.id} style={{ borderBottom: idx < notifications.filter(n => !n.is_read).slice(0, 4).length - 1 ? '2px dashed rgba(0,0,0,0.1)' : 'none', paddingBottom: idx < notifications.filter(n => !n.is_read).slice(0, 4).length - 1 ? '15px' : '0' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: notif.notif_type === 'match' ? '#16a34a' : 'inherit' }}>
                        {notif.message}
                      </div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '5px' }}>
                        {new Date(notif.created_at).toLocaleDateString()} at {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
          </>
          )}

          {/* Subpages Navigation */}
          {currentPage === 'schedule' && (
            <SchedulePage onJoinSession={(sessionId) => {
              setSelectedSessionId(sessionId);
              setCurrentPage('video-chat');
            }} />
          )}
          {currentPage === 'matches' && <MatchesPage />}
          {currentPage === 'groups' && <GroupsPage />}
          {currentPage === 'social' && <FriendsPage />}
          {currentPage === 'resources' && <ResourcesPage />}
          {currentPage === 'notifications' && <NotificationsPage />}
          {currentPage === 'settings' && <SettingsPage isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />}
          {currentPage === 'video-chat' && selectedSessionId && (
            <LiveKitVideoChat sessionId={selectedSessionId} onLeave={() => setCurrentPage('schedule')} />
          )}

        </main>
      </div>
    </>
  );
};