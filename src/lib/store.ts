import type { Player, Practice, SkillTest, CalendarWeek, TrainingSession, TournamentSettings, ArchivedTournament } from './types';
import { defaultSettings } from './types';

const KEYS = {
  players: 'uft-players',
  practices: 'uft-practices',
  skillTests: 'uft-skill-tests',
  calendar: 'uft-calendar',
  sessions: 'uft-sessions',
  settings: 'uft-settings',
  archives: 'uft-archives',
  initialized: 'uft-initialized-v2',
} as const;

function get<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : fallback;
}

function set<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function initializeData() {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(KEYS.initialized)) return;
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  set(KEYS.players, []);
  set(KEYS.practices, []);
  set(KEYS.skillTests, []);
  set(KEYS.calendar, []);
  set(KEYS.sessions, []);
  set(KEYS.settings, defaultSettings());
  set(KEYS.archives, []);
  localStorage.setItem(KEYS.initialized, 'true');
}

export const store = {
  // Players
  getPlayers: (): Player[] => get(KEYS.players, []),
  setPlayers: (p: Player[]) => set(KEYS.players, p),
  addPlayer: (p: Player) => { const all = store.getPlayers(); all.push(p); store.setPlayers(all); },
  updatePlayer: (p: Player) => { store.setPlayers(store.getPlayers().map((x) => (x.id === p.id ? p : x))); },
  deletePlayer: (id: string) => {
    store.setPlayers(store.getPlayers().filter((x) => x.id !== id));
    store.setPractices(store.getPractices().map((p) => ({
      ...p,
      attendees: p.attendees.filter((a) => a !== id),
    })));
    store.setSkillTests(store.getSkillTests().filter((t) => t.playerId !== id));
  },

  // Training Sessions
  getSessions: (): TrainingSession[] => get(KEYS.sessions, []),
  setSessions: (s: TrainingSession[]) => set(KEYS.sessions, s),
  addSession: (s: TrainingSession) => { const all = store.getSessions(); all.push(s); store.setSessions(all); },
  updateSession: (s: TrainingSession) => {
    store.setSessions(store.getSessions().map((x) => (x.id === s.id ? s : x)));
  },
  deleteSession: (id: string) => {
    store.setSessions(store.getSessions().filter((x) => x.id !== id));
    store.setPractices(store.getPractices().filter((p) => p.sessionId !== id));
  },
  toggleSessionComplete: (id: string) => {
    store.setSessions(store.getSessions().map((s) => (s.id === id ? { ...s, completed: !s.completed } : s)));
  },

  // Practices (Attendance)
  getPractices: (): Practice[] => get(KEYS.practices, []),
  setPractices: (p: Practice[]) => set(KEYS.practices, p),
  addPractice: (p: Practice) => { const all = store.getPractices(); all.push(p); store.setPractices(all); },
  updatePractice: (p: Practice) => { store.setPractices(store.getPractices().map((x) => (x.id === p.id ? p : x))); },
  deletePractice: (id: string) => { store.setPractices(store.getPractices().filter((x) => x.id !== id)); },
  getPracticeBySession: (sessionId: string): Practice | undefined => store.getPractices().find((p) => p.sessionId === sessionId),

  // Skill Tests
  getSkillTests: (): SkillTest[] => get(KEYS.skillTests, []),
  setSkillTests: (s: SkillTest[]) => set(KEYS.skillTests, s),
  addSkillTest: (s: SkillTest) => { const all = store.getSkillTests(); all.push(s); store.setSkillTests(all); },
  updateSkillTest: (s: SkillTest) => { store.setSkillTests(store.getSkillTests().map((x) => (x.id === s.id ? s : x))); },
  deleteSkillTest: (id: string) => { store.setSkillTests(store.getSkillTests().filter((x) => x.id !== id)); },

  // Calendar
  getCalendar: (): CalendarWeek[] => get(KEYS.calendar, []),
  setCalendar: (c: CalendarWeek[]) => set(KEYS.calendar, c),
  addWeek: (w: CalendarWeek) => { const all = store.getCalendar(); all.push(w); store.setCalendar(all); },
  updateWeek: (w: CalendarWeek) => { store.setCalendar(store.getCalendar().map((x) => (x.weekNumber === w.weekNumber ? w : x))); },
  deleteWeek: (weekNumber: number) => {
    store.setCalendar(store.getCalendar().filter((x) => x.weekNumber !== weekNumber));
    const sessionIds = store.getSessions().filter((s) => s.weekNumber === weekNumber).map((s) => s.id);
    store.setSessions(store.getSessions().filter((s) => s.weekNumber !== weekNumber));
    store.setPractices(store.getPractices().filter((p) => !sessionIds.includes(p.sessionId)));
  },

  // Settings
  getSettings: (): TournamentSettings => get(KEYS.settings, defaultSettings()),
  setSettings: (s: TournamentSettings) => set(KEYS.settings, s),

  // Archives
  getArchives: (): ArchivedTournament[] => get(KEYS.archives, []),
  setArchives: (a: ArchivedTournament[]) => set(KEYS.archives, a),

  archiveTournament: () => {
    const settings = store.getSettings();
    const players = store.getPlayers();
    const sessions = store.getSessions();
    const practices = store.getPractices();
    const skillTests = store.getSkillTests();
    const calendar = store.getCalendar();

    const completedSessions = sessions.filter((s) => s.completed).length;
    const totalAttendees = practices.reduce((sum, p) => sum + p.attendees.length, 0);
    const totalSlots = practices.length * players.length;

    const archive: ArchivedTournament = {
      id: `arch-${Date.now()}`,
      settings: { ...settings },
      archivedAt: new Date().toISOString(),
      players: [...players],
      sessions: [...sessions],
      practices: [...practices],
      skillTests: [...skillTests],
      calendar: [...calendar],
      summary: {
        totalSessions: sessions.length,
        completedSessions,
        avgAttendanceRate: totalSlots > 0 ? Math.round((totalAttendees / totalSlots) * 100) : 0,
        totalEvaluations: skillTests.length,
        playerCount: players.length,
      },
    };

    const archives = store.getArchives();
    archives.push(archive);
    store.setArchives(archives);
    return archive;
  },

  deleteArchive: (id: string) => {
    store.setArchives(store.getArchives().filter((a) => a.id !== id));
  },

  startNewTournament: () => {
    store.archiveTournament();
    // Reset data but keep players
    store.setSessions([]);
    store.setPractices([]);
    store.setSkillTests([]);
    store.setCalendar([]);
    store.setSettings(defaultSettings());
  },

  // Reset
  resetAll: () => {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
    localStorage.removeItem(KEYS.initialized);
  },
};

