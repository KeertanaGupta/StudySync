import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, ChevronLeft, ChevronRight, Video, BookOpen, Users, X, Sparkles, Upload, Wand2, Loader2 } from 'lucide-react';
import { getSessions, createSession, getGroups, getOptimalSlots, updateAvailability, getAvailability, uploadTimetableOcr, syncGoogleCalendar } from '../../../services/sessionApi';
import { toast } from 'sonner';

interface ScheduleEvent {
  id: number;
  title: string;
  day: number;
  date: string; // Add ISO date component
  startHour: number;
  duration: number;
  type: 'session' | 'study' | 'group';
  color: string;
  room_url?: string;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0 to 23

// Helper to get YYYY-MM-DD in local time
const getLocalDateString = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface SchedulePageProps {
  onJoinSession: (sessionId: number) => void;
}

export const SchedulePage = ({ onJoinSession }: SchedulePageProps) => {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', day: 0, startHour: 9, duration: 1 });
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showOptimizeModal, setShowOptimizeModal] = useState(false);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [showOcrPanel, setShowOcrPanel] = useState(false);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [clickedEvent, setClickedEvent] = useState<ScheduleEvent | null>(null);

  const handleSyncCalendar = async () => {
    setIsSyncingCalendar(true);
    try {
      const res = await syncGoogleCalendar();
      if (res.data.events && res.data.events.length > 0) {
        toast.success(`Synced ${res.data.events.length} events from Google Calendar!`);
        fetchEvents();
      } else {
        toast.info("No upcoming events found on Google Calendar.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to sync Google Calendar. Please re-login with Google to refresh token.");
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const [sessionsRes, availRes, gcalRes] = await Promise.all([
        getSessions(),
        getAvailability(),
        syncGoogleCalendar().catch(() => ({ data: { events: [] } }))
      ]);
      
      const mappedSessions: ScheduleEvent[] = (sessionsRes.data || []).map((s: any, idx: number) => {
        const d = new Date(s.scheduled_time);
        return {
          id: s.id,
          title: s.title,
          date: getLocalDateString(d),
          day: (d.getDay() + 6) % 7,
          startHour: d.getHours(),
          duration: Math.ceil(s.duration / 60),
          type: 'session',
          color: ['#bae6fd', '#fef08a', '#bbf7d0', '#fbcfe8'][idx % 4]
        };
      });

      const mappedAvail: ScheduleEvent[] = (availRes.data || []).map((a: any) => {
        const startH = parseInt(a.start_time.split(':')[0]);
        const endH = parseInt(a.end_time.split(':')[0]);
        return {
          id: a.id,
          title: 'Class/Availability',
          date: '', // Weekly recurring
          day: a.day_of_week,
          startHour: startH,
          duration: Math.max(1, endH - startH),
          type: 'study',
          color: '#e2e8f0'
        };
      });

      const mappedGcal: ScheduleEvent[] = (gcalRes.data.events || []).map((ge: any) => {
        const d = new Date(ge.start);
        const endD = new Date(ge.end);
        const durHours = Math.ceil((endD.getTime() - d.getTime()) / (1000 * 60 * 60));
        return {
          id: Math.floor(Math.random() * 1000000),
          title: 'G-Cal: ' + (ge.summary || 'Event'),
          date: getLocalDateString(d),
          day: (d.getDay() + 6) % 7,
          startHour: d.getHours(),
          duration: durHours || 1,
          type: 'study',
          color: '#f87171' // Red tint for Google events
        };
      });

      setEvents([...mappedSessions, ...mappedAvail, ...mappedGcal]);
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await getGroups();
      if (Array.isArray(res.data)) {
        setGroups(res.data);
        if (res.data.length > 0) setSelectedGroupId(res.data[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch groups", err);
    }
  };
  const handleOCR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsOcrLoading(true);
    
    try {
      const res = await uploadTimetableOcr(file);
      
      if (res.data.status === "OCR Success") {
        toast.success(`ENGINE SYNCED ${res.data.count} SLOTS!`);
        fetchEvents();
      } else {
        toast.error(res.data.error || "Could not detect patterns.");
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || "PYTHON OCR ENGINE ERROR";
      toast.error(errMsg);
    } finally {
      setIsOcrLoading(false);
      setShowOcrPanel(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchGroups();
  }, []);

  const getWeekDates = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monday = new Date(today);
    const day = today.getDay();
    const diff = today.getDate() - (day === 0 ? 6 : day - 1) + currentWeekOffset * 7;
    monday.setDate(diff);
    
    return DAYS.map((day, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return { 
        day, 
        date: date.getDate(), 
        fullDate: getLocalDateString(date), // Local YYYY-MM-DD
        month: date.toLocaleString('default', { month: 'short' }), 
        isToday: date.toDateString() === today.toDateString() 
      };
    });
  };

  const weekDates = getWeekDates();

  const getEventsForSlot = (dayIndex: number, hour: number) => {
    const slotDate = weekDates[dayIndex].fullDate;
    return events.filter(e => 
      (e.date === slotDate && e.startHour === hour) || 
      (e.date === '' && e.day === dayIndex && e.startHour === hour)
    );
  };

  const typeIcons: Record<string, React.ReactNode> = {
    session: <Video size={12} />,
    study: <BookOpen size={12} />,
    group: <Users size={12} />,
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title"><Calendar size={28} /> Study Schedule</h1>
          <p className="page-subtitle">Plan your week and never miss a study session.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="nb-btn primary" onClick={handleSyncCalendar} disabled={isSyncingCalendar} style={{ background: '#f87171' }}>
            {isSyncingCalendar ? <Loader2 size={18} className="animate-spin" /> : <Calendar size={18} />} G-CAL SYNC
          </button>
          <button className="nb-btn primary" onClick={() => setShowOcrPanel(!showOcrPanel)}>
            <Sparkles size={18} /> MAGIC SYNC
          </button>
          <button className="neo-btn" onClick={() => setShowOptimizeModal(true)}>
            <Users size={18} /> Optimal Slots
          </button>
          <button className="neo-btn primary" onClick={() => setShowAddModal(!showAddModal)}>
            <Plus size={18} /> Add Event
          </button>
        </div>
      </div>
      {/* OCR Panel */}
      {showOcrPanel && (
        <div className="nb-card animate-in slide-in-from-top" style={{ marginBottom: '30px', background: '#f5f3ff', borderColor: '#8b5cf6' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Wand2 className="text-purple-600" /> MAGIC TIMETABLE SYNC
                </h3>
                <p style={{ fontSize: '0.7rem', fontWeight: 900, opacity: 0.6 }}>UPLOAD IMAGE • AI PARSE • SYNC SCHEDULE</p>
              </div>
              <button className="nb-btn-icon" onClick={() => setShowOcrPanel(false)}><X size={20} /></button>
           </div>

           <div className="ocr-upload-zone" style={{ 
              border: '3px dashed #8b5cf6', 
              background: 'white', 
              padding: '40px', 
              textAlign: 'center',
              borderRadius: '15px'
           }}>
              {isOcrLoading ? (
                <div style={{ textAlign: 'center' }}>
                  <Loader2 className="animate-spin" size={40} style={{ margin: '0 auto 20px', color: '#8b5cf6' }} />
                  <p style={{ fontWeight: 900 }}>PYTHON OCR IS ANALYZING YOUR IMAGE...</p>
                  <p style={{ fontSize: '0.7rem', fontWeight: 900, opacity: 0.5, marginTop: '10px' }}>HEAVY PROCESSING ON SERVER</p>
                </div>
              ) : (
                <label style={{ cursor: 'pointer' }}>
                  <input type="file" style={{ display: 'none' }} accept="image/*" onChange={handleOCR} />
                  <Upload size={40} style={{ margin: '0 auto 15px', opacity: 0.5 }} />
                  <p style={{ fontWeight: 900, fontSize: '1rem' }}>CLICK TO UPLOAD TIMETABLE PHOTO</p>
                  <p style={{ fontSize: '0.6rem', fontWeight: 900, opacity: 0.4, marginTop: '10px' }}>SUPPORTS PNG, JPG, WEBP • MAX 10MB</p>
                </label>
              )}
           </div>
           <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(255,255,255,0.5)', border: '2px solid black', borderRadius: '8px' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 900 }}>💡 TIP: Clear white-background images with legible text work best!</p>
           </div>
        </div>
      )}

      {/* Optimization Modal */}
      {showOptimizeModal && (
        <div className="neo-card add-event-form" style={{ marginBottom: '20px', border: '3px solid #6366f1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, fontWeight: 900 }}>🧠 Group Optimization Engine</h3>
            <button className="neo-btn-icon small" onClick={() => setShowOptimizeModal(false)}><X size={14} /></button>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <select 
              className="neo-input" 
              value={selectedGroupId || ''} 
              onChange={e => setSelectedGroupId(Number(e.target.value))}
            >
              <option value="">Select Group...</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <button 
              className="neo-btn primary" 
              disabled={!selectedGroupId}
              onClick={async () => {
                const res = await getOptimalSlots(selectedGroupId!);
                setSuggestions(res.data);
              }}
            >
              Calculate Best Slots
            </button>
          </div>

          {suggestions.length > 0 && (
            <div className="suggestions-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
              {suggestions.map((s, i) => (
                <div key={i} className="neo-card suggestion-item" style={{ padding: '10px', background: i === 0 ? '#f0fdf4' : 'white' }}>
                  <div style={{ fontWeight: 900, fontSize: '0.9rem' }}>{s.day_name} @ {s.hour}:00</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{s.count}/{s.total_members} members free</div>
                  <button 
                    className="neo-btn small primary" 
                    style={{ marginTop: '10px', width: '100%' }}
                    onClick={async () => {
                      // Logic to schedule
                      toast.success(`Scheduled for ${s.day_name} at ${s.hour}:00`);
                      setShowOptimizeModal(false);
                    }}
                  >
                    Schedule
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Week Navigation */}
      <div className="week-nav">
        <button className="neo-btn-icon" onClick={() => setCurrentWeekOffset(prev => prev - 1)}>
          <ChevronLeft size={20} />
        </button>
        <span className="week-label">
          {weekDates[0].month} {weekDates[0].date} — {weekDates[6].month} {weekDates[6].date}
        </span>
        <button className="neo-btn-icon" onClick={() => setCurrentWeekOffset(prev => prev + 1)}>
          <ChevronRight size={20} />
        </button>
        <button className="neo-btn small" onClick={() => setCurrentWeekOffset(0)}>Today</button>
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="neo-card add-event-form" style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '15px', fontWeight: 900 }}>📅 New Study Block</h3>
          <div className="form-row">
            <input
              type="text"
              className="neo-input"
              placeholder="What are you studying?"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            />
            <select className="neo-input" value={newEvent.day} onChange={e => setNewEvent({ ...newEvent, day: +e.target.value })}>
              {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
            </select>
            <select className="neo-input" value={newEvent.startHour} onChange={e => setNewEvent({ ...newEvent, startHour: +e.target.value })}>
              {HOURS.map(h => <option key={h} value={h}>{h}:00</option>)}
            </select>
            <button className="neo-btn primary">Save</button>
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="schedule-grid-wrapper neo-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="schedule-grid">
          {/* Header Row */}
          <div className="schedule-header-cell time-col">
            <Clock size={14} />
          </div>
          {weekDates.map((wd, i) => (
            <div key={i} className={`schedule-header-cell ${wd.isToday ? 'today' : ''}`}>
              <span className="day-name">{wd.day}</span>
              <span className={`day-number ${wd.isToday ? 'today-badge' : ''}`}>{wd.date}</span>
            </div>
          ))}

          {/* Time Rows */}
          {HOURS.map(hour => (
            <div style={{ display: 'contents' }} key={`row-${hour}`}>
              <div key={`time-${hour}`} className="schedule-time-cell">
                {hour}:00
              </div>
              {DAYS.map((_, dayIndex) => {
                const slotEvents = getEventsForSlot(dayIndex, hour);
                return (
                  <div key={`${dayIndex}-${hour}`} className="schedule-cell">
                    {slotEvents.map(ev => (
                      <div
                        key={ev.id}
                        className="schedule-event"
                        style={{
                          background: ev.color,
                          height: `${ev.duration * 60 - 4}px`,
                        }}
                        onClick={() => {
                          setClickedEvent(ev);
                        }}
                      >
                        <div className="event-type-badge">{typeIcons[ev.type]}</div>
                        <span className="event-title">{ev.title}</span>
                        <span className="event-time">{ev.startHour}:00 - {ev.startHour + ev.duration}:00</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="schedule-stats">
        <div className="neo-card stat-mini">
          <div className="stat-mini-value">{events.filter(e => e.type === 'study').length}</div>
          <div className="stat-mini-label">Study Blocks</div>
        </div>
        <div className="neo-card stat-mini">
          <div className="stat-mini-value">{events.filter(e => e.type === 'session').length}</div>
          <div className="stat-mini-label">Live Sessions</div>
        </div>
        <div className="neo-card stat-mini">
          <div className="stat-mini-value">{events.filter(e => e.type === 'group').length}</div>
          <div className="stat-mini-label">Group Events</div>
        </div>
        <div className="neo-card stat-mini">
          <div className="stat-mini-value">{events.reduce((acc, e) => acc + e.duration, 0)}h</div>
          <div className="stat-mini-label">Total Hours</div>
        </div>
      </div>

      {/* Event Details Modal */}
      {clickedEvent && (
        <>
          <div className="neo-card animate-in slide-in-from-bottom-2" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000, width: '90%', maxWidth: '400px', boxShadow: '8px 8px 0 black', border: '4px solid black' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <div className="event-type-badge" style={{ display: 'inline-flex', padding: '5px 10px', background: clickedEvent.color, border: '2px solid black', borderRadius: '20px', fontWeight: 900, fontSize: '0.7rem', marginBottom: '10px' }}>
                  {clickedEvent.type.toUpperCase()}
                </div>
                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>{clickedEvent.title}</h3>
              </div>
              <button className="nb-btn-icon" onClick={() => setClickedEvent(null)}><X size={20} /></button>
            </div>
            
            <div style={{ background: '#f8fafc', padding: '15px', border: '2px solid black', borderRadius: '8px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', fontWeight: 700 }}>
                <Calendar size={16} /> {DAYS[clickedEvent.day]} {clickedEvent.date && `(${clickedEvent.date})`}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700 }}>
                <Clock size={16} /> {clickedEvent.startHour}:00 - {clickedEvent.startHour + clickedEvent.duration}:00 ({clickedEvent.duration} hrs)
              </div>
            </div>

            {clickedEvent.type === 'session' && (
               <button className="nb-btn primary" style={{ width: '100%', padding: '15px', fontSize: '1rem' }} onClick={() => {
                 setClickedEvent(null);
                 onJoinSession(clickedEvent.id);
               }}>
                 <Video size={20} /> Join Live Session
               </button>
            )}
          </div>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }} onClick={() => setClickedEvent(null)} />
        </>
      )}
    </div>
  );
};
