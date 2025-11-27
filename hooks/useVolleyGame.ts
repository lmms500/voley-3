import { useState, useCallback, useEffect } from 'react';
import { GameState, TeamId, SetHistory, GameConfig, Team, Player, RotationDetail } from '../types';
import { 
  DEFAULT_CONFIG,
  MIN_LEAD_TO_WIN, 
  SETS_TO_WIN_MATCH
} from '../constants';

const STORAGE_KEY = 'volleyscore_pro_state_v1';

const INITIAL_STATE: GameState = {
  teamAName: '', 
  teamBName: '',
  teamARoster: null,
  teamBRoster: null,
  queue: [],
  rotationReport: null,
  scoreA: 0,
  scoreB: 0,
  setsA: 0,
  setsB: 0,
  currentSet: 1,
  history: [],
  isMatchOver: false,
  matchWinner: null,
  swappedSides: false,
  inSuddenDeath: false,
  config: DEFAULT_CONFIG,
  matchDurationSeconds: 0,
  isTimerRunning: false,
  servingTeam: null,
  timeoutsA: 0,
  timeoutsB: 0,
};

export const useVolleyGame = () => {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [historyStack, setHistoryStack] = useState<GameState[]>([INITIAL_STATE]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from LocalStorage on Mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.config) {
          setState(parsed);
          setHistoryStack([parsed]);
        }
      }
    } catch (e) {
      console.warn('Failed to load game state', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to LocalStorage on Change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isLoaded]);

  // Timer Effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (state.isTimerRunning) {
      interval = setInterval(() => {
        setState(prev => ({
          ...prev,
          matchDurationSeconds: prev.matchDurationSeconds + 1
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [state.isTimerRunning]);

  // --- ROTATION REPORT GENERATION ---
  useEffect(() => {
    if (state.isMatchOver && !state.rotationReport && state.matchWinner && state.queue.length > 0) {
        const winnerId = state.matchWinner;
        const loserRoster = winnerId === 'A' ? state.teamBRoster : state.teamARoster;
        const nextTeam = state.queue[0];
        
        if (!loserRoster || !nextTeam) return;

        let donorTeamName = loserRoster.name;
        let stealable: Player[] = [];
        let stolenPlayers: Player[] = [];
        
        const needed = 6 - nextTeam.players.length;
        
        if (needed > 0) {
            if (state.queue.length >= 2) {
                const donorTeam = state.queue[1];
                donorTeamName = donorTeam.name;
                stealable = donorTeam.players.filter(p => !p.isFixed);
            } else {
                stealable = loserRoster.players.filter(p => !p.isFixed);
            }

            if (stealable.length > 0) {
                const stolenCount = Math.min(needed, stealable.length);
                stolenPlayers = stealable.slice(0, stolenCount);
            }
        }
        
        const report: RotationDetail = {
            outTeamName: loserRoster.name,
            inTeamName: nextTeam.name,
            stolenPlayers,
            donorTeamName
        };
        
        setState(prev => ({ ...prev, rotationReport: report }));
    }
  }, [state.isMatchOver, state.rotationReport, state.matchWinner, state.queue, state.teamARoster, state.teamBRoster]);

  const updateState = useCallback((newState: GameState) => {
    setHistoryStack(prev => {
      const newStack = [...prev, newState];
      if (newStack.length > 50) newStack.shift();
      return newStack;
    });
    setState(newState);
  }, []);

  const undo = useCallback(() => {
    setHistoryStack(prev => {
      if (prev.length <= 1) return prev;
      const newStack = [...prev];
      newStack.pop(); 
      const prevState = newStack[newStack.length - 1];
      setState(prevState);
      return newStack;
    });
  }, []);

  // UPDATED RESET MATCH: Atomic update for Config + Names
  const resetMatch = useCallback((newConfig?: GameConfig, newNames?: { teamAName: string, teamBName: string }) => {
    const configToUse = newConfig || state.config;
    const nameA = newNames ? newNames.teamAName : state.teamAName;
    const nameB = newNames ? newNames.teamBName : state.teamBName;

    // Update roster names to sync with the inputs
    const updatedTeamARoster = state.teamARoster ? { ...state.teamARoster, name: nameA } : state.teamARoster;
    const updatedTeamBRoster = state.teamBRoster ? { ...state.teamBRoster, name: nameB } : state.teamBRoster;

    const newState: GameState = { 
      ...state, // Preserves Queue and Rosters
      
      scoreA: 0,
      scoreB: 0,
      setsA: 0,
      setsB: 0,
      currentSet: 1,
      history: [],
      isMatchOver: false,
      matchWinner: null,
      swappedSides: false,
      inSuddenDeath: false,
      matchDurationSeconds: 0,
      isTimerRunning: false,
      servingTeam: null,
      timeoutsA: 0,
      timeoutsB: 0,
      rotationReport: null,

      config: configToUse,
      teamAName: nameA,
      teamBName: nameB,
      teamARoster: updatedTeamARoster, 
      teamBRoster: updatedTeamBRoster,
    };

    setHistoryStack([newState]);
    setState(newState);
  }, [state]);

  const fullReset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(INITIAL_STATE);
    setHistoryStack([INITIAL_STATE]);
  }, []);

  const generateTeams = useCallback((namesText: string) => {
    const names = namesText.split('\n')
      .map(n => n.trim())
      .filter(n => n.length > 0);

    const players: Player[] = names.map((name, idx) => ({
      id: `p-${Date.now()}-${idx}`,
      name,
      isFixed: false
    }));

    const PLAYERS_PER_TEAM = 6;
    const teams: Team[] = [];
    
    // Generate purely based on order (FIFO)
    for (let i = 0; i < players.length; i += PLAYERS_PER_TEAM) {
      const chunk = players.slice(i, i + PLAYERS_PER_TEAM);
      const teamId = teams.length + 1;
      teams.push({
        id: `team-${teamId}`,
        name: `Team ${teamId}`,
        players: chunk
      });
    }

    const teamA = teams[0] || null;
    const teamB = teams[1] || null;
    const queue = teams.slice(2);

    updateState({
      ...state,
      teamARoster: teamA,
      teamBRoster: teamB,
      teamAName: teamA ? teamA.name : 'Team A',
      teamBName: teamB ? teamB.name : 'Team B',
      queue,
      rotationReport: null
    });
  }, [state, updateState]);

  const updateRosters = useCallback((teamA: Team | null, teamB: Team | null, queue: Team[]) => {
      updateState({
          ...state,
          teamARoster: teamA,
          teamBRoster: teamB,
          queue
      });
  }, [state, updateState]);

  const updateTeamName = useCallback((teamId: string, newName: string) => {
    const newState = { ...state };
    let updated = false;

    if (newState.teamARoster?.id === teamId) {
        newState.teamARoster = { ...newState.teamARoster, name: newName };
        newState.teamAName = newName;
        updated = true;
    }
    if (newState.teamBRoster?.id === teamId) {
        newState.teamBRoster = { ...newState.teamBRoster, name: newName };
        newState.teamBName = newName;
        updated = true;
    }

    if (!updated) {
        newState.queue = newState.queue.map(t => 
            t.id === teamId ? { ...t, name: newName } : t
        );
    }
    
    updateState(newState);
  }, [state, updateState]);

  const removePlayer = useCallback((playerId: string) => {
    const filterTeam = (t: Team) => ({
            ...t, 
            players: t.players.filter(p => p.id !== playerId) 
    });

    const newState = { ...state };

    if (newState.teamARoster?.players.find(p => p.id === playerId)) {
        newState.teamARoster = filterTeam(newState.teamARoster);
    } else if (newState.teamBRoster?.players.find(p => p.id === playerId)) {
        newState.teamBRoster = filterTeam(newState.teamBRoster);
    } else {
        newState.queue = newState.queue.map(t => 
            t.players.find(p => p.id === playerId) ? filterTeam(t) : t
        );
    }
    
    updateState(newState);
  }, [state, updateState]);

  const movePlayer = useCallback((playerId: string, targetTeamId: string) => {
    let player: Player | undefined;
    let sourceTeamId: string | undefined;

    if (state.teamARoster?.players.find(p => p.id === playerId)) {
        player = state.teamARoster.players.find(p => p.id === playerId);
        sourceTeamId = state.teamARoster.id;
    }
    else if (state.teamBRoster?.players.find(p => p.id === playerId)) {
            player = state.teamBRoster.players.find(p => p.id === playerId);
            sourceTeamId = state.teamBRoster.id;
    }
    else {
        for (const team of state.queue) {
            if (team.players.find(p => p.id === playerId)) {
                player = team.players.find(p => p.id === playerId);
                sourceTeamId = team.id;
                break;
            }
        }
    }

    if (!player || !sourceTeamId || sourceTeamId === targetTeamId) return;

    const removePlayerFromTeam = (team: Team) => ({
        ...team,
        players: team.players.filter(p => p.id !== playerId)
    });

    const addPlayerToTeam = (team: Team) => ({
        ...team,
        players: [...team.players, player!]
    });

    const newState = { ...state };

    if (newState.teamARoster?.id === sourceTeamId) {
        newState.teamARoster = removePlayerFromTeam(newState.teamARoster);
    } else if (newState.teamBRoster?.id === sourceTeamId) {
        newState.teamBRoster = removePlayerFromTeam(newState.teamBRoster);
    } else {
        newState.queue = newState.queue.map(t => 
            t.id === sourceTeamId ? removePlayerFromTeam(t) : t
        );
    }

    if (newState.teamARoster?.id === targetTeamId) {
        newState.teamARoster = addPlayerToTeam(newState.teamARoster!);
    } else if (newState.teamBRoster?.id === targetTeamId) {
        newState.teamBRoster = addPlayerToTeam(newState.teamBRoster!);
    } else {
        newState.queue = newState.queue.map(t => 
            t.id === targetTeamId ? addPlayerToTeam(t) : t
        );
    }

    updateState(newState);
  }, [state, updateState]);

  const rotateTeams = useCallback(() => {
    if (!state.matchWinner || state.queue.length === 0) return;

    const winnerId = state.matchWinner;
    const winnerRoster = winnerId === 'A' ? state.teamARoster : state.teamBRoster;
    const loserRoster = winnerId === 'A' ? state.teamBRoster : state.teamARoster;

    if (!winnerRoster || !loserRoster) return; 

    let nextTeam = { ...state.queue[0], players: [...state.queue[0].players] }; 
    let newLoserRoster = { ...loserRoster, players: [...loserRoster.players] };
    
    let newQueue: Team[] = [];

    if (state.queue.length >= 2) {
        let donorTeam = { ...state.queue[1], players: [...state.queue[1].players] };
        const needed = 6 - nextTeam.players.length;
        if (needed > 0) {
              const stealable = donorTeam.players.filter(p => !p.isFixed);
              const count = Math.min(needed, stealable.length);
              const stolen = stealable.slice(0, count);
              
              const stolenIds = stolen.map(s => s.id);
              donorTeam.players = donorTeam.players.filter(p => !stolenIds.includes(p.id));
              nextTeam.players = [...nextTeam.players, ...stolen];
        }
        const restOfQueue = state.queue.slice(2);
        newQueue = [donorTeam, newLoserRoster, ...restOfQueue];

    } else {
        const needed = 6 - nextTeam.players.length;
        if (needed > 0) {
            const stealable = newLoserRoster.players.filter(p => !p.isFixed);
            const count = Math.min(needed, stealable.length);
            const stolen = stealable.slice(0, count);

            const stolenIds = stolen.map(s => s.id);
            newLoserRoster.players = newLoserRoster.players.filter(p => !stolenIds.includes(p.id));
            nextTeam.players = [...nextTeam.players, ...stolen];
        }
        newQueue = [...state.queue.slice(1), newLoserRoster];
    }

    const newState: GameState = {
        ...INITIAL_STATE,
        config: state.config,
        teamARoster: winnerRoster,
        teamBRoster: nextTeam, 
        teamAName: winnerRoster.name,
        teamBName: nextTeam.name,
        queue: newQueue,
        rotationReport: null
    };

    setHistoryStack([newState]);
    setState(newState);
  }, [state, INITIAL_STATE]);

  // ... (rest of simple callbacks) ...
  const toggleSides = useCallback(() => {
    setState(prev => ({ ...prev, swappedSides: !prev.swappedSides }));
  }, []);

  const toggleService = useCallback(() => {
    setState(prev => ({
        ...prev,
        servingTeam: prev.servingTeam === 'A' ? 'B' : 'A'
    }));
  }, []);

  const useTimeout = useCallback((teamId: TeamId) => {
      setState(prev => {
          if (teamId === 'A' && prev.timeoutsA >= 2) return prev;
          if (teamId === 'B' && prev.timeoutsB >= 2) return prev;
          const newState = {
              ...prev,
              timeoutsA: teamId === 'A' ? prev.timeoutsA + 1 : prev.timeoutsA,
              timeoutsB: teamId === 'B' ? prev.timeoutsB + 1 : prev.timeoutsB
          };
          setHistoryStack(hist => [...hist, newState]);
          return newState;
      });
  }, []);

  const setTeamNames = useCallback((nameA: string, nameB: string) => {
    setState(prev => ({
      ...prev,
      teamAName: nameA,
      teamBName: nameB,
      teamARoster: prev.teamARoster ? { ...prev.teamARoster, name: nameA } : prev.teamARoster,
      teamBRoster: prev.teamBRoster ? { ...prev.teamBRoster, name: nameB } : prev.teamBRoster
    }));
  }, []);

  const applySettings = useCallback((newConfig: GameConfig, newNames?: { teamAName: string, teamBName: string }) => {
    resetMatch(newConfig, newNames);
  }, [resetMatch]);

  const addPoint = useCallback((team: TeamId) => {
    if (state.isMatchOver) return;

    let newIsTimerRunning = state.isTimerRunning;
    if (!state.isTimerRunning && state.matchDurationSeconds === 0) {
        newIsTimerRunning = true;
    }

    let newServingTeam = state.servingTeam;
    if (state.servingTeam !== team) {
        newServingTeam = team;
    }

    const potentialScoreA = team === 'A' ? state.scoreA + 1 : state.scoreA;
    const potentialScoreB = team === 'B' ? state.scoreB + 1 : state.scoreB;
    
    const isDecidingSet = state.config.maxSets > 1 && state.currentSet === state.config.maxSets;
    const useTieBreak = isDecidingSet && state.config.hasTieBreak;
    const setPointTarget = useTieBreak ? state.config.tieBreakPoints : state.config.pointsPerSet;

    if (state.config.deuceType === 'sudden_death_3pt') {
      if (state.inSuddenDeath) {
        const suddenDeathTarget = 3;
        if (potentialScoreA >= suddenDeathTarget) {
          handleSetWin('A', potentialScoreA, potentialScoreB, newIsTimerRunning);
          return;
        }
        if (potentialScoreB >= suddenDeathTarget) {
          handleSetWin('B', potentialScoreA, potentialScoreB, newIsTimerRunning);
          return;
        }
        updateState({ 
            ...state, 
            scoreA: potentialScoreA, 
            scoreB: potentialScoreB, 
            isTimerRunning: newIsTimerRunning,
            servingTeam: newServingTeam
        });
        return;
      }
      if (potentialScoreA === setPointTarget - 1 && potentialScoreB === setPointTarget - 1) {
        updateState({
          ...state,
          scoreA: 0,
          scoreB: 0,
          inSuddenDeath: true, 
          isTimerRunning: newIsTimerRunning,
          servingTeam: newServingTeam
        });
        return;
      }
    }

    const winner = checkStandardWin(potentialScoreA, potentialScoreB, setPointTarget);

    if (winner) {
      handleSetWin(winner, potentialScoreA, potentialScoreB, newIsTimerRunning);
    } else {
      updateState({
        ...state,
        scoreA: potentialScoreA,
        scoreB: potentialScoreB,
        isTimerRunning: newIsTimerRunning,
        servingTeam: newServingTeam
      });
    }
  }, [state, updateState]);

  const checkStandardWin = (scoreA: number, scoreB: number, target: number): TeamId | null => {
    if (scoreA >= target && scoreA >= scoreB + MIN_LEAD_TO_WIN) return 'A';
    if (scoreB >= target && scoreB >= scoreA + MIN_LEAD_TO_WIN) return 'B';
    return null;
  };

  const handleSetWin = (setWinner: TeamId, finalScoreA: number, finalScoreB: number, timerWasRunning: boolean) => {
    const newSetsA = setWinner === 'A' ? state.setsA + 1 : state.setsA;
    const newSetsB = setWinner === 'B' ? state.setsB + 1 : state.setsB;
    
    const newHistory: SetHistory = {
      setNumber: state.currentSet,
      scoreA: finalScoreA,
      scoreB: finalScoreB,
      winner: setWinner
    };

    const setsNeeded = SETS_TO_WIN_MATCH(state.config.maxSets);
    const matchWinner = newSetsA === setsNeeded ? 'A' : (newSetsB === setsNeeded ? 'B' : null);

    updateState({
      ...state,
      scoreA: matchWinner ? finalScoreA : 0, 
      scoreB: matchWinner ? finalScoreB : 0,
      setsA: newSetsA,
      setsB: newSetsB,
      history: [...state.history, newHistory],
      currentSet: matchWinner ? state.currentSet : state.currentSet + 1,
      isMatchOver: !!matchWinner,
      matchWinner: matchWinner,
      inSuddenDeath: false,
      isTimerRunning: matchWinner ? false : timerWasRunning, 
      servingTeam: null, 
      timeoutsA: 0, 
      timeoutsB: 0
    });
  };

  const subtractPoint = useCallback((team: TeamId) => {
    if (state.isMatchOver) return;
    if (team === 'A' && state.scoreA > 0) updateState({ ...state, scoreA: state.scoreA - 1 });
    if (team === 'B' && state.scoreB > 0) updateState({ ...state, scoreB: state.scoreB - 1 });
  }, [state, updateState]);

  return {
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
    canUndo: historyStack.length > 1,
    generateTeams,
    updateRosters,
    rotateTeams
  };
};