// ── Player ──────────────────────────────────────────────────────
export type SkillLevel = 'A' | 'B' | 'C';
export type Position = 'Handler' | 'Cutter' | 'Hybrid';

export interface Player {
  id: string;
  name: string;
  jerseyNumber: number;
  position: Position;
  skillLevel: SkillLevel;
  joinedDate: string;
  avatarColor: string;
  email?: string;
}

// ── Training Schedule ───────────────────────────────────────────
export interface TrainingPhase {
  id: number;
  name: string;
  weeks: [number, number]; // [startWeek, endWeek] inclusive
  color: string;
  description: string;
}

export const PHASES: TrainingPhase[] = [
  { id: 1, name: 'Foundation',          weeks: [1, 4],   color: '#3b82f6', description: 'Build fundamentals & team bonding' },
  { id: 2, name: 'Skill Building',      weeks: [5, 8],   color: '#10b981', description: 'Develop individual skills & techniques' },
  { id: 3, name: 'Tactical Development', weeks: [9, 13],  color: '#f59e0b', description: 'Offense/defense systems & strategies' },
  { id: 4, name: 'Competition Prep',    weeks: [14, 18], color: '#ef4444', description: 'Game simulations & tournament readiness' },
  { id: 5, name: 'Taper & Peak',        weeks: [19, 20], color: '#8b5cf6', description: 'Recovery, sharpening & peak performance' },
];

export type SessionDay = 'Mon' | 'Wed' | 'Fri';

export interface Drill {
  name: string;
  duration: number; // minutes
}

export interface TrainingSession {
  id: string;
  weekNumber: number;
  day: SessionDay;
  date: string;
  focus: string;
  drills: Drill[];
  completed: boolean;
}

export interface CalendarWeek {
  weekNumber: number;
  startDate: string;
  focus: string;
  notes: string;
}

// ── Skill Evaluation (expanded: 6 categories × 3 sub-skills = 18) ──
export interface SkillScores {
  // Throwing
  backhand: number;
  forehand: number;
  hammer: number;
  scoober: number;
  // Catching
  pancake: number;
  rimCatch: number;
  layoutCatch: number;
  // Cutting
  inCut: number;
  deepCut: number;
  breakSideCut: number;
  // Defense
  marking: number;
  force: number;
  positioning: number;
  // Game IQ
  fieldAwareness: number;
  decisionMaking: number;
  communication: number;
  // Fitness
  sprintSpeed: number;
  endurance: number;
  agility: number;
}

export type SkillName = keyof SkillScores;

export interface SkillCategory {
  label: string;
  color: string;
  skills: { key: SkillName; label: string }[];
}

export const SKILL_CATEGORIES: SkillCategory[] = [
  {
    label: 'Throwing', color: '#3b82f6',
    skills: [
      { key: 'backhand', label: 'Backhand' },
      { key: 'forehand', label: 'Forehand' },
      { key: 'hammer', label: 'Hammer' },
      { key: 'scoober', label: 'Scoober' },
    ],
  },
  {
    label: 'Catching', color: '#10b981',
    skills: [
      { key: 'pancake', label: 'Pancake' },
      { key: 'rimCatch', label: 'Rim Catch' },
      { key: 'layoutCatch', label: 'Layout Catch' },
    ],
  },
  {
    label: 'Cutting', color: '#f59e0b',
    skills: [
      { key: 'inCut', label: 'In-cut' },
      { key: 'deepCut', label: 'Deep Cut' },
      { key: 'breakSideCut', label: 'Break-side Cut' },
    ],
  },
  {
    label: 'Defense', color: '#ef4444',
    skills: [
      { key: 'marking', label: 'Marking' },
      { key: 'force', label: 'Force' },
      { key: 'positioning', label: 'Positioning' },
    ],
  },
  {
    label: 'Game IQ', color: '#8b5cf6',
    skills: [
      { key: 'fieldAwareness', label: 'Field Awareness' },
      { key: 'decisionMaking', label: 'Decision Making' },
      { key: 'communication', label: 'Communication' },
    ],
  },
  {
    label: 'Fitness', color: '#ec4899',
    skills: [
      { key: 'sprintSpeed', label: 'Sprint Speed' },
      { key: 'endurance', label: 'Endurance' },
      { key: 'agility', label: 'Agility' },
    ],
  },
];

export const ALL_SKILL_KEYS: SkillName[] = SKILL_CATEGORIES.flatMap((c) => c.skills.map((s) => s.key));

export function getSkillLabel(key: SkillName): string {
  for (const cat of SKILL_CATEGORIES) {
    for (const s of cat.skills) {
      if (s.key === key) return s.label;
    }
  }
  return key;
}

export function getSkillColor(key: SkillName): string {
  for (const cat of SKILL_CATEGORIES) {
    if (cat.skills.some((s) => s.key === key)) return cat.color;
  }
  return '#6b7280';
}

export function emptySkilScores(): SkillScores {
  return {
    backhand: 5, forehand: 5, hammer: 5, scoober: 5,
    pancake: 5, rimCatch: 5, layoutCatch: 5,
    inCut: 5, deepCut: 5, breakSideCut: 5,
    marking: 5, force: 5, positioning: 5,
    fieldAwareness: 5, decisionMaking: 5, communication: 5,
    sprintSpeed: 5, endurance: 5, agility: 5,
  };
}

export function categoryAverage(scores: SkillScores, cat: SkillCategory): number {
  const vals = cat.skills.map((s) => scores[s.key]);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function overallAverage(scores: SkillScores): number {
  const vals = ALL_SKILL_KEYS.map((k) => scores[k]);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

// ── Skill Test ──────────────────────────────────────────────────
export interface SkillTest {
  id: string;
  playerId: string;
  date: string;
  scores: SkillScores;
}

// ── Attendance (linked to training sessions) ────────────────────
export interface Practice {
  id: string;
  sessionId: string; // links to TrainingSession.id
  date: string;
  type: string;
  notes: string;
  attendees: string[];
}

// ── Tournament ──────────────────────────────────────────────────
export const TOURNAMENT_DATE = '2026-10-15';
