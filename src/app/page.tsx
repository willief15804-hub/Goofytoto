'use client';

import { useState } from 'react';
import { useInitialize, useForceUpdate } from '@/hooks/useLocalStorage';
import { store } from '@/lib/store';
import { buildPhases, SKILL_CATEGORIES, overallAverage, categoryAverage } from '@/lib/types';
import Link from 'next/link';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import Modal from '@/components/Modal';

export default function Dashboard() {
  const ready = useInitialize();
  const refresh = useForceUpdate();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!ready) return <LoadingSkeleton />;

  const players = store.getPlayers();
  const practices = store.getPractices();
  const skillTests = store.getSkillTests();
  const calendar = store.getCalendar();
  const sessions = store.getSessions();
  const settings = store.getSettings();
  const phases = buildPhases(settings.phaseWeeks);

  const hasTournament = !!settings.tournamentName;
  const hasData = players.length > 0 || sessions.length > 0;

  // Current week & phase — computed from training start date
  const now = new Date();
  let currentWeekNum = 0;
  if (settings.trainingStartDate) {
    const start = new Date(settings.trainingStartDate);
    const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0) currentWeekNum = Math.floor(diffDays / 7) + 1;
  } else {
    const idx = calendar.findIndex((w) => {
      const start = new Date(w.startDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      return now >= start && now < end;
    });
    if (idx >= 0) currentWeekNum = calendar[idx].weekNumber;
  }

  const currentWeek = calendar.find((w) => w.weekNumber === currentWeekNum);
  const currentPhase = phases.find((p) => currentWeekNum >= p.weeks[0] && currentWeekNum <= p.weeks[1]);

  // Next session
  const nextSession = sessions
    .filter((s) => !s.completed && new Date(s.date) >= now)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  // Tournament countdown — from settings or fallback
  const tournamentDate = settings.tournamentDate || '';
  const daysToTournament = tournamentDate
    ? Math.max(0, Math.ceil((new Date(tournamentDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Attendance stats
  const totalPractices = practices.length;
  const teamAttendanceRate = totalPractices > 0 && players.length > 0
    ? Math.round((practices.reduce((sum, p) => sum + p.attendees.length, 0) / (totalPractices * players.length)) * 100)
    : 0;

  // Session progress
  const completedSessions = sessions.filter((s) => s.completed).length;
  const sessionProgress = sessions.length > 0 ? Math.round((completedSessions / sessions.length) * 100) : 0;

  // Most improved players
  const improvements = players.map((player) => {
    const tests = skillTests.filter((t) => t.playerId === player.id).sort((a, b) => a.date.localeCompare(b.date));
    if (tests.length < 2) return { player, improvement: 0 };
    const first = overallAverage(tests[0].scores);
    const latest = overallAverage(tests[tests.length - 1].scores);
    return { player, improvement: latest - first };
  }).filter((x) => x.improvement > 0).sort((a, b) => b.improvement - a.improvement);

  // Team radar
  const teamRadar = SKILL_CATEGORIES.map((cat) => {
    const latestScores = players.map((p) => {
      const tests = skillTests.filter((t) => t.playerId === p.id).sort((a, b) => b.date.localeCompare(a.date));
      return tests[0] ? categoryAverage(tests[0].scores, cat) : null;
    }).filter((v): v is number => v !== null);
    const avg = latestScores.length > 0 ? latestScores.reduce((a, b) => a + b, 0) / latestScores.length : 0;
    return { skill: cat.label, value: Math.round(avg * 10) / 10 };
  });

  function doReset() {
    store.resetAll();
    setShowResetConfirm(false);
    window.location.reload();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {hasData && (
          <button onClick={() => setShowResetConfirm(true)}
            className="text-sm text-gray-500 hover:text-red-500 transition-colors">Reset Data</button>
        )}
      </div>

      {/* Reset Confirm */}
      <Modal open={showResetConfirm} onClose={() => setShowResetConfirm(false)} title="Reset All Data"
        footer={
          <div className="flex gap-3">
            <button onClick={doReset} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700">Reset Everything</button>
            <button onClick={() => setShowResetConfirm(false)} className="flex-1 border border-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          </div>
        }>
        <p className="text-sm text-gray-600">This will permanently delete <strong>all data</strong> including players, sessions, evaluations, and settings. This cannot be undone.</p>
      </Modal>

      {/* Welcome Flow — no tournament set up */}
      {!hasTournament && !hasData && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-4xl mb-3">🥏</p>
          <p className="text-xl font-semibold text-gray-700 mb-2">Welcome to UF Club Tracker!</p>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">Set up your first tournament to get started. Configure your schedule, add players, and begin tracking your team.</p>
          <Link href="/settings" className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
            Setup Tournament
          </Link>
        </div>
      )}

      {/* Getting started when tournament configured but no player/session data */}
      {hasTournament && !hasData && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-xl font-semibold text-gray-700 mb-2">{settings.tournamentName}</p>
          <p className="text-sm text-gray-500 mb-6">Tournament configured! Now add players and create training sessions.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
            <Link href="/players" className="bg-purple-50 rounded-xl p-4 hover:bg-purple-100 transition-colors">
              <p className="text-2xl mb-1">👥</p>
              <p className="text-sm font-semibold text-purple-700">Add Players</p>
            </Link>
            <Link href="/attendance" className="bg-purple-50 rounded-xl p-4 hover:bg-purple-100 transition-colors">
              <p className="text-2xl mb-1">📋</p>
              <p className="text-sm font-semibold text-purple-700">Create Sessions</p>
            </Link>
            <Link href="/calendar" className="bg-purple-50 rounded-xl p-4 hover:bg-purple-100 transition-colors">
              <p className="text-2xl mb-1">📅</p>
              <p className="text-sm font-semibold text-purple-700">Build Schedule</p>
            </Link>
          </div>
        </div>
      )}

      {/* Top Row Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase font-semibold">Current Phase</p>
          {currentPhase ? (
            <>
              <p className="text-lg font-bold mt-1" style={{ color: currentPhase.color }}>{currentPhase.name}</p>
              <p className="text-xs text-gray-500 mt-1">{currentPhase.description}</p>
            </>
          ) : (
            <p className="text-lg font-bold mt-1 text-gray-400">—</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase font-semibold">Current Week</p>
          {currentWeek ? (
            <>
              <p className="text-lg font-bold mt-1">Week {currentWeek.weekNumber}</p>
              <p className="text-xs text-gray-500 mt-1">{currentWeek.focus}</p>
            </>
          ) : currentWeekNum > 0 ? (
            <p className="text-lg font-bold mt-1">Week {currentWeekNum}</p>
          ) : (
            <p className="text-lg font-bold mt-1 text-gray-400">—</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase font-semibold">Next Session</p>
          {nextSession ? (
            <>
              <p className="text-lg font-bold mt-1">{nextSession.day}, W{nextSession.weekNumber}</p>
              <p className="text-xs text-gray-500 mt-1">{nextSession.focus.slice(0, 30)}</p>
            </>
          ) : (
            <p className="text-lg font-bold mt-1 text-gray-400">{sessions.length > 0 ? 'All done!' : '—'}</p>
          )}
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-4 text-white">
          <p className="text-xs uppercase font-semibold opacity-80">
            {settings.tournamentName || 'Tournament'}
          </p>
          {tournamentDate ? (
            <>
              <p className="text-3xl font-bold mt-1">{daysToTournament}</p>
              <p className="text-xs opacity-80 mt-1">days until {new Date(tournamentDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </>
          ) : (
            <>
              <p className="text-lg font-bold mt-1 opacity-80">Not set</p>
              <Link href="/settings" className="text-xs underline opacity-80 hover:opacity-100">Configure in Settings</Link>
            </>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Players" value={players.length} icon="👥" />
        <StatCard label="Sessions Done" value={sessions.length > 0 ? `${completedSessions}/${sessions.length}` : '0'} icon="📋" sub={sessions.length > 0 ? `${sessionProgress}%` : undefined} />
        <StatCard label="Team Attendance" value={`${teamAttendanceRate}%`} icon="✅" />
        <StatCard label="Evaluations" value={skillTests.length} icon="🎯" />
      </div>

      {/* Training Progress Bar */}
      {sessions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold">Training Progress</p>
            <p className="text-sm text-gray-500">{sessionProgress}%</p>
          </div>
          <div className="flex gap-0.5 h-3 rounded-full overflow-hidden">
            {phases.map((phase) => {
              const phaseSessions = sessions.filter((s) => s.weekNumber >= phase.weeks[0] && s.weekNumber <= phase.weeks[1]);
              const phaseCompleted = phaseSessions.filter((s) => s.completed).length;
              const phasePct = (phaseSessions.length / sessions.length) * 100;
              const completePct = phaseSessions.length > 0 ? (phaseCompleted / phaseSessions.length) : 0;
              return (
                <div key={phase.id} className="relative" style={{ width: `${phasePct}%` }}>
                  <div className="h-3 rounded-sm" style={{ backgroundColor: phase.color + '30' }} />
                  <div className="absolute top-0 left-0 h-3 rounded-sm transition-all" style={{ width: `${completePct * 100}%`, backgroundColor: phase.color }} />
                </div>
              );
            })}
          </div>
          <div className="flex gap-0.5 mt-1">
            {phases.map((phase) => (
              <div key={phase.id} className="flex-1 text-center">
                <p className="text-[9px] font-medium" style={{ color: phase.color }}>{phase.name.split(' ')[0]}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Middle Row: Radar + Most Improved */}
      {skillTests.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-semibold mb-4">Team Skill Overview</h2>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={teamRadar}>
                <PolarGrid />
                <PolarAngleAxis dataKey="skill" fontSize={11} />
                <PolarRadiusAxis domain={[0, 10]} fontSize={10} />
                <Radar dataKey="value" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.3} name="Team Average" />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-semibold mb-4">Top 5 Most Improved</h2>
            {improvements.length > 0 ? (
              <div className="space-y-3">
                {improvements.slice(0, 5).map(({ player, improvement }, i) => {
                  const tests = skillTests.filter((t) => t.playerId === player.id).sort((a, b) => b.date.localeCompare(a.date));
                  const latest = tests[0];
                  return (
                    <Link key={player.id} href={`/players/${player.id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <span className="text-lg font-bold text-gray-400 w-6">#{i + 1}</span>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                        style={{ backgroundColor: player.avatarColor }}>{player.name.charAt(0)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{player.name}</p>
                        <p className="text-xs text-gray-500">{player.position} · Level {player.skillLevel}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-purple-700">{latest ? overallAverage(latest.scores).toFixed(1) : '—'}</span>
                        <p className="text-xs font-bold text-green-600">+{improvement.toFixed(1)}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">Need 2+ evaluations per player</p>
            )}
            <Link href="/skills" className="inline-block mt-3 text-sm text-purple-600 hover:text-purple-800">View all evaluations →</Link>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: '/calendar', label: 'Training Schedule', icon: '📅', desc: `${settings.phaseWeeks.reduce((a, b) => a + b, 0)}-week plan` },
          { href: '/attendance', label: 'Attendance', icon: '✅', desc: 'Record & track' },
          { href: '/skills', label: 'Skill Evaluation', icon: '🎯', desc: '19 sub-skills' },
          { href: '/players', label: 'Players', icon: '👥', desc: `${players.length} players` },
        ].map((link) => (
          <Link key={link.href} href={link.href}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow group">
            <span className="text-2xl">{link.icon}</span>
            <p className="font-semibold text-sm mt-2 group-hover:text-purple-700 transition-colors">{link.label}</p>
            <p className="text-xs text-gray-500">{link.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, sub }: { label: string; value: string | number; icon: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4 bg-white">
      <span className="text-2xl">{icon}</span>
      <p className="text-2xl font-bold mt-2">{value}</p>
      <div className="flex items-center gap-1">
        <p className="text-sm text-gray-500">{label}</p>
        {sub && <span className="text-xs text-purple-600 font-medium">({sub})</span>}
      </div>
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
