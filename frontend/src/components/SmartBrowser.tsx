import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

interface SmartTestBrowserProps {
  skillsToTest: string[];
  onComplete: () => void;
  onCancel: () => void;
}

export const SmartTestBrowser = ({ skillsToTest, onComplete, onCancel }: SmartTestBrowserProps) => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // --- API HANDLERS ---

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const token = localStorage.getItem('access_token');
        // We match your backend expectation: { skill: "Python" }
        const res = await axios.post('/api/quiz/generate/', 
          { skill: skillsToTest[0] },
          { headers: { 'Authorization': `Token ${token}` } }
        );
        
        if (res.data.questions && res.data.questions.length > 0) {
          setQuestions(res.data.questions);
        } else {
          throw new Error("No questions generated");
        }
      } catch (err) {
        toast.error("AI is overloaded. Please try again in a moment.");
        onCancel();
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [skillsToTest, onCancel]);

  const handleSelect = (option: string) => {
    setAnswers({ ...answers, [currentIndex]: option });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    let correctCount = 0;
    
    questions.forEach((q, index) => {
      if (answers[index] === q.correct_answer) correctCount++;
    });

    try {
      const token = localStorage.getItem('access_token');
      // Sending results to your SubmitQuizView
      await axios.post('/api/quiz/submit/', {
        skill: skillsToTest[0],
        correct_count: correctCount,
        total: questions.length
      }, {
        headers: { 'Authorization': `Token ${token}` }
      });

      toast.success("Verification successful! Dashboard updated.");
      onComplete(); 
    } catch (err) {
      toast.error("Failed to save your score.");
      setSubmitting(false);
    }
  };

  // --- UI RENDER LOGIC ---

  if (loading) {
    return (
      <div className="smart-browser-overlay">
        // Inside SmartBrowser.tsx
<style>{`
      .smart-browser-overlay {
        position: fixed; 
        top: 0; 
        left: 0; 
        width: 100vw; 
        height: 100vh;
        background-color: #fffceb; /* Solid color to block the dashboard */
        background-image: 
          linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px);
        background-size: 40px 40px; /* Keep the grid look */
        z-index: 9999; /* Higher than everything else */
        display: flex;
        flex-direction: column;
        padding: 60px;
        overflow-y: auto;
        box-sizing: border-box;
      }

      @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.02); opacity: 0.8; }
        100% { transform: scale(1); opacity: 1; }
      }
      .pulse-text { animation: pulse 1.5s infinite ease-in-out; }
    `}</style>
        <h1 className="pulse-text" style={{ fontSize: '3rem', fontWeight: 900, textAlign: 'center' }}>
          🧠 AI IS COMPILING YOUR TEST...
        </h1>
        <p style={{ fontFamily: 'monospace', marginTop: '20px', fontWeight: 'bold' }}>
          Analyzing documentation for {skillsToTest[0]}
        </p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="smart-browser-overlay">
      <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Header Section */}
        <div style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          borderBottom: '6px solid #000', paddingBottom: '20px', marginBottom: '40px' 
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 900, textTransform: 'uppercase' }}>
              LEVEL UP: {skillsToTest[0]}
            </h2>
            <div style={{ background: '#000', color: '#fff', display: 'inline-block', padding: '4px 12px', marginTop: '10px', fontWeight: 900, fontSize: '0.9rem' }}>
              DIFFICULTY: {currentQ?.difficulty?.toUpperCase() || 'MEDIUM'}
            </div>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1.5rem', marginBottom: '5px' }}>
              {currentIndex + 1} / {questions.length}
            </div>
            <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#dc2626', fontWeight: 900, cursor: 'pointer', textDecoration: 'underline' }}>
              ABORT MISSION ✖
            </button>
          </div>
        </div>

        {/* Question Area */}
        <div style={{ marginBottom: '50px' }}>
          <h3 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '40px', lineHeight: 1.1, color: '#000' }}>
            {currentQ?.question}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {currentQ?.options.map((opt: string, i: number) => {
              const isSelected = answers[currentIndex] === opt;
              return (
                <button 
                  key={i} 
                  onClick={() => handleSelect(opt)}
                  style={{
                    padding: '30px',
                    fontSize: '1.2rem',
                    fontFamily: 'monospace',
                    fontWeight: 900,
                    textAlign: 'left',
                    background: isSelected ? '#000' : '#fff',
                    color: isSelected ? '#fff' : '#000',
                    border: '4px solid #000',
                    boxShadow: isSelected ? 'none' : '8px 8px 0 #000',
                    transform: isSelected ? 'translate(4px, 4px)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.1s',
                    borderRadius: '8px'
                  }}
                >
                  <span style={{ opacity: 0.5, marginRight: '10px' }}>0{i + 1}</span> {opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px' }}>
          <button 
            disabled={currentIndex === 0} 
            onClick={() => setCurrentIndex(curr => curr - 1)}
            style={{
              background: 'white', border: '4px solid #000', padding: '15px 30px', 
              fontWeight: 900, cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
              opacity: currentIndex === 0 ? 0.3 : 1,
              boxShadow: '4px 4px 0 #000'
            }}
          >
            ← PREVIOUS
          </button>
          
          {currentIndex === questions.length - 1 ? (
            <button 
              onClick={handleSubmit} 
              disabled={!answers[currentIndex] || submitting}
              style={{
                background: '#000', color: '#fff', border: '4px solid #000', 
                padding: '15px 40px', fontWeight: 900, fontSize: '1.2rem', 
                cursor: 'pointer', boxShadow: '6px 6px 0 #bae6fd'
              }}
            >
              {submitting ? "GRADING..." : "FINISH TEST →"}
            </button>
          ) : (
            <button 
              onClick={() => setCurrentIndex(curr => curr + 1)} 
              disabled={!answers[currentIndex]}
              style={{
                background: '#fef08a', border: '4px solid #000', padding: '15px 40px', 
                fontWeight: 900, fontSize: '1.2rem', cursor: 'pointer',
                boxShadow: '6px 6px 0 #000'
              }}
            >
              NEXT QUESTION →
            </button>
          )}
        </div>

      </div>
    </div>
  );
};