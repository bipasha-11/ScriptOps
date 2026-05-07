import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Clapperboard, MessageSquare, Users, RefreshCw, Send, AlertTriangle, Lightbulb, Calendar, Info, CornerDownRight } from 'lucide-react';

import API_BASE_URL from '../config';

const API = `${API_BASE_URL}/api/v1`;

const DIFFICULTY_COLORS = {
  Easy: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  Medium: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  Hard: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  Extreme: 'text-red-400 bg-red-400/10 border-red-400/20',
};

function DifficultyBadge({ level }) {
  const colorClass = DIFFICULTY_COLORS[level] || 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20';
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colorClass} tracking-wide uppercase shadow-sm`}>
      {level}
    </span>
  );
}

function ShimmerRow() {
  return (
    <div className="h-20 rounded-xl bg-gradient-to-r from-secondary via-white/5 to-secondary bg-[length:200%_100%] animate-pulse border border-white/5" />
  );
}

function EmptyState({ tab, selectedScene }) {
  if (tab === 'scene' && !selectedScene) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
          <Clapperboard size={32} strokeWidth={1.5} className="opacity-50" />
        </div>
        <h3 className="text-lg font-medium text-slate-300">No Target Scene</h3>
        <p className="text-sm mt-1 max-w-xs text-slate-500">Select a scene from the tracker to view localized script breakdown.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center p-12 text-slate-500 text-center">
      <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-4 text-accent">
        <Sparkles size={32} strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-medium text-slate-300">No Insights Generated</h3>
      <p className="text-sm mt-1 max-w-xs text-slate-500">Hit the Generate button to run deep intelligence over this parameter.</p>
    </div>
  );
}

const TAB_ICONS = {
  overall: Sparkles,
  scene: Clapperboard,
  chat: MessageSquare,
  crew: Users
};

export default function InsightsPanel({ analysis, selectedScene }) {
  const [tab, setTab] = useState('overall'); // 'overall', 'scene', 'chat', 'crew'
  
  // Analytics State
  const [overallData, setOverallData] = useState(null);
  const [sceneData, setSceneData] = useState({});
  const [crewData, setCrewData] = useState(null);
  const [crewLoading, setCrewLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const prevScene = useRef(null);

  // Chat State
  const [chatHistory, setChatHistory] = useState([
    { role: 'model', content: "System Online. I am your specialized production Intelligence assistant powered by Llama 3. Ask me to break down risk vectors, summarize characters, or suggest budget cuts." }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (selectedScene && selectedScene !== prevScene.current) {
      if (tab !== 'chat') setTab('scene');
      prevScene.current = selectedScene;
      if (!sceneData[selectedScene]) fetchScene(selectedScene);
    }
  }, [selectedScene, tab, sceneData]);

  useEffect(() => {
    if (tab === 'chat' && chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [chatHistory, tab]);

  const fetchOverall = async () => {
    if (overallData) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const groqKey = localStorage.getItem('groq_api_key');
      const headers = { 
        'Authorization': `Bearer ${token}`
      };
      if (groqKey) headers['X-Groq-Api-Key'] = groqKey;

      const res = await fetch(`${API}/insights`, {
        headers: headers
      });
      setOverallData(await res.json());
    } catch (e) {
      setOverallData({ error: e.message });
    } finally { setLoading(false); }
  };

  const fetchScene = async (sceneNum) => {
    const num = sceneNum ?? selectedScene;
    if (!num) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const groqKey = localStorage.getItem('groq_api_key');
      const headers = { 
        'Authorization': `Bearer ${token}`
      };
      if (groqKey) headers['X-Groq-Api-Key'] = groqKey;

      const res = await fetch(`${API}/insights/${num}`, {
        headers: headers
      });
      const data = await res.json();
      setSceneData(prev => ({ ...prev, [num]: data }));
    } catch (e) {
      setSceneData(prev => ({ ...prev, [num]: { error: e.message } }));
    } finally { setLoading(false); }
  };

  const fetchCrew = async () => {
    setCrewLoading(true);
    try {
      let keywords = "Cinematic, High Quality, Drama";
      let max_budget = 10000;
        
      const currentSceneData = selectedScene ? analysis?.scenes.find(s => s.scene_number === selectedScene) : null;
      if (currentSceneData) {
        const features = Object.entries(currentSceneData.features).filter(([k,v]) => v).map(([k,v]) => k).join(", ");
        keywords = `${currentSceneData.scene_type.day_night}, ${currentSceneData.scene_type.interior ? 'Interior' : 'Exterior'}, ${features}, ${currentSceneData.heading}`;
        
        // Estimate a dynamic Max Daily Rate based on 10-15% of the overall scene budget parameter
        max_budget = Math.max(2000, currentSceneData.budget * 0.15);
      }
      
      const token = localStorage.getItem('token');
      const skillWeight = parseFloat(localStorage.getItem('skill_weight')) || 0.7;
      const socialWeight = parseFloat(localStorage.getItem('social_weight')) || 0.3;

      const res = await fetch(`${API}/match-creators`, { 
          method: 'POST', 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }, 
          body: JSON.stringify({ 
            script_requirements: { keywords: keywords, max_budget_usd: max_budget },
            skill_weight: skillWeight,
            social_weight: socialWeight
          }) 
      });
      
      const data = await res.json();
      setCrewData(data.matches || []);
    } catch (e) { console.error(e); } 
    finally { setCrewLoading(false); }
  };

  const handleGenerate = () => {
    if (tab === 'overall') fetchOverall();
    else if (tab === 'scene') fetchScene();
    else if (tab === 'crew') fetchCrew();
  };

  const refreshCurrent = () => {
    if (tab === 'overall') { setOverallData(null); setTimeout(fetchOverall, 0); }
    else if (tab === 'scene' && selectedScene) {
      setSceneData(prev => { const n = { ...prev }; delete n[selectedScene]; return n; });
      setTimeout(() => fetchScene(selectedScene), 0);
    }
  };

  const handleSendChat = async (e) => {
    e?.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = { role: 'user', content: chatInput.trim() };
    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    setChatInput('');
    setChatLoading(true);

    try {
      const token = localStorage.getItem('token');
      const groqKey = localStorage.getItem('groq_api_key');
      const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      if (groqKey) headers['X-Groq-Api-Key'] = groqKey;

      const res = await fetch(`${API}/insights/chat`, {
        method: 'POST', 
        headers: headers,
        body: JSON.stringify({ messages: newHistory, selected_scene_id: selectedScene || null })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || "Server error");
      setChatHistory(prev => [...prev, { role: 'model', content: data.response }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'model', content: `⚠️ ${err.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  const currentData = tab === 'overall' ? overallData : (tab === 'scene' && selectedScene ? sceneData[selectedScene] : null);
  const hasData = currentData && !currentData.error;
  const hasError = currentData?.error;
  const needsGenerate = !currentData && !loading && tab !== 'chat';
  const missingScene = tab === 'scene' && !selectedScene;
  const currentScene = selectedScene ? analysis?.scenes.find(s => s.scene_number === selectedScene) : null;

  if (!analysis) return null;

  return (
    <div className="flex flex-col h-[550px] gap-4">

      {/* Futuristic Tab Bar */}
      <div className="flex gap-2 items-center bg-black/20 p-1.5 rounded-xl border border-white/5">
        {[
          { id: 'overall', label: 'Overall' },
          { id: 'scene',   label: selectedScene ? `Scene ${selectedScene}` : 'Local Scene' },
          { id: 'chat',    label: 'Chat AI' },
          { id: 'crew',    label: 'Crew Match' }
        ].map(({ id, label }) => {
           const Icon = TAB_ICONS[id];
           const isActive = tab === id;
           return (
             <button
               key={id}
               onClick={() => setTab(id)}
               className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all relative
                 ${isActive ? 'text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}
               `}
             >
               {isActive && <motion.div layoutId="activeTab" className="absolute inset-0 bg-accent rounded-lg" transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />}
               <span className="relative z-10 flex items-center gap-1.5">
                 <Icon size={14} className={isActive ? 'text-white' : 'text-slate-500'} />
                 <span className="truncate max-w-[80px] sm:max-w-none">{label}</span>
               </span>
             </button>
           );
        })}

        {hasData && tab !== 'chat' && tab !== 'crew' && (
          <button
            onClick={refreshCurrent} disabled={loading} title="Re-generate insights"
            className="p-2 ml-1 rounded-lg border border-white/10 bg-secondary/50 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        )}
      </div>

      {currentScene && (tab === 'scene' || tab === 'chat' || tab === 'crew') && (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center flex-wrap gap-3 px-4 py-3 bg-secondary/60 rounded-xl border border-accent/20 backdrop-blur-sm">
            <span className="font-bold text-white text-sm flex items-center gap-2"><CornerDownRight size={14} className="text-accent" /> {currentScene.heading}</span>
            <div className="flex gap-3 text-xs font-mono font-bold bg-black/40 px-3 py-1.5 rounded-md border border-white/5">
              <span className="text-slate-400">RISK <span className={currentScene.risk_score >= 70 ? 'text-red-400' : currentScene.risk_score >= 50 ? 'text-orange-400' : currentScene.risk_score >= 30 ? 'text-yellow-400' : 'text-green-400'}>{currentScene.risk_score}</span>/100</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">BUDGET <span className="text-white">${currentScene.budget.toLocaleString()}</span></span>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-black/10 rounded-xl border border-white/5 p-4 flex flex-col relative">

        {tab === 'chat' && (
          <div className="flex flex-col h-full">
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4 pb-4 pr-2">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex max-w-[85%] ${msg.role === 'user' ? 'self-end' : 'self-start'}`}>
                   {msg.role === 'model' && (
                     <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent mr-3 mt-1 shrink-0">
                       <Sparkles size={14} />
                     </div>
                   )}
                   <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                     msg.role === 'user' 
                       ? 'bg-accent text-white rounded-br-sm shadow-[0_4px_15px_rgba(124,58,237,0.3)]' 
                       : 'bg-secondary/80 border border-white/5 text-slate-200 rounded-bl-sm'
                   }`}>
                     {msg.content}
                   </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex max-w-[85%] self-start">
                   <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent mr-3 mt-1 shrink-0 animate-pulse">
                     <Sparkles size={14} />
                   </div>
                   <div className="px-5 py-4 rounded-2xl bg-secondary/80 border border-white/5 rounded-bl-sm flex gap-1.5 items-center">
                     <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                     <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                     <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                   </div>
                </div>
              )}
              {/* Removed chatEndRef to prevent page hijacking via scrollIntoView */}
            </div>

            <form onSubmit={handleSendChat} className="mt-auto relative">
              <input
                type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} disabled={chatLoading}
                placeholder={selectedScene ? `Ask about Scene ${selectedScene}...` : "Query productions models..."}
                className="w-full bg-secondary/90 border border-white/10 rounded-xl py-3.5 pl-4 pr-12 text-sm text-white placeholder:text-slate-500 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all shadow-inner"
              />
              <button
                type="submit" disabled={!chatInput.trim() || chatLoading}
                className={`absolute right-2 top-2 p-1.5 rounded-lg flex items-center justify-center transition-all ${
                  (!chatInput.trim() || chatLoading) ? 'text-slate-600' : 'bg-accent text-white hover:bg-purple-500 shadow-md'
                }`}
              >
                <Send size={16} className={(!chatInput.trim() || chatLoading) ? '' : 'ml-0.5'} />
              </button>
            </form>
          </div>
        )}

        {loading && tab !== 'chat' && (
          <div className="flex flex-col gap-3 mt-2"><ShimmerRow /><ShimmerRow /><ShimmerRow /></div>
        )}

        {!loading && missingScene && tab !== 'chat' && tab !== 'crew' && <EmptyState tab="scene" selectedScene={null} />}
        
        {!loading && needsGenerate && !missingScene && tab !== 'chat' && tab !== 'crew' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-6 py-8 m-auto">
            <EmptyState tab={tab} selectedScene={selectedScene} />
            <button onClick={handleGenerate} className="bg-accent hover:bg-purple-500 text-white font-bold py-3 px-8 rounded-xl shadow-[0_0_20px_rgba(124,58,237,0.4)] flex items-center gap-2 transition-all hover:scale-105">
              <Sparkles size={18} /> Generate Intel
            </button>
          </motion.div>
        )}

        {!loading && hasError && tab !== 'chat' && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 flex justify-between items-center">
            <div>
              <h4 className="text-red-400 font-bold mb-1 flex items-center gap-2"><AlertTriangle size={18} /> Error parsing intel</h4>
              <p className="text-slate-400 text-sm">{currentData.error}</p>
            </div>
            <button onClick={handleGenerate} className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg text-sm font-bold border border-red-500/20 hover:bg-red-500/30">Retry</button>
          </div>
        )}

        {/* OVERALL TAB */}
        {!loading && hasData && tab === 'overall' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4 pb-4">
            {currentData.executive_summary && (
              <div className="bg-secondary/60 border border-white/5 rounded-xl p-5">
                <h4 className="text-white font-bold mb-2 flex items-center gap-2 text-sm tracking-wide"><Info size={16} className="text-blue-400" /> EXECUTIVE SUMMARY</h4>
                <p className="text-slate-300 text-sm leading-relaxed">{currentData.executive_summary}</p>
              </div>
            )}
            {currentData.key_concerns?.length > 0 && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-5">
                <h4 className="text-orange-400 font-bold mb-3 flex items-center gap-2 text-sm tracking-wide"><AlertTriangle size={16} /> CRITICAL CONCERNS</h4>
                <ul className="flex flex-col gap-2">
                  {currentData.key_concerns.map((c, i) => <li key={i} className="text-slate-300 text-sm flex gap-2"><span className="text-orange-500/50 mt-0.5">•</span> <span>{c}</span></li>)}
                </ul>
              </div>
            )}
            {currentData.recommendations?.length > 0 && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-5">
                <h4 className="text-green-400 font-bold mb-3 flex items-center gap-2 text-sm tracking-wide"><Lightbulb size={16} /> KEY RECOMMENDATIONS</h4>
                <ul className="flex flex-col gap-2">
                  {currentData.recommendations.map((r, i) => <li key={i} className="text-slate-300 text-sm flex gap-2"><span className="text-green-500/50 mt-0.5">•</span> <span>{r}</span></li>)}
                </ul>
              </div>
            )}
            {currentData.suggested_shoot_order && (
              <div className="bg-secondary/60 border border-white/5 rounded-xl p-5">
                <h4 className="text-white font-bold mb-2 flex items-center gap-2 text-sm tracking-wide"><Calendar size={16} className="text-purple-400" /> MACRO SHOOT ORDER</h4>
                <p className="text-slate-300 text-sm leading-relaxed">{currentData.suggested_shoot_order}</p>
              </div>
            )}
            {currentData.estimated_total_shooting_days != null && (
              <div className="mt-2 text-center py-4 bg-accent/10 border border-accent/20 rounded-xl">
                 <p className="text-sm font-medium text-slate-300">ESTIMATED PRINCIPAL PHOTOGRAPHY: <span className="text-xl font-bold text-accent ml-2">{currentData.estimated_total_shooting_days} DAYS</span></p>
              </div>
            )}
          </motion.div>
        )}

        {/* SCENE TAB */}
        {!loading && hasData && tab === 'scene' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4 pb-4">
            {currentData.summary && (
              <div className="bg-secondary/60 border border-white/5 rounded-xl p-5">
                <h4 className="text-white font-bold mb-2 flex items-center gap-2 text-sm tracking-wide"><Info size={16} className="text-blue-400" /> SCENE DECONSTRUCTION</h4>
                <p className="text-slate-300 text-sm leading-relaxed">{currentData.summary}</p>
              </div>
            )}
            {currentData.top_risks?.length > 0 && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                <h4 className="text-red-400 font-bold mb-3 flex items-center gap-2 text-sm tracking-wide"><AlertTriangle size={16} /> IDENTIFIED RISKS & MITIGATION</h4>
                <ul className="flex flex-col gap-3">
                  {currentData.top_risks.map((r, i) => (
                    <li key={i} className="text-sm">
                      <strong className="text-white block mb-1">{r.risk}</strong>
                      <span className="text-slate-400 flex gap-2"><CornerDownRight size={14} className="mt-0.5 text-red-500/50 shrink-0"/> {r.mitigation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {currentData.cost_optimizations?.length > 0 && (
              <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                <h4 className="text-green-400 font-bold mb-3 flex items-center gap-2 text-sm tracking-wide"><Lightbulb size={16} /> BUDGET OPTIMIZATION SPONSORS</h4>
                <ul className="flex flex-col gap-2">
                  {currentData.cost_optimizations.map((c, i) => <li key={i} className="text-slate-300 text-sm flex gap-2"><span className="text-green-500/50 mt-0.5">•</span> <span>{c}</span></li>)}
                </ul>
              </div>
            )}
            {currentData.difficulty && (
              <div className="bg-secondary/60 border border-white/5 rounded-xl p-5 flex justify-between items-center">
                <div>
                  <h4 className="text-white font-bold mb-1 text-sm tracking-wide text-slate-400">PRODUCTION COMPLEXITY</h4>
                  <p className="text-sm font-medium text-slate-300 mt-1">Setup time approx: <span className="text-white font-bold ml-1">{currentData.shooting_days_estimate ?? '1/8 days'}</span></p>
                </div>
                <DifficultyBadge level={currentData.difficulty} />
              </div>
            )}
          </motion.div>
        )}

        {/* CREW MATCHING */}
        {tab === 'crew' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4 pb-4 h-full">
            {!crewData && !crewLoading && (
               <div className="flex flex-col items-center justify-center p-12 text-center h-full m-auto">
                 <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center mb-6 text-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                   <Users size={36} strokeWidth={1.5} />
                 </div>
                 <h3 className="text-xl font-bold text-white mb-2 tracking-wide">AI Crew Radar</h3>
                 <p className="text-sm mt-1 max-w-sm text-slate-400 leading-relaxed mb-8">Scan deterministic matrices to surface optimal talent fits for your specific logistical requirements.</p>
                 <button onClick={fetchCrew} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center gap-2 transition-all hover:scale-105">
                   <Sparkles size={18} /> Execute Search Match
                 </button>
               </div>
            )}
            {crewLoading && (
              <div className="flex flex-col gap-3 mt-2"><ShimmerRow /><ShimmerRow /></div>
            )}
            {crewData && crewData.map((match, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                key={i} className="bg-secondary/60 rounded-xl p-5 border border-white/10 relative overflow-hidden group hover:border-white/20 transition-colors"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full border-b border-l border-blue-500/10 pointer-events-none group-hover:bg-blue-500/10 transition-colors"></div>
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4 relative z-10">
                     <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-accent flex items-center justify-center font-bold text-white text-lg shadow-md border-2 border-primary">
                       {match.creator_name.charAt(0)}
                     </div>
                     <div className="flex flex-col justify-center">
                       <h4 className="text-lg leading-tight font-bold text-white tracking-wide">{match.creator_name}</h4>
                       <span className="text-[0.70rem] mt-1 leading-none font-semibold text-slate-400 tracking-wider uppercase block">{match.raw_data.experience_level} • {match.raw_data.engagement_rate} Social</span>
                     </div>
                  </div>
                  <div className="relative z-10 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full font-bold text-xs border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                    {(match.score).toFixed(1)} / 10 Match
                  </div>
                </div>
                
                <p className="text-sm text-slate-300 leading-relaxed mb-4 relative z-10 border-l-2 border-white/20 pl-3 italic">
                  "{match.explanation.why_they_fit}"
                </p>
                {match.explanation.trade_offs !== "None." && (
                  <div className="text-xs font-medium text-amber-500 border border-amber-500/20 bg-amber-500/10 px-3 py-2 rounded-lg mb-4 flex gap-2 w-fit relative z-10">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" /> <span>{match.explanation.trade_offs}</span>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2 relative z-10">
                  {match.raw_data.skills.map((s, idx) => (
                    <span key={idx} className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-[0.65rem] font-bold text-slate-300 uppercase tracking-wider">
                      {s}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
