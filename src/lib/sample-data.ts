import { Player, CalendarWeek, TrainingSession, SkillTest, Practice, SkillScores } from './types';

// ── Players (10 players with skill levels) ──────────────────────
export const samplePlayers: Player[] = [
  { id: 'p1',  name: 'Alex Rivera',      jerseyNumber: 7,  position: 'Handler', skillLevel: 'A', joinedDate: '2025-09-01', avatarColor: '#3b82f6' },
  { id: 'p2',  name: 'Jordan Lee',       jerseyNumber: 14, position: 'Cutter',  skillLevel: 'A', joinedDate: '2025-09-01', avatarColor: '#10b981' },
  { id: 'p3',  name: 'Sam Chen',         jerseyNumber: 22, position: 'Hybrid',  skillLevel: 'B', joinedDate: '2025-09-15', avatarColor: '#f59e0b' },
  { id: 'p4',  name: 'Taylor Kim',       jerseyNumber: 3,  position: 'Handler', skillLevel: 'B', joinedDate: '2025-10-01', avatarColor: '#ef4444' },
  { id: 'p5',  name: 'Morgan Patel',     jerseyNumber: 19, position: 'Cutter',  skillLevel: 'A', joinedDate: '2025-09-01', avatarColor: '#8b5cf6' },
  { id: 'p6',  name: 'Casey Brown',      jerseyNumber: 11, position: 'Cutter',  skillLevel: 'C', joinedDate: '2025-10-15', avatarColor: '#ec4899' },
  { id: 'p7',  name: 'Riley Martinez',   jerseyNumber: 5,  position: 'Handler', skillLevel: 'B', joinedDate: '2025-09-01', avatarColor: '#06b6d4' },
  { id: 'p8',  name: 'Avery Thompson',   jerseyNumber: 33, position: 'Hybrid',  skillLevel: 'C', joinedDate: '2025-11-01', avatarColor: '#84cc16' },
  { id: 'p9',  name: 'Quinn Davis',      jerseyNumber: 8,  position: 'Cutter',  skillLevel: 'B', joinedDate: '2025-09-15', avatarColor: '#f97316' },
  { id: 'p10', name: 'Drew Wilson',      jerseyNumber: 21, position: 'Handler', skillLevel: 'A', joinedDate: '2025-10-01', avatarColor: '#14b8a6' },
];

// ── 20 Calendar Weeks ───────────────────────────────────────────
const weekData: [string, string, string][] = [
  // Phase 1: Foundation (W1-4)
  ['2026-01-12', 'Throwing Fundamentals',    'Focus on form over speed'],
  ['2026-01-19', 'Catching & Footwork',      'Build reliable hands'],
  ['2026-01-26', 'Basic Cuts & Movement',    'Learn the 3 main cuts'],
  ['2026-02-02', 'Team Bonding & Fitness',   'Baseline fitness testing'],
  // Phase 2: Skill Building (W5-8)
  ['2026-02-09', 'Advanced Throws',          'Hammers, scoobers, IO/OI'],
  ['2026-02-16', 'Handler Skills',           'Resets, breaks, pivoting'],
  ['2026-02-23', 'Cutting Combinations',     'Timing & spacing'],
  ['2026-03-02', 'Individual Defense',        'Marking & positioning'],
  // Phase 3: Tactical Development (W9-13)
  ['2026-03-09', 'Vert Stack Offense',       'Primary offense system'],
  ['2026-03-16', 'Ho Stack Offense',         'Secondary offense system'],
  ['2026-03-23', 'Zone Defense',             '3-3-1 and 2-3-2 zones'],
  ['2026-03-30', 'Zone Offense',             'Beating zone defenses'],
  ['2026-04-06', 'Transition & Fast Break',  'Turnover situations'],
  // Phase 4: Competition Prep (W14-18)
  ['2026-04-13', 'Endzone Offense',          'Scoring in tight spaces'],
  ['2026-04-20', 'Game Simulation 1',        'Full scrimmage w/ coaching'],
  ['2026-04-27', 'Set Plays & Signals',      'Practiced plays for tourney'],
  ['2026-05-04', 'Game Simulation 2',        'Refs, clock, subs'],
  ['2026-05-11', 'Weakness Targeting',       'Based on eval results'],
  // Phase 5: Taper & Peak (W19-20)
  ['2026-05-18', 'Light Sharpening',         'Low volume, high quality'],
  ['2026-05-25', 'Peak & Review',            'Celebrate progress, set goals'],
];

