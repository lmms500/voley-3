
export type TeamId = 'A' | 'B';

export interface SetHistory {
  setNumber: number;
  scoreA: number;
  scoreB: number;
  winner: TeamId;
}

export type DeuceType = 'standard' | 'sudden_death_3pt';

export interface GameConfig {
  maxSets: number;       // 1, 3, 5
  pointsPerSet: number;  // 15, 21, 25
  tieBreakPoints: number;// 15 usually
  hasTieBreak: boolean;  // If true, last set uses tieBreakPoints. If false, uses pointsPerSet.
  deuceType: DeuceType;  // 'standard' (win by 2) or 'sudden_death_3pt' (reset 0-0, first to 3)
}

export interface Player {
  id: string;
  name: string;
  isFixed: boolean; // If true, cannot be stolen by other teams
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
}

export interface RotationDetail {
  outTeamName: string;
  inTeamName: string;
  stolenPlayers: Player[];
  donorTeamName?: string;
}

export interface GameState {
  teamAName: string; 
  teamBName: string; 
  teamARoster: Team | null; // Detailed roster for Team A
  teamBRoster: Team | null; // Detailed roster for Team B
  queue: Team[];            // Teams waiting to play
  rotationReport: RotationDetail | null; // Detailed report object
  scoreA: number;
  scoreB: number;
  setsA: number;
  setsB: number;
  currentSet: number;
  history: SetHistory[];
  isMatchOver: boolean;
  matchWinner: TeamId | null;
  swappedSides: boolean;
  inSuddenDeath: boolean; 
  config: GameConfig;
  matchDurationSeconds: number; 
  isTimerRunning: boolean;
  servingTeam: TeamId | null; 
  timeoutsA: number; 
  timeoutsB: number; 
}

export interface ThemeConfig {
  primary: string;
  secondary: string;
  bg: string;
  text: string;
}

export type Language = 'en' | 'pt';
export type ThemeMode = 'light' | 'dark';