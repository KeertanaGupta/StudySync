import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, X, User } from 'lucide-react';
import { getGroupMessages, sendGroupMessage } from '../../../services/sessionApi';
import { useAuthStore } from '../../../store/authStore';

interface Message {
  id: number;
  user: {
    id: number;
    username: string;
    profile_picture?: string;
  };
  content: string;
  created_at: string;
}

interface GroupChatProps {
  groupId: number;
  groupName: string;
  onClose: () => void;
}

export const GroupChat: React.FC<GroupChatProps> = ({ groupId, groupName, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await getGroupMessages(groupId);
      setMessages(res.data);
    } catch (err) {
      console.error("Failed to fetch messages", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // Simple polling for new messages every 3 seconds
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [groupId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const tempMessage = newMessage;
      setNewMessage('');
      await sendGroupMessage(groupId, tempMessage);
      fetchMessages();
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  return (
    <div className="neo-card group-chat-overlay" style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '350px',
      height: '500px',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      background: 'white',
      padding: 0,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '15px',
        background: 'var(--neo-black)',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={18} /> {groupName} Chat
        </h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
          <X size={20} />
        </button>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} style={{
        flex: 1,
        overflowY: 'auto',
        padding: '15px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        background: '#f8fafc'
      }}>
        {loading && messages.length === 0 ? (
          <p style={{ textAlign: 'center', opacity: 0.5 }}>Loading messages...</p>
        ) : messages.length === 0 ? (
          <p style={{ textAlign: 'center', opacity: 0.5 }}>No messages yet. Say hi!</p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user.id === user?.id;
            return (
              <div key={msg.id} style={{
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: isMe ? 'flex-end' : 'flex-start'
              }}>
                {!isMe && <span style={{ fontSize: '0.7rem', fontWeight: 700, marginBottom: '2px', marginLeft: '4px' }}>{msg.user.username}</span>}
                <div style={{
                  padding: '8px 12px',
                  borderRadius: '12px',
                  border: '2px solid black',
                  background: isMe ? '#bae6fd' : 'white',
                  boxShadow: '2px 2px 0 black',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  wordBreak: 'break-word'
                }}>
                  {msg.content}
                </div>
                <span style={{ fontSize: '0.6rem', opacity: 0.5, marginTop: '2px' }}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} style={{
        padding: '15px',
        borderTop: '2px solid black',
        display: 'flex',
        gap: '10px',
        background: 'white'
      }}>
        <input
          type="text"
          className="neo-input"
          placeholder="Type a message..."
          style={{ flex: 1, height: '40px' }}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button type="submit" className="neo-btn-icon primary" style={{ width: '40px', height: '40px' }}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};
