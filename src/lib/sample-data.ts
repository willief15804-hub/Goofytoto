import { Player, Practice, SkillTest, CalendarWeek } from './types';

export const samplePlayers: Player[] = [
  { id: 'p1', name: 'Alex Rivera', jerseyNumber: 7, position: 'Handler', joinedDate: '2025-09-01', avatarColor: '#3b82f6', email: 'alex@example.com' },
  { id: 'p2', name: 'Jordan Lee', jerseyNumber: 14, position: 'Cutter', joinedDate: '2025-09-01', avatarColor: '#10b981', email: 'jordan@example.com' },
  { id: 'p3', name: 'Sam Chen', jerseyNumber: 22, position: 'Hybrid', joinedDate: '2025-09-15', avatarColor: '#f59e0b', email: 'sam@example.com' },
  { id: 'p4', name: 'Taylor Kim', jerseyNumber: 3, position: 'Handler', joinedDate: '2025-10-01', avatarColor: '#ef4444', email: 'taylor@example.com' },
  { id: 'p5', name: 'Morgan Patel', jerseyNumber: 19, position: 'Cutter', joinedDate: '2025-09-01', avatarColor: '#8b5cf6', email: 'morgan@example.com' },
  { id: 'p6', name: 'Casey Brown', jerseyNumber: 11, position: 'Cutter', joinedDate: '2025-10-15', avatarColor: '#ec4899', email: 'casey@example.com' },
  { id: 'p7', name: 'Riley Martinez', jerseyNumber: 5, position: 'Handler', joinedDate: '2025-09-01', avatarColor: '#06b6d4', email: 'riley@example.com' },
  { id: 'p8', name: 'Avery Thompson', jerseyNumber: 33, position: 'Hybrid', joinedDate: '2025-11-01', avatarColor: '#84cc16', email: 'avery@example.com' },
  { id: 'p9', name: 'Quinn Davis', jerseyNumber: 8, position: 'Cutter', joinedDate: '2025-09-15', avatarColor: '#f97316', email: 'quinn@example.com' },
  { id: 'p10', name: 'Drew Wilson', jerseyNumber: 21, position: 'Handler', joinedDate: '2025-10-01', avatarColor: '#14b8a6', email: 'drew@example.com' },
];

const practiceIds = ['pr1', 'pr2', 'pr3', 'pr4', 'pr5', 'pr6', 'pr7', 'pr8', 'pr9', 'pr10', 'pr11', 'pr12'];

