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

  const nextSession = sessions
    .filter((s) => !s.completed && new Date(s.date) >= now)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  const tournamentDate = settings.tournamentDate || '';
  const daysToTournament = tournamentDate
    ? Math.max(0, Math.ceil((new Date(tournamentDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const totalPractices = practices.length;
  const teamAttendanceRate = totalPractices > 0 && players.length > 0
    ? Math.round((practices.reduce((sum, p) => sum + p.attendees.length, 0) / (totalPractices * players.length)) * 100)
    : 0;

  const completedSessions = sessions.filter((s) => s.completed).length;
  const sessionProgress = sessions.length > 0 ? Math.round((completedSessions / sessions.length) * 100) : 0;

  const improvements = players.map((player) => {
    const tests = skillTests.filter((t) => t.playerId === player.id).sort((a, b) => a.date.localeCompare(b.date));
    if (tests.length < 2) return { player, improvement: 0 };
    const first = overallAverage(tests[0].scores);
    const latest = overallAverage(tests[tests.length - 1].scores);
    return { player, improvement: latest - first };
  }).filter((x) => x.improvement > 0).sort((a, b) => b.improvement - a.improvement);

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
    <div className="space-y-6 stagger-children">
      <div className="flex items-center justify-between animate-fade-in-up">
        <h1 className="text-3xl font-heading font-extrabold" style={{ color: 'var(--dark)' }}>Dashboard</h1>
        {hasData && (
          <button onClick={() => setShowResetConfirm(true)}
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--danger)] transition-colors">Reset Data</button>
        )}
      </div>

      <Modal open={showResetConfirm} onClose={() => setShowResetConfirm(false)} title="Reset All Data"
        footer={
          <div className="flex gap-3">
            <button onClick={doReset} className="flex-1 btn-danger">Reset Everything</button>
            <button onClick={() => setShowResetConfirm(false)} className="flex-1 btn-secondary">Cancel</button>
          </div>
        }>
        <p className="text-sm text-[var(--text-secondary)]">This will permanently delete <strong>all data</strong> including players, sessions, evaluations, and settings. This cannot be undone.</p>
      </Modal>

      {/* Welcome Flow */}
      {!hasTournament && !hasData && (
        <div className="card p-8 text-center animate-fade-in-up">
          <p className="text-5xl mb-4">🥏</p>
          <p className="text-2xl font-heading font-extrabold mb-2" style={{ color: 'var(--dark)' }}>Welcome to UF Club Tracker!</p>
          <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-md mx-auto">Set up your first tournament to get started. Configure your schedule, add players, and begin tracking your team.</p>
          <Link href="/settings" className="btn-primary inline-block text-base px-8 py-3">
            Setup Tournament
          </Link>
        </div>
      )}

      {/* Getting started */}
      {hasTournament && !hasData && (
        <div className="card p-8 text-center animate-fade-in-up">
          <p className="text-xl font-heading font-bold mb-2" style={{ color: 'var(--dark)' }}>{settings.tournamentName}</p>
          <p className="text-sm text-[var(--text-secondary)] mb-6">Tournament configured! Now add players and create training sessions.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
            <Link href="/players" className="card-interactive p-5 text-center">
              <p className="text-3xl mb-2">👥</p>
              <p className="text-sm font-heading font-bold" style={{ color: 'var(--dark)' }}>Add Players</p>
            </Link>
            <Link href="/attendance" className="card-interactive p-5 text-center">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-sm font-heading font-bold" style={{ color: 'var(--dark)' }}>Create Sessions</p>
            </Link>
            <Link href="/calendar" className="card-interactive p-5 text-center">
              <p className="text-3xl mb-2">📅</p>
              <p className="text-sm font-heading font-bold" style={{ color: 'var(--dark)' }}>Build Schedule</p>
            </Link>
          </div>
        </div>
      )}

      {/* Hero Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
        {/* Current Phase */}
        <div className="card-flat p-5" style={{ background: currentPhase ? currentPhase.color + '20' : 'var(--card-bg)' }}>
          <p className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-secondary)]">Current Phase</p>
          {currentPhase ? (
            <>
              <p className="text-lg font-heading font-extrabold mt-1" style={{ color: currentPhase.color }}>{currentPhase.name}</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">{currentPhase.description}</p>
            </>
          ) : (
            <p className="text-lg font-bold mt-1 text-gray-300">—</p>
          )}
        </div>

        {/* Current Week — lime bg */}
        <div className="card-flat p-5 gradient-lime">
          <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--dark)', opacity: 0.6 }}>Current Week</p>
          {currentWeek ? (
            <>
              <p className="text-2xl font-heading font-extrabold mt-1 stat-number" style={{ color: 'var(--dark)' }}>Week {currentWeek.weekNumber}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--dark)', opacity: 0.7 }}>{currentWeek.focus}</p>
            </>
          ) : currentWeekNum > 0 ? (
            <p className="text-2xl font-heading font-extrabold mt-1 stat-number" style={{ color: 'var(--dark)' }}>Week {currentWeekNum}</p>
          ) : (
            <p className="text-lg font-bold mt-1" style={{ color: 'var(--dark)', opacity: 0.4 }}>—</p>
          )}
        </div>

        {/* Next Session — teal bg */}
        <div className="card-flat p-5 gradient-teal">
          <p className="text-[10px] uppercase font-bold tracking-wider text-white/60">Next Session</p>
          {nextSession ? (
            <>
              <p className="text-lg font-heading font-extrabold mt-1 text-white">{nextSession.day}, W{nextSession.weekNumber}</p>
              <p className="text-xs text-white/70 mt-1">{nextSession.focus.slice(0, 30)}</p>
            </>
          ) : (
            <p className="text-lg font-bold mt-1 text-white/50">{sessions.length > 0 ? 'All done!' : '—'}</p>
          )}
        </div>

        {/* Tournament Countdown — navy bg */}
        <div className="card-flat p-5 gradient-navy">
          <p className="text-[10px] uppercase font-bold tracking-wider text-white/60">
            {settings.tournamentName || 'Tournament'}
          </p>
          {tournamentDate ? (
            <>
              <p className="text-4xl font-heading font-extrabold mt-1 text-white stat-number animate-count-up">{daysToTournament}</p>
              <p className="text-xs text-white/60 mt-1">days until {new Date(tournamentDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </>
          ) : (
            <>
              <p className="text-lg font-bold mt-1 text-white/50">Not set</p>
              <Link href="/settings" className="text-xs underline text-white/60 hover:text-white/80">Configure in Settings</Link>
            </>
          )}
        </div>
      </div>

      {/* Stats Row — each card different color */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
        <StatCard label="Players" value={players.length} color="var(--primary)" />
        <StatCard label="Sessions Done" value={sessions.length > 0 ? `${completedSessions}/${sessions.length}` : '0'} sub={sessions.length > 0 ? `${sessionProgress}%` : undefined} color="var(--secondary)" />
        <StatCard label="Team Attendance" value={`${teamAttendanceRate}%`} color="var(--accent-pink)" />
        <StatCard label="Evaluations" value={skillTests.length} color="var(--accent-blue)" />
      </div>

      {/* Training Progress Bar */}
      {sessions.length > 0 && (
        <div className="card-flat p-5 animate-fade-in-up">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-heading font-bold" style={{ color: 'var(--dark)' }}>Training Progress</p>
            <p className="text-sm stat-number" style={{ color: 'var(--text-secondary)' }}>{sessionProgress}%</p>
          </div>
          <div className="flex gap-0.5 h-3.5 rounded-full overflow-hidden">
            {phases.map((phase) => {
              const phaseSessions = sessions.filter((s) => s.weekNumber >= phase.weeks[0] && s.weekNumber <= phase.weeks[1]);
              const phaseCompleted = phaseSessions.filter((s) => s.completed).length;
              const phasePct = (phaseSessions.length / sessions.length) * 100;
              const completePct = phaseSessions.length > 0 ? (phaseCompleted / phaseSessions.length) : 0;
              return (
                <div key={phase.id} className="relative" style={{ width: `${phasePct}%` }}>
                  <div className="h-3.5 rounded-sm" style={{ backgroundColor: phase.color + '30' }} />
                  <div className="absolute top-0 left-0 h-3.5 rounded-sm animate-progress" style={{ width: `${completePct * 100}%`, backgroundColor: phase.color }} />
                </div>
              );
            })}
          </div>
          <div className="flex gap-0.5 mt-1.5">
            {phases.map((phase) => (
              <div key={phase.id} className="flex-1 text-center">
                <p className="text-[9px] font-bold" style={{ color: phase.color }}>{phase.name.split(' ')[0]}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Middle Row: Radar + Most Improved */}
      {skillTests.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up">
          <div className="card-flat p-5">
            <h2 className="text-lg font-heading font-bold mb-4" style={{ color: 'var(--dark)' }}>Team Skill Overview</h2>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={teamRadar}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="skill" fontSize={11} tick={{ fill: 'var(--text-secondary)' }} />
                <PolarRadiusAxis domain={[0, 10]} fontSize={10} />
                <Radar dataKey="value" stroke="var(--secondary)" fill="var(--secondary)" fillOpacity={0.3} name="Team Average" />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="card-flat p-5">
            <h2 className="text-lg font-heading font-bold mb-4" style={{ color: 'var(--dark)' }}>Top 5 Most Improved</h2>
            {improvements.length > 0 ? (
              <div className="space-y-3">
                {improvements.slice(0, 5).map(({ player, improvement }, i) => {
                  const tests = skillTests.filter((t) => t.playerId === player.id).sort((a, b) => b.date.localeCompare(a.date));
                  const latest = tests[0];
                  return (
                    <Link key={player.id} href={`/players/${player.id}`}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-black/5 transition-colors">
                      <span className="text-lg font-heading font-extrabold text-gray-300 w-6">#{i + 1}</span>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ring-2 ring-white shadow-sm"
                        style={{ backgroundColor: player.avatarColor }}>{player.name.charAt(0)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-heading font-bold text-sm truncate" style={{ color: 'var(--dark)' }}>{player.name}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{player.position} · Level {player.skillLevel}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold stat-number" style={{ color: 'var(--secondary)' }}>{latest ? overallAverage(latest.scores).toFixed(1) : '—'}</span>
                        <p className="text-xs font-bold text-[var(--success)]">+{improvement.toFixed(1)}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-[var(--text-secondary)] text-center py-8">Need 2+ evaluations per player</p>
            )}
            <Link href="/skills" className="inline-block mt-3 text-sm font-bold hover:opacity-80 transition-opacity" style={{ color: 'var(--secondary)' }}>View all evaluations →</Link>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up">
        {[
          { href: '/calendar', label: 'Training Schedule', icon: '📅', desc: `${settings.phaseWeeks.reduce((a, b) => a + b, 0)}-week plan`, gradient: 'gradient-lime' },
          { href: '/attendance', label: 'Attendance', icon: '✅', desc: 'Record & track', gradient: 'gradient-teal' },
          { href: '/skills', label: 'Skill Evaluation', icon: '🎯', desc: '19 sub-skills', gradient: 'gradient-pink' },
          { href: '/players', label: 'Players', icon: '👥', desc: `${players.length} players`, gradient: 'gradient-navy' },
        ].map((link) => (
          <Link key={link.href} href={link.href} className="card-interactive p-5 group">
            <div className={`w-10 h-10 rounded-xl ${link.gradient} flex items-center justify-center text-xl mb-3`}>
              {link.icon}
            </div>
            <p className="font-heading font-bold text-sm" style={{ color: 'var(--dark)' }}>{link.label}</p>
            <p className="text-xs text-[var(--text-secondary)]">{link.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="card-flat p-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-10 -mr-4 -mt-4" style={{ backgroundColor: color }} />
      <p className="text-3xl font-extrabold stat-number animate-count-up" style={{ color: 'var(--dark)' }}>{value}</p>
      <div className="flex items-center gap-1.5 mt-1">
        <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">{label}</p>
        {sub && <span className="text-xs font-bold" style={{ color }}>({sub})</span>}
      </div>
      <div className="h-1 w-12 rounded-full mt-2" style={{ backgroundColor: color }} />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 rounded-xl w-40" style={{ backgroundColor: 'var(--primary)', opacity: 0.3 }} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 rounded-2xl" style={{ backgroundColor: 'var(--primary)', opacity: 0.1 }} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-72 rounded-2xl" style={{ backgroundColor: 'var(--secondary)', opacity: 0.1 }} />
        <div className="h-72 rounded-2xl" style={{ backgroundColor: 'var(--accent-pink)', opacity: 0.1 }} />
      </div>
    </div>
  );
}