export const sampleCalendar: CalendarWeek[] = weekData.map(([startDate, focus, notes], i) => ({
  weekNumber: i + 1,
  startDate,
  focus,
  notes,
}));

// ── Training Sessions (3 per week × 20 weeks = 60 sessions) ────
type SessionTemplate = [string, { name: string; duration: number }[]];

const sessionTemplates: Record<number, [SessionTemplate, SessionTemplate, SessionTemplate]> = {
  1:  [['Backhand & Forehand Basics',  [{name:'Warm-up jog & dynamic stretches',duration:10},{name:'Partner backhand drill',duration:20},{name:'Partner forehand drill',duration:20},{name:'Box throwing (4 corners)',duration:15},{name:'Cool-down & debrief',duration:10}]],
       ['Throwing Under Pressure',     [{name:'Warm-up',duration:10},{name:'Throwing on the move',duration:20},{name:'Marking drill (force BH)',duration:15},{name:'3v3 mini game',duration:25},{name:'Stretch',duration:5}]],
       ['Throwing Assessment',         [{name:'Warm-up',duration:10},{name:'Throwing accuracy test',duration:25},{name:'Game: Ultimate keepaway',duration:25},{name:'Team review',duration:15}]]],
  2:  [['Pancake & Rim Catching',      [{name:'Warm-up',duration:10},{name:'Pancake catch ladder',duration:20},{name:'Rim catch drill',duration:20},{name:'High-point catching',duration:15},{name:'Cool-down',duration:10}]],
       ['Catching on the Run',         [{name:'Warm-up',duration:10},{name:'Running catch patterns',duration:25},{name:'Layout catch intro',duration:20},{name:'Flow drill',duration:15},{name:'Stretch',duration:5}]],
       ['Footwork & Agility',          [{name:'Warm-up',duration:10},{name:'Agility ladder',duration:15},{name:'Cone cutting drills',duration:20},{name:'4v4 small-sided game',duration:25},{name:'Debrief',duration:5}]]],
  3:  [['In-cuts & Out-cuts',          [{name:'Warm-up',duration:10},{name:'In-cut drill (5-cone)',duration:20},{name:'Out-cut timing drill',duration:20},{name:'Cut & catch combo',duration:15},{name:'Cool-down',duration:10}]],
       ['Deep Cuts & Hucks',           [{name:'Warm-up',duration:10},{name:'Deep cut reads',duration:20},{name:'Huck & chase drill',duration:20},{name:'Sky drill',duration:15},{name:'Stretch',duration:10}]],
       ['Break-side Movement',         [{name:'Warm-up',duration:10},{name:'Break-side cut patterns',duration:25},{name:'3v3 break-side game',duration:25},{name:'Debrief',duration:15}]]],
  4:  [['Baseline Fitness Test',       [{name:'Warm-up',duration:10},{name:'40yd dash',duration:15},{name:'Beep test / shuttle',duration:20},{name:'Agility course',duration:15},{name:'Cool-down',duration:15}]],
       ['Team Building Drills',        [{name:'Warm-up',duration:10},{name:'Trust fall cutting',duration:15},{name:'Communication challenge',duration:20},{name:'Team relay races',duration:20},{name:'Debrief',duration:10}]],
       ['Foundation Review Scrimmage', [{name:'Warm-up',duration:10},{name:'Skills stations (rotate)',duration:25},{name:'Full scrimmage',duration:30},{name:'Spirit circle',duration:10}]]],
  5:  [['Hammer Technique',            [{name:'Warm-up',duration:10},{name:'Hammer grip & release',duration:20},{name:'Hammer accuracy drill',duration:20},{name:'Game play with hammers',duration:15},{name:'Cool-down',duration:10}]],
       ['Scoober & Trick Throws',      [{name:'Warm-up',duration:10},{name:'Scoober technique',duration:20},{name:'High-release throws',duration:15},{name:'Throw selection game',duration:20},{name:'Stretch',duration:10}]],
       ['IO/OI Break Throws',          [{name:'Warm-up',duration:10},{name:'Inside-out drill',duration:20},{name:'Outside-in drill',duration:20},{name:'Break mark 1v1',duration:15},{name:'Debrief',duration:10}]]],
  6:  [['Handler Resets',              [{name:'Warm-up',duration:10},{name:'Dump-swing drill',duration:25},{name:'Reset timing (3-count)',duration:20},{name:'Handler weave',duration:15},{name:'Cool-down',duration:5}]],
       ['Break Throws in Flow',        [{name:'Warm-up',duration:10},{name:'Around breaks w/ mark',duration:20},{name:'Handler movement patterns',duration:20},{name:'4v4 handler game',duration:20},{name:'Stretch',duration:5}]],
       ['Pivoting & Fakes',            [{name:'Warm-up',duration:10},{name:'Pivot footwork drill',duration:15},{name:'Fake & throw combo',duration:20},{name:'1v1 handler battles',duration:20},{name:'Debrief',duration:10}]]],
  7:  [['Cutting Combos & Timing',     [{name:'Warm-up',duration:10},{name:'Give-and-go drill',duration:20},{name:'Combo cut sequences',duration:20},{name:'Timing drill with handler',duration:15},{name:'Cool-down',duration:10}]],
       ['Stack Movement',              [{name:'Warm-up',duration:10},{name:'Vert stack positioning',duration:20},{name:'Clear & fill drill',duration:20},{name:'5v5 vert stack play',duration:20},{name:'Stretch',duration:5}]],
       ['Cutting Under Pressure',      [{name:'Warm-up',duration:10},{name:'1v1 cutting',duration:20},{name:'2v2 give-go-cut',duration:20},{name:'Film review clips',duration:15},{name:'Debrief',duration:10}]]],
  8:  [['Marking Fundamentals',        [{name:'Warm-up',duration:10},{name:'Marking stance drill',duration:15},{name:'Force drill (BH/FH)',duration:20},{name:'Active mark 1v1',duration:20},{name:'Cool-down',duration:10}]],
       ['Help Defense & Poaching',     [{name:'Warm-up',duration:10},{name:'Help-side positioning',duration:20},{name:'Poach drill',duration:20},{name:'3v3 defense game',duration:20},{name:'Stretch',duration:5}]],
       ['Skill Building Eval',         [{name:'Warm-up',duration:10},{name:'Skills assessment',duration:30},{name:'Mini scrimmage',duration:25},{name:'Review & feedback',duration:10}]]],
  9:  [['Vert Stack Walkthrough',      [{name:'Warm-up',duration:10},{name:'Position assignments',duration:15},{name:'Vert stack flow drill',duration:25},{name:'7v7 vert stack',duration:20},{name:'Cool-down',duration:5}]],
       ['Vert Stack Live Reps',        [{name:'Warm-up',duration:10},{name:'Reset practice in vert',duration:20},{name:'Live vert 7v7',duration:30},{name:'Video review',duration:10},{name:'Stretch',duration:5}]],
       ['Vert Stack Refinement',       [{name:'Warm-up',duration:10},{name:'Common mistakes fix',duration:20},{name:'Vert stack scrimmage',duration:30},{name:'Debrief',duration:15}]]],
  10: [['Ho Stack Introduction',       [{name:'Warm-up',duration:10},{name:'Ho stack positions',duration:15},{name:'Ho stack flow drill',duration:25},{name:'5v5 ho stack',duration:20},{name:'Cool-down',duration:5}]],
       ['Ho Stack Continuation',       [{name:'Warm-up',duration:10},{name:'Iso cuts in ho stack',duration:20},{name:'Handler initiation',duration:20},{name:'Live reps',duration:20},{name:'Stretch',duration:5}]],
       ['Offense Review',              [{name:'Warm-up',duration:10},{name:'Vert vs Ho decision',duration:15},{name:'Offense scrimmage',duration:30},{name:'Coaching debrief',duration:20}]]],
  11: [['3-3-1 Zone Setup',            [{name:'Warm-up',duration:10},{name:'Cup positioning',duration:20},{name:'Wing & deep roles',duration:20},{name:'Walk-through',duration:15},{name:'Cool-down',duration:10}]],
       ['Zone Rotations',              [{name:'Warm-up',duration:10},{name:'Cup shift drill',duration:20},{name:'Wing trap scenarios',duration:20},{name:'Zone vs offense',duration:20},{name:'Stretch',duration:5}]],
       ['Zone Live Reps',              [{name:'Warm-up',duration:10},{name:'7v7 zone defense',duration:35},{name:'Adjustment coaching',duration:15},{name:'Debrief',duration:15}]]],
  12: [['Zone O: Swing It',            [{name:'Warm-up',duration:10},{name:'Swing-it drill',duration:20},{name:'Popper movement',duration:20},{name:'Zone O flow',duration:15},{name:'Cool-down',duration:10}]],
       ['Zone O: Crash the Cup',       [{name:'Warm-up',duration:10},{name:'Crash technique',duration:20},{name:'Over-the-top throws',duration:20},{name:'Zone O scrimmage',duration:20},{name:'Stretch',duration:5}]],
       ['Zone O vs Zone D',            [{name:'Warm-up',duration:10},{name:'Full zone scrimmage',duration:35},{name:'Strategy discussion',duration:15},{name:'Debrief',duration:15}]]],
  13: [['Transition Offense',          [{name:'Warm-up',duration:10},{name:'Fast break drill',duration:20},{name:'Turnover recovery',duration:20},{name:'Transition scrimmage',duration:15},{name:'Cool-down',duration:10}]],
       ['Transition Defense',          [{name:'Warm-up',duration:10},{name:'Quick D setup drill',duration:20},{name:'Counter-attack defense',duration:20},{name:'Live transition reps',duration:20},{name:'Stretch',duration:5}]],
       ['Tactical Phase Review',       [{name:'Warm-up',duration:10},{name:'All systems scrimmage',duration:35},{name:'Film study',duration:15},{name:'Feedback session',duration:15}]]],
  14: [['Endzone Plays',               [{name:'Warm-up',duration:10},{name:'Endzone set play 1',duration:20},{name:'Endzone set play 2',duration:20},{name:'Red zone 4v4',duration:15},{name:'Cool-down',duration:10}]],
       ['Endzone Defense',             [{name:'Warm-up',duration:10},{name:'Endzone D positioning',duration:20},{name:'Bracket defense drill',duration:20},{name:'Endzone scrimmage',duration:20},{name:'Stretch',duration:5}]],
       ['Red Zone Scrimmage',          [{name:'Warm-up',duration:10},{name:'Endzone-only game',duration:35},{name:'Review winning plays',duration:15},{name:'Debrief',duration:15}]]],
  15: [['Game Sim: Full Rules',        [{name:'Warm-up',duration:15},{name:'Full game (2×15min)',duration:35},{name:'Coaching timeouts',duration:10},{name:'Debrief',duration:15}]],
       ['Game Sim: Adjustments',       [{name:'Warm-up',duration:10},{name:'Adjustment talk',duration:15},{name:'Full game with subs',duration:35},{name:'Spirit scores',duration:15}]],
       ['Game Film Review',            [{name:'Warm-up (light)',duration:10},{name:'Video analysis',duration:30},{name:'Individual feedback',duration:20},{name:'Goal setting',duration:15}]]],
  16: [['Set Play Installation',       [{name:'Warm-up',duration:10},{name:'Play 1: Stack & Go',duration:20},{name:'Play 2: Zipper',duration:20},{name:'Play 3: Flood',duration:15},{name:'Cool-down',duration:10}]],
       ['Set Play Reps',               [{name:'Warm-up',duration:10},{name:'Signal practice',duration:15},{name:'Play calling game',duration:25},{name:'Live set plays',duration:20},{name:'Stretch',duration:5}]],
       ['Pre-game Routine',            [{name:'Warm-up routine practice',duration:15},{name:'Pre-game throwing',duration:15},{name:'Mental prep talk',duration:15},{name:'Short scrimmage',duration:20},{name:'Debrief',duration:10}]]],
  17: [['Full Game Sim 2',             [{name:'Full warm-up routine',duration:15},{name:'Game 1 (15min)',duration:20},{name:'Halftime adjustments',duration:10},{name:'Game 2 (15min)',duration:20},{name:'Cool-down',duration:10}]],
       ['Situational Play',            [{name:'Warm-up',duration:10},{name:'Universe point drills',duration:20},{name:'Upwind/downwind strategy',duration:20},{name:'Clutch scenarios',duration:20},{name:'Stretch',duration:5}]],
       ['Comp Prep Review',            [{name:'Warm-up',duration:10},{name:'Full scrimmage',duration:30},{name:'Tournament logistics',duration:15},{name:'Team meeting',duration:20}]]],
  18: [['Weakness Targeting',          [{name:'Warm-up',duration:10},{name:'Individual stations',duration:30},{name:'Position-specific work',duration:20},{name:'Cool-down',duration:15}]],
       ['Skill Re-evaluation',         [{name:'Warm-up',duration:10},{name:'Full skills assessment',duration:35},{name:'Comparison with baseline',duration:15},{name:'Debrief',duration:15}]],
       ['Mock Tournament',             [{name:'Warm-up',duration:15},{name:'Game 1 vs Team A',duration:20},{name:'Game 2 vs Team B',duration:20},{name:'Awards & feedback',duration:20}]]],
  19: [['Light Throwing & Film',       [{name:'Easy warm-up',duration:10},{name:'Light partner throws',duration:20},{name:'Film highlights',duration:20},{name:'Visualization',duration:15},{name:'Stretch',duration:10}]],
       ['Sharpening Drills',           [{name:'Easy warm-up',duration:10},{name:'High-quality reps (low vol)',duration:25},{name:'Mental rehearsal',duration:15},{name:'Team bonding activity',duration:20},{name:'Cool-down',duration:5}]],
       ['Walk-through Only',           [{name:'Light warm-up',duration:10},{name:'Play walk-throughs',duration:25},{name:'Signal review',duration:15},{name:'Team talk',duration:15},{name:'Stretch & recovery',duration:10}]]],
  20: [['Final Tune-up',               [{name:'Easy warm-up',duration:10},{name:'Favorite drills',duration:20},{name:'Short fun scrimmage',duration:20},{name:'Team photo',duration:10},{name:'Cool-down',duration:15}]],
       ['Peak Day',                    [{name:'Pre-game routine practice',duration:15},{name:'Short high-intensity reps',duration:20},{name:'Goal setting ceremony',duration:15},{name:'Team speech',duration:15},{name:'Celebration',duration:10}]],
       ['Season Celebration',          [{name:'Light warm-up',duration:10},{name:'Skills showcase',duration:25},{name:'Awards ceremony',duration:20},{name:'Season review',duration:15},{name:'Party!',duration:5}]]],
};

