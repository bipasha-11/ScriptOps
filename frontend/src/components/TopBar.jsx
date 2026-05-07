import { Search, Bell, User, LogOut, Settings } from 'lucide-react';

export default function TopBar({ onLogout, userName }) {
  const scrollToSettings = () => {
    const el = document.getElementById('settings');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
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
          <button 
            onClick={scrollToSettings}
            className="flex items-center gap-2 text-slate-400 hover:text-accent transition-colors text-sm font-bold uppercase tracking-widest group"
          >
             <Settings size={18} className="group-hover:rotate-90 transition-transform duration-500" /> 
             <span className="hidden lg:inline">System Config</span>
          </button>

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
