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
import { Loader2, X, MessageSquare, BookOpen, Quote, Sparkles, Brain, ChevronRight } from 'lucide-react';
import { getLiveKitToken } from '../../services/sessionApi';

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
                   <button className={`nb-btn ${showAI ? 'primary' : ''}`} onClick={() => setShowAI(!showAI)} style={{ fontSize: '0.7rem' }}>
                      <Sparkles size={14} /> {showAI ? 'HIDE AI' : 'SHOW AI'}
                   </button>
                   <button className="nb-btn danger" style={{ padding: '8px' }} onClick={onLeave}>
                      <X size={20} />
                   </button>
                </div>
            </div>
            
            <div className="video-frame-wrapper" style={{ flex: 1, padding: 0, position: 'relative', overflow: 'hidden', border: '4px solid black', boxSshadow: '8px 8px 0 black', display: 'flex' }}>
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
                const text = decoder.decode(payload);
                console.log("📡 Data Received:", text);
                if (text.length > 2) {
                   setMessages(prev => [...prev, {
                       id: Math.random().toString(),
                       text: text,
                       participant: participant?.identity || "System",
                       timestamp: Date.now()
                   }].slice(-50));
                }
            } catch(e) {}
        }

        room.on(RoomEvent.TranscriptionReceived, handleTranscription);
        room.on(RoomEvent.DataReceived, handleData);
        
        // Start Local Speech Recognition
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        let recognition: any = null;
        
        if (SpeechRecognition) {
            recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onresult = (event: any) => {
                const transcript = event.results[event.results.length - 1][0].transcript;
                if (transcript && transcript.trim().length > 2) {
                    // 1. Show locally
                    setMessages(prev => [...prev, {
                        id: Math.random().toString(),
                        text: transcript.trim(),
                        participant: "You",
                        timestamp: Date.now()
                    }].slice(-50));
                    
                    // 2. Broadcast to room
                    try {
                        const encoder = new TextEncoder();
                        const data = encoder.encode(transcript.trim());
                        // Send to everyone via reliable data channel
                        room.localParticipant.publishData(data, { reliable: true });
                    } catch (err) {
                        console.error("Failed to broadcast transcript", err);
                    }
                }
            };

            recognition.onend = () => {
                // Auto restart
                try { recognition?.start(); } catch(e) {}
            };

            try {
                recognition.start();
            } catch(e) {}
        }

        return () => {
            room.off(RoomEvent.TranscriptionReceived, handleTranscription);
            room.off(RoomEvent.DataReceived, handleData);
            if (recognition) {
                recognition.onend = null; // Prevent restart
                recognition.stop();
            }
        };
    }, [room]);

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
            
            <div className="transcript-feed" style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', marginTop: '60px' }}>
                        <div style={{ width: '60px', height: '60px', background: '#fef08a', border: '3px solid black', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '4px 4px 0 black' }}>
                            <Loader2 className="animate-spin" size={24} />
                        </div>
                        <p style={{ fontSize: '0.8rem', fontWeight: 900, color: '#475569' }}>LISTENING FOR AUDIO...</p>
                        <p style={{ fontSize: '0.6rem', fontWeight: 900, color: '#94a3b8', marginTop: '10px' }}>START TALKING TO SEE TRANSCRIPTS</p>
                    </div>
                ) : (
                    messages.map((m) => (
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
                    ))
                )}
                {/* Scroll Anchor */}
                <div id="transcript-bottom" />
            </div>
            
            <div style={{ padding: '20px', borderTop: '4px solid black', background: '#f8fafc' }}>
                <button className="nb-btn primary w-full" style={{ width: '100%', fontSize: '0.75rem' }}>
                    <BookOpen size={16} /> EXPORT STUDY NOTES
                </button>
            </div>
        </div>
    );
};
