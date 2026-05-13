import { useState, useEffect } from 'react';
import {
    LiveKitRoom,
    VideoConference,
    useRoomContext,
} from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';

interface TranscriptionSegment {
    id: string;
    text: string;
    final: boolean;
    participant?: any;
}
import '@livekit/components-styles';
import { Loader2, X, MessageSquare, BookOpen, Quote, Sparkles, Brain, ChevronRight, CheckSquare } from 'lucide-react';
import { getLiveKitToken } from '../../services/sessionApi';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { toast } from 'sonner';

interface TranscriptionMessage {
    id: string;
    text: string;
    participant: string;
    timestamp: number;
}

interface LiveKitVideoChatProps {
    sessionId: number;
    onLeave: () => void;
}

export const LiveKitVideoChat = ({ sessionId, onLeave }: LiveKitVideoChatProps) => {
    const [token, setToken] = useState<string | null>(null);
    const [serverUrl, setServerUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAI, setShowAI] = useState(true);

    useEffect(() => {
        const fetchToken = async () => {
            try {
                const res = await getLiveKitToken(sessionId);
                setToken(res.data.token);
                setServerUrl(res.data.serverUrl);
                setLoading(false);
            } catch (err) {
                console.error("Failed to get LiveKit token", err);
                setLoading(false);
            }
        };

        fetchToken();
    }, [sessionId]);

    if (loading) {
        return (
            <div className="loading-overlay" style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 className="animate-spin" size={40} color="#6366f1" />
                <p style={{ marginTop: '10px', color: '#666', fontWeight: 900 }}>AUTHENTICATING LIVEKIT...</p>
            </div>
        );
    }

    if (!token || !serverUrl) {
        return (
            <div className="neo-card" style={{ padding: '40px', textAlign: 'center' }}>
                <h3 style={{ color: '#ef4444' }}>LiveKit Authentication Failed</h3>
                <p>Could not retrieve access token. Make sure LIVEKIT keys are set in .env</p>
                <button className="neo-btn" onClick={onLeave} style={{ marginTop: '20px' }}>Go Back</button>
            </div>
        );
    }


    return (
        <div className="video-session-container" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
            <div className="video-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ background: '#fef08a', padding: '10px', border: '2px solid black', borderRadius: '8px' }}>
                        <Brain size={24} />
                    </div>
                    <div>
                        <h2 className="section-title" style={{ margin: 0, fontSize: '1.2rem' }}>AI-Infused Study Session</h2>
                        <p style={{ fontSize: '0.7rem', fontWeight: 900, opacity: 0.6 }}>ENCRYPTED • LIVE TRANSCRIPTION ACTIVE</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        className={`btn-neo btn-neo-sm ${showAI ? 'btn-neo-accent' : 'btn-neo-secondary'}`}
                        onClick={() => setShowAI(!showAI)}
                        title={showAI ? "Hide AI Sidebar" : "Show AI Sidebar"}
                    >
                        <Sparkles size={16} />
                        <span style={{ marginLeft: '4px' }}>{showAI ? 'HIDE AI' : 'SHOW AI'}</span>
                    </button>
                    <button
                        className="btn-neo btn-neo-danger btn-neo-icon sm"
                        onClick={onLeave}
                        title="Leave Session"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            <div className="video-frame-wrapper" style={{ flex: 1, padding: 0, position: 'relative', overflow: 'hidden', border: '4px solid black', boxShadow: '8px 8px 0 black', display: 'flex' }}>
                <LiveKitRoom
                    video={true}
                    audio={true}
                    token={token}
                    serverUrl={serverUrl}
                    onDisconnected={onLeave}
                    data-lk-theme="default"
                    style={{ height: '100%', width: '100%', display: 'flex' }}
                >
                    <div style={{ flex: 1, position: 'relative', background: '#000' }}>
                        <VideoConference />
                    </div>
                    {showAI && <TranscriptionSidebar />}
                </LiveKitRoom>
            </div>
        </div>
    );
};

