import { Player, Practice, SkillTest, CalendarWeek } from './types';
import { samplePlayers, samplePractices, sampleSkillTests, sampleCalendar } from './sample-data';

const KEYS = {
  players: 'uft-players',
  practices: 'uft-practices',
  skillTests: 'uft-skill-tests',
  calendar: 'uft-calendar',
  initialized: 'uft-initialized',
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
  set(KEYS.players, samplePlayers);
  set(KEYS.practices, samplePractices);
  set(KEYS.skillTests, sampleSkillTests);
  set(KEYS.calendar, sampleCalendar);
  localStorage.setItem(KEYS.initialized, 'true');
}

export const store = {
  getPlayers: (): Player[] => get(KEYS.players, []),
  setPlayers: (p: Player[]) => set(KEYS.players, p),
  addPlayer: (p: Player) => {
    const all = store.getPlayers();
    all.push(p);
    store.setPlayers(all);
  },
  updatePlayer: (p: Player) => {
    const all = store.getPlayers().map((x) => (x.id === p.id ? p : x));
    store.setPlayers(all);
  },
  deletePlayer: (id: string) => {
    store.setPlayers(store.getPlayers().filter((x) => x.id !== id));
  },

  getPractices: (): Practice[] => get(KEYS.practices, []),
  setPractices: (p: Practice[]) => set(KEYS.practices, p),
  addPractice: (p: Practice) => {
    const all = store.getPractices();
    all.push(p);
    store.setPractices(all);
  },
  updatePractice: (p: Practice) => {
    const all = store.getPractices().map((x) => (x.id === p.id ? p : x));
    store.setPractices(all);
  },
  deletePractice: (id: string) => {
    store.setPractices(store.getPractices().filter((x) => x.id !== id));
  },

  getSkillTests: (): SkillTest[] => get(KEYS.skillTests, []),
  setSkillTests: (s: SkillTest[]) => set(KEYS.skillTests, s),
  addSkillTest: (s: SkillTest) => {
    const all = store.getSkillTests();
    all.push(s);
    store.setSkillTests(all);
  },
  updateSkillTest: (s: SkillTest) => {
    const all = store.getSkillTests().map((x) => (x.id === s.id ? s : x));
    store.setSkillTests(all);
  },
  deleteSkillTest: (id: string) => {
    store.setSkillTests(store.getSkillTests().filter((x) => x.id !== id));
  },

  getCalendar: (): CalendarWeek[] => get(KEYS.calendar, []),
  setCalendar: (c: CalendarWeek[]) => set(KEYS.calendar, c),
  updateWeek: (w: CalendarWeek) => {
    const all = store.getCalendar().map((x) => (x.weekNumber === w.weekNumber ? w : x));
    store.setCalendar(all);
  },

  resetAll: () => {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
    initializeData();
  },
};
