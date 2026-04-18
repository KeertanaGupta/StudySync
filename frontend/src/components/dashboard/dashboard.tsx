import { useEffect, useState, FormEvent } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import { SmartTestBrowser } from '../SmartBrowser';
import { 
  Home, Calendar, Users, BookOpen, Bell, Settings, 
  Search, Sun, User, Layout, SearchCode, Video, PlusCircle
} from 'lucide-react';
import './Dashboard.css';

// 🗺️ MAPPING DICTIONARIES: Turns raw DB text into pretty UI labels
const DNA_MAPS = {
  style: { visual: "Visual", auditory: "Auditory", reading: "Reading", practice: "Practice" },
  role: { explainer: "Explainer", problem_solver: "Solver", note_taker: "Note-Taker", questioner: "Questioner" },
  goal: { exam: "Exam Prep", project: "Projects", concept: "Clarity", practice: "Practice" }
};

export const Dashboard = () => {
  const { user, logout } = useAuthStore();
  
  // --- STATE MANAGEMENT ---
  const [profileData, setProfileData] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [newSkillStr, setNewSkillStr] = useState("");
  const [testingSkill, setTestingSkill] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // --- API ACTIONS ---
  
  // 1. Fetch User Skills
  const fetchSkills = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:8000/api/skills/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      console.log("📡 Skills synced:", res.data);
      setSkills(res.data);
    } catch (err) {
      console.error("Failed to load skills", err);
    }
  };

  // 2. Fetch Profile DNA
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get('http://localhost:8000/api/user/profile/', {
          headers: { 'Authorization': `Token ${token}` }
        });
        setProfileData(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch profile DNA", err);
        setLoading(false);
      }
    };

    fetchProfile();
    fetchSkills();
  }, []);

  // 3. Add New Skill (Optimistic Update)
  const handleAddSkill = async (e: FormEvent) => {
    e.preventDefault();
    const skillName = newSkillStr.trim();
    if (!skillName) return;

    try {
      const token = localStorage.getItem('access_token');
      
      const res = await axios.post('http://localhost:8000/api/skills/', 
        { name: skillName },
        { headers: { 'Authorization': `Token ${token}` } }
      );
      
      setNewSkillStr(""); // Clear input

      // Optimistic Update: Add to UI immediately so user doesn't see "No skills"
      setSkills(prev => [...prev, res.data]);

      // Sync with DB to ensure everything is perfect
      fetchSkills(); 

    } catch (err: any) {
      console.error("Full Error Object:", err.response?.data);
      // This will show you the ACTUAL error from Django
      const backendError = err.response?.data?.error || "Error adding skill";
      alert(`Django says: ${backendError}`);
      fetchSkills(); 
    }
  };

  // --- RENDER ---

  if (loading) {
    return (
      <div className="dash-wrapper" style={{alignItems: 'center', justifyContent: 'center'}}>
        <h1 style={{ fontWeight: 900, fontSize: '2rem' }}>BOOTING COMMAND CENTER...</h1>
      </div>
    );
  }

  return (
    <>
      {/* 🧠 SMART TEST BROWSER OVERLAY (Only visible during verification) */}
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

      <div className="dash-wrapper">
        
        {/* 👈 LEFT SIDEBAR */}
        <aside className="dash-sidebar">
          <div className="brand-title">
            <div className="brand-icon">S</div>
            StudySync
          </div>
          
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '10px', fontWeight: 'bold' }}>MENU</div>
          <nav className="sidebar-menu">
            <div className="sidebar-link active"><Home size={18}/> Home</div>
            <div className="sidebar-link"><Calendar size={18}/> Schedule</div>
            <div className="sidebar-link"><SearchCode size={18}/> Matches</div>
            <div className="sidebar-link"><Users size={18}/> My Groups</div>
            <div className="sidebar-link"><BookOpen size={18}/> Resources</div>
            <div className="sidebar-link"><Bell size={18}/> Notifications</div>
            <div className="sidebar-link"><Settings size={18}/> Settings</div>
          </nav>

          <div style={{ marginTop: 'auto' }}>
             <button className="sidebar-link" style={{color: '#dc2626', width: '100%', background: 'transparent'}} onClick={logout}>
               Log Out
             </button>
          </div>
        </aside>

        {/* 👉 MAIN CONTENT */}
        <main className="dash-main">
          
          {/* Top Navbar */}
          <header className="top-nav">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 900 }}>
              <Layout size={20} /> DASHBOARD
            </div>
            <div className="top-nav-icons">
              <div className="icon-btn"><Search size={18}/></div>
              <div className="icon-btn"><Bell size={18}/></div>
              <div className="icon-btn"><Sun size={18}/></div>
              <div className="icon-btn" style={{ background: '#fef08a' }}><User size={18}/></div>
            </div>
          </header>

          {/* Welcome Text */}
          <div className="welcome-header">
            <h1>Welcome back, {user?.name?.split(' ')[0] || "Student"}! 👋</h1>
            <p>Here's the latest breakdown of your Study DNA and Technical Arsenal.</p>
          </div>

          {/* DNA Stats Grid (Top 4 Cards) */}
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
              <div className="stat-value" style={{ fontSize: '1.1rem', marginTop: '5px' }}>{profileData?.institution || "N/A"}</div>
              <div className="stat-label" style={{ marginTop: '8px' }}>Institution</div>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div style={{ fontWeight: 900, fontSize: '1.2rem', marginBottom: '15px' }}>⚡ QUICK ACTIONS</div>
          <div className="quick-actions-grid">
            <div className="action-card">
              <div className="action-icon"><SearchCode size={24}/></div>
              <h3 style={{ margin: '0 0 5px 0', fontWeight: 900 }}>Find a Match</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7 }}>Discover new study partners</p>
            </div>
            <div className="action-card dark">
              <div className="action-icon"><Video size={24}/></div>
              <h3 style={{ margin: '0 0 5px 0', fontWeight: 900 }}>Join Session</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7 }}>Enter active study room</p>
            </div>
            <div className="action-card">
              <div className="action-icon"><PlusCircle size={24}/></div>
              <h3 style={{ margin: '0 0 5px 0', fontWeight: 900 }}>Create Group</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7 }}>Start your own circle</p>
            </div>
          </div>

          {/* Bottom Grid: Arsenal & Notifications */}
          <div className="bottom-split-grid">
            
            {/* 🛠️ TECHNICAL ARSENAL */}
            <div>
              <div style={{ fontWeight: 900, fontSize: '1.2rem', marginBottom: '15px' }}>🛠️ TECHNICAL ARSENAL</div>
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
                    placeholder="Add a new skill (e.g. SQL, React)..." 
                    value={newSkillStr}
                    onChange={(e) => setNewSkillStr(e.target.value)}
                  />
                  <button type="submit" className="btn-primary">ADD SKILL</button>
                </form>

                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                  {skills.length === 0 && <p style={{ opacity: 0.5, fontFamily: 'monospace' }}>No skills added yet.</p>}
                  
                  {skills.map((skill) => {
                    const colorClass = skill.is_verified ? `level-${skill.level}` : 'level-unverified';
                    return (
                      <div key={skill.id} className={`skill-tag ${colorClass}`}>
                        {skill.name}
                        {!skill.is_verified && (
                          <button 
                            className="verify-btn"
                            onClick={() => setTestingSkill(skill.name)}
                          >
                            VERIFY
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 🔔 NOTIFICATIONS */}
            <div>
              <div style={{ fontWeight: 900, fontSize: '1.2rem', marginBottom: '15px', display: 'flex', justifyContent: 'space-between' }}>
                <span>🔔 NOTIFICATIONS</span>
                <span style={{ fontSize: '0.75rem', cursor: 'pointer', opacity: 0.6, textDecoration: 'underline' }}>Mark all read</span>
              </div>
              
              <div className="neo-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ borderBottom: '2px dashed rgba(0,0,0,0.1)', paddingBottom: '15px' }}>
                  <div style={{ fontWeight: 900, fontSize: '0.9rem' }}>Alex sent you a message</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '5px' }}>10 mins ago</div>
                </div>
                <div style={{ borderBottom: '2px dashed rgba(0,0,0,0.1)', paddingBottom: '15px' }}>
                  <div style={{ fontWeight: 900, fontSize: '0.9rem' }}>New high-compatibility match!</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '5px' }}>2 hours ago</div>
                </div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: '0.9rem', color: '#16a34a' }}>Skill Verified: Advanced</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '5px' }}>Yesterday</div>
                </div>
              </div>
            </div>

          </div>

        </main>
      </div>
    </>
  );
};