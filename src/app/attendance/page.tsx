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

  const [showSessionForm, setShowSessionForm] = useState(false);
  const [editSessionId, setEditSessionId] = useState<string | null>(null);
  const [sessionFocus, setSessionFocus] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionWeek, setSessionWeek] = useState(1);
  const [sessionDay, setSessionDay] = useState<SessionDay>('Mon');

  const [attendSessionId, setAttendSessionId] = useState<string | null>(null);
  const [attendees, setAttendees] = useState<string[]>([]);

  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  if (!ready) return <div className="animate-pulse h-96 rounded-2xl" style={{ backgroundColor: 'var(--secondary)', opacity: 0.1 }} />;

  const players = store.getPlayers();
  const practices = store.getPractices();
  const sessions = store.getSessions();
  const calendar = store.getCalendar();
  const settings = store.getSettings();
  const PHASES = buildPhases(settings.phaseWeeks);

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
      store.updateSession({ ...existing, focus: sessionFocus.trim(), date: sessionDate, weekNumber: sessionWeek, day: sessionDay });
    } else {
      store.addSession({
        id: `s-${Date.now()}`, weekNumber: sessionWeek, day: sessionDay, date: sessionDate,
        focus: sessionFocus.trim(), drills: [], completed: false,
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
        id: `pr-${Date.now()}`, sessionId: attendSessionId, date: session.date,
        type: session.focus.split(' ')[0], notes: session.focus, attendees,
      });
    }
    if (!session.completed) store.toggleSessionComplete(session.id);
    setAttendSessionId(null);
    refresh();
  }

  function toggleSelect(id: string) {
    setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
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
    <div className="space-y-6 stagger-children">
      <div className="flex items-center justify-between flex-wrap gap-3 animate-fade-in-up">
        <h1 className="text-3xl font-heading font-extrabold" style={{ color: 'var(--dark)' }}>Attendance</h1>
        <button onClick={openNewSession} className="btn-primary">+ Add New Session</button>
      </div>

      {/* Session Form Modal */}
      <Modal open={showSessionForm} onClose={() => setShowSessionForm(false)}
        title={editSessionId ? 'Edit Session' : 'New Session'}
        footer={
          <div className="flex gap-3">
            <button onClick={saveSession} className="flex-1 btn-primary">Save</button>
            <button onClick={() => setShowSessionForm(false)} className="flex-1 btn-secondary">Cancel</button>
          </div>
        }>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[var(--dark)] mb-1">Session Name / Focus</label>
            <input type="text" value={sessionFocus} onChange={(e) => setSessionFocus(e.target.value)}
              className="w-full px-3 py-2.5 text-sm" placeholder="e.g. Throwing Fundamentals" />
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--dark)] mb-1">Date</label>
            <input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)}
              className="w-full px-3 py-2.5 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-[var(--dark)] mb-1">Week</label>
              <select value={sessionWeek} onChange={(e) => setSessionWeek(parseInt(e.target.value))}
                className="w-full px-3 py-2.5 text-sm">
                {Array.from({ length: settings.phaseWeeks.reduce((a, b) => a + b, 0) || 20 }, (_, i) => i + 1).map((w) => {
                  const phase = getPhaseForWeek(w);
                  return <option key={w} value={w}>W{w}{phase ? ` — ${phase.name}` : ''}</option>;
                })}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--dark)] mb-1">Day</label>
              <select value={sessionDay} onChange={(e) => setSessionDay(e.target.value as SessionDay)}
                className="w-full px-3 py-2.5 text-sm">
                {ALL_DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </div>
      </Modal>

      {/* Take Attendance Modal */}
      <Modal open={!!attendSessionId} onClose={() => setAttendSessionId(null)} title="Take Attendance"
        footer={
          <div className="flex gap-3">
            <button onClick={saveAttendance} className="flex-1 btn-primary">Save Attendance</button>
            <button onClick={() => setAttendSessionId(null)} className="flex-1 btn-secondary">Cancel</button>
          </div>
        }>
        {(() => {
          const session = sessions.find((s) => s.id === attendSessionId);
          if (!session) return null;
          return (
            <>
              <p className="text-sm text-[var(--text-secondary)] mb-4">{session.focus} — {session.day}, {new Date(session.date).toLocaleDateString()}</p>
              {players.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)] text-center py-6">No players added yet. Add players first.</p>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold stat-number" style={{ color: 'var(--dark)' }}>{attendees.length}/{players.length} present</span>
                    <div className="flex gap-2">
                      <button onClick={() => setAttendees(players.map((p) => p.id))} className="text-xs font-bold" style={{ color: 'var(--secondary)' }}>All</button>
                      <button onClick={() => setAttendees([])} className="text-xs font-bold text-[var(--text-secondary)]">None</button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {players.map((p) => {
                      const isPresent = attendees.includes(p.id);
                      return (
                        <button key={p.id} onClick={() => togglePlayer(p.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-all ${
                            isPresent ? 'ring-1' : 'hover:bg-black/[0.03]'
                          }`}
                          style={isPresent ? { backgroundColor: 'rgba(0, 214, 143, 0.08)', borderColor: 'var(--success)', color: 'var(--dark)' } : {}}>
                          <div className={`toggle-track ${isPresent ? 'on' : 'off'}`} style={{ width: '40px', height: '22px' }}>
                            <div className="toggle-thumb" style={{ width: '18px', height: '18px', top: '2px' }} />
                          </div>
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: p.avatarColor }}>{p.name.charAt(0)}</div>
                          <span className="flex-1 font-medium">{p.name}</span>
                          <span className="text-xs text-[var(--text-secondary)]">#{p.jerseyNumber}</span>
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

      {/* Delete Confirms */}
      <Modal open={!!deleteSessionId} onClose={() => setDeleteSessionId(null)} title="Delete Session"
        footer={<div className="flex gap-3"><button onClick={confirmDeleteSession} className="flex-1 btn-danger">Delete</button><button onClick={() => setDeleteSessionId(null)} className="flex-1 btn-secondary">Cancel</button></div>}>
        <p className="text-sm text-[var(--text-secondary)]">Are you sure? This will also remove any attendance record linked to this session.</p>
      </Modal>
      <Modal open={bulkDeleteConfirm} onClose={() => setBulkDeleteConfirm(false)} title="Delete Selected Sessions"
        footer={<div className="flex gap-3"><button onClick={bulkDelete} className="flex-1 btn-danger">Delete {selected.size} Sessions</button><button onClick={() => setBulkDeleteConfirm(false)} className="flex-1 btn-secondary">Cancel</button></div>}>
        <p className="text-sm text-[var(--text-secondary)]">Are you sure you want to delete <strong>{selected.size} sessions</strong> and their attendance records?</p>
      </Modal>

      {/* Empty State */}
      {sessions.length === 0 ? (
        <div className="card p-12 text-center animate-fade-in-up">
          <p className="text-5xl mb-4">📋</p>
          <p className="text-xl font-heading font-extrabold mb-2" style={{ color: 'var(--dark)' }}>No sessions yet</p>
          <p className="text-sm text-[var(--text-secondary)] mb-5">Create your first training session to start tracking attendance.</p>
          <button onClick={openNewSession} className="btn-primary text-base px-8 py-3">+ Add First Session</button>
        </div>
      ) : (
        <>
          {/* Weekly Rate Chart */}
          {weeklyRates.length > 0 && (
            <div className="card-flat p-5 animate-fade-in-up">
              <h2 className="text-lg font-heading font-bold mb-4" style={{ color: 'var(--dark)' }}>Team Attendance Rate by Week</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyRates}>
                  <XAxis dataKey="week" fontSize={10} tick={{ fill: 'var(--text-secondary)' }} />
                  <YAxis domain={[0, 100]} fontSize={10} tickFormatter={(v) => `${v}%`} tick={{ fill: 'var(--text-secondary)' }} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Bar dataKey="rate" fill="var(--secondary)" radius={[6, 6, 0, 0]} name="Attendance %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Bulk Actions */}
          <div className="flex items-center gap-3 animate-fade-in-up">
            <button onClick={toggleSelectAll} className="text-xs font-bold" style={{ color: 'var(--secondary)' }}>
              {selected.size === sessions.length ? 'Deselect All' : 'Select All'}
            </button>
            {selected.size > 0 && (
              <button onClick={() => setBulkDeleteConfirm(true)}
                className="text-xs font-bold px-3 py-1.5 rounded-xl" style={{ backgroundColor: 'rgba(255,107,107,0.1)', color: 'var(--danger)' }}>
                Delete Selected ({selected.size})
              </button>
            )}
          </div>

          {/* Session Table */}
          <div className="card-flat overflow-hidden animate-fade-in-up">
            <div className="p-5 border-b" style={{ borderColor: 'var(--background)' }}>
              <h2 className="text-lg font-heading font-bold" style={{ color: 'var(--dark)' }}>Session Attendance</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: 'var(--background)' }}>
                    <th className="px-3 py-3 w-8"></th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Session</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Phase</th>
                    <th className="px-4 py-3 text-center text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Present</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSessions.map((session) => {
                    const practice = practices.find((p) => p.sessionId === session.id);
                    const phase = getPhaseForWeek(session.weekNumber);
                    const isSelected = selected.has(session.id);
                    return (
                      <tr key={session.id} className="border-b transition-colors hover:bg-black/[0.02]"
                        style={{ borderColor: 'var(--background)', backgroundColor: isSelected ? 'rgba(204,255,0,0.08)' : undefined }}>
                        <td className="px-3 py-2.5">
                          <button onClick={() => toggleSelect(session.id)}
                            className="w-5 h-5 rounded-md flex items-center justify-center"
                            style={{
                              backgroundColor: isSelected ? 'var(--primary)' : 'transparent',
                              border: isSelected ? '2px solid var(--primary)' : '2px solid #d1d5db',
                              color: isSelected ? 'var(--dark)' : 'transparent',
                            }}>
                            {isSelected && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                          </button>
                        </td>
                        <td className="px-4 py-2.5">
                          <p className="text-sm font-bold" style={{ color: 'var(--dark)' }}>{session.focus}</p>
                          <p className="text-xs text-[var(--text-secondary)]">W{session.weekNumber} {session.day}</p>
                        </td>
                        <td className="px-4 py-2.5 text-sm text-[var(--text-secondary)]">
                          {new Date(session.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-4 py-2.5">
                          {phase && <span className="text-[10px] px-2.5 py-1 rounded-full font-bold" style={{ backgroundColor: phase.color + '20', color: phase.color }}>{phase.name}</span>}
                        </td>
                        <td className="px-4 py-2.5 text-center">
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
                                  <div className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: 'var(--background)', color: 'var(--text-secondary)' }}>
                                    +{practice.attendees.length - 5}
                                  </div>
                                )}
                              </div>
                              <span className="text-xs font-bold text-[var(--text-secondary)] ml-1">{practice.attendees.length}/{players.length}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-[var(--text-secondary)]">Not recorded</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openAttendance(session.id)}
                              className="text-xs font-bold px-3 py-1 rounded-lg transition-colors"
                              style={{ color: 'var(--secondary)', backgroundColor: 'rgba(78,205,196,0.1)' }}>
                              {practice ? 'Edit' : 'Take Attendance'}
                            </button>
                            <button onClick={() => openEditSession(session)} className="text-xs text-[var(--text-secondary)] hover:text-[var(--dark)]">✏️</button>
                            <button onClick={() => setDeleteSessionId(session.id)} className="text-xs text-[var(--text-secondary)] hover:text-[var(--danger)]">🗑️</button>
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
            <div className="card-flat p-5 animate-fade-in-up">
              <h2 className="text-lg font-heading font-bold mb-4" style={{ color: 'var(--dark)' }}>Player Attendance Summary</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {players.map((player) => {
                  const attended = practices.filter((p) => p.attendees.includes(player.id)).length;
                  const rate = practices.length > 0 ? Math.round((attended / practices.length) * 100) : 0;
                  const rateColor = rate >= 80 ? 'var(--success)' : rate >= 50 ? 'var(--warning)' : 'var(--danger)';
                  return (
                    <div key={player.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ border: '1px solid var(--background)' }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                        style={{ backgroundColor: player.avatarColor }}>{player.name.charAt(0)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: 'var(--dark)' }}>{player.name}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 rounded-full h-2" style={{ backgroundColor: 'var(--background)' }}>
                            <div className="h-2 rounded-full transition-all animate-progress" style={{ width: `${rate}%`, backgroundColor: rateColor }} />
                          </div>
                          <span className="text-xs font-bold stat-number w-20 text-right" style={{ color: rateColor }}>{attended}/{practices.length} ({rate}%)</span>
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