export const samplePractices: Practice[] = [
  { id: practiceIds[0], date: '2026-01-13', type: 'Regular', notes: 'Throwing fundamentals', attendees: ['p1', 'p2', 'p3', 'p4', 'p5', 'p7', 'p9', 'p10'] },
  { id: practiceIds[1], date: '2026-01-15', type: 'Conditioning', notes: 'Sprint drills and agility', attendees: ['p1', 'p2', 'p3', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10'] },
  { id: practiceIds[2], date: '2026-01-20', type: 'Regular', notes: 'Zone offense walkthrough', attendees: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10'] },
  { id: practiceIds[3], date: '2026-01-22', type: 'Scrimmage', notes: 'Full 7v7 scrimmage', attendees: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9'] },
  { id: practiceIds[4], date: '2026-01-27', type: 'Regular', notes: 'Man defense principles', attendees: ['p1', 'p3', 'p4', 'p5', 'p7', 'p8', 'p10'] },
  { id: practiceIds[5], date: '2026-01-29', type: 'Regular', notes: 'Handler movement & resets', attendees: ['p1', 'p2', 'p4', 'p5', 'p6', 'p7', 'p9', 'p10'] },
  { id: practiceIds[6], date: '2026-02-03', type: 'Conditioning', notes: 'Endurance and plyometrics', attendees: ['p1', 'p2', 'p3', 'p4', 'p6', 'p8', 'p9', 'p10'] },
  { id: practiceIds[7], date: '2026-02-05', type: 'Tournament Prep', notes: 'Set plays and endzone offense', attendees: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10'] },
  { id: practiceIds[8], date: '2026-02-10', type: 'Regular', notes: 'Huck drills and deep game', attendees: ['p2', 'p3', 'p5', 'p6', 'p7', 'p8', 'p9'] },
  { id: practiceIds[9], date: '2026-02-12', type: 'Scrimmage', notes: 'Intrasquad game', attendees: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10'] },
  { id: practiceIds[10], date: '2026-02-17', type: 'Regular', notes: 'Force middle defense', attendees: ['p1', 'p2', 'p3', 'p4', 'p5', 'p7', 'p9'] },
  { id: practiceIds[11], date: '2026-02-19', type: 'Regular', notes: 'Break throws & around breaks', attendees: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p8', 'p10'] },
];

function makeSkillTest(id: string, playerId: string, date: string, base: number[]): SkillTest {
  return {
    id,
    playerId,
    date,
    scores: {
      throwing: base[0],
      catching: base[1],
      cutting: base[2],
      marking: base[3],
      handler: base[4],
      fitness: base[5],
    },
  };
}

export const sampleSkillTests: SkillTest[] = [
  // Round 1 - January
  makeSkillTest('st1', 'p1', '2026-01-10', [8, 7, 5, 6, 9, 6]),
  makeSkillTest('st2', 'p2', '2026-01-10', [6, 8, 9, 7, 5, 8]),
  makeSkillTest('st3', 'p3', '2026-01-10', [7, 7, 7, 6, 7, 7]),
  makeSkillTest('st4', 'p4', '2026-01-10', [7, 6, 5, 5, 8, 5]),
  makeSkillTest('st5', 'p5', '2026-01-10', [5, 8, 8, 7, 4, 9]),
  makeSkillTest('st6', 'p6', '2026-01-10', [4, 7, 7, 6, 3, 7]),
  makeSkillTest('st7', 'p7', '2026-01-10', [8, 6, 6, 7, 8, 6]),
  makeSkillTest('st8', 'p8', '2026-01-10', [5, 6, 6, 5, 5, 6]),
  makeSkillTest('st9', 'p9', '2026-01-10', [6, 7, 8, 6, 4, 8]),
  makeSkillTest('st10', 'p10', '2026-01-10', [7, 6, 5, 6, 7, 5]),
  // Round 2 - February
  makeSkillTest('st11', 'p1', '2026-02-14', [9, 7, 6, 7, 9, 7]),
  makeSkillTest('st12', 'p2', '2026-02-14', [7, 9, 9, 8, 6, 9]),
  makeSkillTest('st13', 'p3', '2026-02-14', [8, 8, 8, 7, 8, 8]),
  makeSkillTest('st14', 'p4', '2026-02-14', [8, 7, 6, 6, 9, 6]),
  makeSkillTest('st15', 'p5', '2026-02-14', [6, 9, 9, 8, 5, 9]),
  makeSkillTest('st16', 'p6', '2026-02-14', [5, 8, 8, 7, 4, 8]),
  makeSkillTest('st17', 'p7', '2026-02-14', [9, 7, 7, 8, 9, 7]),
  makeSkillTest('st18', 'p8', '2026-02-14', [6, 7, 7, 6, 6, 7]),
  makeSkillTest('st19', 'p9', '2026-02-14', [7, 8, 9, 7, 5, 9]),
  makeSkillTest('st20', 'p10', '2026-02-14', [8, 7, 6, 7, 8, 6]),
];

export const sampleCalendar: CalendarWeek[] = [
  { weekNumber: 1, startDate: '2026-01-12', focus: 'Fundamentals', drills: ['Box throwing drill', 'Partner catching ladder', 'Basic cuts: in/out'], notes: 'Focus on form over speed' },
  { weekNumber: 2, startDate: '2026-01-19', focus: 'Offensive Concepts', drills: ['Vert stack walkthrough', 'Dump-swing drill', 'Give-and-go cuts'], notes: 'Introduce vert stack' },
  { weekNumber: 3, startDate: '2026-01-26', focus: 'Defense Basics', drills: ['Force backhand 1v1', 'Help defense positioning', 'Marking footwork'], notes: 'Man defense principles' },
  { weekNumber: 4, startDate: '2026-02-02', focus: 'Conditioning', drills: ['Suicide sprints', 'Agility ladder', 'Plyometric jumps'], notes: 'Build game fitness' },
  { weekNumber: 5, startDate: '2026-02-09', focus: 'Deep Game', drills: ['Huck accuracy contest', 'Deep cut timing', 'Sky drill'], notes: 'Long throws and reads' },
  { weekNumber: 6, startDate: '2026-02-16', focus: 'Handler Movement', drills: ['Reset drill', 'Around break throws', 'Handler weave'], notes: 'Break throws emphasis' },
  { weekNumber: 7, startDate: '2026-02-23', focus: 'Zone Offense', drills: ['Zone O positions', 'Swing-it drill', 'Crash the cup'], notes: 'Beat zone defenses' },
  { weekNumber: 8, startDate: '2026-03-02', focus: 'Zone Defense', drills: ['Cup positioning', 'Wing trap drill', 'Transition from zone to man'], notes: 'Run 3-3-1 zone' },
  { weekNumber: 9, startDate: '2026-03-09', focus: 'Scrimmage Week', drills: ['Full 7v7 game', 'Spirit of the Game review', 'Situational play'], notes: 'Apply skills in game' },
  { weekNumber: 10, startDate: '2026-03-16', focus: 'Endzone Offense', drills: ['Endzone set plays', 'Dish-score drill', 'Red zone 4v4'], notes: 'Scoring efficiency' },
  { weekNumber: 11, startDate: '2026-03-23', focus: 'Transition Play', drills: ['Fast break drill', 'Turnover D drill', 'Quick counter offense'], notes: 'Speed in transition' },
  { weekNumber: 12, startDate: '2026-03-30', focus: 'Advanced Throws', drills: ['Hammer drill', 'Scoober practice', 'IO/OI progression'], notes: 'Expand throwing toolkit' },
  { weekNumber: 13, startDate: '2026-04-06', focus: 'Team Chemistry', drills: ['Partner pick drill', 'Trust fall cutting', 'Communication challenge'], notes: 'Build connections' },
  { weekNumber: 14, startDate: '2026-04-13', focus: 'Tournament Prep 1', drills: ['Line calling practice', 'Warm-up routine', 'Set play reps'], notes: 'Pre-tournament prep' },
  { weekNumber: 15, startDate: '2026-04-20', focus: 'Tournament Prep 2', drills: ['Game simulation', 'Sideline strategy', 'Sub patterns'], notes: 'Fine-tune game plan' },
  { weekNumber: 16, startDate: '2026-04-27', focus: 'Recovery & Film', drills: ['Light throwing', 'Film review session', 'Strategy discussion'], notes: 'Mental preparation' },
  { weekNumber: 17, startDate: '2026-05-04', focus: 'Intensive Drills', drills: ['High-rep cutting', 'Pressure throwing', 'Defensive intensity drill'], notes: 'Push through plateau' },
  { weekNumber: 18, startDate: '2026-05-11', focus: 'Skill Testing', drills: ['Throwing accuracy test', 'Catching under pressure', 'Fitness assessment'], notes: 'Mid-season evaluation' },
  { weekNumber: 19, startDate: '2026-05-18', focus: 'Weakness Focus', drills: ['Individual skill work', 'Position-specific drills', 'Film correction'], notes: 'Address individual gaps' },
  { weekNumber: 20, startDate: '2026-05-25', focus: 'Season Review', drills: ['Scrimmage showcase', 'Awards ceremony prep', 'Goal setting'], notes: 'Celebrate progress' },
];