function getSessionDate(weekStart: string, day: 'Mon' | 'Wed' | 'Fri'): string {
  const d = new Date(weekStart);
  const offsets = { Mon: 0, Wed: 2, Fri: 4 };
  d.setDate(d.getDate() + offsets[day]);
  return d.toISOString().split('T')[0];
}

export const sampleSessions: TrainingSession[] = [];
const days: ('Mon' | 'Wed' | 'Fri')[] = ['Mon', 'Wed', 'Fri'];

for (let w = 1; w <= 20; w++) {
  const weekStart = sampleCalendar[w - 1].startDate;
  const templates = sessionTemplates[w];
  for (let d = 0; d < 3; d++) {
    const [focus, drills] = templates[d];
    const date = getSessionDate(weekStart, days[d]);
    const isPast = new Date(date) < new Date('2026-05-15');
    sampleSessions.push({
      id: `s-${w}-${d}`,
      weekNumber: w,
      day: days[d],
      date,
      focus,
      drills,
      completed: isPast,
    });
  }
}

// ── Attendance (linked to sessions that are in the past) ────────
const pastSessions = sampleSessions.filter((s) => s.completed);
export const samplePractices: Practice[] = pastSessions.map((s) => {
  const rand = (seed: number) => {
    const x = Math.sin(seed * 9301 + 49297) * 49297;
    return x - Math.floor(x);
  };
  const attendees = samplePlayers
    .filter((_, i) => rand(parseInt(s.id.replace(/\D/g, '')) + i) > 0.15)
    .map((p) => p.id);
  return {
    id: `pr-${s.id}`,
    sessionId: s.id,
    date: s.date,
    type: s.focus.split(' ')[0],
    notes: s.focus,
    attendees,
  };
});

