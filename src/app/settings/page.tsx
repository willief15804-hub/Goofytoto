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

  // Form state
  const [form, setForm] = useState<TournamentSettings | null>(null);

  if (!ready) return <div className="animate-pulse h-96 bg-gray-200 rounded-xl" />;

  const settings = store.getSettings();
  const f = form || settings;

  function initForm() {
    if (!form) setForm({ ...settings });
  }

  function updateForm(patch: Partial<TournamentSettings>) {
    initForm();
    setForm((prev) => ({ ...(prev || settings), ...patch }));
  }

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

  function doArchive() {
    store.archiveTournament();
    setShowArchiveConfirm(false);
    refresh();
  }

  function doNewTournament() {
    store.startNewTournament();
    setShowNewTournament(false);
    setForm(null);
    refresh();
  }

  function doReset() {
    store.resetAll();
    setShowResetConfirm(false);
    window.location.reload();
  }

  function downloadCSV(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadText(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Tournament Configuration */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="text-lg font-semibold">Tournament Configuration</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tournament Name</label>
            <input type="text" value={f.tournamentName} onChange={(e) => updateForm({ tournamentName: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. VUG Ultimate 2026" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tournament Date</label>
            <input type="date" value={f.tournamentDate} onChange={(e) => updateForm({ tournamentDate: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Training Start Date</label>
            <input type="date" value={f.trainingStartDate} onChange={(e) => updateForm({ trainingStartDate: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sessions Per Week</label>
            <input type="number" min={1} max={7} value={f.sessionsPerWeek}
              onChange={(e) => updateForm({ sessionsPerWeek: Math.max(1, parseInt(e.target.value) || 1) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        {/* Training Days */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Training Days</label>
          <div className="flex flex-wrap gap-2">
            {ALL_DAYS.map((day) => (
              <button key={day} onClick={() => toggleDay(day)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  f.trainingDays.includes(day)
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>{day}</button>
            ))}
          </div>
        </div>

        {/* Phase Configuration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phase Configuration</label>
          <div className="space-y-2">
            {DEFAULT_PHASES.map((phase, i) => (
              <div key={phase.name} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: phase.color }} />
                <span className="text-sm font-medium w-44">{phase.name}</span>
                <input type="number" min={1} max={20} value={f.phaseWeeks[i]}
                  onChange={(e) => setPhaseWeek(i, parseInt(e.target.value) || 1)}
                  className="w-20 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-center" />
                <span className="text-xs text-gray-500">weeks</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">Total: <strong>{totalWeeks} weeks</strong></p>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-3">
          <button onClick={saveSettings} disabled={!form}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            Save Settings
          </button>
          {saved && <span className="text-sm text-green-600 font-medium">Saved!</span>}
        </div>
      </div>

      {/* Tournament Management */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold">Tournament Management</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setShowArchiveConfirm(true)}
            className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
            Archive Tournament
          </button>
          <button onClick={() => setShowNewTournament(true)}
            className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors">
            Start New Tournament
          </button>
          <button onClick={() => setShowResetConfirm(true)}
            className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
            Reset All Data
          </button>
        </div>
      </div>

      {/* Export Data */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold">Export Data</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => downloadCSV(exportPlayersCSV(), 'players.csv')}
            className="border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Export Players CSV
          </button>
          <button onClick={() => downloadCSV(exportAttendanceCSV(), 'attendance.csv')}
            className="border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Export Attendance CSV
          </button>
          <button onClick={() => downloadCSV(exportEvaluationsCSV(), 'evaluations.csv')}
            className="border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Export Evaluations CSV
          </button>
          <button onClick={() => downloadText(exportSummary(), 'tournament-summary.txt')}
            className="bg-purple-50 text-purple-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors">
            Export Summary
          </button>
        </div>
      </div>

      {/* Archive Confirm */}
      <Modal open={showArchiveConfirm} onClose={() => setShowArchiveConfirm(false)} title="Archive Tournament"
        footer={
          <div className="flex gap-3">
            <button onClick={doArchive} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Archive</button>
            <button onClick={() => setShowArchiveConfirm(false)} className="flex-1 border border-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          </div>
        }>
        <p className="text-sm text-gray-600">
          This will save a snapshot of all current data (players, sessions, attendance, evaluations) as an archived tournament.
          You can view it later on the History page.
        </p>
      </Modal>

      {/* New Tournament Confirm */}
      <Modal open={showNewTournament} onClose={() => setShowNewTournament(false)} title="Start New Tournament"
        footer={
          <div className="flex gap-3">
            <button onClick={doNewTournament} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700">Start New</button>
            <button onClick={() => setShowNewTournament(false)} className="flex-1 border border-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          </div>
        }>
        <p className="text-sm text-gray-600">
          The current tournament will be archived automatically. Sessions, attendance, evaluations, and calendar progress will be reset to zero.
          <strong> Players will be kept.</strong>
        </p>
      </Modal>

      {/* Reset Confirm */}
      <Modal open={showResetConfirm} onClose={() => setShowResetConfirm(false)} title="Reset All Data"
        footer={
          <div className="flex gap-3">
            <button onClick={doReset} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700">Reset Everything</button>
            <button onClick={() => setShowResetConfirm(false)} className="flex-1 border border-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          </div>
        }>
        <p className="text-sm text-gray-600">
          This will permanently delete <strong>all data</strong> including players, sessions, evaluations, settings, and archived tournaments. This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
