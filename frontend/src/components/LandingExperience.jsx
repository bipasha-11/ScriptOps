import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import ScriptUpload from './ScriptUpload';
import { ShieldAlert, SplitSquareHorizontal, DollarSign, Fingerprint } from 'lucide-react';

const ScrollWalker = ({ direction = "right" }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  
  // Apply a spring physics layer so the walk feels buttery smooth even if the user scrolls jerkily
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });
  
  const xPos = useTransform(
    smoothProgress, 
    [0.1, 0.9], 
    direction === "right" ? ["-10vw", "100vw"] : ["100vw", "-10vw"]
  );

  return (
    <div ref={ref} className="w-full h-32 relative overflow-hidden flex items-center z-20">
       <motion.div style={{ x: xPos }} className="absolute z-10 hidden sm:block">
          <div className="relative w-8 h-16 drop-shadow-[0_0_15px_rgba(124,58,237,0.8)]">
            {/* Head */}
            <motion.div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_15px_#fff]" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }} />
            {/* Torso */}
            <motion.div className="absolute top-5 left-1/2 -translate-x-1/2 w-1.5 h-6 bg-gradient-to-b from-white to-accent rounded-full" />
            {/* Legs */}
            <motion.div className="absolute top-10 left-2 w-1.5 h-6 bg-accent/60 rounded-full origin-top" animate={{ rotate: [30, -30, 30] }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear'}} />
            <motion.div className="absolute top-10 right-2 w-1.5 h-6 bg-accent/60 rounded-full origin-top" animate={{ rotate: [-30, 30, -30] }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear'}} />
          </div>
       </motion.div>
    </div>
  );
};

export default function LandingExperience({ onFileSelect, onAuthClick, isAuthenticated, userEmail, userName, onLogout }) {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });

  return (
    <div ref={containerRef} className="relative bg-[#050508] text-white w-full overflow-x-hidden selection:bg-accent/30 selection:text-white pb-10">
      
      {/* Background Gradient Parallax tracking */}
      <motion.div 
        className="fixed inset-0 z-0 pointer-events-none opacity-30"
        style={{
          background: useTransform(
            scrollYProgress,
            [0, 0.4, 0.8, 1],
            [
              "radial-gradient(circle at 50% 10%, rgba(124,58,237,0.15) 0%, transparent 60%)",
              "radial-gradient(circle at 10% 50%, rgba(59,130,246,0.1) 0%, transparent 50%)",
              "radial-gradient(circle at 90% 70%, rgba(239,68,68,0.1) 0%, transparent 60%)",
              "radial-gradient(circle at 50% 90%, rgba(34,197,94,0.15) 0%, transparent 60%)"
            ]
          )
        }}
      />

      {/* STAGE 1: HERO */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center z-10 p-8 pt-20">
        <motion.div 
          initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: "easeOut" }}
          viewport={{ once: true }}
          className="max-w-4xl w-full flex flex-col items-center text-center gap-6"
        >
           {/* Welcome Message Above Heading */}
           {isAuthenticated && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }}
                className="mb-[-1.5rem] flex flex-col items-center gap-2"
              >
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase">
                  Welcome <span className="text-accent">{userName && userName !== 'undefined' ? userName : 'Bipasha'}</span>
                </h2>
              </motion.div>
           )}

           <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, duration: 1 }}>
             <h1 className="text-6xl md:text-8xl lg:text-[7rem] font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white via-slate-200 to-slate-600 pb-2">
               ScriptOps
             </h1>
           </motion.div>
           <p className="text-xl md:text-2xl text-slate-400 font-light max-w-2xl leading-relaxed">
             The cinematic intelligence engine. Scroll to discover how we simulate the reality of physical production before the cameras roll.
           </p>

           <div className="flex flex-col items-center gap-4 mt-4">
              {!isAuthenticated && (
                <button 
                  onClick={onAuthClick}
                  className="px-10 py-4 bg-accent hover:bg-accent-light text-white font-black rounded-full shadow-xl shadow-accent/20 transition-all active:scale-95 uppercase tracking-[0.2em] text-xs"
                >
                  Sign In / Register
                </button>
              )}
           </div>
        </motion.div>
        
        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-slate-500 flex flex-col items-center gap-3 text-xs uppercase tracking-widest font-bold pointer-events-none"
        >
          <span>Scroll to Discover</span>
          <div className="w-px h-10 bg-gradient-to-b from-slate-500 to-transparent" />
        </motion.div>
      </section>

      <ScrollWalker direction="right" />

      {/* STAGE 2: SCENE BREAKDOWN */}
      <section className="relative min-h-[85vh] flex items-center justify-center z-10 p-8 md:pl-48 bg-gradient-to-b from-transparent to-blue-900/5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center max-w-6xl w-full">
           <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} viewport={{ margin: "-20%" }}>
             <motion.div whileHover={{ scale: 1.1, rotate: 5 }} className="w-max">
               <SplitSquareHorizontal size={48} className="text-blue-500 mb-6 drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]" />
             </motion.div>
             <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">Shatter the<br/>Narrative.</h2>
             <p className="text-lg md:text-xl text-slate-400 font-light leading-relaxed">Our engine reads dialogue, action, and sluglines flawlessly. We automatically chunk your script into structured, actionable logistical units.</p>
           </motion.div>
           
           <div className="relative w-full flex flex-col gap-5 justify-center">
             {[1,2,3].map((i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: 100, scale: 0.9 }} 
                  whileInView={{ opacity: 1, x: 0, scale: 1 }} 
                  whileHover={{ scale: 1.05, border: '1px solid rgba(59,130,246,0.5)' }}
                  transition={{ duration: 0.6, delay: i * 0.15, type: 'spring' }}
                  className="h-20 w-full bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center px-8 relative overflow-hidden group cursor-default shadow-lg"
                >
                   <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-blue-500 group-hover:w-4 transition-all duration-300" />
                   <span className="font-mono text-blue-300 font-bold ml-4 tracking-wider text-sm md:text-base">SCENE_{String(i).padStart(3, '0')} // EXT.</span>
                   <div className="ml-auto flex items-center gap-2">
                     <div className="w-8 h-2 bg-blue-500/20 rounded-full" />
                     <div className="w-16 h-2 bg-blue-500/40 rounded-full" />
                   </div>
                </motion.div>
             ))}
           </div>
        </div>
      </section>

      <ScrollWalker direction="left" />

      {/* STAGE 3: RISK DETECTION */}
      <section className="relative min-h-[85vh] flex items-center justify-center z-10 p-8 md:pl-48 bg-gradient-to-b from-transparent to-red-900/5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center max-w-6xl w-full">
           <div className="relative h-80 w-80 md:w-96 md:h-96 rounded-full border border-red-500/20 bg-red-500/5 flex items-center justify-center mx-auto group">
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }} transition={{ repeat: Infinity, duration: 4 }}
                className="absolute inset-0 rounded-full bg-red-500/10 blur-xl"
              />
              <motion.div whileHover={{ scale: 1.2, rotate: -10 }} transition={{ type: "spring" }}>
                <ShieldAlert size={80} className="text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,1)] z-10" />
              </motion.div>
              <motion.div initial={{ scale: 0.5, opacity: 0 }} whileInView={{ scale: 1.5, opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 2.5 }} className="absolute inset-0 border-[3px] border-red-500/30 rounded-full" />
           </div>

           <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} viewport={{ margin: "-20%" }}>
             <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-white text-shadow">Detect Danger<br/>Early.</h2>
             <p className="text-lg md:text-xl text-slate-400 font-light leading-relaxed">From unscripted pyrotechnics to complex night shoots, the AI calculates a risk quotient for every single scene, giving you time to pivot.</p>
           </motion.div>
        </div>
      </section>

      <ScrollWalker direction="right" />

      {/* STAGE 4: BUDGET PREDICTION */}
      <section className="relative min-h-[85vh] flex items-center justify-center z-10 p-8 md:pl-48 bg-gradient-to-b from-transparent to-green-900/5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center max-w-6xl w-full">
           <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} viewport={{ margin: "-20%" }}>
             <motion.div whileHover={{ scale: 1.1, rotate: 15 }} className="w-max">
               <DollarSign size={48} className="text-green-500 mb-6 drop-shadow-[0_0_15px_rgba(34,197,94,0.6)]" />
             </motion.div>
             <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">Precision<br/>Forecasting.</h2>
             <p className="text-lg md:text-xl text-slate-400 font-light leading-relaxed">Dynamic financial extrapolation visualizes burn rates across your entire shooting schedule, preventing overages before cameras ever roll.</p>
           </motion.div>
           
           <div className="flex items-end justify-center gap-4 h-72 w-full px-4 border-b-2 border-green-500/20 pb-2">
             {[40, 70, 45, 90, 60, 100, 50].map((height, i) => (
                <motion.div 
                  key={i}
                  initial={{ height: 0, opacity: 0, y: 20 }} 
                  whileInView={{ height: `${height}%`, opacity: 1, y: 0 }} 
                  whileHover={{ scaleY: 1.05, backgroundColor: 'rgba(74,222,128,1)' }}
                  transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                  className={`w-12 md:w-16 rounded-t-lg origin-bottom transition-colors duration-300 cursor-default ${height > 80 ? 'bg-green-400 shadow-[0_0_20px_rgba(74,222,128,0.5)]' : 'bg-green-500/20 border border-green-500/30'}`}
                />
             ))}
           </div>
        </div>
      </section>

      <ScrollWalker direction="left" />

      {/* STAGE 5: PRODUCTION INSIGHTS & UPLOAD BUTTON */}
      <section className="relative min-h-screen flex items-center justify-center z-10 p-8 text-center bg-[#0B0B0F] pb-20 pt-10">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none mix-blend-overlay"></div>
        <motion.div 
           initial={{ opacity: 0, scale: 0.9 }} 
           whileInView={{ opacity: 1, scale: 1 }} 
           transition={{ duration: 1 }} 
           viewport={{ margin: "-20%" }} 
           className="max-w-4xl w-full flex flex-col items-center"
        >
           <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}>
             <Fingerprint size={80} className="text-accent mb-10 drop-shadow-[0_0_25px_rgba(124,58,237,0.8)]" />
           </motion.div>
           <h2 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-r from-accent via-purple-400 to-blue-400 leading-tight pb-2">Ready to Assemble?</h2>
           <p className="text-xl md:text-3xl text-slate-400 font-light mb-16 max-w-3xl leading-relaxed">
             Drop your script below to match your unique cinematic DNA against thousands of verified creators.
           </p>
           
           <div className="w-full max-w-2xl bg-white/[0.02] p-2 rounded-[2.5rem] backdrop-blur-3xl border border-white/10 shadow-[0_0_50px_rgba(124,58,237,0.1)] relative group hidden-scrollbar overflow-hidden">
             <div className="absolute inset-0 bg-accent/5 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl pointer-events-none"></div>
             <ScriptUpload onFileSelect={onFileSelect} />
           </div>
        </motion.div>
      </section>

    </div>
  );
}
