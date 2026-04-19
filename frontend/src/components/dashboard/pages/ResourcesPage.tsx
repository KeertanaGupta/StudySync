import React, { useState, useEffect } from 'react';
import { BookOpen, Upload, FileText, Link, Video, Star, ExternalLink, Search, FolderOpen, Plus, Download } from 'lucide-react';
import { getResources, uploadResource, starResource } from '../../../services/resourceApi';

interface Resource {
  id: number;
  title: string;
  file_type: 'pdf' | 'video' | 'link' | 'notes';
  subject: string;
  uploader: {
    username: string;
  };
  uploaded_at: string;
  is_starred: boolean;
  file: string;
  color?: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  pdf: <FileText size={20} />,
  video: <Video size={20} />,
  link: <Link size={20} />,
  notes: <BookOpen size={20} />,
};

const typeLabels: Record<string, string> = {
  pdf: 'PDF',
  video: 'Video',
  link: 'Link',
  notes: 'Notes',
};

const colors = ['#fca5a5', '#bae6fd', '#bbf7d0', '#fef08a', '#c4b5fd', '#fbcfe8'];

export const ResourcesPage = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchResources = async () => {
    try {
      const res = await getResources();
      setResources(res.data.map((r: any, idx: number) => ({
        ...r,
        color: colors[idx % colors.length]
      })));
    } catch (err) {
      console.error("Failed to fetch resources", err);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const filters = [
    { label: 'All', value: 'all', icon: <FolderOpen size={14} /> },
    { label: 'PDFs', value: 'pdf', icon: <FileText size={14} /> },
    { label: 'Videos', value: 'video', icon: <Video size={14} /> },
    { label: 'Links', value: 'link', icon: <Link size={14} /> },
    { label: 'Notes', value: 'notes', icon: <BookOpen size={14} /> },
    { label: 'Starred', value: 'starred', icon: <Star size={14} /> },
  ];

  const filtered = resources.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.subject.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeFilter === 'starred') return matchesSearch && r.is_starred;
    if (activeFilter !== 'all') return matchesSearch && r.file_type === activeFilter;
    return matchesSearch;
  });

  const toggleStar = async (id: number) => {
    try {
      await starResource(id);
      fetchResources();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);
    formData.append('subject', 'General');
    formData.append('file_type', file.type.includes('pdf') ? 'pdf' : 'notes');

    setUploading(true);
    try {
      await uploadResource(formData);
      setShowUpload(false);
      fetchResources();
    } catch (err) {
      alert("Upload failed. Make sure Cloudinary credentials are set in .env");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title"><BookOpen size={28} /> Resources</h1>
          <p className="page-subtitle">Your shared study materials, notes, and references.</p>
        </div>
        <button className="neo-btn primary" onClick={() => setShowUpload(!showUpload)}>
          <Upload size={18} /> Upload Resource
        </button>
      </div>

      {/* Search Bar */}
      <div className="resource-search neo-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', marginBottom: '20px' }}>
        <Search size={18} style={{ opacity: 0.5 }} />
        <input
          className="search-input-clean"
          placeholder="Search resources by name or subject..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="neo-card upload-area" style={{ marginBottom: '20px' }}>
          <div className="upload-dropzone" style={{ cursor: 'pointer' }} onClick={() => document.getElementById('file-input')?.click()}>
            <Upload size={40} style={{ opacity: 0.3 }} />
            <h3>{uploading ? 'Uploading to Cloudinary...' : 'Click to select files'}</h3>
            <p style={{ opacity: 0.6, fontSize: '0.85rem' }}>PDF, Video, or Study Notes</p>
            <input 
              type="file" 
              id="file-input" 
              style={{ display: 'none' }} 
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button className="neo-btn small" onClick={(e) => { e.stopPropagation(); setShowUpload(false); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filter-bar" style={{ marginBottom: '20px' }}>
        {filters.map(f => (
          <button
            key={f.value}
            className={`filter-chip ${activeFilter === f.value ? 'active' : ''}`}
            onClick={() => setActiveFilter(f.value)}
          >
            {f.icon} {f.label}
          </button>
        ))}
      </div>

      {/* Resources Grid */}
      <div className="resources-grid">
        {filtered.map(resource => (
          <div key={resource.id} className="resource-card neo-card">
            <div className="resource-card-icon" style={{ background: resource.color }}>
              {typeIcons[resource.file_type]}
            </div>
            <div className="resource-card-body">
              <div className="resource-type-badge">{typeLabels[resource.file_type]}</div>
              <h3 className="resource-title">{resource.title}</h3>
              <span className="resource-subject">{resource.subject}</span>
              <div className="resource-meta">
                <span>By {resource.uploader?.username}</span>
                <span>•</span>
                <span>{new Date(resource.uploaded_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="resource-card-actions">
              <button
                className={`star-btn ${resource.is_starred ? 'starred' : ''}`}
                onClick={(e) => { e.stopPropagation(); toggleStar(resource.id); }}
              >
                <Star size={16} fill={resource.is_starred ? '#f59e0b' : 'none'} />
              </button>
              {resource.file_type === 'link' ? (
                <a href={resource.file} target="_blank" rel="noreferrer" className="neo-btn-icon small"><ExternalLink size={14} /></a>
              ) : (
                <a href={resource.file} download className="neo-btn-icon small"><Download size={14} /></a>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state neo-card">
          <BookOpen size={48} style={{ opacity: 0.3 }} />
          <h3>No resources found</h3>
          <p>Try a different search or upload something new.</p>
        </div>
      )}
    </div>
  );
};
