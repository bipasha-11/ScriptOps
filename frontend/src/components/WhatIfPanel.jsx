import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Settings, TrendingUp, TrendingDown, Minus } from 'lucide-react';

import API_BASE_URL from '../config';

const API = `${API_BASE_URL}/api/v1`;
const FEATURE_LIST = ['crowd', 'vfx', 'stunt', 'night', 'rain', 'vehicle', 'weapon', 'animal'];

export default function WhatIfPanel({ scenes, selectedScene }) {
  const scene = scenes?.find((s) => s.scene_number === selectedScene);
  const [features, setFeatures] = useState({});
  const [dayNight, setDayNight] = useState('');
  const [numChars, setNumChars] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Reset state when scene changes
  const sceneKey = scene?.scene_number;

  const toggleFeature = (feat) => {
    setFeatures((prev) => {
      const current = prev[feat] ?? scene?.features?.[feat] ?? false;
      return { ...prev, [feat]: !current };
    });
    setResult(null);
  };

  const simulate = async () => {
    if (!scene) return;
    setLoading(true);
    try {
      const body = {};
      if (Object.keys(features).length) body.features = features;
      if (dayNight) body.day_night = dayNight;
      if (numChars !== '') body.num_characters = parseInt(numChars) || 0;

      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/whatif/${scene.scene_number}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!scene) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500 h-full">
        <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
          <Settings size={32} strokeWidth={1.5} className="opacity-50" />
        </div>
        <h3 className="text-lg font-medium text-slate-400">What-If Simulator</h3>
        <p className="text-sm mt-1 text-center max-w-xs">Select a scene from the table below to simulate production changes</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full text-sm">
      <div className="mb-6 pb-4 border-b border-white/10">
        <h4 className="text-accent font-bold tracking-wide uppercase text-xs mb-1">Scene #{scene.scene_number}</h4>
        <p className="text-white font-medium text-base truncate">{scene.heading}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {FEATURE_LIST.map((feat) => {
          const isOn = features[feat] ?? scene.features?.[feat] ?? false;
          return (
            <button
              key={feat}
              className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all ${
                isOn 
                  ? 'bg-accent/20 border-accent/50 text-white shadow-[0_0_10px_rgba(124,58,237,0.2)]' 
                  : 'bg-secondary/50 border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-300'
              }`}
              onClick={() => toggleFeature(feat)}
            >
              <span className="capitalize text-xs font-semibold">{feat}</span>
              <div className={`w-2 h-2 rounded-full ${isOn ? 'bg-accent shadow-[0_0_5px_var(--color-accent)]' : 'bg-slate-600'}`} />
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Time of Day</label>
          <select 
            value={dayNight || scene.scene_type?.day_night} 
            onChange={(e) => { setDayNight(e.target.value); setResult(null); }}
            className="bg-secondary border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
          >
            <option value="DAY">Day</option>
            <option value="NIGHT">Night</option>
            <option value="DAWN/DUSK">Dawn/Dusk</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Characters</label>
          <input
            type="number" min="0" max="50"
            value={numChars !== '' ? numChars : scene.num_characters}
            onChange={(e) => { setNumChars(e.target.value); setResult(null); }}
            className="bg-secondary border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
          />
        </div>
      </div>

      <button 
        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
          loading 
            ? 'bg-accent/50 text-white/50 cursor-not-allowed' 
            : 'bg-accent hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] hover:-translate-y-0.5'
        }`}
        onClick={simulate} 
        disabled={loading}
      >
        <Zap size={18} className={loading ? 'animate-pulse' : ''} />
        {loading ? 'Simulating Impact...' : 'Run Simulation'}
      </button>

      <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-secondary/80 border border-white/10 rounded-xl p-5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Simulation Impact</h4>
              
              <div className="flex flex-col gap-4">
                {/* Risk Score */}
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Risk Score</span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-400">{result.original_risk}</span>
                    <span className="text-slate-600">→</span>
                    <span className="text-white font-bold">{result.modified_risk}</span>
                    <span className={`flex items-center text-xs ml-1 ${result.delta_risk > 0 ? 'text-red-400' : result.delta_risk < 0 ? 'text-green-400' : 'text-slate-500'}`}>
                      {result.delta_risk > 0 ? <TrendingUp size={14} className="mr-1"/> : result.delta_risk < 0 ? <TrendingDown size={14} className="mr-1"/> : <Minus size={14} className="mr-1"/>}
                      {Math.abs(result.delta_risk)}
                    </span>
                  </div>
                </div>

                {/* Budget */}
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Budget</span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-400">${(result.original_budget / 1000).toFixed(1)}K</span>
                    <span className="text-slate-600">→</span>
                    <span className="text-white font-bold">${(result.modified_budget / 1000).toFixed(1)}K</span>
                    <span className={`flex items-center text-xs ml-1 ${result.delta_budget > 0 ? 'text-red-400' : result.delta_budget < 0 ? 'text-green-400' : 'text-slate-500'}`}>
                      {result.delta_budget > 0 ? <TrendingUp size={14} className="mr-1"/> : result.delta_budget < 0 ? <TrendingDown size={14} className="mr-1"/> : <Minus size={14} className="mr-1"/>}
                      ${(Math.abs(result.delta_budget) / 1000).toFixed(1)}K
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
