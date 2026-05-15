'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useInitialize } from '@/hooks/useLocalStorage';
import { store } from '@/lib/store';
import { SKILL_CATEGORIES, categoryAverage, overallAverage } from '@/lib/types';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

export default function PlayerProfilePage() {
  const ready = useInitialize();
  const params = useParams();
  const id = params.id as string;

  if (!ready) return <div className="animate-pulse h-96 rounded-2xl" style={{ backgroundColor: 'var(--primary)', opacity: 0.1 }} />;

  const players = store.getPlayers();
  const player = players.find((p) => p.id === id);
  const practices = store.getPractices();
  const skillTests = store.getSkillTests();

  if (!player) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--text-secondary)] mb-4">Player not found</p>
        <Link href="/players" className="font-bold" style={{ color: 'var(--secondary)' }}>Back to players</Link>
      </div>
    );
  }

  const playerTests = skillTests.filter((t) => t.playerId === id).sort((a, b) => a.date.localeCompare(b.date));
  const latestTest = playerTests[playerTests.length - 1];
  const firstTest = playerTests[0];

  const attended = practices.filter((p) => p.attendees.includes(id));
  const attendRate = practices.length > 0 ? Math.round((attended.length / practices.length) * 100) : 0;

  const radarData = SKILL_CATEGORIES.map((cat) => ({
    skill: cat.label,
    current: latestTest ? Math.round(categoryAverage(latestTest.scores, cat) * 10) / 10 : 0,
    baseline: firstTest && playerTests.length > 1 ? Math.round(categoryAverage(firstTest.scores, cat) * 10) / 10 : 0,
  }));

  const progressData = playerTests.map((test) => {
    const entry: Record<string, string | number> = {
      date: new Date(test.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
    SKILL_CATEGORIES.forEach((cat) => {
      entry[cat.label] = Math.round(categoryAverage(test.scores, cat) * 10) / 10;
    });
    entry['Overall'] = Math.round(overallAverage(test.scores) * 10) / 10;
    return entry;
  });

  const recentPractices = attended.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

  const levelStyle: Record<string, { bg: string; text: string }> = {
    A: { bg: 'rgba(0, 214, 143, 0.15)', text: 'var(--success)' },
    B: { bg: 'rgba(78, 205, 196, 0.15)', text: 'var(--secondary)' },
    C: { bg: 'rgba(107, 114, 128, 0.15)', text: 'var(--text-secondary)' },
  };

  return (
    <div className="space-y-6 stagger-children">
      <Link href="/players" className="text-sm font-bold inline-flex items-center gap-1 animate-fade-in-up" style={{ color: 'var(--secondary)' }}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        Back to players
      </Link>

      {/* Player Header */}
      <div className="card-flat p-6 animate-fade-in-up">
        <div className="flex items-center gap-5 flex-wrap">
          <div className="w-18 h-18 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg"
            style={{
              backgroundColor: player.avatarColor,
              width: '72px', height: '72px',
              boxShadow: `0 0 0 4px var(--card-bg), 0 0 0 6px ${levelStyle[player.skillLevel].text}`,
            }}>
            {player.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-heading font-extrabold" style={{ color: 'var(--dark)' }}>{player.name}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs px-2.5 py-1 rounded-full font-bold stat-number" style={{ backgroundColor: 'var(--background)', color: 'var(--dark)' }}>#{player.jerseyNumber}</span>
              <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ backgroundColor: 'rgba(204, 255, 0, 0.2)', color: 'var(--dark)' }}>{player.position}</span>
              <span className="text-xs px-2.5 py-1 rounded-full font-extrabold" style={{ backgroundColor: levelStyle[player.skillLevel].bg, color: levelStyle[player.skillLevel].text }}>Level {player.skillLevel}</span>
              <span className="text-xs text-[var(--text-secondary)]">Joined {new Date(player.joinedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-2xl font-extrabold stat-number" style={{ color: 'var(--secondary)' }}>
                {latestTest ? overallAverage(latestTest.scores).toFixed(1) : '—'}
              </p>
              <p className="text-[10px] text-[var(--text-secondary)] uppercase font-bold tracking-wide">Skill Avg</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold stat-number" style={{ color: 'var(--dark)' }}>{attended.length}</p>
              <p className="text-[10px] text-[var(--text-secondary)] uppercase font-bold tracking-wide">Practices</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold stat-number" style={{ color: attendRate >= 80 ? 'var(--success)' : attendRate >= 50 ? 'var(--warning)' : 'var(--danger)' }}>{attendRate}%</p>
              <p className="text-[10px] text-[var(--text-secondary)] uppercase font-bold tracking-wide">Attendance</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold stat-number" style={{ color: 'var(--accent-pink)' }}>{playerTests.length}</p>
              <p className="text-[10px] text-[var(--text-secondary)] uppercase font-bold tracking-wide">Evals</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      {playerTests.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up">
          <div className="card-flat p-5">
            <h2 className="text-lg font-heading font-bold mb-4" style={{ color: 'var(--dark)' }}>Skill Radar</h2>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="skill" fontSize={11} tick={{ fill: 'var(--text-secondary)' }} />
                <PolarRadiusAxis domain={[0, 10]} fontSize={10} />
                {firstTest && playerTests.length > 1 && (
                  <Radar dataKey="baseline" stroke="#d1d5db" fill="#d1d5db" fillOpacity={0.2} name="Baseline" />
                )}
                <Radar dataKey="current" stroke="var(--secondary)" fill="var(--secondary)" fillOpacity={0.3} name="Current" />
                <Tooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="card-flat p-5">
            <h2 className="text-lg font-heading font-bold mb-4" style={{ color: 'var(--dark)' }}>Progress Over Time</h2>
            {playerTests.length > 1 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={progressData}>
                  <XAxis dataKey="date" fontSize={11} tick={{ fill: 'var(--text-secondary)' }} />
                  <YAxis domain={[0, 10]} fontSize={11} tick={{ fill: 'var(--text-secondary)' }} />
                  <Tooltip />
                  <Legend />
                  {SKILL_CATEGORIES.map((cat) => (
                    <Line key={cat.label} type="monotone" dataKey={cat.label} stroke={cat.color} strokeWidth={2} dot={{ r: 3 }} />
                  ))}
                  <Line type="monotone" dataKey="Overall" stroke="var(--dark)" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-[var(--text-secondary)] text-center py-16">Need at least 2 evaluations to show progress</p>
            )}
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center animate-fade-in-up">
          <p className="text-4xl mb-3">🎯</p>
          <p className="text-[var(--text-secondary)]">No evaluations recorded yet for this player.</p>
          <Link href="/skills" className="text-sm font-bold mt-2 inline-block" style={{ color: 'var(--secondary)' }}>Go to Skill Evaluation →</Link>
        </div>
      )}

      {/* Detailed Skill Breakdown */}
      {latestTest && (
        <div className="card-flat p-5 animate-fade-in-up">
          <h2 className="text-lg font-heading font-bold mb-4" style={{ color: 'var(--dark)' }}>Detailed Skill Breakdown</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SKILL_CATEGORIES.map((cat) => {
              const avg = categoryAverage(latestTest.scores, cat);
              const baseAvg = firstTest && playerTests.length > 1 ? categoryAverage(firstTest.scores, cat) : null;
              const diff = baseAvg !== null ? avg - baseAvg : 0;
              return (
                <div key={cat.label} className="card-sm p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-heading font-bold" style={{ color: cat.color }}>{cat.label}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-extrabold stat-number" style={{ color: cat.color }}>{avg.toFixed(1)}</span>
                      {diff !== 0 && (
                        <span className={`text-xs font-bold`} style={{ color: diff > 0 ? 'var(--success)' : 'var(--danger)' }}>
                          {diff > 0 ? '↑' : '↓'}{Math.abs(diff).toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {cat.skills.map((skill) => {
                      const val = latestTest.scores[skill.key];
                      const prevVal = firstTest && playerTests.length > 1 ? firstTest.scores[skill.key] : null;
                      const d = prevVal !== null ? val - prevVal : 0;
                      return (
                        <div key={skill.key}>
                          <div className="flex items-center justify-between text-xs mb-0.5">
                            <span className="text-[var(--text-secondary)]">{skill.label}</span>
                            <div className="flex items-center gap-1">
                              <span className="font-bold stat-number">{val}/10</span>
                              {d !== 0 && <span className="font-bold" style={{ color: d > 0 ? 'var(--success)' : 'var(--danger)' }}>{d > 0 ? '+' : ''}{d}</span>}
                            </div>
                          </div>
                          <div className="rounded-full h-2" style={{ backgroundColor: cat.color + '20' }}>
                            <div className="h-2 rounded-full transition-all animate-progress" style={{ width: `${val * 10}%`, backgroundColor: cat.color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Practices */}
      <div className="card-flat p-5 animate-fade-in-up">
        <h2 className="text-lg font-heading font-bold mb-4" style={{ color: 'var(--dark)' }}>Recent Practices Attended</h2>
        {recentPractices.length > 0 ? (
          <div className="space-y-2">
            {recentPractices.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-black/[0.03] transition-colors" style={{ border: '1px solid var(--background)' }}>
                <div className="text-center shrink-0 w-14">
                  <p className="text-[10px] text-[var(--text-secondary)] uppercase font-bold">{new Date(p.date).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                  <p className="text-sm font-extrabold stat-number" style={{ color: 'var(--dark)' }}>{new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: 'var(--dark)' }}>{p.notes}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{p.type}</p>
                </div>
                <span className="text-xs font-bold text-[var(--text-secondary)]">{p.attendees.length} present</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-3xl mb-2">🏃</p>
            <p className="text-[var(--text-secondary)]">No practices attended yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
