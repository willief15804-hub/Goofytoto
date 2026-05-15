'use client';

import { useState } from 'react';
import { useInitialize, useForceUpdate } from '@/hooks/useLocalStorage';
import { store } from '@/lib/store';
import { buildPhases } from '@/lib/types';
import type { TrainingSession, SessionDay } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Modal from '@/components/Modal';

const ALL_DAYS: SessionDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function AttendancePage() {
  const ready = useInitialize();
  const refresh = useForceUpdate();

  // Session form
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [editSessionId, setEditSessionId] = useState<string | null>(null);
  const [sessionFocus, setSessionFocus] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionWeek, setSessionWeek] = useState(1);
  const [sessionDay, setSessionDay] = useState<SessionDay>('Mon');

  // Attendance
  const [attendSessionId, setAttendSessionId] = useState<string | null>(null);
  const [attendees, setAttendees] = useState<string[]>([]);

  // Delete
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  if (!ready) return <div className="animate-pulse h-96 bg-gray-200 rounded-xl" />;

  const players = store.getPlayers();
  const practices = store.getPractices();
  const sessions = store.getSessions();
  const calendar = store.getCalendar();
  const settings = store.getSettings();
  const PHASES = buildPhases(settings.phaseWeeks);

  // Weekly team attendance rate
  const weeklyRates = calendar.map((w) => {
    const weekPractices = practices.filter((p) => {
      const s = sessions.find((s) => s.id === p.sessionId);
      return s && s.weekNumber === w.weekNumber;
    });
    const totalSlots = weekPractices.length * players.length;
    const totalPresent = weekPractices.reduce((sum, p) => sum + p.attendees.length, 0);
    const rate = totalSlots > 0 ? Math.round((totalPresent / totalSlots) * 100) : 0;
    return { week: `W${w.weekNumber}`, rate, count: weekPractices.length };
  }).filter((w) => w.count > 0);

  // Session CRUD
  function openNewSession() {
    setEditSessionId(null);
    setSessionFocus('');
    setSessionDate(new Date().toISOString().split('T')[0]);
    setSessionWeek(1);
    setSessionDay('Mon');
    setShowSessionForm(true);
  }

  function openEditSession(s: TrainingSession) {
    setEditSessionId(s.id);
    setSessionFocus(s.focus);
    setSessionDate(s.date);
    setSessionWeek(s.weekNumber);
    setSessionDay(s.day);
    setShowSessionForm(true);
  }

  function saveSession() {
    if (!sessionFocus.trim() || !sessionDate) return;
    if (editSessionId) {
      const existing = sessions.find((s) => s.id === editSessionId)!;
      store.updateSession({
        ...existing,
        focus: sessionFocus.trim(),
        date: sessionDate,
        weekNumber: sessionWeek,
        day: sessionDay,
      });
    } else {
      store.addSession({
        id: `s-${Date.now()}`,
        weekNumber: sessionWeek,
        day: sessionDay,
        date: sessionDate,
        focus: sessionFocus.trim(),
        drills: [],
        completed: false,
      });
    }
    setShowSessionForm(false);
    refresh();
  }

  function confirmDeleteSession() {
    if (!deleteSessionId) return;
    store.deleteSession(deleteSessionId);
    setDeleteSessionId(null);
    setSelected((prev) => { const next = new Set(prev); next.delete(deleteSessionId); return next; });
    refresh();
  }

  function bulkDelete() {
    selected.forEach((id) => store.deleteSession(id));
    setSelected(new Set());
    setBulkDeleteConfirm(false);
    refresh();
  }

  // Attendance
  function openAttendance(sessionId: string) {
    const existing = practices.find((p) => p.sessionId === sessionId);
    setAttendSessionId(sessionId);
    setAttendees(existing ? [...existing.attendees] : []);
  }

  function togglePlayer(playerId: string) {
    setAttendees((prev) => prev.includes(playerId) ? prev.filter((x) => x !== playerId) : [...prev, playerId]);
  }

  function saveAttendance() {
    if (!attendSessionId) return;
    const session = sessions.find((s) => s.id === attendSessionId);
    if (!session) return;
    const existing = practices.find((p) => p.sessionId === attendSessionId);
    if (existing) {
      store.updatePractice({ ...existing, attendees });
    } else {
      store.addPractice({
        id: `pr-${Date.now()}`,
        sessionId: attendSessionId,
        date: session.date,
        type: session.focus.split(' ')[0],
        notes: session.focus,
        attendees,
      });
    }
    if (!session.completed) {
      store.toggleSessionComplete(session.id);
    }
    setAttendSessionId(null);
    refresh();
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === sessions.length) setSelected(new Set());
    else setSelected(new Set(sessions.map((s) => s.id)));
  }

  function getPhaseForWeek(weekNum: number) {
    return PHASES.find((p) => weekNum >= p.weeks[0] && weekNum <= p.weeks[1]);
  }

  const sortedSessions = [...sessions].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Attendance</h1>
        <button onClick={openNewSession} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
          + Add New Session
        </button>
      </div>

      {/* Session Form Modal */}
      <Modal open={showSessionForm} onClose={() => setShowSessionForm(false)}
        title={editSessionId ? 'Edit Session' : 'New Session'}
        footer={
          <div className="flex gap-3">
            <button onClick={saveSession} className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700">Save</button>
            <button onClick={() => setShowSessionForm(false)} className="flex-1 border border-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          </div>
        }>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session Name / Focus</label>
            <input type="text" value={sessionFocus} onChange={(e) => setSessionFocus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Throwing Fundamentals" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Week (W1-W20)</label>
              <select value={sessionWeek} onChange={(e) => setSessionWeek(parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {Array.from({ length: settings.phaseWeeks.reduce((a, b) => a + b, 0) || 20 }, (_, i) => i + 1).map((w) => {
                  const phase = getPhaseForWeek(w);
                  return <option key={w} value={w}>W{w}{phase ? ` — ${phase.name}` : ''}</option>;
                })}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
              <select value={sessionDay} onChange={(e) => setSessionDay(e.target.value as SessionDay)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {ALL_DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </div>
      </Modal>

      {/* Take Attendance Modal */}
      <Modal open={!!attendSessionId} onClose={() => setAttendSessionId(null)}
        title="Take Attendance"
        footer={
          <div className="flex gap-3">
            <button onClick={saveAttendance} className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700">Save Attendance</button>
            <button onClick={() => setAttendSessionId(null)} className="flex-1 border border-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          </div>
        }>
        {(() => {
          const session = sessions.find((s) => s.id === attendSessionId);
          if (!session) return null;
          return (
            <>
              <p className="text-sm text-gray-500 mb-4">{session.focus} — {session.day}, {new Date(session.date).toLocaleDateString()}</p>
              {players.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No players added yet. Add players first.</p>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">{attendees.length}/{players.length} present</span>
                    <div className="flex gap-2">
                      <button onClick={() => setAttendees(players.map((p) => p.id))} className="text-xs text-purple-600 hover:text-purple-800">All</button>
                      <button onClick={() => setAttendees([])} className="text-xs text-gray-500 hover:text-gray-700">None</button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {players.map((p) => {
                      const isPresent = attendees.includes(p.id);
                      return (
                        <button key={p.id} onClick={() => togglePlayer(p.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                            isPresent ? 'bg-green-50 text-green-800 ring-1 ring-green-200' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                          }`}>
                          {/* Toggle switch */}
                          <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${isPresent ? 'bg-green-500' : 'bg-gray-300'}`}>
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isPresent ? 'translate-x-5' : 'translate-x-0'}`} />
                          </div>
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: p.avatarColor }}>{p.name.charAt(0)}</div>
                          <span className="flex-1">{p.name}</span>
                          <span className="text-xs text-gray-400">#{p.jerseyNumber}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          );
        })()}
      </Modal>

      {/* Delete Session Confirm */}
      <Modal open={!!deleteSessionId} onClose={() => setDeleteSessionId(null)} title="Delete Session"
        footer={
          <div className="flex gap-3">
            <button onClick={confirmDeleteSession} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700">Delete</button>
            <button onClick={() => setDeleteSessionId(null)} className="flex-1 border border-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          </div>
        }>
        <p className="text-sm text-gray-600">
          Are you sure? This will also remove any attendance record linked to this session.
        </p>
      </Modal>

      {/* Bulk Delete Confirm */}
      <Modal open={bulkDeleteConfirm} onClose={() => setBulkDeleteConfirm(false)} title="Delete Selected Sessions"
        footer={
          <div className="flex gap-3">
            <button onClick={bulkDelete} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700">Delete {selected.size} Sessions</button>
            <button onClick={() => setBulkDeleteConfirm(false)} className="flex-1 border border-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          </div>
        }>
        <p className="text-sm text-gray-600">
          Are you sure you want to delete <strong>{selected.size} sessions</strong> and their attendance records?
        </p>
      </Modal>

      {/* Empty State */}
      {sessions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-lg font-semibold text-gray-700 mb-1">No sessions yet</p>
          <p className="text-sm text-gray-500 mb-4">Create your first training session to start tracking attendance.</p>
          <button onClick={openNewSession} className="bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
            + Add First Session
          </button>
        </div>
      ) : (
        <>
          {/* Weekly Rate Chart */}
          {weeklyRates.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-lg font-semibold mb-4">Team Attendance Rate by Week</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyRates}>
                  <XAxis dataKey="week" fontSize={10} />
                  <YAxis domain={[0, 100]} fontSize={10} tickFormatter={(v) => `${v}%`} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Bar dataKey="rate" fill="#7c3aed" radius={[3, 3, 0, 0]} name="Attendance %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Bulk Actions */}
          <div className="flex items-center gap-3">
            <button onClick={toggleSelectAll}
              className="text-xs text-purple-600 hover:text-purple-800 font-medium">
              {selected.size === sessions.length ? 'Deselect All' : 'Select All'}
            </button>
            {selected.size > 0 && (
              <button onClick={() => setBulkDeleteConfirm(true)}
                className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium transition-colors">
                Delete Selected ({selected.size})
              </button>
            )}
          </div>

          {/* Session Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Session Attendance</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-3 py-3 w-8"></th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Session</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Phase</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Present</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSessions.map((session) => {
                    const practice = practices.find((p) => p.sessionId === session.id);
                    const phase = getPhaseForWeek(session.weekNumber);
                    const isSelected = selected.has(session.id);
                    return (
                      <tr key={session.id} className={`border-b border-gray-100 hover:bg-gray-50 ${isSelected ? 'bg-purple-50' : ''}`}>
                        <td className="px-3 py-2">
                          <button onClick={() => toggleSelect(session.id)}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              isSelected ? 'bg-purple-500 border-purple-500 text-white' : 'border-gray-300'
                            }`}>
                            {isSelected && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                          </button>
                        </td>
                        <td className="px-4 py-2">
                          <p className="text-sm font-medium">{session.focus}</p>
                          <p className="text-xs text-gray-400">W{session.weekNumber} {session.day}</p>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {new Date(session.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-4 py-2">
                          {phase && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: phase.color + '20', color: phase.color }}>{phase.name}</span>}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {practice ? (
                            <div className="flex items-center justify-center gap-1">
                              <div className="flex -space-x-1">
                                {practice.attendees.slice(0, 5).map((aid) => {
                                  const pl = players.find((p) => p.id === aid);
                                  return pl ? (
                                    <div key={aid} className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold"
                                      style={{ backgroundColor: pl.avatarColor }} title={pl.name}>{pl.name.charAt(0)}</div>
                                  ) : null;
                                })}
                                {practice.attendees.length > 5 && (
                                  <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                                    +{practice.attendees.length - 5}
                                  </div>
                                )}
                              </div>
                              <span className="text-xs text-gray-500 ml-1">{practice.attendees.length}/{players.length}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Not recorded</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openAttendance(session.id)}
                              className="text-xs text-purple-600 hover:text-purple-800">
                              {practice ? 'Edit Attendance' : 'Take Attendance'}
                            </button>
                            <button onClick={() => openEditSession(session)}
                              className="text-xs text-gray-500 hover:text-purple-600">✏️</button>
                            <button onClick={() => setDeleteSessionId(session.id)}
                              className="text-xs text-gray-500 hover:text-red-500">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Per-Player Stats */}
          {players.length > 0 && practices.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-lg font-semibold mb-4">Player Attendance Summary</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {players.map((player) => {
                  const attended = practices.filter((p) => p.attendees.includes(player.id)).length;
                  const rate = practices.length > 0 ? Math.round((attended / practices.length) * 100) : 0;
                  return (
                    <div key={player.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                        style={{ backgroundColor: player.avatarColor }}>{player.name.charAt(0)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{player.name}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div className="h-2 rounded-full bg-purple-500 transition-all" style={{ width: `${rate}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 w-20 text-right">{attended}/{practices.length} ({rate}%)</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
