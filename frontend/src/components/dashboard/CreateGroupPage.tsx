import { AdvancedScheduler } from './AdvancedScheduler'; // The file we just built!

export const CreateGroupPage = () => {
  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, margin: 0 }}>Form a Squad</h1>
        <p style={{ fontFamily: 'monospace', fontSize: '1.2rem', opacity: 0.8 }}>
          Select members. Our AI constraint engine will find a time where everyone is free.
        </p>
      </div>

      {/* Inject the AI Scheduler directly into the group creation flow! */}
      <AdvancedScheduler />
      
    </div>
  );
};