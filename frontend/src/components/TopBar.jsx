import { useState, useEffect, useRef } from 'react';
import { Search, Bell, User, LogOut, Settings, Key, Cpu, CheckCircle2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TopBar({ onLogout, userName }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('groq_api_key') || '');
  const [saved, setSaved] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    const handleSync = () => {
      setApiKey(localStorage.getItem('groq_api_key') || '');
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('config-update', handleSync);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('config-update', handleSync);
    };
  }, []);

  const handleSaveKey = (val) => {
    setApiKey(val);
    localStorage.setItem('groq_api_key', val);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    // Notify other components
    window.dispatchEvent(new CustomEvent('config-update'));
  };

  const scrollToSettings = () => {
    const el = document.getElementById('settings');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setIsDropdownOpen(false);
  };

  return (
    <header className="h-20 bg-primary/95 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-10 sticky top-0 z-40 w-full shadow-sm">
       <div className="flex items-center bg-secondary/80 px-4 py-2.5 rounded-2xl border border-white/10 w-96 focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/50 transition-all">
          <Search size={18} className="text-slate-400" />
          <input 
             type="text" 
             placeholder="Search scripts, scenes, or creators..." 
             className="bg-transparent border-none outline-none ml-3 text-sm text-white w-full placeholder:text-slate-500 font-medium tracking-wide" 
          />
       </div>
       
       <div className="flex items-center gap-8">
          {/* System Config Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-sm font-bold uppercase tracking-widest group
                ${isDropdownOpen ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-slate-400 hover:text-accent'}
              `}
            >
               <Settings size={18} className={`${isDropdownOpen ? 'rotate-90' : 'group-hover:rotate-45'} transition-transform duration-500`} /> 
               <span className="hidden lg:inline">System Config</span>
               <ChevronDown size={14} className={`ml-1 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-80 bg-secondary border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-50 p-5"
                >
                  <div className="flex flex-col gap-5">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <h3 className="text-white text-xs font-bold uppercase tracking-wider">Quick Configuration</h3>
                      <button onClick={scrollToSettings} className="text-[10px] text-accent hover:underline font-bold uppercase">Advanced</button>
                    </div>

                    {/* Model Select */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Cpu size={12} className="text-accent" /> Intelligence Engine
                      </label>
                      <select className="bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-xs text-white focus:ring-1 focus:ring-accent outline-none cursor-pointer">
                        <option>Groq Llama 3 70B</option>
                        <option>Gemini 2.0 Flash</option>
                      </select>
                    </div>

                    {/* API Key Input */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Key size={12} className="text-accent" /> Groq API Key
                        {saved && <span className="ml-auto text-emerald-400 flex items-center gap-1 animate-pulse"><CheckCircle2 size={10} /> Saved</span>}
                      </label>
                      <input 
                        type="password"
                        value={apiKey}
                        onChange={(e) => handleSaveKey(e.target.value)}
                        placeholder="gsk_..."
                        className="bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-xs text-white focus:ring-1 focus:ring-accent outline-none font-mono"
                      />
                    </div>

                    <div className="pt-2">
                      <button 
                        onClick={scrollToSettings}
                        className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[10px] font-bold text-slate-400 uppercase tracking-widest transition-all"
                      >
                        More System Settings
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={onLogout} className="flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors text-sm font-bold uppercase tracking-widest">
             <LogOut size={18} /> Logout
          </button>
          
          <div className="flex items-center gap-4 pl-8 border-l border-white/10 cursor-pointer group">
             <div className="text-right hidden sm:block">
               <p className="text-sm font-bold text-white tracking-wide">{userName || 'Creator'}</p>
               <p className="text-[0.7rem] text-accent uppercase font-bold tracking-wider">Pro Edition</p>
             </div>
             <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-accent to-purple-400 p-[2px] shadow-[0_0_15px_rgba(124,58,237,0.3)] group-hover:shadow-[0_0_25px_rgba(124,58,237,0.6)] transition-all duration-300">
                <div className="w-full h-full bg-secondary rounded-full flex items-center justify-center">
                   <User size={20} className="text-white group-hover:scale-110 transition-transform duration-300" />
                </div>
             </div>
          </div>
       </div>
    </header>
  );
}
