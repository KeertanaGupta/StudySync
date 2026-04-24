import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, X, Users, Trash2 } from 'lucide-react';
import { getGroupEvents, createGroupEvent } from '../../../services/sessionApi';
import { toast } from 'sonner';

interface GroupCalendarProps {
  groupId: number;
  groupName: string;
  memberIds?: number[];
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

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const GroupCalendar: React.FC<GroupCalendarProps> = ({ groupId, groupName }) => {
  const [events, setEvents] = useState<GroupEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', day: 0, startHour: 9 });

  const fetchEvents = async () => {
    try {
      const res = await getGroupEvents(groupId);
      setEvents(res.data);
    } catch (err) {
      console.error("Failed to fetch group events", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [groupId]);

  const handleAddEvent = async () => {
    if (!newEvent.title) return;
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
      fetchEvents();
      toast.success("Event added to group calendar!");
    } catch (err) {
      toast.error("Failed to add event.");
    }
  };

  const getEventsForSlot = (dayIndex: number, hour: number) => {
    return events.filter(e => e.day_of_week === dayIndex && e.start_hour === hour);
  };

  return (
    <div className="group-calendar-shared neo-card" style={{ marginTop: '20px', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={22} /> {groupName} Shared Calendar
          </h3>
          <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>Coordinate study times with your team manually.</p>
        </div>
        <button className="neo-btn primary small" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Add Slot
        </button>
      </div>

      {showAddModal && (
        <div className="neo-card" style={{ marginBottom: '20px', background: '#f8fafc', border: '3px solid black' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            <h4 style={{ fontWeight: 900 }}>📅 Add Group Slot</h4>
            <button className="neo-btn-icon small" onClick={() => setShowAddModal(false)}><X size={14} /></button>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input 
              className="neo-input" 
              placeholder="Event / Busy Note" 
              style={{ flex: 1, minWidth: '200px' }}
              value={newEvent.title}
              onChange={e => setNewEvent({...newEvent, title: e.target.value})}
            />
            <select className="neo-input" value={newEvent.day} onChange={e => setNewEvent({...newEvent, day: +e.target.value})}>
              {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
            </select>
            <select className="neo-input" value={newEvent.startHour} onChange={e => setNewEvent({...newEvent, startHour: +e.target.value})}>
              {HOURS.map(h => <option key={h} value={h}>{h}:00</option>)}
            </select>
            <button className="neo-btn primary" onClick={handleAddEvent}>Save to Group</button>
          </div>
        </div>
      )}

      <div className="shared-grid-container" style={{ maxHeight: '500px', overflowY: 'auto', border: '3px solid black', borderRadius: '12px' }}>
        <div className="shared-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: '80px repeat(7, 1fr)',
          background: 'white'
        }}>
          {/* Header Row */}
          <div style={{ padding: '15px', borderBottom: '2px solid black', borderRight: '2px solid black', background: '#f1f5f9' }}><Clock size={16} /></div>
          {DAYS.map(day => (
            <div key={day} style={{ 
              padding: '15px', 
              textAlign: 'center', 
              fontWeight: 900, 
              borderBottom: '2px solid black', 
              borderRight: '2px solid black',
              background: '#f1f5f9'
            }}>{day}</div>
          ))}

          {/* Time Rows */}
          {HOURS.slice(7, 23).map(hour => (
            <React.Fragment key={hour}>
              <div style={{ 
                padding: '10px', 
                textAlign: 'center', 
                fontSize: '0.8rem', 
                fontWeight: 700,
                borderBottom: '1px solid #e2e8f0',
                borderRight: '2px solid black',
                background: '#f8fafc'
              }}>{hour}:00</div>
              {DAYS.map((_, dayIdx) => {
                const slotEvents = getEventsForSlot(dayIdx, hour);
                return (
                  <div key={`${dayIdx}-${hour}`} style={{ 
                    minHeight: '60px', 
                    borderBottom: '1px solid #e2e8f0', 
                    borderRight: '1px solid #e2e8f0',
                    padding: '2px',
                    position: 'relative'
                  }}>
                    {slotEvents.map(ev => (
                      <div key={ev.id} style={{ 
                        background: ev.color, 
                        border: '2px solid black',
                        borderRadius: '4px',
                        padding: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        marginBottom: '2px',
                        boxShadow: '1px 1px 0 black'
                      }}>
                        <div style={{ fontSize: '0.6rem', opacity: 0.7, marginBottom: '2px' }}>@{ev.user_name}</div>
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

      <div style={{ marginTop: '15px', display: 'flex', gap: '15px', fontSize: '0.8rem', fontWeight: 700 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '12px', height: '12px', background: '#bae6fd', border: '1px solid black' }} /> Member A
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '12px', height: '12px', background: '#fef08a', border: '1px solid black' }} /> Member B
        </div>
        <p style={{ marginLeft: 'auto', opacity: 0.6 }}>Every member can see and add sessions.</p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .shared-grid::-webkit-scrollbar {
          width: 8px;
        }
        .shared-grid::-webkit-scrollbar-thumb {
          background: black;
          border-radius: 10px;
        }
      `}} />
    </div>
  );
};
