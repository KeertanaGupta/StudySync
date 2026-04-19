import { useNavigate, useParams } from "react-router-dom";
import { LiveKitVideoChat } from "../dashboard/LiveKitVideoChat";

export default function JoinSession({ id }: { id: string }) {
  const navigate = useNavigate();
  const sessionId = parseInt(id);

  if (!sessionId) return <div className="neo-card">Invalid Session ID</div>;

  return (
    <div style={{ padding: '20px', background: '#f8fafc', minHeight: '100vh' }}>
      <LiveKitVideoChat 
        sessionId={sessionId} 
        onLeave={() => navigate('/')} 
      />
    </div>
  );
}