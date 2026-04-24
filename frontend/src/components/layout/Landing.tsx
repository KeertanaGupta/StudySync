import { useState, useEffect } from 'react';
import './Landing.css';

interface LandingProps {
  onLoginClick: () => void;
}

export const Landing = ({ onLoginClick }: LandingProps) => {
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  return (
    <div className="landing-page">
      {/* NAVBAR */}
      <nav className="nb-navbar">
        <div className="nb-logo">
          <span className="nb-logo-icon">{"{}"}</span>
          <span>StudySync AI</span>
        </div>
        
        <div className="nb-nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#demo">Demo</a>
          <a href="#reviews">Reviews</a>
        </div>

        <div className="nb-nav-actions">
          <button className="theme-toggle" onClick={() => setIsDarkMode(!isDarkMode)}>
            {isDarkMode ? '☾' : '☼'}
          </button>
          <button className="nb-btn-text" onClick={onLoginClick}>Sign in</button>
          <button className="nb-btn-black" onClick={onLoginClick}>Get Started</button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="nb-hero">
        <div className="nb-badge">
          ✨ Powered by next-gen learning AI
        </div>
        
        <h1>
          AI-powered study groups<br/>that actually work
        </h1>

        <p>
          Get matched with the right peers, schedule effortlessly, and let AI keep every session focused, productive, and on-track.
        </p>

        <div className="nb-cta-group">
          {/* Linked to your Auth flow! */}
          <button className="nb-btn-primary" onClick={onLoginClick}>
            GET STARTED FREE →
          </button>
          <button className="nb-btn-secondary">▶ Watch Demo</button>
        </div>

        <div className="nb-trusted">
          <p>Trusted by students at</p>
          <div className="nb-schools">
            <span>MIT</span> <span>STANFORD</span> <span>OXFORD</span> <span>BERKELEY</span>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="nb-section">
        <div className="section-label">Features</div>
        <h2 className="section-title">Everything a study group<br/>should be</h2>
        <p className="section-subtitle">
          Four core systems working together to make group learning the most effective part of your week.
        </p>

        <div className="features-grid">
          <div className="nb-card">
            <div className="card-icon">🧠</div>
            <h3>Smart Matching</h3>
            <p>Our AI analyzes learning style, goals, and schedule to pair you with peers who'll genuinely accelerate your progress.</p>
          </div>
          <div className="nb-card">
            <div className="card-icon">📅</div>
            <h3>Auto Scheduling</h3>
            <p>No more group chats trying to find a time. We coordinate calendars and lock in sessions that actually happen.</p>
          </div>
          <div className="nb-card">
            <div className="card-icon">✨</div>
            <h3>Session Intelligence</h3>
            <p>Live AI takes notes, surfaces concepts you missed, and generates quizzes from your discussion in real time.</p>
          </div>
          <div className="nb-card">
            <div className="card-icon">❤️</div>
            <h3>Group Health</h3>
            <p>Track engagement, momentum, and burnout signals. Keep your group thriving — not ghosting after week two.</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="nb-section">
        <div className="section-label">How it works</div>
        <h2 className="section-title">From signup to first<br/>session in minutes</h2>
        
        <div className="timeline">
          <div className="timeline-step">
            <div className="step-icon">
              👤
              <span className="step-number">1</span>
            </div>
            <h3>Create your profile</h3>
            <p>Tell us your courses, goals, and how you learn best. Takes 60 seconds.</p>
          </div>
          <div className="timeline-step">
            <div className="step-icon">
              👥
              <span className="step-number">2</span>
            </div>
            <h3>Get matched</h3>
            <p>Our AI finds 3-5 peers whose schedules and study style fit you perfectly.</p>
          </div>
          <div className="timeline-step">
            <div className="step-icon">
              🚀
              <span className="step-number">3</span>
            </div>
            <h3>Study smarter</h3>
            <p>Show up, learn deeper, track progress. We handle the logistics.</p>
          </div>
        </div>
      </section>

      {/* REVIEWS SECTION */}
      <section id="reviews" className="nb-section">
        <div className="section-label">Loved by students</div>
        <h2 className="section-title">Real stories, real<br/>results</h2>

        <div className="reviews-grid">
          <div className="nb-card">
            <div className="stars">★★★★★</div>
            <p>"Finally a study group that doesn't dissolve after week two. The AI matching is uncanny — my group just clicks."</p>
            <div className="review-author">
              <div className="author-avatar">MC</div>
              <div className="author-info">
                <h4>Maya Chen</h4>
                <p>CS Junior, Stanford</p>
              </div>
            </div>
          </div>
          <div className="nb-card">
            <div className="stars">★★★★★</div>
            <p>"The session summaries alone save me 3 hours a week. I review the AI notes and I'm ready for the exam."</p>
            <div className="review-author">
              <div className="author-avatar">DO</div>
              <div className="author-info">
                <h4>Daniel Okafor</h4>
                <p>Pre-Med, UCLA</p>
              </div>
            </div>
          </div>
          <div className="nb-card">
            <div className="stars">★★★★★</div>
            <p>"Auto-scheduling is a game changer. No more 47-message threads trying to find a time that works."</p>
            <div className="review-author">
              <div className="author-avatar">SM</div>
              <div className="author-info">
                <h4>Sofia Martinez</h4>
                <p>Engineering, MIT</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="nb-section">
        <div className="cta-banner">
          <h2>Ready to study<br/>like it's 2030?</h2>
          <p>Join thousands of students already learning faster with AI-matched groups. Free to start.</p>
          <div className="nb-cta-group" style={{ marginBottom: 0 }}>
            {/* Linked to Auth flow! */}
            <button className="nb-btn-primary" onClick={onLoginClick}>GET STARTED FREE →</button>
            <button className="nb-btn-secondary" style={{ background: '#fef3c7' }}>Talk to sales</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="nb-footer">
        <div className="footer-brand">
          <div className="nb-logo">
            <span className="nb-logo-icon">{"{}"}</span>
            <span>Synapse</span>
          </div>
          <p>AI-powered study groups that actually work. Built for the next generation of learners.</p>
          <div className="social-links">
            <a href="#">𝕏</a>
            <a href="#">🐙</a>
            <a href="#">in</a>
            <a href="#">📸</a>
          </div>
        </div>
        
        <div className="footer-col">
          <h4>Product</h4>
          <a href="#">Features</a>
          <a href="#">Demo</a>
          <a href="#">Pricing</a>
          <a href="#">Changelog</a>
        </div>
        
        <div className="footer-col">
          <h4>Company</h4>
          <a href="#">About</a>
          <a href="#">Blog</a>
          <a href="#">Careers</a>
          <a href="#">Press</a>
        </div>
        
        <div className="footer-col">
          <h4>Resources</h4>
          <a href="#">Docs</a>
          <a href="#">Help center</a>
          <a href="#">Community</a>
          <a href="#">Contact</a>
        </div>

        <div className="footer-bottom">
          <div>© 2026 Synapse Labs. All rights reserved.</div>
          <div className="footer-bottom-links">
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Terms</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Cookies</a>
          </div>
        </div>
      </footer>
    </div>
  );
};