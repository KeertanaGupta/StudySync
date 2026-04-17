import './Landing.css';

export const Landing = () => {
  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className="nb-navbar">
        <div className="nb-logo">
          <span className="nb-logo-icon">{"{}"}</span>
          <span className="nb-logo-text">StudySync AI</span>
        </div>
        
        <div className="nb-nav-links">
          <a href="#">Features</a>
          <a href="#">How it works</a>
          <a href="#">Demo</a>
        </div>

        <div className="nb-nav-actions">
          <button className="nb-btn-outline">Sign in</button>
          <button className="nb-btn-black">Get Started</button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="nb-hero">
        <div className="nb-badge">
          ✨ Powered by next-gen learning AI
        </div>
        
        <h1 className="nb-title">
          AI-powered study groups <br/> that actually work
        </h1>

        <p className="nb-subtitle">
          Get matched with the right peers, schedule effortlessly, and let AI keep every session focused, productive, and on-track.
        </p>

        <div className="nb-cta-group">
          <button className="nb-btn-primary">GET STARTED FREE →</button>
          <button className="nb-btn-secondary">▶ Watch Demo</button>
        </div>

        <div className="nb-trusted">
          <p>Trusted by students at</p>
          <div className="nb-schools">
            <span>MIT</span> <span>STANFORD</span> <span>OXFORD</span> <span>BERKELEY</span>
          </div>
        </div>
      </main>
    </div>
  );
};