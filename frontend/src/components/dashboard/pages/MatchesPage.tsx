import { useState, useEffect } from 'react';
import { SearchCode, Sparkles, Users, BookOpen, Zap, ChevronRight, Star, Filter } from 'lucide-react';
import axios from 'axios';
import { sendStudyRequest } from '../../../services/sessionApi';
import { toast } from 'sonner';

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

  const filters = [
    { label: 'All', value: 'all' },
    { label: '90%+', value: 'high' },
    { label: 'Same Goal', value: 'goal' },
    { label: 'Available Now', value: 'available' },
  ];

  const filteredMatches = matches.filter(m => {
    if (selectedFilter === 'high') return m.compatibility >= 90;
    // You can add logic here to filter by specific goals or availability
    return true;
  });

  const handleFindMatches = async () => {
    setIsSearching(true);
    const token = localStorage.getItem('access_token');

    try {
      // 🚨 UPDATED URL: Now hitting /api/match/ as requested
      const response = await axios.get('/api/match/', {
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
    </div>
  );
};