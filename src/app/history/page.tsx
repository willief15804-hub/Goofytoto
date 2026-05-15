'use client';

import { useState } from 'react';
import { useInitialize, useForceUpdate } from '@/hooks/useLocalStorage';
import { store } from '@/lib/store';
import { SKILL_CATEGORIES, categoryAverage, overallAverage, buildPhases } from '@/lib/types';
import type { ArchivedTournament } from '@/lib/types';
import Modal from '@/components/Modal';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts';

export default function HistoryPage() {
  const ready = useInitialize();
  const refresh = useForceUpdate();
  const [viewId, setViewId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (!ready) return <div className="animate-pulse h-96 rounded-2xl" style={{ backgroundColor: 'var(--accent-pink)', opacity: 0.1 }} />;

  const archives = store.getArchives();
  const viewing = archives.find((a) => a.id === viewId);

  function confirmDelete() {
    if (!deleteId) return;
    store.deleteArchive(deleteId);
    setDeleteId(null);
    if (viewId === deleteId) setViewId(null);
    refresh();
  }

  if (archives.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-heading font-extrabold animate-fade-in-up" style={{ color: 'var(--dark)' }}>Tournament History</h1>
        <div className="card p-12 text-center animate-fade-in-up">
          <p className="text-5xl mb-4">🏆</p>
          <p className="text-xl font-heading font-extrabold mb-2" style={{ color: 'var(--dark)' }}>No archived tournaments</p>
          <p className="text-sm text-[var(--text-secondary)]">Archive your current tournament from Settings to see it here.</p>
        </div>
      </div>
    );
  }

  if (viewing) {
    const phases = buildPhases(viewing.settings.phaseWeeks);
    const teamRadar = SKILL_CATEGORIES.map((cat) => {
      const latestScores = viewing.players.map((p) => {
        const tests = viewing.skillTests.filter((t) => t.playerId === p.id).sort((a, b) => b.date.localeCompare(a.date));
        return tests[0] ? categoryAverage(tests[0].scores, cat) : null;
      }).filter((v): v is number => v !== null);
      const avg = latestScores.length > 0 ? latestScores.reduce((a, b) => a + b, 0) / latestScores.length : 0;
      return { skill: cat.label, value: Math.round(avg * 10) / 10 };
    });

    return (
      <div className="space-y-6 stagger-children">
        <button onClick={() => setViewId(null)} className="text-sm font-bold inline-flex items-center gap-1 animate-fade-in-up" style={{ color: 'var(--secondary)' }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back to History
        </button>
        <div className="flex items-center justify-between animate-fade-in-up">
          <h1 className="text-3xl font-heading font-extrabold" style={{ color: 'var(--dark)' }}>{viewing.settings.tournamentName || 'Untitled Tournament'}</h1>
          <span className="text-sm text-[var(--text-secondary)] font-medium">Archived {new Date(viewing.archivedAt).toLocaleDateString()}</span>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 animate-fade-in-up">
          {[
            { label: 'Players', value: viewing.summary.playerCount, color: 'var(--primary)' },
            { label: 'Sessions', value: `${viewing.summary.completedSessions}/${viewing.summary.totalSessions}`, color: 'var(--secondary)' },
            { label: 'Attendance', value: `${viewing.summary.avgAttendanceRate}%`, color: 'var(--accent-pink)' },
            { label: 'Evaluations', value: viewing.summary.totalEvaluations, color: 'var(--accent-blue)' },
            { label: 'Tournament', value: viewing.settings.tournamentDate ? new Date(viewing.settings.tournamentDate).toLocaleDateString() : '—', color: 'var(--dark)' },
          ].map((card) => (
            <div key={card.label} className="card-flat p-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-12 h-12 rounded-full opacity-10 -mr-3 -mt-3" style={{ backgroundColor: card.color }} />
              <p className="text-2xl font-extrabold stat-number" style={{ color: 'var(--dark)' }}>{card.value}</p>
              <p className="text-[10px] text-[var(--text-secondary)] uppercase font-bold tracking-wide">{card.label}</p>
              <div className="h-1 w-8 rounded-full mt-1.5" style={{ backgroundColor: card.color }} />
            </div>
          ))}
        </div>

        {/* Team Radar */}
        {viewing.skillTests.length > 0 && (
          <div className="card-flat p-5 animate-fade-in-up">
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
        )}

        {/* Phase Progress */}
        {phases.length > 0 && viewing.sessions.length > 0 && (
          <div className="card-flat p-5 animate-fade-in-up">
            <h2 className="text-lg font-heading font-bold mb-3" style={{ color: 'var(--dark)' }}>Phase Progress</h2>
            <div className="flex gap-1.5">
              {phases.map((phase) => {
                const phaseSessions = viewing.sessions.filter((s) => s.weekNumber >= phase.weeks[0] && s.weekNumber <= phase.weeks[1]);
                const phaseCompleted = phaseSessions.filter((s) => s.completed).length;
                const pct = phaseSessions.length > 0 ? Math.round((phaseCompleted / phaseSessions.length) * 100) : 0;
                return (
                  <div key={phase.id} className="flex-1 rounded-xl p-3 text-center" style={{ backgroundColor: phase.color + '15' }}>
                    <p className="text-[10px] font-extrabold" style={{ color: phase.color }}>{phase.name}</p>
                    <p className="text-xl font-extrabold stat-number mt-1" style={{ color: phase.color }}>{pct}%</p>
                    <p className="text-[10px] text-[var(--text-secondary)] font-bold">{phaseCompleted}/{phaseSessions.length}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Players */}
        <div className="card-flat p-5 animate-fade-in-up">
          <h2 className="text-lg font-heading font-bold mb-3" style={{ color: 'var(--dark)' }}>Players ({viewing.players.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {viewing.players.map((p) => {
              const attended = viewing.practices.filter((pr) => pr.attendees.includes(p.id)).length;
              const rate = viewing.practices.length > 0 ? Math.round((attended / viewing.practices.length) * 100) : 0;
              const tests = viewing.skillTests.filter((t) => t.playerId === p.id).sort((a, b) => b.date.localeCompare(a.date));
              const avg = tests[0] ? overallAverage(tests[0].scores).toFixed(1) : '—';
              return (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ border: '1px solid var(--background)' }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ backgroundColor: p.avatarColor }}>{p.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: 'var(--dark)' }}>{p.name} <span className="text-[var(--text-secondary)]">#{p.jerseyNumber}</span></p>
                    <p className="text-xs text-[var(--text-secondary)]">{p.position} · {p.skillLevel} · Att: {rate}% · Skill: {avg}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 stagger-children">
      <h1 className="text-3xl font-heading font-extrabold animate-fade-in-up" style={{ color: 'var(--dark)' }}>Tournament History</h1>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Archive"
        footer={<div className="flex gap-3"><button onClick={confirmDelete} className="flex-1 btn-danger">Delete</button><button onClick={() => setDeleteId(null)} className="flex-1 btn-secondary">Cancel</button></div>}>
        <p className="text-sm text-[var(--text-secondary)]">Are you sure you want to permanently delete this archived tournament?</p>
      </Modal>

      <div className="space-y-4">
        {archives.sort((a, b) => b.archivedAt.localeCompare(a.archivedAt)).map((arch, idx) => (
          <div key={arch.id} className="card p-5 animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="font-heading font-extrabold text-lg" style={{ color: 'var(--dark)' }}>{arch.settings.tournamentName || 'Untitled Tournament'}</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Archived {new Date(arch.archivedAt).toLocaleDateString()} · Tournament: {arch.settings.tournamentDate ? new Date(arch.settings.tournamentDate).toLocaleDateString() : '—'}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setViewId(arch.id)} className="btn-primary text-sm">View Details</button>
                <button onClick={() => setDeleteId(arch.id)} className="text-sm text-[var(--text-secondary)] hover:text-[var(--danger)] px-2 py-2">🗑️</button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-4">
              {[
                { label: 'Players', value: arch.summary.playerCount },
                { label: 'Sessions', value: `${arch.summary.completedSessions}/${arch.summary.totalSessions}` },
                { label: 'Attendance', value: `${arch.summary.avgAttendanceRate}%` },
                { label: 'Evaluations', value: arch.summary.totalEvaluations },
                { label: 'Weeks', value: arch.settings.phaseWeeks.reduce((a: number, b: number) => a + b, 0) },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-xl font-extrabold stat-number" style={{ color: 'var(--dark)' }}>{stat.value}</p>
                  <p className="text-[10px] text-[var(--text-secondary)] uppercase font-bold tracking-wide">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
