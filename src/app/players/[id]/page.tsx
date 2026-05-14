'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useInitialize } from '@/hooks/useLocalStorage';
import { store } from '@/lib/store';
import { SKILL_NAMES, SKILL_LABELS, SKILL_COLORS } from '@/lib/types';
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

  const playerTests = skillTests
    .filter((t) => t.playerId === id)
    .sort((a, b) => a.date.localeCompare(b.date));

  const latestTest = playerTests[playerTests.length - 1];
  const previousTest = playerTests.length > 1 ? playerTests[playerTests.length - 2] : null;

  const attended = practices.filter((p) => p.attendees.includes(id));
  const attendRate = practices.length > 0 ? Math.round((attended.length / practices.length) * 100) : 0;

  const radarData = SKILL_NAMES.map((skill) => ({
    skill: SKILL_LABELS[skill],
    current: latestTest?.scores[skill] ?? 0,
    previous: previousTest?.scores[skill] ?? 0,
  }));

  const progressData = playerTests.map((test) => {
    const entry: Record<string, string | number> = {
      date: new Date(test.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
    SKILL_NAMES.forEach((skill) => {
      entry[SKILL_LABELS[skill]] = test.scores[skill];
    });
    return entry;
  });

  const recentPractices = attended.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

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
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-sm bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">#{player.jerseyNumber}</span>
              <span className="text-sm bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{player.position}</span>
              <span className="text-sm text-gray-500">Joined {new Date(player.joinedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-purple-700">
                {latestTest ? (Object.values(latestTest.scores).reduce((a, b) => a + b, 0) / 6).toFixed(1) : '—'}
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
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold mb-4">Skill Snapshot</h2>
          {latestTest ? (
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="skill" fontSize={11} />
                <PolarRadiusAxis domain={[0, 10]} fontSize={10} />
                {previousTest && (
                  <Radar dataKey="previous" stroke="#d1d5db" fill="#d1d5db" fillOpacity={0.2} name="Previous" />
                )}
                <Radar dataKey="current" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.3} name="Current" />
                <Tooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-16">No skill tests recorded</p>
          )}
        </div>

        {/* Progress Line Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold mb-4">Skill Progress Over Time</h2>
          {playerTests.length > 1 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={progressData}>
                <XAxis dataKey="date" fontSize={11} />
                <YAxis domain={[0, 10]} fontSize={11} />
                <Tooltip />
                <Legend />
                {SKILL_NAMES.map((skill) => (
                  <Line
                    key={skill}
                    type="monotone"
                    dataKey={SKILL_LABELS[skill]}
                    stroke={SKILL_COLORS[skill]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-16">Need at least 2 tests to show progress</p>
          )}
        </div>
      </div>

      {/* Skill Breakdown */}
      {latestTest && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold mb-4">Current Skill Breakdown</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SKILL_NAMES.map((skill) => {
              const val = latestTest.scores[skill];
              const prevVal = previousTest?.scores[skill];
              const diff = prevVal !== undefined ? val - prevVal : 0;
              return (
                <div key={skill} className="p-4 rounded-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{SKILL_LABELS[skill]}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold" style={{ color: SKILL_COLORS[skill] }}>{val}</span>
                      <span className="text-xs text-gray-400">/10</span>
                      {diff !== 0 && (
                        <span className={`text-xs font-medium ml-1 ${diff > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {diff > 0 ? '↑' : '↓'}{Math.abs(diff)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-100 rounded-full h-3">
                    <div className="h-3 rounded-full transition-all" style={{ width: `${val * 10}%`, backgroundColor: SKILL_COLORS[skill] }} />
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
