import { useState, useEffect } from 'react';
import { SearchCode, Sparkles, Users, BookOpen, Zap, ChevronRight, Star, Filter, X, Shield } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../../config/api';
import { sendStudyRequest } from '../../../services/sessionApi';
import { toast } from 'sonner';
import { useAuthStore } from '../../../store/authStore';

interface MatchUser {
  id: string;
  name: string;
  institution: string;
  compatibility: number;
  learning_style: string;
  study_goal: string;
  role: string;
  availability: string;
  skills: string[];
  avatar_color: string;
}

const compatibilityColor = (score: number) => {
  if (score >= 90) return '#22c55e';
  if (score >= 80) return '#f59e0b';
  if (score >= 70) return '#3b82f6';
  return '#94a3b8';
};

export const MatchesPage = () => {
  const [matches, setMatches] = useState<MatchUser[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const { user } = useAuthStore();

  const filters = [
    { label: 'All', value: 'all' },
    { label: '90%+', value: 'high' },
    { label: 'Same Goal', value: 'goal' },
    { label: 'Available Now', value: 'available' },
  ];

  const filteredMatches = matches.filter(m => {
    if (selectedFilter === 'high') return m.compatibility >= 90;
    
    if (selectedFilter === 'goal') {
      // Compare match's goal with current user's goal
      // Note: backend returns display name for study_goal in the matches list
      // but the authStore user has the raw value.
      const userGoalDisplay = {
        'exam': 'Exam Prep',
        'project': 'Project Help',
        'concept': 'Concept Clarity',
        'practice': 'Practice Problems'
      }[user?.study_goal || ''] || user?.study_goal;
      
      return m.study_goal === userGoalDisplay;
    }

    if (selectedFilter === 'available') {
      const hour = new Date().getHours();
      let currentPeriod = '';
      if (hour >= 6 && hour < 12) currentPeriod = 'Early Bird (Mornings)';
      else if (hour >= 12 && hour < 17) currentPeriod = 'Afternoon Grind';
      else if (hour >= 17 && hour < 24) currentPeriod = 'Night Owl (Evenings)';
      else currentPeriod = 'Night Owl (Evenings)'; // Very late night
      
      return m.availability === currentPeriod;
    }

    return true;
  });

  const handleFindMatches = async () => {
    setIsSearching(true);
    const token = localStorage.getItem('access_token');

    try {
      // 🚨 UPDATED URL: Now hitting /api/match/ as requested
      const response = await axios.get(`${API_BASE_URL}/api/match/`, {
        headers: { Authorization: `Token ${token}` }
      });

      if (response.data && response.data.matches) {
        const updatedMatches = response.data.matches.map((m: any, index: number) => ({
          id: String(m.user_id),
          name: m.name,
          institution: m.institution || 'Independent',
          compatibility: m.score, // The score returned by the AI Engine
          learning_style: m.learning_style || 'N/A',
          study_goal: m.study_goal || 'N/A',
          role: m.role || 'N/A',
          availability: m.availability || 'N/A',
          // Shared skills derived from the AI comparison
          skills: m.shared_skills && m.shared_skills.length > 0 ? m.shared_skills : ['General'],
          avatar_color: ['#bae6fd', '#bbf7d0', '#fef08a', '#fbcfe8'][index % 4]
        }));

        setMatches(updatedMatches);
        if (response.data.engine) {
          toast.success(`Success! Found matches via ${response.data.engine}`);
        }
      }
    } catch (err) {
      console.error("Match fetching failed", err);
      toast.error("Matchmaker service is temporarily offline.");
      setMatches([]);
    } finally {
      setIsSearching(false);
      setHasScanned(true);
    }
  };

  useEffect(() => {
    handleFindMatches();
  }, []);

  const handleSendRequest = async (userId: string) => {
    try {
      await sendStudyRequest(parseInt(userId));
      toast.success("Study request sent!");
    } catch (err) {
      toast.error("You've already sent a request to this student.");
    }
  };

  const viewProfile = async (id: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get(`${API_BASE_URL}/api/user/profile/${id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setSelectedUser(res.data);
    } catch (err) {
      toast.error("Profile Data Locked or Unavailable.");
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title"><SearchCode size={28} /> Study Matches</h1>
          <p className="page-subtitle">AI-powered study partner recommendations based on your Study DNA.</p>
        </div>
        <button className="neo-btn primary" onClick={handleFindMatches} disabled={isSearching}>
          {isSearching ? (
            <><span className="btn-spinner" /> Scanning Network...</>
          ) : (
            <><Sparkles size={18} /> Rescan for Partners</>
          )}
        </button>
      </div>

      <div className="filter-bar">
        <Filter size={16} />
        {filters.map(f => (
          <button
            key={f.value}
            className={`filter-chip ${selectedFilter === f.value ? 'active' : ''}`}
            onClick={() => setSelectedFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="matches-grid">
        {filteredMatches.map(match => (
          <div
            key={match.id}
            className={`match-card neo-card ${expandedMatch === match.id ? 'expanded' : ''}`}
            onClick={() => setExpandedMatch(expandedMatch === match.id ? null : match.id)}
            style={{ cursor: 'pointer' }}
          >
            <div className="match-card-header">
              <div className="match-avatar" style={{ background: match.avatar_color }}>
                {match.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
              <div className="match-info">
                <h3 className="match-name">{match.name}</h3>
                <p className="match-institution">{match.institution}</p>
              </div>
              <div className="match-score" style={{ borderColor: compatibilityColor(match.compatibility) }}>
                <span className="score-value" style={{ color: compatibilityColor(match.compatibility) }}>
                  {match.compatibility}%
                </span>
                <span className="score-label">Match</span>
              </div>
            </div>

            <div className="match-tags">
              <span className="match-tag"><BookOpen size={12} /> {match.learning_style}</span>
              <span className="match-tag"><Zap size={12} /> {match.study_goal}</span>
              <span className="match-tag"><Users size={12} /> {match.role}</span>
            </div>

            {expandedMatch === match.id && (
              <div className="match-expanded">
                <div className="match-detail-row">
                  <span className="detail-label">Availability</span>
                  <span className="detail-value">{match.availability}</span>
                </div>
                <div className="match-skills">
                  <span className="detail-label">Shared Skills / Interests</span>
                  <div className="skills-row">
                    {match.skills.map(s => (
                      <span key={s} className="mini-skill-tag">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="match-actions">
                  <button className="neo-btn primary small" onClick={(e) => { e.stopPropagation(); handleSendRequest(match.id); }}>
                    <Users size={14} /> Send Request
                  </button>
                  <button className="neo-btn small" onClick={(e) => { e.stopPropagation(); viewProfile(match.id); }}>
                    <SearchCode size={14} /> Explore Profile
                  </button>
                  <button className="neo-btn small">
                    <Star size={14} /> Save
                  </button>
                </div>
              </div>
            )}

            <div className="match-expand-hint">
              <ChevronRight size={14} className={expandedMatch === match.id ? 'rotated' : ''} />
            </div>
          </div>
        ))}
      </div>

      {filteredMatches.length === 0 && !isSearching && (
        <div className="empty-state neo-card">
          <SearchCode size={48} style={{ opacity: 0.3 }} />
          <h3>No matches found</h3>
          <p>Try clearing your filters or rescanning your network.</p>
        </div>
      )}

      {/* Profile Modal - Copy of the logic from FriendsPage for consistency */}
      {selectedUser && (
        <div className="nb-modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="nb-modal" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedUser(null)} className="close-modal">
              <X size={20} />
            </button>

            <div className="modal-content">
              <div className="profile-sidebar">
                <div className="friend-avatar large" style={{ backgroundColor: '#bae6fd' }}>
                  {selectedUser.first_name?.[0] || selectedUser.username[0]}
                </div>
                <h2 className="profile-name">{selectedUser.first_name || selectedUser.username}</h2>
                <p className="profile-inst">{selectedUser.institution}</p>
                
                <div className="profile-stats">
                  <div className="p-stat">
                    <span className="p-label">DNA TYPE</span>
                    <span className="p-value">{selectedUser.learning_style}</span>
                  </div>
                  <div className="p-stat">
                    <span className="p-label">MISSION</span>
                    <span className="p-value">{selectedUser.study_goal}</span>
                  </div>
                </div>
              </div>

              <div className="profile-main">
                <h3 className="section-title">Shared Library</h3>
                <div className="resources-stack">
                  {selectedUser.resources?.length > 0 ? (
                    selectedUser.resources.map((res: any) => (
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
                
                {!selectedUser.is_friend && (
                  <div className="neo-card" style={{ marginTop: '20px', background: '#fef08a', padding: '15px' }}>
                    <p style={{ margin: 0, fontWeight: 900, fontSize: '0.8rem' }}>
                      💡 Want to see more? Send a study request to unlock their full DNA profile and private resources!
                    </p>
                    <button 
                      className="neo-btn primary small" 
                      style={{ marginTop: '10px', width: '100%' }}
                      onClick={() => handleSendRequest(selectedUser.id)}
                    >
                      SEND REQUEST
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};