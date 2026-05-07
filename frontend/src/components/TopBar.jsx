import { useState, useEffect, useRef } from 'react';
import { Search, Bell, User, LogOut, Settings, Key, Cpu, CheckCircle2, ChevronDown, Sliders } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TopBar({ onLogout, userName }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('groq_api_key') || '');
  const [riskThreshold, setRiskThreshold] = useState(parseInt(localStorage.getItem('risk_threshold')) || 50);
  const [skillWeight, setSkillWeight] = useState(parseFloat(localStorage.getItem('skill_weight')) || 0.7);
  const [socialWeight, setSocialWeight] = useState(parseFloat(localStorage.getItem('social_weight')) || 0.3);
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
      setRiskThreshold(parseInt(localStorage.getItem('risk_threshold')) || 50);
      setSkillWeight(parseFloat(localStorage.getItem('skill_weight')) || 0.7);
      setSocialWeight(parseFloat(localStorage.getItem('social_weight')) || 0.3);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('config-update', handleSync);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('config-update', handleSync);
    };
  }, []);

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    window.dispatchEvent(new CustomEvent('config-update'));
  };

  const handleSaveKey = (val) => {
    setApiKey(val);
    localStorage.setItem('groq_api_key', val);
    showSaved();
  };

  const handleThresholdChange = (val) => {
    const v = parseInt(val);
    setRiskThreshold(v);
    localStorage.setItem('risk_threshold', v);
    showSaved();
  };

  const handleWeightsChange = (skill, social) => {
    setSkillWeight(skill);
    setSocialWeight(social);
    localStorage.setItem('skill_weight', skill);
    localStorage.setItem('social_weight', social);
    showSaved();
  };

  const getRiskLabel = (v) => {
    if (v <= 30) return 'Tolerant';
    if (v <= 50) return 'Standard';
    if (v <= 70) return 'Conservative';
    return 'Strict';
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
                      <h3 className="text-white text-xs font-bold uppercase tracking-wider">System Configuration</h3>
                      {saved && <span className="text-[10px] text-emerald-400 flex items-center gap-1 animate-pulse font-bold"><CheckCircle2 size={10} /> Syncing</span>}
                    </div>

                    {/* Model Select */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Cpu size={12} className="text-accent" /> Intelligence Engine
                      </label>
                      <select className="bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-[11px] text-white focus:ring-1 focus:ring-accent outline-none cursor-pointer">
                        <option>Groq Llama 3 70B (User Managed)</option>
                        <option>Google Gemini 2.0 Flash</option>
                      </select>
                    </div>

                    {/* API Key Input */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Groq API Key</label>
                      <input 
                        type="password"
                        value={apiKey}
                        onChange={(e) => handleSaveKey(e.target.value)}
                        placeholder="gsk_..."
                        className="bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-[11px] text-white focus:ring-1 focus:ring-accent outline-none font-mono"
                      />
                    </div>

                    {/* Risk Threshold */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex justify-between">
                        <span>Risk Tolerance</span>
                        <span className="text-accent">{riskThreshold}% ({getRiskLabel(riskThreshold)})</span>
                      </label>
                      <input 
                        type="range" min="10" max="90" step="5"
                        value={riskThreshold}
                        onChange={(e) => handleThresholdChange(e.target.value)}
                        className="accent-accent h-1 bg-white/10 rounded-full appearance-none cursor-pointer" 
                      />
                    </div>

                    {/* Weights Divider */}
                    <div className="border-t border-white/5 pt-3 mt-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-3">
                        <Sliders size={12} className="text-blue-400" /> Matching Weights
                      </label>
                      
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                            <span className="text-slate-400">Skill</span>
                            <span className="text-blue-400">{Math.round(skillWeight * 100)}%</span>
                          </div>
                          <input 
                            type="range" min="0" max="1" step="0.05"
                            value={skillWeight}
                            onChange={(e) => handleWeightsChange(parseFloat(e.target.value), 1 - parseFloat(e.target.value))}
                            className="accent-blue-500 h-1 bg-white/10 rounded-full appearance-none cursor-pointer" 
                          />
                        </div>

                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                            <span className="text-slate-400">Social</span>
                            <span className="text-green-400">{Math.round(socialWeight * 100)}%</span>
                          </div>
                          <input 
                            type="range" min="0" max="1" step="0.05"
                            value={socialWeight}
                            onChange={(e) => handleWeightsChange(1 - parseFloat(e.target.value), parseFloat(e.target.value))}
                            className="accent-green-500 h-1 bg-white/10 rounded-full appearance-none cursor-pointer" 
                          />
                        </div>
                      </div>
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