// --- TRANSCRIPTION SIDEBAR COMPONENT ---
const TranscriptionSidebar = () => {
const room = useRoomContext();
const [messages, setMessages] = useState<TranscriptionMessage[]>([]);
const [interimTranscript, setInterimTranscript] = useState<string>("");
const [isSummarizing, setIsSummarizing] = useState(false);
const [summaryData, setSummaryData] = useState<{ summary: string, tasks: string[] } | null>(null);

const handleExportNotes = async () => {
    if (messages.length === 0) {
        toast.error("No transcription data to summarize yet.");
        return;
    }
    setIsSummarizing(true);
    try {
        const transcript = messages.map(m => `${m.participant}: ${m.text}`).join('\n');
        const token = localStorage.getItem('access_token');
        const res = await axios.post(`${API_BASE_URL}/api/session/summary/`, { transcript }, {
            headers: { 'Authorization': `Token ${token}` }
        });
        setSummaryData(res.data);
        toast.success('Study notes generated!');
    } catch (err) {
        console.error(err);
        toast.error('Failed to generate notes. Need more conversation data.');
    }
    setIsSummarizing(false);
};

useEffect(() => {
    const handleTranscription = (segments: TranscriptionSegment[]) => {
        console.log("📝 Transcription Received:", segments);
        segments.forEach(segment => {
            if (segment.final) {
                setMessages(prev => [
                    ...prev,
                    {
                        id: segment.id,
                        text: segment.text,
                        participant: segment.participant?.identity || "Unknown",
                        timestamp: Date.now()
                    }
                ].slice(-50));
            }
        });
    };

    const handleData = (payload: Uint8Array, participant?: any) => {
        try {
            const decoder = new TextDecoder();
            const rawData = decoder.decode(payload);
            console.log("📡 Data Received:", rawData);

            try {
                const data = JSON.parse(rawData);
                if (data.type === 'transcript') {
                    if (data.isFinal) {
                        setMessages(prev => [...prev, {
                            id: data.id || Math.random().toString(),
                            text: data.text,
                            participant: participant?.identity || "Participant",
                            timestamp: data.timestamp || Date.now()
                        }].slice(-50));
                        // Clear any interim for this participant if we had a more complex state
                        // For now, simplicity: final messages just append
                    } else {
                        // Handle interim from others
                        setInterimTranscript(prev => {
                            // If it's from the same participant, we could show it
                            // For now, we only show local interim in the dedicated state
                            // To show others' interims, we'd need a map of participant -> interim
                            return prev;
                        });

                        // Let's actually support others' interims by updating a "Live" message
                        setMessages(prev => {
                            const existingIndex = prev.findIndex(m => m.id === `interim-${participant?.identity}`);
                            const newMessage = {
                                id: `interim-${participant?.identity}`,
                                text: data.text,
                                participant: participant?.identity || "Participant",
                                timestamp: Date.now(),
                                isInterim: true
                            };
                            if (existingIndex >= 0) {
                                const next = [...prev];
                                next[existingIndex] = newMessage;
                                return next;
                            } else {
                                return [...prev, newMessage].slice(-50);
                            }
                        });
                    }
                    return;
                }
            } catch (e) {
                // Fallback for plain text data
                if (rawData.length > 1) {
                    setMessages(prev => [...prev, {
                        id: Math.random().toString(),
                        text: rawData,
                        participant: participant?.identity || "System",
                        timestamp: Date.now()
                    }].slice(-50));
                }
            }
        } catch (e) { }
    }

    room.on(RoomEvent.TranscriptionReceived, handleTranscription);
    room.on(RoomEvent.DataReceived, handleData);

    // Start Local Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    let recognition: any = null;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        let lastBroadcastTime = 0;
        const BROADCAST_THROTTLE = 250; // ms

        recognition.onresult = (event: any) => {
            let interim = "";
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcript = event.results[i][0].transcript.trim();

                if (event.results[i].isFinal) {
                    if (transcript.length > 1) {
                        // 1. Commit to local list
                        setMessages(prev => [
                            ...prev.filter(m => m.id !== 'local-interim'),
                            {
                                id: Math.random().toString(),
                                text: transcript,
                                participant: "You",
                                timestamp: Date.now()
                            }
                        ].slice(-50));

                        // 2. Broadcast Final
                        try {
                            const payload = JSON.stringify({
                                type: 'transcript',
                                text: transcript,
                                isFinal: true,
                                id: Math.random().toString(),
                                timestamp: Date.now()
                            });
                            room.localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true });
                        } catch (err) { }
                    }
                    setInterimTranscript("");
                } else {
                    interim += event.results[i][0].transcript;
                    setInterimTranscript(interim);

                    // Broadcast interim with throttling
                    const now = Date.now();
                    if (now - lastBroadcastTime > BROADCAST_THROTTLE && interim.length > 3) {
                        lastBroadcastTime = now;
                        try {
                            const payload = JSON.stringify({
                                type: 'transcript',
                                text: interim,
                                isFinal: false,
                                id: 'local-interim',
                                timestamp: now
                            });
                            room.localParticipant.publishData(new TextEncoder().encode(payload), { reliable: false });
                        } catch (err) { }
                    }
                }
            }
        };

        recognition.onend = () => {
            try { recognition?.start(); } catch (e) { }
        };

        try {
            recognition.start();
        } catch (e) { }
    }

    return () => {
        room.off(RoomEvent.TranscriptionReceived, handleTranscription);
        room.off(RoomEvent.DataReceived, handleData);
        if (recognition) {
            recognition.onend = null;
            recognition.stop();
        }
    };
}, [room]);