// ── Skill Tests (2 rounds: baseline Jan + mid-season progress) ──
function mkScores(base: number[]): SkillScores {
  return {
    backhand: base[0], forehand: base[1], hammer: base[2], scoober: base[3],
    pancake: base[4], rimCatch: base[5], layoutCatch: base[6],
    inCut: base[7], deepCut: base[8], breakSideCut: base[9],
    marking: base[10], force: base[11], positioning: base[12],
    fieldAwareness: base[13], decisionMaking: base[14], communication: base[15],
    sprintSpeed: base[16], endurance: base[17], agility: base[18],
  };
}

export const sampleSkillTests: SkillTest[] = [
  // Round 1 - Baseline (Week 4)
  { id: 'st1',  playerId: 'p1',  date: '2026-02-06', scores: mkScores([8,8,5,4, 7,6,5, 5,5,4, 6,6,5, 7,8,7, 6,6,6]) },
  { id: 'st2',  playerId: 'p2',  date: '2026-02-06', scores: mkScores([6,5,3,3, 8,8,7, 9,8,7, 7,6,6, 6,6,5, 8,9,8]) },
  { id: 'st3',  playerId: 'p3',  date: '2026-02-06', scores: mkScores([7,7,5,4, 7,6,6, 7,6,6, 6,6,6, 7,7,7, 7,7,7]) },
  { id: 'st4',  playerId: 'p4',  date: '2026-02-06', scores: mkScores([7,6,4,3, 6,5,4, 5,5,4, 5,5,5, 6,7,6, 5,5,5]) },
  { id: 'st5',  playerId: 'p5',  date: '2026-02-06', scores: mkScores([5,5,3,2, 8,7,6, 8,8,7, 7,7,6, 5,5,5, 9,8,8]) },
  { id: 'st6',  playerId: 'p6',  date: '2026-02-06', scores: mkScores([4,4,2,2, 6,5,4, 7,6,5, 5,4,4, 4,4,4, 6,7,6]) },
  { id: 'st7',  playerId: 'p7',  date: '2026-02-06', scores: mkScores([8,7,6,5, 6,5,5, 6,5,5, 7,7,6, 7,7,8, 6,6,6]) },
  { id: 'st8',  playerId: 'p8',  date: '2026-02-06', scores: mkScores([5,4,3,2, 6,5,4, 6,5,5, 5,4,4, 5,5,5, 6,5,5]) },
  { id: 'st9',  playerId: 'p9',  date: '2026-02-06', scores: mkScores([6,5,3,3, 7,6,5, 8,7,6, 6,6,5, 5,5,5, 8,8,7]) },
  { id: 'st10', playerId: 'p10', date: '2026-02-06', scores: mkScores([7,7,5,4, 6,5,5, 5,5,4, 6,6,6, 7,7,7, 5,5,6]) },
  // Round 2 - Mid-season (Week 13)
  { id: 'st11', playerId: 'p1',  date: '2026-04-10', scores: mkScores([9,9,7,6, 8,7,6, 6,6,6, 7,7,7, 8,9,8, 7,7,7]) },
  { id: 'st12', playerId: 'p2',  date: '2026-04-10', scores: mkScores([7,7,5,4, 9,9,8, 10,9,8, 8,8,7, 7,7,7, 9,9,9]) },
  { id: 'st13', playerId: 'p3',  date: '2026-04-10', scores: mkScores([8,8,7,6, 8,7,7, 8,7,7, 7,7,7, 8,8,8, 8,8,8]) },
  { id: 'st14', playerId: 'p4',  date: '2026-04-10', scores: mkScores([8,7,6,5, 7,6,5, 6,6,6, 7,6,6, 7,8,7, 6,6,6]) },
  { id: 'st15', playerId: 'p5',  date: '2026-04-10', scores: mkScores([6,6,5,4, 9,8,7, 9,9,8, 8,8,7, 7,6,6, 10,9,9]) },
  { id: 'st16', playerId: 'p6',  date: '2026-04-10', scores: mkScores([6,5,4,3, 7,6,6, 8,7,7, 6,6,5, 6,5,5, 7,8,7]) },
  { id: 'st17', playerId: 'p7',  date: '2026-04-10', scores: mkScores([9,8,7,7, 7,6,6, 7,6,6, 8,8,7, 8,8,9, 7,7,7]) },
  { id: 'st18', playerId: 'p8',  date: '2026-04-10', scores: mkScores([6,6,4,4, 7,6,5, 7,7,6, 6,5,5, 6,6,6, 7,6,6]) },
  { id: 'st19', playerId: 'p9',  date: '2026-04-10', scores: mkScores([7,7,5,4, 8,7,7, 9,8,8, 7,7,7, 7,6,6, 9,9,8]) },
  { id: 'st20', playerId: 'p10', date: '2026-04-10', scores: mkScores([8,8,7,6, 7,6,6, 6,6,6, 7,7,7, 8,8,8, 6,6,7]) },
];
