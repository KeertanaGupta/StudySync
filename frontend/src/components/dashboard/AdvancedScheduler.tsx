import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

// Make sure these IDs match the ones you generated in your Django shell!
const MOCK_FRIENDS = [
  { id: 2, name: "chitresh", isSelf: true },
  { id: 4, name: "Keertana", isSelf: false },
  { id: 5, name: "Rahul", isSelf: false },
  { id: 6, name: "Sneha", isSelf: false },
  { id: 7, name: "Vikram", isSelf: false }
];

export const AdvancedScheduler = () => {
  // Always include yourself by default
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([MOCK_FRIENDS[0].id]); 
  const [duration, setDuration] = useState<number>(2);
  
  const [slots, setSlots] = useState<{green: any[], yellow: any[]}>({ green: [], yellow: [] });
  const [isCalculating, setIsCalculating] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const toggleUser = (id: number) => {
    if (id === MOCK_FRIENDS[0].id) return; // Can't unselect yourself
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(selectedUserIds.filter(userId => userId !== id));
    } else {
      setSelectedUserIds([...selectedUserIds, id]);
    }
  };

  const findBestTime = async () => {
    if (selectedUserIds.length < 2) {
      toast.warning("Please select at least one friend to study with!");
      return;
    }

    setIsCalculating(true);
    setHasSearched(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.post('http://localhost:8000/api/group-schedule/', {
        user_ids: selectedUserIds,
        duration_hours: duration
      }, {
        headers: { 'Authorization': `Token ${token}` } 
      });

      setSlots({
        green: res.data.recommendations.green_best_slots || [],
        yellow: res.data.recommendations.yellow_alternatives || []
      });
      toast.success("Sync complete!");

    } catch (err) {
      toast.error("Failed to calculate schedule. Check your backend terminals.");
      console.error(err);
    } finally {
      setIsCalculating(false);
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString([], { 
      weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  // Brutalist styling constants
  const brutalBorder = '4px solid #000';
  const brutalShadow = '6px 6px 0px #000';
  const hoverShadow = '8px 8px 0px #000';

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* SQUAD SELECTION UI */}
      <div style={{ 
        background: '#fffceb', 
        border: brutalBorder, 
        borderRadius: '12px', 
        padding: '30px', 
        boxShadow: brutalShadow,
        marginBottom: '40px'
      }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '1.8rem', fontWeight: 900, textTransform: 'uppercase' }}>
          1. Select Your Squad
        </h2>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
          {MOCK_FRIENDS.map(friend => {
            const isSelected = selectedUserIds.includes(friend.id);
            return (
              <button 
                key={friend.id} 
                onClick={() => toggleUser(friend.id)}
                style={{
                  padding: '12px 24px', 
                  borderRadius: '8px', 
                  border: brutalBorder, 
                  fontWeight: 900, 
                  fontSize: '1rem',
                  cursor: friend.isSelf ? 'default' : 'pointer', 
                  background: isSelected ? '#000' : '#fff',
                  color: isSelected ? '#fff' : '#000',
                  boxShadow: isSelected ? 'none' : '4px 4px 0px #000',
                  transform: isSelected ? 'translate(4px, 4px)' : 'none',
                  transition: 'all 0.1s'
                }}>
                {friend.name} {isSelected && !friend.isSelf && " ✕"}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '30px', borderTop: '4px dashed #000', paddingTop: '30px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontWeight: 900, textTransform: 'uppercase', marginBottom: '5px' }}>Duration (Hrs)</label>
            <input 
              type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} min="1" max="8"
              style={{ width: '80px', padding: '12px', borderRadius: '8px', border: brutalBorder, fontSize: '1.2rem', fontWeight: 900, textAlign: 'center' }}
            />
          </div>
          
          <button 
            onClick={findBestTime} 
            disabled={isCalculating}
            style={{
              flex: 1, padding: '15px', borderRadius: '8px', border: brutalBorder, 
              background: isCalculating ? '#94a3b8' : '#bbf7d0', 
              color: '#000', fontWeight: 900, fontSize: '1.4rem', textTransform: 'uppercase',
              cursor: isCalculating ? 'wait' : 'pointer',
              boxShadow: isCalculating ? 'none' : brutalShadow,
              transform: isCalculating ? 'translate(6px, 6px)' : 'none',
            }}>
            {isCalculating ? "CRUNCHING MATH..." : "FIND PERFECT TIME"}
          </button>
        </div>
      </div>

      {/* RESULTS UI */}
      {hasSearched && !isCalculating && (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
          
          {/* GREEN SLOTS - Perfect Matches */}
          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 900, textTransform: 'uppercase', borderBottom: brutalBorder, paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>🟢</span> Perfect Matches
            </h3>
            
            {slots.green.length === 0 ? (
              <div style={{ padding: '30px', border: brutalBorder, borderRadius: '12px', background: '#f1f5f9', fontWeight: 'bold', textAlign: 'center' }}>
                No perfect overlapping times found. Check alternatives below.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                {slots.green.map((slot, i) => (
                  <div key={i} style={{ 
                    background: '#bbf7d0', border: brutalBorder, padding: '25px', 
                    borderRadius: '12px', display: 'flex', justifyContent: 'space-between', 
                    alignItems: 'center', boxShadow: brutalShadow 
                  }}>
                    <div>
                      <p style={{ fontSize: '1.5rem', fontWeight: 900, margin: '0 0 5px 0' }}>{formatDate(slot.start)}</p>
                      <p style={{ margin: 0, fontWeight: 'bold', opacity: 0.8 }}>All {slot.free_users.length} members available</p>
                    </div>
                    <div style={{ background: '#000', color: '#fff', padding: '10px 20px', borderRadius: '8px', fontWeight: 900, fontSize: '1.2rem' }}>
                      Score: {slot.score}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* YELLOW SLOTS - Alternatives (1 person missing) */}
          {slots.yellow.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 900, textTransform: 'uppercase', borderBottom: brutalBorder, paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>🟡</span> Alternatives (1 Conflict)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                {slots.yellow.map((slot, i) => (
                  <div key={i} style={{ 
                    background: '#fef08a', border: brutalBorder, padding: '25px', 
                    borderRadius: '12px', display: 'flex', justifyContent: 'space-between', 
                    alignItems: 'center', boxShadow: brutalShadow 
                  }}>
                    <div>
                      <p style={{ fontSize: '1.5rem', fontWeight: 900, margin: '0 0 5px 0' }}>{formatDate(slot.start)}</p>
                      <p style={{ margin: 0, fontWeight: 'bold', opacity: 0.8 }}>
                        Missing User ID: {slot.conflicting_users[0]}
                      </p>
                    </div>
                    <button style={{ 
                      background: '#fff', border: brutalBorder, color: '#000', 
                      padding: '10px 20px', borderRadius: '8px', fontWeight: 900, cursor: 'pointer',
                      boxShadow: '4px 4px 0px #000'
                    }}>
                      FORCE SCHEDULE
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};