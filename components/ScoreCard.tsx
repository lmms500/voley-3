import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { TeamId, Language } from '../types';
import { THEME, t } from '../constants';
import { Zap, Plus, Minus, Volleyball } from 'lucide-react';

interface ScoreCardProps {
  teamId: TeamId;
  teamName?: string;
  score: number;
  opponentScore: number;
  setsWon: number;
  maxSets: number;
  setsToWinMatch: number;
  isWinner?: boolean;
  inSuddenDeath?: boolean;
  isServing: boolean;
  timeoutsUsed: number;
  onAdd: () => void;
  onSubtract: () => void;
  onToggleService: () => void;
  onUseTimeout: () => void;
  pointsToWinSet: number;
  lang: Language;
  isLandscape: boolean;
  isFullscreen: boolean;
  safeAreaTop: boolean;
  safeAreaBottom: boolean;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({
  teamId,
  teamName,
  score,
  opponentScore,
  setsWon,
  maxSets,
  setsToWinMatch,
  isWinner,
  inSuddenDeath,
  isServing,
  timeoutsUsed,
  onAdd,
  onSubtract,
  onToggleService,
  onUseTimeout,
  pointsToWinSet,
  lang,
  isLandscape,
  isFullscreen,
  safeAreaTop,
  safeAreaBottom
}) => {
  const theme = THEME[teamId];
  const y = useMotionValue(0);
  
  const prevScore = useRef(score);
  const direction = score > prevScore.current ? 1 : -1;

  useEffect(() => {
    prevScore.current = score;
  }, [score]);
  
  const isDragging = useRef(false);
  const dragThreshold = isLandscape ? 50 : 80;
  const feedbackDistance = isLandscape ? 50 : 80;

  // Transformations
  const upOpacity = useTransform(y, [-20, -dragThreshold], [0, 1]);
  const upScale = useTransform(y, [-20, -dragThreshold], [0.8, 1.2]);
  const downOpacity = useTransform(y, [20, dragThreshold], [0, 1]);
  const downScale = useTransform(y, [20, dragThreshold], [0.8, 1.2]);

  const triggerHaptic = (pattern: number | number[] = 15) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  const displayName = teamName && teamName.trim() !== '' 
    ? teamName 
    : t(lang, theme.nameKey as any);

  const isMatchPoint = setsWon === setsToWinMatch - 1 && score >= pointsToWinSet - 1 && score > opponentScore;
  const isSetPoint = !isMatchPoint && score >= pointsToWinSet - 1 && score > opponentScore;

  const scoreVariants = {
    enter: (dir: number) => ({ y: dir > 0 ? 50 : -50, opacity: 0, scale: 0.9 }),
    center: { y: 0, opacity: 1, scale: 1 },
    exit: (dir: number) => ({ y: dir > 0 ? -50 : 50, opacity: 0, scale: 1.1, position: 'absolute' as const })
  };

  // --- LAYOUT LOGIC ---
  // Adjusted padding to ensure content doesn't get pushed too far
  const paddingTop = safeAreaTop ? 'pt-20' : 'pt-2';
  const paddingBottom = safeAreaBottom ? 'pb-24' : 'pb-2';
  const paddingClass = `${paddingTop} ${paddingBottom} px-4`;

  // Font Size - Massive Typography (Adjusted to prevent clipping)
  // Switched to leading-none to prevent vertical clipping
  // Reduced VH values slightly to fit safe areas
  let scoreSizeClass = '';
  if (isLandscape) {
    // Landscape Mode
    scoreSizeClass = isFullscreen ? 'text-[35vh] leading-none' : 'text-[28vh] leading-none';
  } else {
    // Portrait Mode (Card height is ~50vh)
    // 20vh font is ~40% of the card height, leaving 60% for name/badges/padding
    scoreSizeClass = isFullscreen ? 'text-[22vh] leading-none' : 'text-[18vh] leading-none';
  }

  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-start transition-all duration-700 overflow-hidden bg-noise ${theme.bgGradient} ${paddingClass}`}>
      
      {/* Serving Spotlight Effect */}
      <AnimatePresence>
        {isServing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 bg-gradient-radial from-white/10 via-transparent to-transparent pointer-events-none mix-blend-overlay`}
          />
        )}
      </AnimatePresence>
      
      {isWinner && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/20 dark:bg-white/5 backdrop-blur-[2px] pointer-events-none z-0" 
        />
      )}

      {/* Visual Feedback Icons */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <motion.div 
            style={{ opacity: upOpacity, scale: upScale, y: -feedbackDistance }}
            className="absolute w-20 h-20 rounded-full bg-emerald-500/90 text-white shadow-[0_0_40px_rgba(16,185,129,0.5)] flex items-center justify-center backdrop-blur-md border border-white/20"
          >
            <Plus size={40} strokeWidth={3} />
          </motion.div>

          <motion.div 
            style={{ opacity: downOpacity, scale: downScale, y: feedbackDistance }}
            className="absolute w-20 h-20 rounded-full bg-rose-500/90 text-white shadow-[0_0_40px_rgba(244,63,94,0.5)] flex items-center justify-center backdrop-blur-md border border-white/20"
          >
             <Minus size={40} strokeWidth={3} />
          </motion.div>
      </div>

      {/* --- HEADER (SETS & TIMEOUTS) - Anchored Top --- */}
      <div className="w-full flex items-start justify-between z-20 shrink-0 mb-2 pointer-events-auto h-12">
        {/* Sets Won */}
        <div className="flex flex-col gap-1">
             <div className="flex gap-2">
                {Array.from({ length: setsToWinMatch }).map((_, i) => (
                <div
                    key={i}
                    className={`rounded-full transition-all duration-500 border border-white/10 ${
                    isLandscape ? 'w-2 h-2' : 'w-3 h-3'
                    } ${
                    i < setsWon 
                        ? `${theme.accentBg} shadow-[0_0_15px_currentColor] scale-110 border-transparent` 
                        : 'bg-black/10 dark:bg-white/10'
                    }`}
                />
                ))}
            </div>
        </div>

        {/* Right side: Timeouts & Service Toggle */}
        <div className="flex flex-col items-end gap-3">
             <button 
                onClick={(e) => { e.stopPropagation(); triggerHaptic(); onToggleService(); }}
                className={`transition-all duration-300 p-2 rounded-full backdrop-blur-md border ${isServing ? theme.text + ' bg-white/30 dark:bg-white/10 border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'text-slate-400/50 border-transparent hover:bg-black/5'}`}
            >
                <Volleyball size={18} />
            </button>
            <div className="flex gap-1.5">
                {[0, 1].map((i) => (
                    <button
                        key={i}
                        disabled={timeoutsUsed > i}
                        onClick={(e) => { e.stopPropagation(); triggerHaptic([10, 10]); onUseTimeout(); }}
                        className={`w-1.5 h-6 rounded-full transition-all border border-white/5 ${
                            i < timeoutsUsed 
                            ? 'bg-black/10 dark:bg-white/5 cursor-not-allowed' 
                            : `${theme.accentBg} opacity-100 hover:scale-110 shadow-sm border-transparent`
                        }`}
                    />
                ))}
            </div>
        </div>
      </div>

      {/* --- CENTERED SANDWICH (NAME, SCORE, BADGES) --- */}
      <motion.div
        style={{ y }}
        className="z-10 flex-1 w-full flex flex-col items-center justify-center outline-none touch-action-none cursor-pointer min-h-0"
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.15}
        onDragStart={() => { isDragging.current = true; }}
        onDragEnd={(e, { offset }) => {
            if (offset.y < -dragThreshold) {
                triggerHaptic();
                onAdd();
            } else if (offset.y > dragThreshold) {
                triggerHaptic();
                onSubtract();
            }
            setTimeout(() => { isDragging.current = false; }, 100);
        }}
        onTap={() => {
            if (!isDragging.current) {
                triggerHaptic();
                onAdd();
            }
        }}
        whileTap={{ scale: 0.98 }}
      >
        {/* 1. NAME (Top of Sandwich) */}
        <div className={`relative px-5 py-1.5 rounded-full border flex items-center gap-2 ${isServing ? 'bg-white/20 dark:bg-black/20 border-white/10 backdrop-blur-lg shadow-sm' : 'border-transparent'} transition-all duration-300 shrink-0 z-20 mb-1`}>
           {isServing && (
             <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className={`${theme.text}`}>
               <Volleyball size={14} fill="currentColor" className="opacity-40" />
             </motion.div>
           )}
           <span className={`font-bold tracking-widest uppercase ${theme.text} ${isLandscape ? 'text-xs' : 'text-sm md:text-base'} truncate max-w-[200px] text-center drop-shadow-sm`}>
             {displayName}
           </span>
        </div>
        
        {/* 2. SCORE (Meat of Sandwich) */}
        <div className="relative flex-1 w-full flex items-center justify-center z-10 min-h-0">
            <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                <motion.span
                    key={score}
                    custom={direction}
                    variants={scoreVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    className={`font-black tabular-nums tracking-tighter ${theme.scoreColor} drop-shadow-2xl ${scoreSizeClass}`}
                    style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.15))' }}
                >
                    {score}
                </motion.span>
            </AnimatePresence>
        </div>

        {/* 3. BADGES (Bottom of Sandwich) */}
        <div className="h-6 flex items-center justify-center gap-2 shrink-0 z-20 mt-2 min-h-[1.5rem]">
            <AnimatePresence>
                {inSuddenDeath && (
                    <motion.div 
                        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                        className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/90 backdrop-blur-md text-white rounded-full shadow-lg shadow-amber-500/20 border border-white/20"
                    >
                        <Zap size={10} fill="currentColor" />
                        <span className="text-[9px] font-bold tracking-wider uppercase">{t(lang, 'firstTo3')}</span>
                    </motion.div>
                )}
                {isMatchPoint && (
                     <motion.div 
                        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                        className="px-4 py-1 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-full shadow-[0_0_20px_rgba(244,63,94,0.4)] animate-pulse border border-white/20"
                    >
                        <span className="text-[10px] font-black tracking-widest uppercase">{t(lang, 'matchPoint')}</span>
                    </motion.div>
                )}
                {isSetPoint && (
                     <motion.div 
                     initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                     className="px-4 py-1 bg-indigo-600 text-white rounded-full shadow-[0_0_20px_rgba(79,70,229,0.4)] border border-white/20"
                 >
                     <span className="text-[10px] font-black tracking-widest uppercase">{t(lang, 'setPoint')}</span>
                 </motion.div>
                )}
            </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};