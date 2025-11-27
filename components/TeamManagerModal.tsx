
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, Users, Lock, Unlock, Shuffle, Trash2, Edit2, GripHorizontal, RotateCcw } from 'lucide-react';
import { Team, Player, Language } from '../types';
import { t } from '../constants';

interface TeamManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onGenerate: (names: string) => void;
  onUpdateRosters: (teamA: Team | null, teamB: Team | null, queue: Team[]) => void;
  onUpdateTeamName: (teamId: string, newName: string) => void;
  onMovePlayer: (playerId: string, targetTeamId: string) => void;
  onRemovePlayer: (playerId: string) => void;
  onUndo: () => void;
  canUndo: boolean;
  teamA: Team | null;
  teamB: Team | null;
  queue: Team[];
}

interface TeamCardProps {
    team: Team | null;
    label: string;
    onToggleLock: (teamId: string, playerId: string) => void;
    onUpdateName: (teamId: string, newName: string) => void;
    onMovePlayer: (playerId: string, targetTeamId: string) => void;
    onRemovePlayer: (playerId: string) => void;
    lang: Language;
}

const TeamCard: React.FC<TeamCardProps> = ({ 
    team, 
    label, 
    onToggleLock, 
    onUpdateName, 
    onMovePlayer,
    onRemovePlayer,
    lang 
}) => {
    const isDragging = useRef(false);

    if (!team) return null;
    
    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo, player: Player) => {
        const point = info.point;
        const elements = document.elementsFromPoint(point.x, point.y);
        
        // Find the closest element with data-team-id attribute
        const targetTeamElement = elements.find(el => el.hasAttribute('data-team-id'));
        
        if (targetTeamElement) {
            const targetId = targetTeamElement.getAttribute('data-team-id');
            // If valid target and different from current team
            if (targetId && targetId !== team.id) {
                onMovePlayer(player.id, targetId);
            }
        }
    };

    return (
        <div 
            data-team-id={team.id}
            className="rounded-xl p-3 border transition-all relative bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-white/5"
        >
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 pointer-events-none">{label}</span>
                <div 
                    className="flex-1 ml-3 relative"
                    onClick={(e) => e.stopPropagation()} 
                >
                     <input 
                        type="text"
                        value={team.name}
                        onChange={(e) => onUpdateName(team.id, e.target.value)}
                        className="w-full bg-transparent border-b border-transparent focus:border-indigo-500 text-sm font-bold text-indigo-600 dark:text-indigo-400 outline-none text-right px-1"
                     />
                     <Edit2 size={10} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none opacity-50" />
                </div>
            </div>
            
            <div className="flex flex-wrap gap-1.5">
                {team.players.map(p => (
                    <motion.div
                        key={p.id}
                        layout // Smooth reordering animation
                        drag
                        dragSnapToOrigin
                        dragElastic={0} // Remove elasticity for faster feel and exact tracking
                        dragMomentum={false} // Stop movement immediately on release
                        whileDrag={{ 
                            scale: 1.15, 
                            zIndex: 9999, // Ensure it's on top of everything
                            cursor: 'grabbing',
                            boxShadow: "0px 8px 15px rgba(0,0,0,0.2)"
                        }}
                        onDragStart={() => {
                            isDragging.current = true;
                        }}
                        onDragEnd={(e, info) => {
                            handleDragEnd(e, info, p);
                            // Add a small delay before allowing clicks again
                            setTimeout(() => {
                                isDragging.current = false;
                            }, 100);
                        }}
                        onClick={(e) => {
                            // Changed from onTap to onClick to correctly handle stopPropagation from children
                            if (!isDragging.current) {
                                onToggleLock(team.id, p.id);
                            }
                        }}
                        className={`pl-2 pr-1 py-1.5 rounded-md text-xs font-medium flex items-center justify-between gap-1 transition-all border cursor-grab active:cursor-grabbing select-none relative group min-w-[90px] ${
                            p.isFixed 
                                ? 'bg-rose-500 text-white border-rose-500 shadow-sm' 
                                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-500/50'
                        }`}
                    >
                        <span className="truncate max-w-[85px] pointer-events-none">{p.name}</span>
                        
                        <div className="flex items-center">
                            {/* Status Icon (Lock/Unlock) */}
                            <div className={`shrink-0 transition-opacity mr-1 ${p.isFixed ? 'opacity-100' : 'opacity-30 group-hover:opacity-100'}`}>
                                {p.isFixed ? <Lock size={10} /> : <Unlock size={10} />}
                            </div>

                             {/* Delete Button */}
                             <button
                                onPointerDown={(e) => e.stopPropagation()} // Prevent drag start
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent lock toggle bubbling
                                    onRemovePlayer(p.id);
                                }}
                                className={`shrink-0 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-opacity ${p.isFixed ? 'text-white/80 hover:text-white' : 'text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100'}`}
                            >
                                <X size={10} />
                            </button>
                        </div>
                    </motion.div>
                ))}
                {team.players.length < 6 && (
                    <span className="text-xs italic text-slate-400 px-2 py-1 flex items-center pointer-events-none border border-dashed border-slate-300 dark:border-white/10 rounded-md">
                        {6 - team.players.length} {t(lang, 'openSlots')}
                    </span>
                )}
            </div>
        </div>
    );
};

