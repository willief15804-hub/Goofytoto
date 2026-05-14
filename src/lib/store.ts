import { Player, Practice, SkillTest, CalendarWeek, TrainingSession } from './types';
import { samplePlayers, samplePractices, sampleSkillTests, sampleCalendar, sampleSessions } from './sample-data';

const KEYS = {
  players: 'uft-players',
  practices: 'uft-practices',
  skillTests: 'uft-skill-tests',
  calendar: 'uft-calendar',
  sessions: 'uft-sessions',
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
  // Clear old v1 data
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  set(KEYS.players, samplePlayers);
  set(KEYS.practices, samplePractices);
  set(KEYS.skillTests, sampleSkillTests);
  set(KEYS.calendar, sampleCalendar);
  set(KEYS.sessions, sampleSessions);
  localStorage.setItem(KEYS.initialized, 'true');
}

export const store = {
  // Players
  getPlayers: (): Player[] => get(KEYS.players, []),
  setPlayers: (p: Player[]) => set(KEYS.players, p),
  addPlayer: (p: Player) => { const all = store.getPlayers(); all.push(p); store.setPlayers(all); },
  updatePlayer: (p: Player) => { store.setPlayers(store.getPlayers().map((x) => (x.id === p.id ? p : x))); },
  deletePlayer: (id: string) => { store.setPlayers(store.getPlayers().filter((x) => x.id !== id)); },

  // Training Sessions
  getSessions: (): TrainingSession[] => get(KEYS.sessions, []),
  setSessions: (s: TrainingSession[]) => set(KEYS.sessions, s),
  toggleSessionComplete: (id: string) => {
    store.setSessions(store.getSessions().map((s) => (s.id === id ? { ...s, completed: !s.completed } : s)));
  },
  updateSession: (s: TrainingSession) => {
    store.setSessions(store.getSessions().map((x) => (x.id === s.id ? s : x)));
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
  updateWeek: (w: CalendarWeek) => { store.setCalendar(store.getCalendar().map((x) => (x.weekNumber === w.weekNumber ? w : x))); },

  // Reset
  resetAll: () => {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
    initializeData();
  },
};
