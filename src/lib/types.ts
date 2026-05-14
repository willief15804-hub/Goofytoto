export interface Player {
  id: string;
  name: string;
  jerseyNumber: number;
  position: 'Handler' | 'Cutter' | 'Hybrid';
  joinedDate: string;
  avatarColor: string;
  email?: string;
}

export interface Practice {
  id: string;
  date: string;
  type: 'Regular' | 'Scrimmage' | 'Tournament Prep' | 'Conditioning';
  notes: string;
  attendees: string[];
}

export interface SkillScores {
  throwing: number;
  catching: number;
  cutting: number;
  marking: number;
  handler: number;
  fitness: number;
}

export interface SkillTest {
  id: string;
  playerId: string;
  date: string;
  scores: SkillScores;
}

export interface CalendarWeek {
  weekNumber: number;
  startDate: string;
  focus: string;
  drills: string[];
  notes: string;
}

export type SkillName = keyof SkillScores;

export const SKILL_NAMES: SkillName[] = [
  'throwing',
  'catching',
  'cutting',
  'marking',
  'handler',
  'fitness',
];

export const SKILL_LABELS: Record<SkillName, string> = {
  throwing: 'Throwing',
  catching: 'Catching',
  cutting: 'Cutting',
  marking: 'Marking',
  handler: 'Handler Skills',
  fitness: 'Fitness',
};

export const SKILL_COLORS: Record<SkillName, string> = {
  throwing: '#3b82f6',
  catching: '#10b981',
  cutting: '#f59e0b',
  marking: '#ef4444',
  handler: '#8b5cf6',
  fitness: '#ec4899',
};
