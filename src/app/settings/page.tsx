'use client';

import { useState } from 'react';
import { useInitialize, useForceUpdate } from '@/hooks/useLocalStorage';
import { store, exportPlayersCSV, exportAttendanceCSV, exportEvaluationsCSV, exportSummary } from '@/lib/store';
import { DEFAULT_PHASES, type SessionDay, type TournamentSettings } from '@/lib/types';
import Modal from '@/components/Modal';

const ALL_DAYS: SessionDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function SettingsPage() {
  const ready = useInitialize();
  const refresh = useForceUpdate();

  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showNewTournament, setShowNewTournament] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState<TournamentSettings | null>(null);

  if (!ready) return <div className="animate-pulse h-96 rounded-2xl" style={{ backgroundColor: 'var(--primary)', opacity: 0.1 }} />;

  const settings = store.getSettings();
  const f = form || settings;

  function initForm() { if (!form) setForm({ ...settings }); }
  function updateForm(patch: Partial<TournamentSettings>) { initForm(); setForm((prev) => ({ ...(prev || settings), ...patch })); }

  function saveSettings() {
    if (!form) return;
    store.setSettings(form);
    setForm(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    refresh();
  }

  function toggleDay(day: SessionDay) {
    const days = [...f.trainingDays];
    const idx = days.indexOf(day);
    if (idx >= 0) days.splice(idx, 1); else days.push(day);
    updateForm({ trainingDays: days });
  }

  function setPhaseWeek(index: number, val: number) {
    const pw = [...f.phaseWeeks];
    pw[index] = Math.max(1, val);
    updateForm({ phaseWeeks: pw });
  }

  const totalWeeks = f.phaseWeeks.reduce((a, b) => a + b, 0);

  function doArchive() { store.archiveTournament(); setShowArchiveConfirm(false); refresh(); }
  function doNewTournament() { store.startNewTournament(); setShowNewTournament(false); setForm(null); refresh(); }
  function doReset() { store.resetAll(); setShowResetConfirm(false); window.location.reload(); }

  function downloadCSV(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  }

  function downloadText(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 stagger-children">
      <h1 className="text-3xl font-heading font-extrabold animate-fade-in-up" style={{ color: 'var(--dark)' }}>Settings</h1>

      {/* Tournament Configuration */}
      <div className="card-flat p-6 space-y-5 animate-fade-in-up">
        <h2 className="text-lg font-heading font-bold" style={{ color: 'var(--dark)' }}>Tournament Configuration</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-[var(--dark)] mb-1">Tournament Name</label>
            <input type="text" value={f.tournamentName} onChange={(e) => updateForm({ tournamentName: e.target.value })}
              className="w-full px-3 py-2.5 text-sm" placeholder="e.g. VUG Ultimate 2026" />
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--dark)] mb-1">Tournament Date</label>
            <input type="date" value={f.tournamentDate} onChange={(e) => updateForm({ tournamentDate: e.target.value })}
              className="w-full px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--dark)] mb-1">Training Start Date</label>
            <input type="date" value={f.trainingStartDate} onChange={(e) => updateForm({ trainingStartDate: e.target.value })}
              className="w-full px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--dark)] mb-1">Sessions Per Week</label>
            <input type="number" min={1} max={7} value={f.sessionsPerWeek}
              onChange={(e) => updateForm({ sessionsPerWeek: Math.max(1, parseInt(e.target.value) || 1) })}
              className="w-full px-3 py-2.5 text-sm" />
          </div>
        </div>

        {/* Training Days */}
        <div>
          <label className="block text-sm font-bold text-[var(--dark)] mb-2">Training Days</label>
          <div className="flex flex-wrap gap-2">
            {ALL_DAYS.map((day) => (
              <button key={day} onClick={() => toggleDay(day)}
                className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={f.trainingDays.includes(day)
                  ? { background: 'var(--primary)', color: 'var(--dark)' }
                  : { background: 'var(--background)', color: 'var(--text-secondary)' }
                }>{day}</button>
            ))}
          </div>
        </div>

        {/* Phase Configuration */}
        <div>
          <label className="block text-sm font-bold text-[var(--dark)] mb-2">Phase Configuration</label>
          <div className="space-y-2.5">
            {DEFAULT_PHASES.map((phase, i) => (
              <div key={phase.name} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ backgroundColor: phase.color + '10' }}>
                <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: phase.color }} />
                <span className="text-sm font-bold w-44" style={{ color: phase.color }}>{phase.name}</span>
                <input type="number" min={1} max={20} value={f.phaseWeeks[i]}
                  onChange={(e) => setPhaseWeek(i, parseInt(e.target.value) || 1)}
                  className="w-20 rounded-xl px-3 py-1.5 text-sm text-center font-bold stat-number" />
                <span className="text-xs text-[var(--text-secondary)] font-bold">weeks</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-2 font-bold">Total: <strong className="stat-number" style={{ color: 'var(--dark)' }}>{totalWeeks} weeks</strong></p>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-3">
          <button onClick={saveSettings} disabled={!form} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
            Save Settings
          </button>
          {saved && <span className="text-sm font-bold animate-fade-in" style={{ color: 'var(--success)' }}>Saved!</span>}
        </div>
      </div>

      {/* Tournament Management */}
      <div className="card-flat p-6 space-y-4 animate-fade-in-up">
        <h2 className="text-lg font-heading font-bold" style={{ color: 'var(--dark)' }}>Tournament Management</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setShowArchiveConfirm(true)}
            className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{ backgroundColor: 'rgba(78, 205, 196, 0.15)', color: 'var(--secondary)' }}>
            Archive Tournament
          </button>
          <button onClick={() => setShowNewTournament(true)}
            className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{ backgroundColor: 'rgba(0, 214, 143, 0.15)', color: 'var(--success)' }}>
            Start New Tournament
          </button>
          <button onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{ backgroundColor: 'rgba(255, 107, 107, 0.15)', color: 'var(--danger)' }}>
            Reset All Data
          </button>
        </div>
      </div>

      {/* Export Data */}
      <div className="card-flat p-6 space-y-4 animate-fade-in-up">
        <h2 className="text-lg font-heading font-bold" style={{ color: 'var(--dark)' }}>Export Data</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => downloadCSV(exportPlayersCSV(), 'players.csv')} className="btn-secondary">Export Players CSV</button>
          <button onClick={() => downloadCSV(exportAttendanceCSV(), 'attendance.csv')} className="btn-secondary">Export Attendance CSV</button>
          <button onClick={() => downloadCSV(exportEvaluationsCSV(), 'evaluations.csv')} className="btn-secondary">Export Evaluations CSV</button>
          <button onClick={() => downloadText(exportSummary(), 'tournament-summary.txt')} className="btn-primary">Export Summary</button>
        </div>
      </div>

      {/* Modals */}
      <Modal open={showArchiveConfirm} onClose={() => setShowArchiveConfirm(false)} title="Archive Tournament"
        footer={<div className="flex gap-3"><button onClick={doArchive} className="flex-1 btn-primary">Archive</button><button onClick={() => setShowArchiveConfirm(false)} className="flex-1 btn-secondary">Cancel</button></div>}>
        <p className="text-sm text-[var(--text-secondary)]">This will save a snapshot of all current data as an archived tournament. You can view it later on the History page.</p>
      </Modal>

      <Modal open={showNewTournament} onClose={() => setShowNewTournament(false)} title="Start New Tournament"
        footer={<div className="flex gap-3"><button onClick={doNewTournament} className="flex-1 btn-primary">Start New</button><button onClick={() => setShowNewTournament(false)} className="flex-1 btn-secondary">Cancel</button></div>}>
        <p className="text-sm text-[var(--text-secondary)]">The current tournament will be archived automatically. Sessions, attendance, evaluations, and calendar progress will be reset to zero. <strong>Players will be kept.</strong></p>
      </Modal>

      <Modal open={showResetConfirm} onClose={() => setShowResetConfirm(false)} title="Reset All Data"
        footer={<div className="flex gap-3"><button onClick={doReset} className="flex-1 btn-danger">Reset Everything</button><button onClick={() => setShowResetConfirm(false)} className="flex-1 btn-secondary">Cancel</button></div>}>
        <p className="text-sm text-[var(--text-secondary)]">This will permanently delete <strong>all data</strong> including players, sessions, evaluations, settings, and archived tournaments. This cannot be undone.</p>
      </Modal>
    </div>
  );
}
