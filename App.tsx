import React, { useState, useEffect } from 'react';
import { useVolleyGame } from './hooks/useVolleyGame';
import { ScoreCard } from './components/ScoreCard';
import { Controls } from './components/Controls';
import { HistoryBar } from './components/HistoryBar';
import { MatchOverModal } from './components/MatchOverModal';
import { SettingsModal } from './components/SettingsModal';
import { TeamManagerModal } from './components/TeamManagerModal';
import { TeamId, Language, ThemeMode } from './types';
import { SETS_TO_WIN_MATCH } from './constants';
import { Minimize } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function App() {
  const {
    state,
    isLoaded,
    addPoint,
    subtractPoint,
    undo,
    resetMatch,
    fullReset,
    toggleSides,
    toggleService,
    useTimeout,
    applySettings,
    setTeamNames,
    updateTeamName,
    movePlayer,
    removePlayer,
    canUndo,
    generateTeams,
    updateRosters,
    rotateTeams
  } = useVolleyGame();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTeamManagerOpen, setIsTeamManagerOpen] = useState(false);
  const [lang, setLang] = useState<Language>('pt'); 
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const [isLandscape, setIsLandscape] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Theme Handling
  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [themeMode]);

  // Orientation Detection
  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  // Fullscreen Detection
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreenMode = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen mode: ${err.message} (${err.name})`);
        setIsFullscreen(true);
      });
    } else {
    }
    setIsFullscreen(true);
  };

  const exitFullscreenMode = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    setIsFullscreen(false);
  };

  if (!isLoaded) return null;

  const leftTeamId: TeamId = state.swappedSides ? 'B' : 'A';
  const rightTeamId: TeamId = state.swappedSides ? 'A' : 'B';

  const isDecidingSet = state.config.maxSets > 1 && state.currentSet === state.config.maxSets;
  const useTieBreak = isDecidingSet && state.config.hasTieBreak;
  const targetPoints = state.inSuddenDeath ? 3 : (useTieBreak ? state.config.tieBreakPoints : state.config.pointsPerSet);

  return (
    <div className="h-full w-full bg-slate-50 dark:bg-[#020617] transition-colors duration-300 relative overflow-hidden font-sans select-none">
      
      {/* 1. Floating Top Bar */}
      <AnimatePresence>
        {!isFullscreen && (
          <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none">
             <div className="pointer-events-auto">
                <HistoryBar 
                    key="history-bar"
                    history={state.history} 
                    currentSet={state.currentSet}
                    swapped={state.swappedSides}
                    lang={lang}
                    maxSets={state.config.maxSets}
                    matchDurationSeconds={state.matchDurationSeconds}
                    isTimerRunning={state.isTimerRunning}
                />
             </div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Main Score Area */}
      <main className={`absolute inset-0 z-0 flex ${isLandscape ? 'flex-row' : 'flex-col'}`}>
        
        {/* Left/Top Team */}
        <div className={`flex-1 relative ${isLandscape ? 'h-full border-r border-white/10' : 'w-full border-b border-white/10'}`}>
            <ScoreCard
            teamId={leftTeamId}
            teamName={leftTeamId === 'A' ? state.teamAName : state.teamBName}
            score={leftTeamId === 'A' ? state.scoreA : state.scoreB}
            opponentScore={leftTeamId === 'A' ? state.scoreB : state.scoreA}
            setsWon={leftTeamId === 'A' ? state.setsA : state.setsB}
            maxSets={state.config.maxSets}
            setsToWinMatch={SETS_TO_WIN_MATCH(state.config.maxSets)}
            onAdd={() => addPoint(leftTeamId)}
            onSubtract={() => subtractPoint(leftTeamId)}
            onToggleService={toggleService}
            onUseTimeout={() => useTimeout(leftTeamId)}
            isWinner={state.matchWinner === leftTeamId}
            inSuddenDeath={state.inSuddenDeath}
            isServing={state.servingTeam === leftTeamId}
            timeoutsUsed={leftTeamId === 'A' ? state.timeoutsA : state.timeoutsB}
            pointsToWinSet={targetPoints}
            lang={lang}
            isLandscape={isLandscape}
            isFullscreen={isFullscreen}
            safeAreaTop={!isFullscreen} 
            safeAreaBottom={isLandscape && !isFullscreen} 
            />
        </div>

        {/* Right/Bottom Team */}
        <div className={`flex-1 relative ${isLandscape ? 'h-full' : 'w-full'}`}>
            <ScoreCard
            teamId={rightTeamId}
            teamName={rightTeamId === 'A' ? state.teamAName : state.teamBName}
            score={rightTeamId === 'A' ? state.scoreA : state.scoreB}
            opponentScore={rightTeamId === 'A' ? state.scoreB : state.scoreA} 
            setsWon={rightTeamId === 'A' ? state.setsA : state.setsB}
            maxSets={state.config.maxSets}
            setsToWinMatch={SETS_TO_WIN_MATCH(state.config.maxSets)}
            onAdd={() => addPoint(rightTeamId)}
            onSubtract={() => subtractPoint(rightTeamId)}
            onToggleService={toggleService}
            onUseTimeout={() => useTimeout(rightTeamId)}
            isWinner={state.matchWinner === rightTeamId}
            inSuddenDeath={state.inSuddenDeath}
            isServing={state.servingTeam === rightTeamId}
            timeoutsUsed={rightTeamId === 'A' ? state.timeoutsA : state.timeoutsB}
            pointsToWinSet={targetPoints}
            lang={lang}
            isLandscape={isLandscape}
            isFullscreen={isFullscreen}
            safeAreaTop={isLandscape && !isFullscreen} 
            safeAreaBottom={!isFullscreen}
            />
        </div>

      </main>

      {/* 3. Floating Bottom Controls */}
      <AnimatePresence>
        {!isFullscreen && (
          <div className="absolute bottom-0 left-0 right-0 z-50 pointer-events-none">
            <div className="pointer-events-auto">
                <Controls 
                    key="controls"
                    onUndo={undo}
                    onReset={() => resetMatch()}
                    onSwap={toggleSides}
                    onSettings={() => setIsSettingsOpen(true)}
                    onFullscreen={toggleFullscreenMode}
                    onOpenTeamManager={() => setIsTeamManagerOpen(true)}
                    canUndo={canUndo}
                    lang={lang}
                />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Exit Fullscreen Button */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={exitFullscreenMode}
            className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-black/40 dark:bg-white/10 backdrop-blur-md text-white dark:text-slate-200 rounded-full flex items-center justify-center border border-white/20 shadow-lg"
          >
            <Minimize size={20} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* 4. Overlays */}
      <MatchOverModal 
        winner={state.matchWinner}
        onReset={() => resetMatch()}
        onRotate={rotateTeams}
        lang={lang}
        teamAName={state.teamAName}
        teamBName={state.teamBName}
        history={state.history}
        finalSetsA={state.setsA}
        finalSetsB={state.setsB}
        hasQueue={state.queue.length > 0}
        rotationReport={state.rotationReport}
      />

      <SettingsModal 
        isOpen={isSettingsOpen}
        currentConfig={state.config}
        teamAName={state.teamAName}
        teamBName={state.teamBName}
        onClose={() => setIsSettingsOpen(false)}
        onSave={(config, nameA, nameB) => applySettings(config, { teamAName: nameA, teamBName: nameB })}
        onFullReset={fullReset}
        lang={lang}
        setLang={setLang}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
      />

      <TeamManagerModal
        isOpen={isTeamManagerOpen}
        onClose={() => setIsTeamManagerOpen(false)}
        lang={lang}
        onGenerate={generateTeams}
        onUpdateRosters={updateRosters}
        onUpdateTeamName={updateTeamName}
        onMovePlayer={movePlayer}
        onRemovePlayer={removePlayer}
        onUndo={undo}
        canUndo={canUndo}
        teamA={state.teamARoster}
        teamB={state.teamBRoster}
        queue={state.queue}
      />

    </div>
  );
}