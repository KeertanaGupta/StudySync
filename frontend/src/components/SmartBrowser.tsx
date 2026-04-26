import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

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
  const navigate = useNavigate();
  
  // Anti-Cheating States
  const [warnings, setWarnings] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // --- 1. PROCTOR MODE: CAMERA & FULLSCREEN ---
  useEffect(() => {
    const startProctoring = async () => {
      try {
        // 1. Request Camera Access
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // 2. Fullscreen is now handled by the VERIFY button click directly to bypass browser blocks
      } catch (err) {
        // 🚨 FIX 1: Removed onCancel() so the app doesn't close if camera is blocked/denied
        toast.warning("Camera access denied. Proctoring disabled for testing.");
        console.warn("Camera Error:", err);
      }
    };

    startProctoring();

    // Cleanup when component unmounts
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.log(err));
      }
    };
  }, [onCancel]);

  // --- 2. ANTI-CHEATING: TAB SWITCH DETECTION ---
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setWarnings(w => {
          const newWarnings = w + 1;
          if (newWarnings >= 3) {
            toast.error("TEST ABORTED: Too many tab switches detected.");
            navigate('/busted');
          } else {
            toast.warning(`WARNING: Tab switching detected! (${newWarnings}/3)`);
          }
          return newWarnings;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [onCancel]);

  // Fix: Assign stream to video element when it actually mounts (after loading finishes)
  useEffect(() => {
    if (!loading && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [loading]);

  // --- 5. AI PHONE DETECTION ---
  useEffect(() => {
    let animationFrameId: number;
    let model: cocoSsd.ObjectDetection;
    let isDetecting = false;
    let cooldown = false;

    const runDetection = async () => {
      // Must have video playing
      if (!loading && videoRef.current && videoRef.current.readyState === 4) {
        if (!model) {
          try {
            await tf.ready();
            model = await cocoSsd.load();
          } catch (e) {
            console.error("Failed to load TF model:", e);
            return;
          }
        }
        
        if (!isDetecting && !cooldown) {
          isDetecting = true;
          try {
            const predictions = await model.detect(videoRef.current);
            const phoneDetected = predictions.some((p: any) => p.class === 'cell phone');
            
            if (phoneDetected) {
              setWarnings((w: number) => {
                const newWarnings = w + 1;
                if (newWarnings >= 3) {
                  navigate('/busted');
                } else {
                  toast.error(`VIOLATION: Cell phone detected! (${newWarnings}/3)`);
                }
                return newWarnings;
              });
              
              cooldown = true;
              setTimeout(() => { cooldown = false; }, 3000);
            }
          } catch (e) {
            console.error("TFJS error", e);
          }
          isDetecting = false;
        }
      }
      animationFrameId = requestAnimationFrame(runDetection);
    };

    if (!loading) {
      runDetection();
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [loading, navigate]);

  // --- 3. FETCH QUESTIONS ---
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      let success = false;
      let attempts = 0;
      const maxAttempts = 3;

      while (!success && attempts < maxAttempts) {
        try {
          attempts++;
          const res = await axios.post(`${API_BASE_URL}/api/quiz/generate/`, 
            { skills: Array.isArray(skillsToTest) ? skillsToTest : [skillsToTest] },
            { headers: { 'Authorization': `Token ${token}` } }
          );
          
          if (res.data.questions && res.data.questions.length > 0) {
            setQuestions(res.data.questions);
            success = true; // Breaks the loop!
          } else {
            throw new Error("No questions generated");
          }
        } catch (err: any) {
          console.warn(`API Attempt ${attempts} failed...`);
          
          // CRITICAL FIX: Stop retrying if we are out of quota!
          if (err.response && err.response.status === 429) {
             console.error("429 Quota Hit! Stopping retries.");
             toast.error("AI Quota Reached! Please wait a minute.");
             onCancel(); 
             return; 
          }

          if (attempts >= maxAttempts) {
            toast.error("Gemini servers are busy. Please try again later.");
            onCancel(); // Only give up after 3 strikes
          } else {
            // Wait 2 seconds before trying again (lets the API breathe)
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      
      setLoading(false); // Turn off the "AI IS COMPILING" screen
    };

    fetchQuestions();
  }, [skillsToTest]); // Dependency array kept clean to prevent infinite loops

  const handleSelect = (option: string) => {
    setAnswers({ ...answers, [currentIndex]: option });
  };

  // --- 4. SUBMIT RESULTS ---
  const handleSubmit = async () => {
    setSubmitting(true);
    let correctCount = 0;
    questions.forEach((q, index) => {
      if (answers[index] === q.correct_answer) correctCount++;
    });

    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`${API_BASE_URL}/api/quiz/submit/`, {
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

  // --- BULLETPROOF OVERLAY STYLES ---
  const overlayStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    backgroundColor: '#fffceb',
    backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
    backgroundSize: '24px 24px',
    zIndex: 999999, // Force to the absolute top
    overflowY: 'auto', margin: 0, padding: '40px', boxSizing: 'border-box'
  };

  if (loading) {
    return (
      <div style={{...overlayStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, textAlign: 'center', animation: 'pulse 1.5s infinite' }}>
          🧠 AI IS COMPILING YOUR TEST...
        </h1>
        <p style={{ fontFamily: 'monospace', marginTop: '20px', fontWeight: 'bold' }}>
          Configuring Proctor Environment for {skillsToTest[0]}...
        </p>
      </div>
    );
  }

  // Safety check if loading finished but no questions exist
  if (!questions || questions.length === 0) return null;

  const currentQ = questions[currentIndex];

  return (
    <div style={overlayStyle}>
      
      {/* 📸 WEBCAM PROCTOR BOX (Bottom Right) */}
      <div style={{
        position: 'fixed', bottom: '20px', right: '20px', width: '200px', height: '150px',
        background: '#000', border: '4px solid #000', borderRadius: '12px',
        boxShadow: '-8px -8px 0px #ef4444', overflow: 'hidden', zIndex: 1000000
      }}>
        <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', top: 5, left: 5, background: 'red', color: 'white', fontSize: '0.6rem', padding: '2px 6px', fontWeight: 'bold', borderRadius: '4px', animation: 'pulse 2s infinite' }}>
          🔴 REC
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', position: 'relative' }}>
        
        {/* Anti-Cheat Warning Display */}
        {warnings > 0 && (
          <div style={{ background: '#ef4444', color: 'white', padding: '10px', textAlign: 'center', fontWeight: 'bold', border: '4px solid #000', marginBottom: '20px' }}>
            ⚠️ WARNING: VIOLATION DETECTED. STRIKES: {warnings}/3
          </div>
        )}

        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '6px solid #000', paddingBottom: '20px', marginBottom: '40px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 900, textTransform: 'uppercase' }}>
              LEVEL UP: {currentQ?.skill_name || skillsToTest[0]}
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
            {/* 🚨 FIX 2a: Safe fallback if question text is missing */}
            {currentQ?.question || "Loading question text..."}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* 🚨 FIX 2b: Safe mapping with ?. ensures it won't crash if options is undefined */}
            {currentQ?.options?.map((opt: string, i: number) => {
              const isSelected = answers[currentIndex] === opt;
              return (
                <button key={i} onClick={() => handleSelect(opt)}
                  style={{
                    padding: '30px', fontSize: '1.2rem', fontFamily: 'monospace', fontWeight: 900, textAlign: 'left', borderRadius: '8px',
                    background: isSelected ? '#000' : '#fff', color: isSelected ? '#fff' : '#000', border: '4px solid #000',
                    boxShadow: isSelected ? 'none' : '8px 8px 0 #000', transform: isSelected ? 'translate(4px, 4px)' : 'none',
                    cursor: 'pointer', transition: 'all 0.1s',
                  }}>
                  <span style={{ opacity: 0.5, marginRight: '10px' }}>0{i + 1}</span> {opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px', paddingBottom: '100px' }}>
          <button disabled={currentIndex === 0} onClick={() => setCurrentIndex(curr => curr - 1)}
            style={{ background: 'white', border: '4px solid #000', padding: '15px 30px', fontWeight: 900, cursor: currentIndex === 0 ? 'not-allowed' : 'pointer', opacity: currentIndex === 0 ? 0.3 : 1, boxShadow: '4px 4px 0 #000' }}>
            ← PREVIOUS
          </button>
          
          {currentIndex === questions.length - 1 ? (
            <button onClick={handleSubmit} disabled={!answers[currentIndex] || submitting}
              style={{ background: '#000', color: '#fff', border: '4px solid #000', padding: '15px 40px', fontWeight: 900, fontSize: '1.2rem', cursor: 'pointer', boxShadow: '6px 6px 0 #bae6fd' }}>
              {submitting ? "GRADING..." : "FINISH TEST →"}
            </button>
          ) : (
            <button onClick={() => setCurrentIndex(curr => curr + 1)} disabled={!answers[currentIndex]}
              style={{ background: '#fef08a', border: '4px solid #000', padding: '15px 40px', fontWeight: 900, fontSize: '1.2rem', cursor: 'pointer', boxShadow: '6px 6px 0 #000' }}>
              NEXT QUESTION →
            </button>
          )}
        </div>

      </div>
    </div>
  );
};