import { LayoutDashboard, FileText, Users, Settings, ChevronLeft, ChevronRight, LogOut, Download, Database, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function Sidebar({ isCollapsed, onToggle, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleNavClick = (id) => {
    setActiveTab(id);
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <aside className={`fixed left-0 top-0 h-screen bg-secondary flex flex-col border-r border-white/5 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.5)] transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className={`p-8 flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between'}`}>
         <h1 className="text-xl font-bold text-white tracking-widest flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
           <span className="text-accent text-3xl">🎬</span> 
           {!isCollapsed && <span>ScriptOps</span>}
         </h1>
      </div>
      
      <nav className={`flex-1 flex flex-col gap-2 mt-4 ${isCollapsed ? 'px-3' : 'px-4'}`}>
        {[ {icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard'},
           {icon: FileText, label: 'Scripts', id: 'scripts'},
           {icon: Users, label: 'Crew Match', id: 'crew'},
         ].map(item => {
           const isActive = activeTab === item.id;
           return (
             <div 
               key={item.label} 
               onClick={() => handleNavClick(item.id)}
               title={isCollapsed ? item.label : ''}
               className={`flex items-center gap-4 py-3.5 rounded-xl cursor-pointer transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'px-5'} ${
                 isActive 
                  ? 'bg-accent/15 text-accent font-semibold shadow-[inset_2px_0_0_var(--color-accent)]' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5 hover:translate-x-1'
               }`}
             >
                <item.icon size={22} className={isActive ? 'drop-shadow-[0_0_8px_rgba(124,58,237,0.5)]' : ''} />
                {!isCollapsed && <span className="text-[0.95rem] tracking-wide whitespace-nowrap overflow-hidden">{item.label}</span>}
             </div>
           );
        })}

        {/* Data Options in Sidebar */}
        {!isCollapsed && (
          <div className="mt-8 flex flex-col gap-2 px-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-3">Output & Data</p>
            <button className="flex items-center gap-3 w-full p-3 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-all text-left">
              <Download size={16} className="text-emerald-400" /> Export Full PDF
            </button>
            <button className="flex items-center gap-3 w-full p-3 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-all text-left">
              <Database size={16} className="text-blue-400" /> Download .FDX
            </button>
            <button className="flex items-center gap-3 w-full p-3 rounded-xl text-xs font-bold text-slate-500 hover:text-red-400 hover:bg-red-400/5 transition-all text-left mt-2">
              <Trash2 size={16} /> Purge Data
            </button>
          </div>
        )}
      </nav>
      
      {/* Bottom Control Hint */}
      {!isCollapsed ? (
        <div className="p-4 border-t border-white/5 flex flex-col gap-3">
          <button onClick={onToggle} className="flex items-center justify-center gap-2 text-slate-400 hover:text-white transition-colors w-full p-2 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10">
            <ChevronLeft size={16} /> Hide Sidebar
          </button>
        </div>
      ) : (
        <div className="p-4 border-t border-white/5 flex flex-col gap-2 items-center">
          <div className="flex flex-col gap-4 mb-4">
            <Download size={18} className="text-slate-500 hover:text-emerald-400 cursor-pointer" title="Export PDF" />
            <Database size={18} className="text-slate-500 hover:text-blue-400 cursor-pointer" title="Download FDX" />
          </div>
          <button onClick={onToggle} className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors" title="Expand Sidebar">
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </aside>
  );
}