export const TeamManagerModal: React.FC<TeamManagerModalProps> = ({
  isOpen,
  onClose,
  lang,
  onGenerate,
  onUpdateRosters,
  onUpdateTeamName,
  onMovePlayer,
  onRemovePlayer,
  onUndo,
  canUndo,
  teamA,
  teamB,
  queue
}) => {
  const [namesInput, setNamesInput] = useState('');
  const [view, setView] = useState<'input' | 'manage'>((teamA || teamB) ? 'manage' : 'input');

  if (!isOpen) return null;

  const handleGenerate = () => {
    if (namesInput.trim().length > 0) {
        onGenerate(namesInput);
        setView('manage');
    }
  };

  const handleClear = () => {
      onUpdateRosters(null, null, []);
      setNamesInput('');
      setView('input');
  };

  const toggleLock = (teamId: string, playerId: string) => {
      const updatePlayerInTeam = (t: Team) => {
          if (t.id !== teamId) return t;
          return {
              ...t,
              players: t.players.map(p => p.id === playerId ? { ...p, isFixed: !p.isFixed } : p)
          };
      };

      const newTeamA = teamA ? updatePlayerInTeam(teamA) : null;
      const newTeamB = teamB ? updatePlayerInTeam(teamB) : null;
      const newQueue = queue.map(updatePlayerInTeam);

      onUpdateRosters(newTeamA, newTeamB, newQueue);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col h-[85vh]"
      >
         <div className="p-5 border-b border-slate-200 dark:border-white/5 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-500/10 rounded-lg text-indigo-500">
                <Users size={20} />
            </div>
            <h2 className="text-slate-900 dark:text-white text-xl font-bold">{t(lang, 'teamManager')}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
            {view === 'input' ? (
                <div className="space-y-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {t(lang, 'namesList')}
                    </p>
                    <textarea 
                        className="w-full h-64 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-xl text-slate-900 dark:text-white text-sm font-mono placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                        placeholder={t(lang, 'namesPlaceholder')}
                        value={namesInput}
                        onChange={(e) => setNamesInput(e.target.value)}
                    />
                    <button 
                        onClick={handleGenerate}
                        disabled={namesInput.trim().length === 0}
                        className="w-full py-4 bg-indigo-600 disabled:opacity-50 text-white font-bold rounded-xl active:scale-95 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                    >
                        <Shuffle size={18} />
                        {t(lang, 'generateTeams')}
                    </button>
                </div>
            ) : (
                <div className="space-y-4 pb-20">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="text-xs text-slate-400 italic flex items-center gap-1">
                                <GripHorizontal size={14} />
                                <span>{t(lang, 'dragToMove')}</span>
                            </div>
                            <div className="text-xs text-slate-400 italic flex items-center gap-1">
                                <Lock size={12} />
                                <span>{t(lang, 'tapToLock')}</span>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            {/* Undo Button */}
                            <button 
                                onClick={(e) => { e.stopPropagation(); onUndo(); }}
                                disabled={!canUndo}
                                className={`text-xs font-bold flex items-center gap-1 hover:underline ${!canUndo ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-indigo-500'}`}
                            >
                                <RotateCcw size={12} />
                                {t(lang, 'undo')}
                            </button>

                            {/* Clear Button */}
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleClear(); }}
                                className="text-xs font-bold text-rose-500 flex items-center gap-1 hover:underline"
                            >
                                <Trash2 size={12} />
                                {t(lang, 'clear')}
                            </button>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <TeamCard 
                            team={teamA} 
                            label={t(lang, 'home')} 
                            onToggleLock={toggleLock} 
                            onUpdateName={onUpdateTeamName}
                            onMovePlayer={onMovePlayer}
                            onRemovePlayer={onRemovePlayer}
                            lang={lang} 
                        />
                        <TeamCard 
                            team={teamB} 
                            label={t(lang, 'guest')} 
                            onToggleLock={toggleLock} 
                            onUpdateName={onUpdateTeamName}
                            onMovePlayer={onMovePlayer}
                            onRemovePlayer={onRemovePlayer}
                            lang={lang} 
                        />
                    </div>

                    <div className="mt-6">
                        <h3 className="text-xs font-bold uppercase text-slate-400 mb-3 flex items-center gap-2">
                            <Users size={12} />
                            {t(lang, 'queue')}
                        </h3>
                        {queue.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 italic text-sm border-2 border-dashed border-slate-200 dark:border-white/5 rounded-xl">
                                {t(lang, 'emptyQueue')}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {queue.map((teamItem, idx) => (
                                    <TeamCard 
                                        key={teamItem.id} 
                                        team={teamItem} 
                                        label={`${idx + 1}. ${t(lang, 'waiting') as string}`} 
                                        onToggleLock={toggleLock} 
                                        onUpdateName={onUpdateTeamName}
                                        onMovePlayer={onMovePlayer}
                                        onRemovePlayer={onRemovePlayer}
                                        lang={lang} 
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

        <div className="p-5 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-950/50">
             <button
                onClick={onClose}
                className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold rounded-xl active:scale-95 transition-transform"
            >
                {t(lang, 'save')}
            </button>
        </div>

      </motion.div>
    </div>
  );
};
