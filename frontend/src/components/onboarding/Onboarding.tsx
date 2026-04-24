import { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { useAuthStore } from '../../store/authStore';
import './Onboarding.css';

// We skip google_id and profile_picture as they are handled during login
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
    // Save the current answer
    const updatedAnswers = { ...answers };
    if (value) {
      updatedAnswers[currentQuestion.id] = value;
    }
    setAnswers(updatedAnswers);

    if (step < QUIZ_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      // SUBMIT TO DJANGO
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
      <div className="ob-card">
        <div className="spinner"></div>
        <h2 className="ob-title">Syncing DNA...</h2>
      </div>
    </div>
  );

  return (
    <div className="ob-container">
      <div className="ob-card">
        <div className="ob-progress">
          <div className="ob-progress-fill" style={{ width: `${((step + 1) / QUIZ_STEPS.length) * 100}%` }}></div>
        </div>

        <h2 className="ob-title">{currentQuestion.text}</h2>

        {currentQuestion.type === 'text' ? (
          <div className="ob-text-input-group">
            <input 
              type="text" 
              className="ob-input"
              placeholder={currentQuestion.placeholder}
              value={answers.institution}
              onChange={(e) => setAnswers({...answers, institution: e.target.value})}
            />
            <button 
              className="nb-btn primary" 
              style={{ marginTop: '20px', width: '100%' }}
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
      </div>
    </div>
  );
};