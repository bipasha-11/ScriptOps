import { useState, useEffect } from 'react';
import { Sliders, Cpu, Download, Database, Key, CheckCircle2 } from 'lucide-react';

export default function SettingsPanel() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('groq_api_key') || '');
  const [saved, setSaved] = useState(false);

  const handleSaveKey = (val) => {
    setApiKey(val);
    localStorage.setItem('groq_api_key', val);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="glass rounded-2xl p-8 shadow-2xl shadow-black/40 ring-1 ring-white/5 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-bl-full pointer-events-none blur-3xl"></div>
      
      <div className="flex flex-col gap-8 relative z-10">
        <div className="border-b border-white/5 pb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <span className="text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]">⚙️</span> 
            System Configuration
          </h2>
          <p className="text-slate-400 text-sm mt-1">Adjust AI engine parameters, matching weights, and export preferences.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* AI Engine Settings */}
          <div className="flex flex-col gap-4 bg-secondary/30 p-5 rounded-xl border border-white/5">
            <h3 className="text-white font-bold flex items-center gap-2"><Cpu size={16} className="text-accent" /> Intelligence Engine</h3>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Primary Model</label>
              <select className="bg-black/40 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white focus:ring-1 focus:ring-accent outline-none">
                 <option>Groq Llama 3 70B (User Managed)</option>
                 <option>Google Gemini 2.0 Flash (Cloud)</option>
                 <option>GPT-4o (Reasoning)</option>
                 <option>Claude 3.5 Sonnet (Creative)</option>
              </select>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Key size={12} className="text-accent" />
                <span>Groq API Key</span>
                {saved && <span className="ml-auto text-[10px] text-emerald-400 flex items-center gap-1"><CheckCircle2 size={10} /> Auto-saved</span>}
              </label>
              <input 
                type="password"
                value={apiKey}
                onChange={(e) => handleSaveKey(e.target.value)}
                placeholder="gsk_..."
                className="bg-black/40 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white focus:ring-1 focus:ring-accent outline-none font-mono"
              />
              <p className="text-[10px] text-slate-500 italic">Your key is stored locally in your browser and used for simulation insights.</p>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex justify-between">
                <span>Risk Tolerance Threshold</span>
                <span className="text-accent">Standard</span>
              </label>
              <input type="range" min="1" max="100" defaultValue="50" className="accent-accent h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer" />
            </div>
          </div>

          {/* Crew Matching Weights */}
          <div className="flex flex-col gap-4 bg-secondary/30 p-5 rounded-xl border border-white/5">
            <h3 className="text-white font-bold flex items-center gap-2"><Sliders size={16} className="text-blue-400" /> Crew Matching Weights</h3>
            
            <div className="flex flex-col gap-2">
               <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex justify-between">
                <span>Skill Emphasis</span>
                <span className="text-blue-400">70%</span>
              </label>
              <input type="range" min="1" max="100" defaultValue="70" className="accent-blue-500 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer" />
            </div>

            <div className="flex flex-col gap-2 mt-2">
               <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex justify-between">
                <span>Social Follower Weight</span>
                <span className="text-green-400">30%</span>
              </label>
              <input type="range" min="1" max="100" defaultValue="30" className="accent-green-500 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer" />
            </div>
          </div>
          
          {/* Data & Export */}
          <div className="flex flex-col gap-4 bg-secondary/30 p-5 rounded-xl border border-white/5 md:col-span-2">
            <h3 className="text-white font-bold flex items-center gap-2"><Database size={16} className="text-emerald-400" /> Output & Data</h3>
            
            <div className="flex flex-wrap gap-4">
              <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all">
                <Download size={16} /> Export Full PDF Report
              </button>
              <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all">
                <Download size={16} /> Download .FDX Notes
              </button>
              <button className="flex items-center gap-2 bg-white/5 hover:bg-red-500/10 hover:text-red-400 border border-red-500/10 text-slate-300 px-5 py-2.5 rounded-lg text-sm font-bold transition-all md:ml-auto">
                Purge Project Data
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
