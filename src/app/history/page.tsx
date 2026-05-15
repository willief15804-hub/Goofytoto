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

  if (!ready) return <div className="animate-pulse h-96 bg-gray-200 rounded-xl" />;

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
        <h1 className="text-2xl font-bold">Tournament History</h1>
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-4xl mb-3">🏆</p>
          <p className="text-lg font-semibold text-gray-700 mb-1">No archived tournaments</p>
          <p className="text-sm text-gray-500">Archive your current tournament from Settings to see it here.</p>
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
      <div className="space-y-6">
        <button onClick={() => setViewId(null)} className="text-sm text-purple-600 hover:text-purple-800">← Back to History</button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{viewing.settings.tournamentName || 'Untitled Tournament'}</h1>
          <span className="text-sm text-gray-500">Archived {new Date(viewing.archivedAt).toLocaleDateString()}</span>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <SummaryCard label="Players" value={viewing.summary.playerCount} />
          <SummaryCard label="Sessions" value={`${viewing.summary.completedSessions}/${viewing.summary.totalSessions}`} />
          <SummaryCard label="Attendance" value={`${viewing.summary.avgAttendanceRate}%`} />
          <SummaryCard label="Evaluations" value={viewing.summary.totalEvaluations} />
          <SummaryCard label="Tournament Date" value={viewing.settings.tournamentDate ? new Date(viewing.settings.tournamentDate).toLocaleDateString() : '—'} />
        </div>

        {/* Team Radar */}
        {viewing.skillTests.length > 0 && (
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
        )}

        {/* Phase Progress */}
        {phases.length > 0 && viewing.sessions.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-semibold mb-3">Phase Progress</h2>
            <div className="flex gap-1">
              {phases.map((phase) => {
                const phaseSessions = viewing.sessions.filter((s) => s.weekNumber >= phase.weeks[0] && s.weekNumber <= phase.weeks[1]);
                const phaseCompleted = phaseSessions.filter((s) => s.completed).length;
                const pct = phaseSessions.length > 0 ? Math.round((phaseCompleted / phaseSessions.length) * 100) : 0;
                return (
                  <div key={phase.id} className="flex-1 rounded-lg p-3 text-center" style={{ backgroundColor: phase.color + '15' }}>
                    <p className="text-xs font-semibold" style={{ color: phase.color }}>{phase.name}</p>
                    <p className="text-lg font-bold mt-1">{pct}%</p>
                    <p className="text-[10px] text-gray-500">{phaseCompleted}/{phaseSessions.length}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Players */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold mb-3">Players ({viewing.players.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {viewing.players.map((p) => {
              const attended = viewing.practices.filter((pr) => pr.attendees.includes(p.id)).length;
              const rate = viewing.practices.length > 0 ? Math.round((attended / viewing.practices.length) * 100) : 0;
              const tests = viewing.skillTests.filter((t) => t.playerId === p.id).sort((a, b) => b.date.localeCompare(a.date));
              const avg = tests[0] ? overallAverage(tests[0].scores).toFixed(1) : '—';
              return (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ backgroundColor: p.avatarColor }}>{p.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name} <span className="text-gray-400">#{p.jerseyNumber}</span></p>
                    <p className="text-xs text-gray-500">{p.position} · {p.skillLevel} · Att: {rate}% · Skill: {avg}</p>
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tournament History</h1>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Archive"
        footer={
          <div className="flex gap-3">
            <button onClick={confirmDelete} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700">Delete</button>
            <button onClick={() => setDeleteId(null)} className="flex-1 border border-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          </div>
        }>
        <p className="text-sm text-gray-600">Are you sure you want to permanently delete this archived tournament?</p>
      </Modal>

      <div className="space-y-4">
        {archives.sort((a, b) => b.archivedAt.localeCompare(a.archivedAt)).map((arch) => (
          <div key={arch.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="font-semibold text-lg">{arch.settings.tournamentName || 'Untitled Tournament'}</h3>
                <p className="text-sm text-gray-500">
                  Archived {new Date(arch.archivedAt).toLocaleDateString()} · Tournament: {arch.settings.tournamentDate ? new Date(arch.settings.tournamentDate).toLocaleDateString() : '—'}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setViewId(arch.id)}
                  className="text-sm bg-purple-50 text-purple-700 px-4 py-2 rounded-lg font-medium hover:bg-purple-100 transition-colors">
                  View Details
                </button>
                <button onClick={() => setDeleteId(arch.id)}
                  className="text-sm text-red-500 hover:text-red-700 px-2 py-2">🗑️</button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-4">
              <div><p className="text-xl font-bold">{arch.summary.playerCount}</p><p className="text-xs text-gray-500">Players</p></div>
              <div><p className="text-xl font-bold">{arch.summary.completedSessions}/{arch.summary.totalSessions}</p><p className="text-xs text-gray-500">Sessions</p></div>
              <div><p className="text-xl font-bold">{arch.summary.avgAttendanceRate}%</p><p className="text-xs text-gray-500">Attendance</p></div>
              <div><p className="text-xl font-bold">{arch.summary.totalEvaluations}</p><p className="text-xs text-gray-500">Evaluations</p></div>
              <div><p className="text-xl font-bold">{arch.settings.phaseWeeks.reduce((a, b) => a + b, 0)}</p><p className="text-xs text-gray-500">Weeks</p></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
