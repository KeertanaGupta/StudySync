import { useState, useEffect } from 'react';
import axios from 'axios' // Use your Axios wrapper
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

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        // Calls the Generate endpoint!
        const res = await axios.post('/api/quiz/generate/', { skills: skillsToTest });
        setQuestions(res.data.questions);
      } catch (err) {
        toast.error("Failed to generate test. AI might be busy!");
        onCancel();
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [skillsToTest]);

  const handleSelect = (option: string) => {
    setAnswers({ ...answers, [currentIndex]: option });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    let score = 0;
    questions.forEach((q, index) => {
      if (answers[index] === q.correct_answer) score++;
    });

    const results = {
      [skillsToTest[0]]: { total: questions.length, correct: score }
    };

    try {
      // Calls the Grade/Submit endpoint!
      await axios.post('/api/quiz/submit/', { results });
      toast.success("Skill verified! Checking your new rank...");
      onComplete(); // Triggers the dashboard to refresh the skills
    } catch (err) {
      toast.error("Failed to submit test.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="smart-browser-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, animation: 'pulse 1.5s infinite' }}>
          🧠 AI is compiling your test...
        </h1>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="smart-browser-overlay">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid #000', paddingBottom: '20px', marginBottom: '60px' }}>
        <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 900, textTransform: 'uppercase' }}>
          Skill Assessment: {skillsToTest.join(', ')}
        </h2>
        <div style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '1.2rem' }}>
          Question {currentIndex + 1} / {questions.length}
        </div>
        <button onClick={onCancel} className="nb-btn-text" style={{ color: '#dc2626', fontSize: '1.2rem' }}>
          EXIT TEST ✖
        </button>
      </div>

      {/* Question Engine */}
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="nb-badge" style={{ background: 'var(--neo-black)', color: 'white', marginBottom: '20px' }}>
          Difficulty: {currentQ.difficulty.toUpperCase()}
        </div>
        
        <h3 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '40px', lineHeight: 1.2 }}>
          {currentQ.question}
        </h3>

        <div style={{ display: 'grid', gap: '20px' }}>
          {currentQ.options.map((opt: string, i: number) => {
            const isSelected = answers[currentIndex] === opt;
            return (
              <button 
                key={i} 
                onClick={() => handleSelect(opt)}
                style={{
                  padding: '25px',
                  fontSize: '1.25rem',
                  fontFamily: 'monospace',
                  textAlign: 'left',
                  background: isSelected ? 'var(--neo-black)' : 'white',
                  color: isSelected ? 'white' : 'var(--neo-black)',
                  border: '4px solid var(--neo-black)',
                  boxShadow: isSelected ? 'none' : '6px 6px 0 var(--neo-black)',
                  transform: isSelected ? 'translate(6px, 6px)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.1s'
                }}
              >
                <span style={{ fontWeight: 900, marginRight: '15px' }}>{String.fromCharCode(65 + i)}.</span> {opt}
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px' }}>
          <button 
            className="nb-btn-secondary" 
            disabled={currentIndex === 0} 
            onClick={() => setCurrentIndex(curr => curr - 1)}
          >
            ← Previous
          </button>
          
          {currentIndex === questions.length - 1 ? (
            <button className="nb-btn-primary" onClick={handleSubmit} disabled={!answers[currentIndex] || submitting}>
              {submitting ? "GRADING..." : "SUBMIT & GET RANKED →"}
            </button>
          ) : (
            <button className="nb-btn-primary" onClick={() => setCurrentIndex(curr => curr + 1)} disabled={!answers[currentIndex]}>
              Next Question →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};