// Auto-scroll to bottom
useEffect(() => {
    const container = document.querySelector('.transcript-feed');
    if (container) {
        container.scrollTop = container.scrollHeight;
    }
}, [messages, interimTranscript]);

return (
    <div className="transcription-sidebar animate-in slide-in-from-right duration-300" style={{
        width: '350px',
        background: '#fffceb',
        borderLeft: '4px solid black',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        zIndex: 50
    }}>
        <div style={{ padding: '24px', borderBottom: '4px solid black', background: '#bae6fd' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: 'white', border: '2px solid black', padding: '5px', borderRadius: '5px' }}>
                        <Sparkles size={18} className="text-indigo-600" />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900 }}>AI STUDY NOTES</h3>
                </div>
                <div style={{ width: '10px', height: '10px', background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 10px #22c55e' }} className="animate-pulse"></div>
            </div>
            <p style={{ fontSize: '0.65rem', fontWeight: 900, opacity: 0.6 }}>LISTENING FOR AUDIO...</p>
        </div>

        <div className="transcript-feed" style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', scrollBehavior: 'smooth' }}>
            {messages.length === 0 && !interimTranscript ? (
                <div style={{ textAlign: 'center', marginTop: '60px' }}>
                    <div style={{ width: '60px', height: '60px', background: '#fef08a', border: '3px solid black', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '4px 4px 0 black' }}>
                        <Loader2 className="animate-spin" size={24} />
                    </div>
                    <p style={{ fontSize: '0.8rem', fontWeight: 900, color: '#475569' }}>LISTENING FOR AUDIO...</p>
                    <p style={{ fontSize: '0.6rem', fontWeight: 900, color: '#94a3b8', marginTop: '10px' }}>START TALKING TO SEE TRANSCRIPTS</p>
                </div>
            ) : (
                <>
                    {messages.map((m) => (
                        <div key={m.id} className="animate-in fade-in slide-in-from-bottom-2" style={{
                            background: 'white',
                            border: '3px solid black',
                            padding: '15px',
                            boxShadow: '4px 4px 0 black',
                            position: 'relative'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ fontSize: '0.6rem', fontWeight: 900, background: '#fef08a', padding: '2px 8px', border: '1px solid black', borderRadius: '4px' }}>
                                    {m.participant}
                                </span>
                                <span style={{ fontSize: '0.55rem', fontWeight: 700, opacity: 0.4 }}>
                                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a', lineHeight: '1.5', fontFamily: 'Courier New' }}>
                                "{m.text}"
                            </div>
                        </div>
                    ))}

                    {interimTranscript && (
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.6)',
                            border: '3px dashed #cbd5e1',
                            padding: '15px',
                            boxShadow: '4px 4px 0 rgba(0,0,0,0.05)',
                            position: 'relative',
                            opacity: 0.8
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ fontSize: '0.6rem', fontWeight: 900, background: '#e2e8f0', padding: '2px 8px', border: '1px solid #94a3b8', borderRadius: '4px' }}>
                                    You (Speaking...)
                                </span>
                            </div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b', lineHeight: '1.5', fontFamily: 'Courier New', fontStyle: 'italic' }}>
                                {interimTranscript}...
                            </div>
                        </div>
                    )}
                </>
            )}

            {summaryData && (
                <div className="animate-in fade-in slide-in-from-bottom-2" style={{
                    background: '#f0fdf4', border: '3px solid black', padding: '15px',
                    boxShadow: '4px 4px 0 black', marginTop: '10px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <Brain size={18} className="text-green-600" />
                        <h4 style={{ margin: 0, fontWeight: 900, fontSize: '0.8rem' }}>AI SESSION SUMMARY</h4>
                    </div>
                    <p style={{ fontSize: '0.85rem', lineHeight: '1.4', marginBottom: '15px' }}>{summaryData.summary}</p>

                    <h4 style={{ margin: '0 0 10px 0', fontWeight: 900, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <CheckSquare size={16} /> ACTION ITEMS
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem' }}>
                        {summaryData.tasks.map((task, i) => (
                            <li key={i} style={{ marginBottom: '5px' }}>{task}</li>
                        ))}
                    </ul>
                </div>
            )}
            {/* Scroll Anchor */}
            <div id="transcript-bottom" />
        </div>

        <div style={{ padding: '20px', borderTop: '4px solid black', background: '#f8fafc' }}>
            <button
                onClick={handleExportNotes}
                disabled={isSummarizing || messages.length === 0}
                className="btn-neo btn-neo-accent"
                style={{ width: '100%', gap: '10px' }}
            >
                {isSummarizing ? <Loader2 className="animate-spin" size={18} /> : <BookOpen size={18} />}
                <span>{isSummarizing ? 'GENERATING SUMMARY...' : 'EXPORT STUDY NOTES'}</span>
            </button>
        </div>
    </div>
);
};
