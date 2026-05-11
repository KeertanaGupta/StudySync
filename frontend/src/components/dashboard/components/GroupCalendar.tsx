import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, X, Users, Trash2, Sparkles, Check } from 'lucide-react';
import { getGroupEvents, createGroupEvent, getOptimalSlots } from '../../../services/sessionApi';
import { toast } from 'sonner';

interface GroupCalendarProps {
  groupId: number;
  groupName: string;
}

interface GroupEvent {
  id: number;
  title: string;
  day_of_week: number;
  start_hour: number;
  duration: number;
  color: string;
  user_name: string;
}

interface OptimalSlot {
  day_of_week: number;
  day_name: string;
  hour: number;
  count: number;
  total_members: number;
  score: number;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const GroupCalendar: React.FC<GroupCalendarProps> = ({ groupId, groupName }) => {
  const [events, setEvents] = useState<GroupEvent[]>([]);
  const [suggestions, setSuggestions] = useState<OptimalSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', day: 0, startHour: 9 });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eventsRes, slotsRes] = await Promise.all([
        getGroupEvents(groupId),
        getOptimalSlots(groupId)
      ]);
      setEvents(eventsRes.data);
      setSuggestions(slotsRes.data);
    } catch (err) {
      console.error("Failed to fetch group data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [groupId]);

  const handleAddEvent = async () => {
    if (!newEvent.title) {
        toast.error("Please enter a title for the event.");
        return;
    }
    try {
      const colors = ['#bae6fd', '#fef08a', '#bbf7d0', '#fbcfe8', '#c4b5fd'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      await createGroupEvent(groupId, {
        title: newEvent.title,
        day_of_week: newEvent.day,
        start_hour: newEvent.startHour,
        duration: 1,
        color: randomColor
      });
      
      setShowAddModal(false);
      setNewEvent({ title: '', day: 0, startHour: 9 });
      fetchData();
      toast.success("Added to group calendar!");
    } catch (err) {
      toast.error("Failed to add event.");
    }
  };

  const handleSlotClick = (day: number, hour: number) => {
    setNewEvent({ ...newEvent, day, startHour: hour });
    setShowAddModal(true);
  };

  const getEventsForSlot = (dayIndex: number, hour: number) => {
    return events.filter(e => e.day_of_week === dayIndex && e.start_hour === hour);
  };

  return (
    <div className="group-calendar-container" style={{ marginTop: '30px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px' }}>
        
        {/* Main Calendar View */}
        <div className="group-calendar-shared neo-card" style={{ padding: '25px', background: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <div>
              <h2 style={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.5rem', margin: 0 }}>
                <Calendar size={28} /> {groupName} Schedule
              </h2>
              <p style={{ fontSize: '0.9rem', opacity: 0.6, marginTop: '5px' }}>Click any slot to coordinate meeting times.</p>
            </div>
            <button className="neo-btn primary" onClick={() => setShowAddModal(true)}>
              <Plus size={20} /> Add Event
            </button>
          </div>

          {showAddModal && (
            <div className="neo-card" style={{ marginBottom: '25px', background: '#fffbeb', border: '4px solid black' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ fontWeight: 900, margin: 0 }}>📅 Plan a Study Session</h3>
                <button className="neo-btn-icon small" onClick={() => setShowAddModal(false)}><X size={18} /></button>
              </div>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: 2, minWidth: '200px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, marginBottom: '5px', textTransform: 'uppercase' }}>Session Title</label>
                  <input 
                    className="neo-input" 
                    placeholder="e.g., Exam Prep, Lab Review" 
                    value={newEvent.title}
                    onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, marginBottom: '5px', textTransform: 'uppercase' }}>Day</label>
                  <select className="neo-input" value={newEvent.day} onChange={e => setNewEvent({...newEvent, day: +e.target.value})}>
                    {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, marginBottom: '5px', textTransform: 'uppercase' }}>Time</label>
                  <select className="neo-input" value={newEvent.startHour} onChange={e => setNewEvent({...newEvent, startHour: +e.target.value})}>
                    {HOURS.map(h => <option key={h} value={h}>{h}:00</option>)}
                  </select>
                </div>
                <button className="neo-btn primary" style={{ height: '48px' }} onClick={handleAddEvent}>Confirm</button>
              </div>
            </div>
          )}

          <div className="shared-grid-container" style={{ 
            maxHeight: '600px', 
            overflowY: 'auto', 
            border: '4px solid black', 
            borderRadius: '16px',
            boxShadow: '8px 8px 0 rgba(0,0,0,0.1)'
          }}>
            <div className="shared-grid" style={{ 
              display: 'grid', 
              gridTemplateColumns: '80px repeat(7, 1fr)',
              background: 'white',
              minWidth: '700px'
            }}>
              {/* Header Row */}
              <div style={{ padding: '20px', borderBottom: '3px solid black', borderRight: '3px solid black', background: '#f8fafc' }}><Clock size={20} /></div>
              {DAYS.map(day => (
                <div key={day} style={{ 
                  padding: '20px', 
                  textAlign: 'center', 
                  fontWeight: 900, 
                  borderBottom: '3px solid black', 
                  borderRight: '3px solid black',
                  background: '#f8fafc',
                  fontSize: '0.9rem'
                }}>{day}</div>
              ))}

              {/* Time Rows */}
              {HOURS.slice(8, 23).map(hour => (
                <React.Fragment key={hour}>
                  <div style={{ 
                    padding: '15px 10px', 
                    textAlign: 'center', 
                    fontSize: '0.85rem', 
                    fontWeight: 900,
                    borderBottom: '1px solid #e2e8f0',
                    borderRight: '3px solid black',
                    background: '#f1f5f9'
                  }}>{hour}:00</div>
                  {DAYS.map((_, dayIdx) => {
                    const slotEvents = getEventsForSlot(dayIdx, hour);
                    return (
                      <div 
                        key={`${dayIdx}-${hour}`} 
                        onClick={() => handleSlotClick(dayIdx, hour)}
                        style={{ 
                          minHeight: '80px', 
                          borderBottom: '1px solid #e2e8f0', 
                          borderRight: '1px solid #e2e8f0',
                          padding: '4px',
                          position: 'relative',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                        className="calendar-cell"
                      >
                        {slotEvents.map(ev => (
                          <div key={ev.id} style={{ 
                            background: ev.color, 
                            border: '3px solid black',
                            borderRadius: '8px',
                            padding: '8px',
                            fontSize: '0.75rem',
                            fontWeight: 900,
                            marginBottom: '4px',
                            boxShadow: '2px 2px 0 black'
                          }}>
                            <div style={{ fontSize: '0.65rem', opacity: 0.7, marginBottom: '4px' }}>@{ev.user_name}</div>
                            {ev.title}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* AI Suggestions Sidebar */}
        <div className="ai-suggestions-sidebar">
          <div className="neo-card" style={{ background: '#f5f3ff', border: '4px solid black', padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px', color: '#6d28d9', margin: '0 0 20px 0' }}>
              <Sparkles size={22} /> AI Meeting Tips
            </h3>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.7, marginBottom: '20px' }}>
              We analyzed everyone's availability. These are the best times for a group session:
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
              {suggestions.map((slot, i) => (
                <div 
                  key={i} 
                  className="suggestion-card neo-card" 
                  onClick={() => handleSlotClick(slot.day_of_week, slot.hour)}
                  style={{ 
                    padding: '12px', 
                    cursor: 'pointer', 
                    background: i === 0 ? '#ede9fe' : 'white',
                    transition: 'transform 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontWeight: 900, fontSize: '0.9rem' }}>{slot.day_name}</span>
                    <span style={{ background: 'black', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 900 }}>
                      {slot.count}/{slot.total_members} Free
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', marginTop: '5px' }}>{slot.hour}:00</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '10px', fontSize: '0.75rem', fontWeight: 900, color: '#6d28d9' }}>
                    <Check size={14} /> Recommended
                  </div>
                </div>
              ))}
              {suggestions.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.5 }}>
                  <Users size={32} style={{ marginBottom: '10px' }} />
                  <p>Add more members to get AI suggestions!</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .calendar-cell:hover {
          background: #fdf2f8;
        }
        .suggestion-card:hover {
          transform: translate(-4px, -4px);
          box-shadow: 6px 6px 0 black;
        }
        .shared-grid-container::-webkit-scrollbar {
          width: 10px;
        }
        .shared-grid-container::-webkit-scrollbar-thumb {
          background: black;
          border-radius: 10px;
        }
      `}} />
    </div>
  );
};

