

import React, { useState } from 'react';
import { ArrowLeftRight, RotateCcw, Check, X, Settings, Maximize, Users, Eraser, RotateCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Language } from '../types';
import { t } from '../constants';

interface ControlsProps {
  onUndo: () => void;
  onReset: () => void;
  onSwap: () => void;
  onSettings: () => void;
  onFullscreen: () => void;
  onOpenTeamManager: () => void;
  canUndo: boolean;
  lang: Language;
}

export const Controls: React.FC<ControlsProps> = ({ 
    onUndo, 
    onReset, 
    onSwap, 
    onSettings, 
    onFullscreen,
    onOpenTeamManager,
    canUndo, 
    lang
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  // Dock Button Style
  const btnClass = "relative flex items-center justify-center w-11 h-11 rounded-full text-slate-500 dark:text-slate-400 transition-all active:scale-90 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white";
  const iconSize = 20;

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="w-full z-40 px-4 pb-8 pt-2 relative bg-transparent shrink-0 flex justify-center pointer-events-none"
    >
      <div className="bg-white/60 dark:bg-[#0f172a]/60 backdrop-blur-2xl border border-white/40 dark:border-white/10 shadow-2xl shadow-black/20 rounded-[2rem] p-2 flex items-center gap-1 pointer-events-auto ring-1 ring-white/20 max-w-full overflow-x-auto no-scrollbar">
      
         {/* Team Manager */}
         <button onClick={onOpenTeamManager} className={btnClass} aria-label={t(lang, 'manageTeams')}>
            <Users size={iconSize} />
        </button>

         {/* Swap */}
        <button onClick={onSwap} className={btnClass} aria-label={t(lang, 'swap')}>
            <ArrowLeftRight size={iconSize} />
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-slate-400/20 dark:bg-white/10 mx-1.5 rounded-full shrink-0"></div>

        {/* Reset Logic (Eraser Icon) */}
        <div className="relative shrink-0">
        <AnimatePresence mode="wait">
          {!confirmReset ? (
            <motion.button
              key="reset-btn"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              onClick={() => setConfirmReset(true)}
              className={btnClass}
              aria-label={t(lang, 'reset')}
            >
              <Eraser size={iconSize} />
            </motion.button>
          ) : (
            <motion.div
              key="confirm-box"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="flex items-center gap-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-full p-0.5 overflow-hidden"
            >
              <button 
                onClick={() => { onReset(); setConfirmReset(false); }}
                className="w-10 h-10 flex items-center justify-center bg-rose-500 text-white rounded-full shadow-sm hover:bg-rose-600 transition-colors"
              >
                <Check size={16} strokeWidth={3} />
              </button>
              <button 
                onClick={() => setConfirmReset(false)}
                className="w-10 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <X size={16} strokeWidth={3} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        </div>

        {/* Undo */}
        <button 
            onClick={onUndo}
            disabled={!canUndo}
            className={`${btnClass} ${!canUndo ? 'opacity-30 cursor-not-allowed' : ''}`}
            aria-label={t(lang, 'undo')}
        >
            <RotateCcw size={iconSize} />
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-slate-400/20 dark:bg-white/10 mx-1.5 rounded-full shrink-0"></div>

        {/* Settings */}
        <button onClick={onSettings} className={btnClass} aria-label={t(lang, 'config')}>
            <Settings size={iconSize} />
        </button>
        
        {/* Fullscreen Trigger */}
        <button onClick={onFullscreen} className={btnClass} aria-label="Fullscreen">
            <Maximize size={iconSize} />
        </button>

        {/* Reload App (Page Refresh) */}
        <button onClick={handleReload} className={btnClass} aria-label={t(lang, 'reload')}>
            <RotateCw size={iconSize} />
        </button>

      </div>
    </motion.div>
  );
};