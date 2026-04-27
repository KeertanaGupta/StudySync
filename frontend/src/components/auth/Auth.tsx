import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthCard } from "./AuthCard"; // Relative import to prevent Vite path errors!
import { Navbar } from "../layout/Navbar";

const Auth = () => {
  // This controls whether we see the big text or the login card
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#fdf8e1] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] font-mono selection:bg-yellow-400">
      
      {/* 1. The Navbar */}
      <Navbar onLoginClick={() => setShowLogin(true)} />

      {/* 2. Floating Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden hidden md:block">
        <motion.div 
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute top-40 left-20 w-32 h-32 border-4 border-black bg-blue-400 rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-4xl"
        >
          🚀
        </motion.div>
        <motion.div 
          animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute bottom-40 right-20 w-24 h-24 border-4 border-black bg-pink-400 rounded-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-3xl"
        >
          ⚡
        </motion.div>
        <motion.div 
          animate={{ x: [0, 10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-1/2 right-40 w-16 h-16 border-4 border-black bg-green-400 transform rotate-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-2xl"
        >
          📚
        </motion.div>
      </div>

      {/* 3. The Main Content Area */}
      <main className="flex-grow flex items-center justify-center relative overflow-hidden px-4 py-12">
        <AnimatePresence mode="wait">
          
          {!showLogin ? (
            /* --- LANDING PAGE VIEW --- */
            <motion.div 
              key="landing"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30, filter: "blur(10px)" }}
              transition={{ duration: 0.4, ease: "backOut" }}
              className="max-w-4xl w-full text-center flex flex-col items-center z-10"
            >
              <div className="mb-6 bg-yellow-400 border-4 border-black px-6 py-2 rounded-full font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                Alpha Release v2.0
              </div>

              <h1 className="text-5xl md:text-8xl font-black text-black uppercase mb-8 leading-[0.9] text-left md:text-center">
                Study <span className="bg-black text-white px-4 inline-block transform -rotate-2">Smarter</span> <br/>
                Not Alone.
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-800 font-bold mb-12 max-w-2xl leading-relaxed">
                Connect with AI-matched study squads that vibe with your <span className="underline decoration-4 decoration-yellow-400">learning DNA</span>.
              </p>

              <div className="flex flex-col sm:flex-row gap-6">
                <button 
                  onClick={() => setShowLogin(true)}
                  className="bg-black text-white font-black text-2xl uppercase px-12 py-6 rounded-2xl border-4 border-black shadow-[10px_10px_0px_0px_#fbbf24] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[6px_6px_0px_0px_#fbbf24] transition-all flex items-center gap-4 group"
                >
                  <span>JOIN THE SQUAD</span>
                  <span className="group-hover:translate-x-2 transition-transform">→</span>
                </button>
              </div>

              <div className="mt-16 flex items-center gap-8 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
                <span className="font-black text-black text-sm uppercase tracking-tighter italic">Trusted by students from</span>
                <div className="flex gap-4 font-black text-xl italic">MIT / HARVARD / STANFORD</div>
              </div>
            </motion.div>
          ) : (
            
            /* --- GOOGLE LOGIN VIEW --- */
            <motion.div
              key="login"
              initial={{ opacity: 0, scale: 0.8, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotate: 2 }}
              transition={{ duration: 0.4, type: "spring" }}
              className="w-full max-w-md z-10 relative"
            >
              <button 
                onClick={() => setShowLogin(false)}
                className="absolute -top-20 left-0 bg-white border-4 border-black px-6 py-3 rounded-2xl font-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2"
              >
                ← GO BACK
              </button>
              
              <div className="bg-white border-8 border-black rounded-[3rem] p-12 shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] overflow-hidden relative">
                <div className="absolute top-0 right-0 bg-yellow-400 border-b-4 border-l-4 border-black px-4 py-1 font-black text-xs">
                  SECURE ACCESS
                </div>
                <AuthCard />
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
};

export default Auth;