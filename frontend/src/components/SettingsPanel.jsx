import { useState, useEffect } from 'react';
import { Sliders, Cpu, Download, Database, Key, CheckCircle2 } from 'lucide-react';

export default function SettingsPanel() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('groq_api_key') || '');
  const [riskThreshold, setRiskThreshold] = useState(parseInt(localStorage.getItem('risk_threshold')) || 50);
  const [skillWeight, setSkillWeight] = useState(parseFloat(localStorage.getItem('skill_weight')) || 0.7);
  const [socialWeight, setSocialWeight] = useState(parseFloat(localStorage.getItem('social_weight')) || 0.3);
  const [saved, setSaved] = useState(false);

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

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const getRiskLabel = (v) => {
    if (v <= 30) return 'Tolerant';
    if (v <= 50) return 'Standard';
    if (v <= 70) return 'Conservative';
    return 'Strict';
  };

  return (
    <div className="glass rounded-2xl p-8 shadow-2xl shadow-black/40 ring-1 ring-white/5 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-bl-full pointer-events-none blur-3xl"></div>
      
      <div className="flex flex-col gap-8 relative z-10">
        <div className="border-b border-white/5 pb-4 flex justify-between items-end">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <span className="text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]">⚙️</span> 
              System Configuration
            </h2>
            <p className="text-slate-400 text-sm mt-1">Adjust AI engine parameters, matching weights, and export preferences.</p>
          </div>
          {saved && (
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20 animate-pulse">
              <CheckCircle2 size={14} /> CONFIGURATION SYNCED
            </div>
          )}
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
              </label>
              <input 
                type="password"
                value={apiKey}
                onChange={(e) => handleSaveKey(e.target.value)}
                placeholder="gsk_..."
                className="bg-black/40 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white focus:ring-1 focus:ring-accent outline-none font-mono"
              />
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex justify-between">
                <span>Risk Tolerance Threshold</span>
                <span className="text-accent">{riskThreshold}% ({getRiskLabel(riskThreshold)})</span>
              </label>
              <input 
                type="range" min="10" max="90" step="5"
                value={riskThreshold}
                onChange={(e) => handleThresholdChange(e.target.value)}
                className="accent-accent h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer" 
              />
              <p className="text-[10px] text-slate-500 italic mt-1">Defines the baseline for "High Risk" classification.</p>
            </div>
          </div>

          {/* Crew Matching Weights */}
          <div className="flex flex-col gap-4 bg-secondary/30 p-5 rounded-xl border border-white/5">
            <h3 className="text-white font-bold flex items-center gap-2"><Sliders size={16} className="text-blue-400" /> Crew Matching Weights</h3>
            
            <div className="flex flex-col gap-2">
               <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex justify-between">
                <span>Skill Emphasis</span>
                <span className="text-blue-400">{Math.round(skillWeight * 100)}%</span>
              </label>
              <input 
                type="range" min="0" max="1" step="0.05"
                value={skillWeight}
                onChange={(e) => handleWeightsChange(parseFloat(e.target.value), 1 - parseFloat(e.target.value))}
                className="accent-blue-500 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer" 
              />
            </div>

            <div className="flex flex-col gap-2 mt-2">
               <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex justify-between">
                <span>Social Follower Weight</span>
                <span className="text-green-400">{Math.round(socialWeight * 100)}%</span>
              </label>
              <input 
                type="range" min="0" max="1" step="0.05"
                value={socialWeight}
                onChange={(e) => handleWeightsChange(1 - parseFloat(e.target.value), parseFloat(e.target.value))}
                className="accent-green-500 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer" 
              />
            </div>
            <p className="text-[10px] text-slate-500 italic mt-auto">Adjust how talent is ranked between technical skills and social reach.</p>
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
