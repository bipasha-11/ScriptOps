import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LandingExperience from './components/LandingExperience';
import SummaryCards from './components/SummaryCards';
import SceneTable from './components/SceneTable';
import RiskHeatmap from './components/RiskHeatmap';
import BudgetChart from './components/BudgetChart';
import WhatIfPanel from './components/WhatIfPanel';
import InsightsPanel from './components/InsightsPanel';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import SettingsPanel from './components/SettingsPanel';
import DashboardSkeleton from './components/DashboardSkeleton';
import Auth from './components/Auth';
import API_BASE_URL from './config';

function App() {
  const [analysis, setAnalysis] = useState(null);
  const [selectedScene, setSelectedScene] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userName, setUserName] = useState(localStorage.getItem('userName'));
  const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail'));

  const handleLogin = (data) => {
    console.log("Login successful, updating state:", data);
    setIsAuthenticated(true);
    setShowAuthModal(false);
    setUserName(data.name);
    setUserEmail(data.email);
  };

  const handleLogout = () => {
    console.log("Logging out...");
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    setIsAuthenticated(false);
    setUserName(null);
    setUserEmail(null);
    setAnalysis(null);
    // Force a state reset
    window.location.reload();
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (token && (isAuthenticated || !userName || userName === 'undefined')) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (res.status === 401) {
            console.warn("Session expired or invalid, logging out.");
            handleLogout();
            return;
          }

          if (res.ok) {
            const data = await res.json();
            if (data.name) {
              setUserName(data.name);
              localStorage.setItem('userName', data.name);
            }
            if (data.email) {
              setUserEmail(data.email);
              localStorage.setItem('userEmail', data.email);
            }
            setIsAuthenticated(true);
          }
        } catch (e) {
          console.error("Profile fetch failed", e);
        }
      }
    };
    fetchProfile();
  }, [isAuthenticated]);

  const handleFileDrop = async (file) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    setIsAnalyzing(true);
    // Smooth scroll to top in case they uploaded from the bottom of the landing page
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    try {
      const form = new FormData();
      form.append('script', file);
      const token = localStorage.getItem('token');
      
      const res = await fetch(`${API_BASE_URL}/api/v1/upload`, { 
        method: 'POST', 
        body: form,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.status === 401) {
        handleLogout();
        setShowAuthModal(true);
        throw new Error('Session expired. Please login again.');
      }
      
      if (!res.ok) throw new Error('Upload failed');
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const analysisRes = await fetch(`${API_BASE_URL}/api/v1/analysis`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (analysisRes.status === 401) {
        handleLogout();
        setShowAuthModal(true);
        throw new Error('Session expired');
      }

      const data = await analysisRes.json();
      setAnalysis(data);
      setSelectedScene(null);
    } catch (e) {
      console.error(e);
      alert(e.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const showChrome = analysis || isAnalyzing;

  return (
    <div className="min-h-screen bg-primary text-slate-200 flex font-sans selection:bg-accent/30 selection:text-white overflow-hidden">
      
      {/* Gated Auth Experience */}
      {showAuthModal && (
        <Auth onLogin={handleLogin} onCancel={() => setShowAuthModal(false)} />
      )}

      {showChrome && (
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
          onLogout={handleLogout}
        />
      )}
      
      <div className={`flex-1 flex flex-col relative min-w-0 transition-all duration-300 ease-in-out ${showChrome ? (isSidebarCollapsed ? 'ml-20 w-[calc(100%-5rem)]' : 'ml-64 w-[calc(100%-16rem)]') : 'w-full ml-0'}`}>
        
        {showChrome && <TopBar onLogout={handleLogout} />}
        
        <main className={`flex-1 w-full mx-auto relative ${showChrome ? 'p-8 max-w-[1600px]' : 'p-0 max-w-none'}`}>
           <AnimatePresence mode="wait">
             
             {/* LANDING EXPERIENCE */}
             {!analysis && !isAnalyzing && (
               <motion.div 
                 key="landing" 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }} 
                 exit={{ opacity: 0, y: -50 }} 
                 transition={{ duration: 0.5 }} 
               >
                  <LandingExperience 
                    onFileSelect={handleFileDrop} 
                    onAuthClick={() => setShowAuthModal(true)} 
                    isAuthenticated={isAuthenticated}
                    userEmail={userEmail}
                    userName={userName}
                    onLogout={handleLogout}
                  />
               </motion.div>
             )}

             {/* LOADING SKELETON STATE */}
             {isAnalyzing && (
               <motion.div 
                 key="skeleton" 
                 initial={{ opacity: 0, y: 20 }} 
                 animate={{ opacity: 1, y: 0 }} 
                 exit={{ opacity: 0, y: -20 }} 
                 transition={{ duration: 0.4 }} 
                 className="w-full mt-10"
               >
                  <div className="mb-8 flex flex-col gap-2">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                       <span className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin"></span> 
                       Processing Script Intelligence...
                    </h2>
                    <p className="text-slate-400">Extracting scenes, tracking stunts, evaluating logistical risks.</p>
                  </div>
                  <DashboardSkeleton />
               </motion.div>
             )}

             {/* DASHBOARD STATE */}
             {analysis && !isAnalyzing && (
               <motion.div 
                 key="dashboard" 
                 id="dashboard" 
                 initial={{ opacity: 0, y: 20 }} 
                 animate={{ opacity: 1, y: 0 }} 
                 transition={{ duration: 0.5, delay: 0.1 }}
                 className="flex flex-col gap-10 pb-20 mt-4"
               >
                  
                  {/* High-level KPI Cards */}
                  <div className="w-full">
                     <SummaryCards analysis={analysis} />
                  </div>
                  
                  {/* Visual Analytics */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                     <div className="glass rounded-2xl p-6 shadow-2xl shadow-black/40 ring-1 ring-white/5">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                          <span className="text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]">🔥</span> 
                          Risk Heatmap
                        </h2>
                        <div className="h-[350px] w-full">
                          <RiskHeatmap scenes={analysis.scenes} selectedScene={selectedScene} onSelectScene={setSelectedScene} />
                        </div>
                     </div>
                     
                     <div className="glass rounded-2xl p-6 shadow-2xl shadow-black/40 ring-1 ring-white/5">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                          <span className="text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]">💰</span> 
                          Budget by Scene
                        </h2>
                        <div className="h-[350px] w-full">
                          <BudgetChart scenes={analysis.scenes} />
                        </div>
                     </div>
                  </div>

                  {/* Granular Scene Table */}
                  <div id="scripts" className="glass rounded-2xl p-0 overflow-hidden shadow-2xl shadow-black/40 ring-1 ring-white/5">
                     <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                        <h2 className="text-xl font-bold text-white flex items-center gap-3">
                          <span className="text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]">📋</span> 
                          Detailed Shot List
                        </h2>
                     </div>
                     <SceneTable scenes={analysis.scenes} selectedScene={selectedScene} onSelectScene={setSelectedScene} />
                  </div>

                  {/* Interactive Engines */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                     <div className="glass rounded-2xl p-6 shadow-2xl shadow-black/40 ring-1 ring-white/5 h-fit sticky top-28">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                          <span className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]">⚡</span> 
                          What-If Simulator
                        </h2>
                        <WhatIfPanel scenes={analysis.scenes} selectedScene={selectedScene} />
                     </div>
                     
                     <div id="crew" className="glass rounded-2xl p-6 shadow-2xl shadow-black/40 ring-1 ring-white/5">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                          <span className="text-accent drop-shadow-[0_0_8px_rgba(124,58,237,0.8)]">🤖</span> 
                          AI Production Intel
                        </h2>
                        <InsightsPanel analysis={analysis} selectedScene={selectedScene} />
                     </div>
                  </div>

                  {/* System Configuration */}
                  <div id="settings" className="w-full mt-4">
                     <SettingsPanel />
                  </div>

               </motion.div>
             )}
           </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default App;