// ── Export helpers ───────────────────────────────────────────────
export function exportPlayersCSV(): string {
  const players = store.getPlayers();
  const header = 'Name,Jersey,Position,Level,Joined';
  const rows = players.map((p) => `"${p.name}",${p.jerseyNumber},${p.position},${p.skillLevel},${p.joinedDate}`);
  return [header, ...rows].join('\n');
}

export function exportAttendanceCSV(): string {
  const practices = store.getPractices();
  const players = store.getPlayers();
  const sessions = store.getSessions();
  const header = 'Session,Date,Week,Day,' + players.map((p) => `"${p.name}"`).join(',');
  const rows = practices.map((pr) => {
    const s = sessions.find((x) => x.id === pr.sessionId);
    const playerCols = players.map((p) => pr.attendees.includes(p.id) ? '1' : '0').join(',');
    return `"${s?.focus || pr.notes}",${pr.date},${s?.weekNumber || ''},${s?.day || ''},${playerCols}`;
  });
  return [header, ...rows].join('\n');
}

export function exportEvaluationsCSV(): string {
  const tests = store.getSkillTests();
  const players = store.getPlayers();
  const skillKeys: (keyof import('./types').SkillScores)[] = [
    'backhand', 'forehand', 'hammer', 'scoober',
    'pancake', 'rimCatch', 'layoutCatch',
    'inCut', 'deepCut', 'breakSideCut',
    'marking', 'force', 'positioning',
    'fieldAwareness', 'decisionMaking', 'communication',
    'sprintSpeed', 'endurance', 'agility',
  ];
  const header = 'Player,Date,' + skillKeys.join(',');
  const rows = tests.map((t) => {
    const p = players.find((x) => x.id === t.playerId);
    const scores = skillKeys.map((k) => t.scores[k]).join(',');
    return `"${p?.name || 'Unknown'}",${t.date},${scores}`;
  });
  return [header, ...rows].join('\n');
}

export function exportSummary(): string {
  const settings = store.getSettings();
  const players = store.getPlayers();
  const sessions = store.getSessions();
  const practices = store.getPractices();
  const skillTests = store.getSkillTests();

  const completed = sessions.filter((s) => s.completed).length;
  const totalAttendees = practices.reduce((sum, p) => sum + p.attendees.length, 0);
  const totalSlots = practices.length * players.length;
  const attendRate = totalSlots > 0 ? Math.round((totalAttendees / totalSlots) * 100) : 0;

  const lines = [
    `Tournament Summary: ${settings.tournamentName || 'Untitled'}`,
    `Generated: ${new Date().toLocaleDateString()}`,
    '',
    `Players: ${players.length}`,
    `Total Sessions: ${sessions.length}`,
    `Completed Sessions: ${completed}`,
    `Attendance Rate: ${attendRate}%`,
    `Total Evaluations: ${skillTests.length}`,
    '',
    'Player Stats:',
  ];

  players.forEach((p) => {
    const attended = practices.filter((pr) => pr.attendees.includes(p.id)).length;
    const pRate = practices.length > 0 ? Math.round((attended / practices.length) * 100) : 0;
    const tests = skillTests.filter((t) => t.playerId === p.id).sort((a, b) => b.date.localeCompare(a.date));
    const latestAvg = tests[0] ? (Object.values(tests[0].scores).reduce((a, b) => a + b, 0) / 19).toFixed(1) : 'N/A';
    lines.push(`  ${p.name} (#${p.jerseyNumber}) — ${p.position} ${p.skillLevel} — Attendance: ${pRate}% — Skill Avg: ${latestAvg}`);
  });

  return lines.join('\n');
}
