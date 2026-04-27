import { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../../config/api';
import { useAuthStore } from '../../store/authStore';
import './Onboarding.css';

// ... (QUIZ_STEPS stays the same)
const QUIZ_STEPS = [
  {
    id: 'institution',
    type: 'text',
    text: "Where do you study?",
    placeholder: "e.g. Stanford University",
    label: "University / Institution"
  },
  {
    id: 'learning_style',
    type: 'choice',
    text: "How do you learn best?",
    options: [
      { label: "Visual", value: "visual", icon: "📺" },
      { label: "Auditory", value: "auditory", icon: "🎧" },
      { label: "Reading", value: "reading", icon: "📚" },
      { label: "Practice", value: "practice", icon: "⚙️" },
    ]
  },
  {
    id: 'study_goal',
    type: 'choice',
    text: "What's your main goal?",
    options: [
      { label: "Exam Prep", value: "exam", icon: "📝" },
      { label: "Projects", value: "project", icon: "💻" },
      { label: "Clarity", value: "concept", icon: "🧠" },
      { label: "Practice", value: "practice", icon: "🔥" },
    ]
  },
  {
    id: 'study_type',
    type: 'choice',
    text: "Ideal session format?",
    options: [
      { label: "Silent", value: "silent", icon: "🤫" },
      { label: "Discussion", value: "discussion", icon: "🗣️" },
      { label: "Mixed", value: "mixed", icon: "🔄" },
      { label: "Pomodoro", value: "pomodoro", icon: "⏱️" },
    ]
  },
  {
    id: 'role',
    type: 'choice',
    text: "Your natural group role?",
    options: [
      { label: "Explainer", value: "explainer", icon: "👨‍🏫" },
      { label: "Solver", value: "problem_solver", icon: "🧩" },
      { label: "Note-Taker", value: "note_taker", icon: "📋" },
      { label: "Questioner", value: "questioner", icon: "🤔" },
    ]
  },
  {
    id: 'availability',
    type: 'choice',
    text: "When are you free?",
    options: [
      { label: "Mornings", value: "mornings", icon: "🌅" },
      { label: "Afternoons", value: "afternoons", icon: "☀️" },
      { label: "Evenings", value: "evenings", icon: "🌙" },
      { label: "Weekends", value: "weekends", icon: "📅" },
    ]
  }
];

export const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({
    institution: '',
  });
  const [loading, setLoading] = useState(false);
  const { markProfileComplete } = useAuthStore();

  const currentQuestion = QUIZ_STEPS[step];

  const handleNext = async (value?: string) => {
    const updatedAnswers = { ...answers };
    if (value) {
      updatedAnswers[currentQuestion.id] = value;
    }
    setAnswers(updatedAnswers);

    if (step < QUIZ_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      setLoading(true);
      try {
        const token = localStorage.getItem('access_token');
        await axios.patch(`${API_BASE_URL}/api/user/profile/`, {
          ...updatedAnswers,
          is_profile_complete: true
        }, {
          headers: { Authorization: `Token ${token}` }
        });
        markProfileComplete();
      } catch (err) {
        alert("Sync Failed! Check if your Django server is running.");
        setLoading(false);
      }
    }
  };

  if (loading) return (
    <div className="ob-container">
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="ob-card"
      >
        <div className="spinner"></div>
        <h2 className="ob-title" style={{ marginTop: '20px' }}>Syncing DNA...</h2>
        <p style={{ fontWeight: 900, opacity: 0.6 }}>Our AI is assembling your ultimate study squad profile.</p>
      </motion.div>
    </div>
  );

  return (
    <div className="ob-container">
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="ob-card"
      >
        <div className="ob-progress">
          <motion.div 
            className="ob-progress-fill" 
            initial={{ width: 0 }}
            animate={{ width: `${((step + 1) / QUIZ_STEPS.length) * 100}%` }}
          ></motion.div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="ob-title">{currentQuestion.text}</h2>

            {currentQuestion.type === 'text' ? (
              <div className="ob-text-input-group">
                <input 
                  type="text" 
                  className="ob-input"
                  placeholder={currentQuestion.placeholder}
                  value={answers.institution}
                  onChange={(e) => setAnswers({...answers, institution: e.target.value})}
                  autoFocus
                />
                <button 
                  className="nb-btn primary" 
                  style={{ marginTop: '30px', width: '100%', padding: '20px', fontSize: '1.2rem' }}
                  onClick={() => {
                    if (answers.institution.trim()) handleNext();
                  }}
                >
                  Continue →
                </button>
              </div>
            ) : (
              <div className="ob-options-grid">
                {currentQuestion.options?.map((opt) => (
                  <button 
                    key={opt.value} 
                    className="ob-option-btn"
                    onClick={() => handleNext(opt.value)}
                  >
                    <span>{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};