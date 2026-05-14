'use client';

import { useInitialize, useForceUpdate } from '@/hooks/useLocalStorage';
import { store } from '@/lib/store';
import { SKILL_NAMES, SKILL_LABELS } from '@/lib/types';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

export default function Dashboard() {
  const ready = useInitialize();
  useForceUpdate();

  if (!ready) return <LoadingSkeleton />;

  const players = store.getPlayers();
  const practices = store.getPractices();
  const skillTests = store.getSkillTests();
  const calendar = store.getCalendar();

  const totalPractices = practices.length;
  const avgAttendance = totalPractices > 0
    ? Math.round(practices.reduce((sum, p) => sum + p.attendees.length, 0) / totalPractices)
    : 0;
  const attendanceRate = totalPractices > 0 && players.length > 0
    ? Math.round((practices.reduce((sum, p) => sum + p.attendees.length, 0) / (totalPractices * players.length)) * 100)
    : 0;

  const currentWeek = calendar.find((w) => {
    const start = new Date(w.startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const now = new Date();
    return now >= start && now < end;
  }) || calendar[calendar.length - 1];

  const latestTests = players.map((player) => {
    const tests = skillTests.filter((t) => t.playerId === player.id).sort((a, b) => b.date.localeCompare(a.date));
    return { player, latestTest: tests[0] || null };
  });

  const teamAvgSkills = SKILL_NAMES.map((skill) => {
    const latestScores = latestTests
      .filter((t) => t.latestTest)
      .map((t) => t.latestTest!.scores[skill]);
    const avg = latestScores.length > 0
      ? latestScores.reduce((a, b) => a + b, 0) / latestScores.length
      : 0;
    return { skill: SKILL_LABELS[skill], value: Math.round(avg * 10) / 10 };
  });

  const attendanceByPractice = practices.slice(-8).map((p) => ({
    date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    count: p.attendees.length,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button
          onClick={() => { store.resetAll(); window.location.reload(); }}
          className="text-sm text-gray-500 hover:text-red-500 transition-colors"
        >
          Reset Data
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Players" value={players.length} icon="👥" />
        <StatCard label="Practices" value={totalPractices} icon="🏃" />
        <StatCard label="Avg Attendance" value={avgAttendance} icon="✅" />
        <StatCard label="Attendance Rate" value={`${attendanceRate}%`} icon="📈" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold mb-4">Attendance Trend</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={attendanceByPractice}>
              <XAxis dataKey="date" fontSize={12} />
              <YAxis domain={[0, players.length]} fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Attendees" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold mb-4">Team Skill Averages</h2>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={teamAvgSkills}>
              <PolarGrid />
              <PolarAngleAxis dataKey="skill" fontSize={11} />
              <PolarRadiusAxis domain={[0, 10]} fontSize={10} />
              <Radar dataKey="value" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.3} name="Team Average" />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {currentWeek && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Current Week</h2>
              <span className="text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                Week {currentWeek.weekNumber}
              </span>
            </div>
            <p className="text-xl font-bold text-purple-700 mb-2">{currentWeek.focus}</p>
            <p className="text-sm text-gray-500 mb-3">{currentWeek.notes}</p>
            <div className="space-y-1">
              {currentWeek.drills.map((drill, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full shrink-0" />
                  {drill}
                </div>
              ))}
            </div>
            <Link href="/calendar" className="inline-block mt-3 text-sm text-purple-600 hover:text-purple-800">
              View full calendar →
            </Link>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold mb-3">Top Performers</h2>
          <div className="space-y-3">
            {latestTests
              .filter((t) => t.latestTest)
              .sort((a, b) => {
                const avgA = Object.values(a.latestTest!.scores).reduce((s, v) => s + v, 0) / 6;
                const avgB = Object.values(b.latestTest!.scores).reduce((s, v) => s + v, 0) / 6;
                return avgB - avgA;
              })
              .slice(0, 5)
              .map(({ player, latestTest }, i) => {
                const avg = Object.values(latestTest!.scores).reduce((s, v) => s + v, 0) / 6;
                return (
                  <Link
                    key={player.id}
                    href={`/players/${player.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-lg font-bold text-gray-400 w-6">#{i + 1}</span>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{ backgroundColor: player.avatarColor }}
                    >
                      {player.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{player.name}</p>
                      <p className="text-xs text-gray-500">{player.position}</p>
                    </div>
                    <span className="text-sm font-semibold text-purple-700">{avg.toFixed(1)}</span>
                  </Link>
                );
              })}
          </div>
          <Link href="/players" className="inline-block mt-3 text-sm text-purple-600 hover:text-purple-800">
            View all players →
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4 bg-white">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold mt-2">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-40" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-72 bg-gray-200 rounded-xl" />
        <div className="h-72 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}
