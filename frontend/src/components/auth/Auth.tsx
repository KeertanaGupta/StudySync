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

      {/* 2. The Main Content Area */}
      <main className="flex-grow flex items-center justify-center relative overflow-hidden px-4 py-12">
        <AnimatePresence mode="wait">
          
          {!showLogin ? (
            /* --- LANDING PAGE VIEW --- */
            <motion.div 
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, filter: "blur(5px)" }}
              transition={{ duration: 0.3 }}
              className="max-w-4xl w-full text-center flex flex-col items-center z-10"
            >
              <h1 className="text-4xl md:text-6xl font-black text-black uppercase mb-6 leading-tight border-4 border-black bg-white p-6 md:p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-3xl">
                Stop studying alone. <br/>
                <span className="text-yellow-500 bg-black px-2 mt-2 inline-block transform rotate-1">Find your squad.</span>
              </h1>
              
              <p className="text-lg md:text-xl text-gray-800 font-bold mb-10 max-w-2xl bg-[#fdf8e1] border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                Our AI analyzes your learning style, goals, and schedule to pair you with the ultimate study group in seconds.
              </p>

              <button 
                onClick={() => setShowLogin(true)}
                className="bg-black text-yellow-400 font-bold text-xl uppercase px-12 py-5 rounded-xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-3"
              >
                <span>Get Started Free</span>
                <span className="text-2xl">→</span>
              </button>
            </motion.div>
          ) : (
            
            /* --- GOOGLE LOGIN VIEW --- */
            <motion.div
              key="login"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md z-10 relative"
            >
              <button 
                onClick={() => setShowLogin(false)}
                className="absolute -top-16 left-0 bg-white border-4 border-black px-4 py-2 rounded-xl font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2"
              >
                <span>←</span> Back
              </button>
              
              <div className="bg-white border-4 border-black rounded-[2rem] p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
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