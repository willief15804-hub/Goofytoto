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

  if (!ready) return <div className="animate-pulse h-96 bg-gray-200 rounded-xl" />;

  const players = store.getPlayers();
  const player = players.find((p) => p.id === id);
  const practices = store.getPractices();
  const skillTests = store.getSkillTests();

  if (!player) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">Player not found</p>
        <Link href="/players" className="text-purple-600 hover:text-purple-800">Back to players</Link>
      </div>
    );
  }

  const playerTests = skillTests.filter((t) => t.playerId === id).sort((a, b) => a.date.localeCompare(b.date));
  const latestTest = playerTests[playerTests.length - 1];
  const firstTest = playerTests[0];

  const attended = practices.filter((p) => p.attendees.includes(id));
  const attendRate = practices.length > 0 ? Math.round((attended.length / practices.length) * 100) : 0;

  // Radar data: category averages, current vs first
  const radarData = SKILL_CATEGORIES.map((cat) => ({
    skill: cat.label,
    current: latestTest ? Math.round(categoryAverage(latestTest.scores, cat) * 10) / 10 : 0,
    baseline: firstTest && playerTests.length > 1 ? Math.round(categoryAverage(firstTest.scores, cat) * 10) / 10 : 0,
  }));

  // Progress line chart: overall + category averages over time
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

  const levelColors = { A: 'bg-green-100 text-green-700', B: 'bg-blue-100 text-blue-700', C: 'bg-gray-100 text-gray-600' };

  return (
    <div className="space-y-6">
      <Link href="/players" className="text-sm text-purple-600 hover:text-purple-800">← Back to players</Link>

      {/* Player Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
            style={{ backgroundColor: player.avatarColor }}>
            {player.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold">{player.name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-sm bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">#{player.jerseyNumber}</span>
              <span className="text-sm bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{player.position}</span>
              <span className={`text-sm px-2 py-0.5 rounded-full font-bold ${levelColors[player.skillLevel]}`}>Level {player.skillLevel}</span>
              <span className="text-sm text-gray-500">Joined {new Date(player.joinedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-purple-700">
                {latestTest ? overallAverage(latestTest.scores).toFixed(1) : '—'}
              </p>
              <p className="text-xs text-gray-500">Skill Avg</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{attended.length}</p>
              <p className="text-xs text-gray-500">Practices</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{attendRate}%</p>
              <p className="text-xs text-gray-500">Attendance</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{playerTests.length}</p>
              <p className="text-xs text-gray-500">Evaluations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold mb-4">Skill Radar</h2>
          {latestTest ? (
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="skill" fontSize={11} />
                <PolarRadiusAxis domain={[0, 10]} fontSize={10} />
                {firstTest && playerTests.length > 1 && (
                  <Radar dataKey="baseline" stroke="#d1d5db" fill="#d1d5db" fillOpacity={0.2} name="Baseline" />
                )}
                <Radar dataKey="current" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.3} name="Current" />
                <Tooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-16">No evaluations recorded</p>
          )}
        </div>

        {/* Progress Line Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold mb-4">Progress Over Time</h2>
          {playerTests.length > 1 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={progressData}>
                <XAxis dataKey="date" fontSize={11} />
                <YAxis domain={[0, 10]} fontSize={11} />
                <Tooltip />
                <Legend />
                {SKILL_CATEGORIES.map((cat) => (
                  <Line key={cat.label} type="monotone" dataKey={cat.label} stroke={cat.color} strokeWidth={2} dot={{ r: 3 }} />
                ))}
                <Line type="monotone" dataKey="Overall" stroke="#1f2937" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-16">Need at least 2 evaluations to show progress</p>
          )}
        </div>
      </div>

      {/* Detailed Skill Breakdown */}
      {latestTest && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold mb-4">Detailed Skill Breakdown</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SKILL_CATEGORIES.map((cat) => {
              const avg = categoryAverage(latestTest.scores, cat);
              const baseAvg = firstTest && playerTests.length > 1 ? categoryAverage(firstTest.scores, cat) : null;
              const diff = baseAvg !== null ? avg - baseAvg : 0;
              return (
                <div key={cat.label} className="rounded-lg border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold" style={{ color: cat.color }}>{cat.label}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold" style={{ color: cat.color }}>{avg.toFixed(1)}</span>
                      {diff !== 0 && (
                        <span className={`text-xs font-bold ${diff > 0 ? 'text-green-600' : 'text-red-500'}`}>
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
                            <span className="text-gray-600">{skill.label}</span>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{val}/10</span>
                              {d !== 0 && <span className={`font-bold ${d > 0 ? 'text-green-600' : 'text-red-500'}`}>{d > 0 ? '+' : ''}{d}</span>}
                            </div>
                          </div>
                          <div className="bg-gray-100 rounded-full h-2">
                            <div className="h-2 rounded-full transition-all" style={{ width: `${val * 10}%`, backgroundColor: cat.color }} />
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
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold mb-4">Recent Practices Attended</h2>
        {recentPractices.length > 0 ? (
          <div className="space-y-2">
            {recentPractices.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
                <div className="text-center shrink-0">
                  <p className="text-xs text-gray-500">{new Date(p.date).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                  <p className="text-sm font-bold">{new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{p.notes}</p>
                  <p className="text-xs text-gray-500">{p.type}</p>
                </div>
                <span className="text-xs text-gray-400">{p.attendees.length} present</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No practices attended yet</p>
        )}
      </div>
    </div>
  );
}
