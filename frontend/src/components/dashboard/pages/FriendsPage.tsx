import React, { useEffect, useState } from 'react';
import { getFriends } from '../../../services/sessionApi';
import { Users, User, BookOpen, MessageSquare, Video, Shield, ChevronRight, X } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
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

const FriendsPage: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const res = await getFriends();
      setFriends(res.data);
    } catch (err) {
      toast.error("Network Error: Failed to sync circle.");
    } finally {
      setLoading(false);
    }
  };

  const viewProfile = async (id: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get(`http://localhost:8000/api/user/profile/${id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setSelectedFriend(res.data);
    } catch (err) {
      toast.error("Profile Data Locked or Unavailable.");
    }
  };

  return (
    <div className="social-container">
      <div className="nb-header">
        <h1 className="nb-title">Study Circle</h1>
        <p style={{fontWeight: 900}}>CONNECTED WITH {friends.length} ACADEMIC PARTNERS</p>
      </div>

      {loading ? (
        <div style={{textAlign: 'center', padding: '100px'}}>
          <h2 className="nb-title" style={{fontSize: '1.5rem'}}>SYNCING...</h2>
        </div>
      ) : friends.length === 0 ? (
        <div className="nb-card" style={{textAlign: 'center', padding: '80px'}}>
           <h2 className="nb-title" style={{fontSize: '1.8rem', marginBottom: '20px'}}>Your Circle is Empty</h2>
           <p style={{fontWeight: 900, marginBottom: '30px'}}>Find students with matching DNA to grow your network.</p>
           <button className="nb-btn primary">SCAN FOR MATCHES</button>
        </div>
      ) : (
        <div className="nb-grid">
          {friends.map((friend) => (
            <div key={friend.id} className="nb-card friend-card">
              <div className="friend-avatar" style={{backgroundColor: friend.avatar_color}}>
                {friend.name[0]}
              </div>
              
              <div className="friend-info">
                <h3>{friend.name}</h3>
                <p style={{fontWeight: 900, opacity: 0.6, fontSize: '0.9rem'}}>@{friend.username}</p>
                <div style={{marginTop: '15px', padding: '10px', background: '#f8fafc', border: '2px solid black', fontWeight: 900, fontSize: '0.8rem'}}>
                  {friend.institution}
                </div>
                <div className="tags">
                   <span className="friend-tag" style={{background: '#bae6fd'}}>{friend.learning_style}</span>
                   <span className="friend-tag" style={{background: '#bbf7d0'}}>{friend.role}</span>
                </div>
              </div>

              <div style={{marginTop: 'auto', paddingTop: '20px', display: 'flex', gap: '10px'}}>
                <button 
                  onClick={() => viewProfile(friend.id)}
                  className="nb-btn primary" 
                  style={{flex: 1, fontSize: '0.8rem'}}
                >
                  Explore Profile
                </button>
                <button className="nb-btn" style={{padding: '10px'}}>
                  <Video size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Profile Modal */}
      {selectedFriend && (
        <div className="nb-modal-overlay">
           <div className="nb-modal">
              <button onClick={() => setSelectedFriend(null)} className="nb-btn danger close-btn">
                <X size={20} />
              </button>

              <div style={{display: 'flex', gap: '40px', flexWrap: 'wrap'}}>
                 <div style={{flex: '1 1 200px'}}>
                    <div className="friend-avatar" style={{width: '120px', height: '120px', fontSize: '3rem'}}>
                       {selectedFriend.first_name?.[0] || selectedFriend.username[0]}
                    </div>
                    <h2 className="nb-title" style={{fontSize: '2rem'}}>{selectedFriend.first_name}</h2>
                    <p style={{fontWeight: 900, textTransform: 'uppercase'}}>{selectedFriend.institution}</p>
                    
                    <div style={{marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '15px'}}>
                       <div className="nb-card" style={{padding: '15px', marginBottom: 0, boxShadow: '4px 4px 0px 0px black'}}>
                          <p className="nb-label">learning DNA</p>
                          <p className="nb-value">{selectedFriend.learning_style}</p>
                       </div>
                       <div className="nb-card" style={{padding: '15px', marginBottom: 0, boxShadow: '4px 4px 0px 0px black'}}>
                          <p className="nb-label">current mission</p>
                          <p className="nb-value">{selectedFriend.study_goal}</p>
                       </div>
                    </div>
                 </div>

                 <div style={{flex: '2 1 400px'}}>
                    <h3 className="nb-title" style={{fontSize: '1.2rem', marginBottom: '30px', borderBottom: '2px solid black', paddingBottom: '10px'}}>
                       Shared Library
                    </h3>
                    <div style={{display: 'grid', gap: '15px'}}>
                       {selectedFriend.resources?.map((res: any) => (
                         <div key={res.id} className="nb-card" style={{display: 'flex', alignItems: 'center', gap: '20px', padding: '20px', margin: 0}}>
                            <div style={{background: '#fef08a', padding: '12px', border: '2px solid black', borderRadius: '8px'}}>
                               <BookOpen size={24} />
                            </div>
                            <div style={{flex: 1}}>
                               <p style={{fontWeight: 900, fontSize: '1.1rem'}}>{res.title}</p>
                               <p className="nb-label" style={{marginBottom: 0}}>{res.subject}</p>
                            </div>
                            <a href={res.file} download className="nb-btn primary" style={{padding: '10px'}}>
                               <ChevronRight size={24} />
                            </a>
                         </div>
                       ))}
                       {(!selectedFriend.resources || selectedFriend.resources.length === 0) && (
                          <div className="nb-card" style={{textAlign: 'center', background: '#f8fafc', borderStyle: 'dashed'}}>
                             <p style={{fontWeight: 900, opacity: 0.5}}>No public resources shared yet.</p>
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
