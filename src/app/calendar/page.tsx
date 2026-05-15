'use client';

import { useState } from 'react';
import { useInitialize, useForceUpdate } from '@/hooks/useLocalStorage';
import { store } from '@/lib/store';
import { buildPhases, type CalendarWeek, type TrainingSession, type SessionDay } from '@/lib/types';
import Modal from '@/components/Modal';

const ALL_DAYS: SessionDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarPage() {
  const ready = useInitialize();
  const refresh = useForceUpdate();
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);

  const [showWeekForm, setShowWeekForm] = useState(false);
  const [editWeekNum, setEditWeekNum] = useState<number | null>(null);
  const [weekFocus, setWeekFocus] = useState('');
  const [weekNotes, setWeekNotes] = useState('');
  const [weekStartDate, setWeekStartDate] = useState('');

  const [editSessionId, setEditSessionId] = useState<string | null>(null);
  const [sessionFocus, setSessionFocus] = useState('');
  const [sessionDay, setSessionDay] = useState<SessionDay>('Mon');
  const [sessionDate, setSessionDate] = useState('');

  const [deleteWeekNum, setDeleteWeekNum] = useState<number | null>(null);

  if (!ready) return <div className="animate-pulse h-96 rounded-2xl" style={{ backgroundColor: 'var(--primary)', opacity: 0.1 }} />;

  const calendar = store.getCalendar();
  const sessions = store.getSessions();
  const settings = store.getSettings();
  const phases = buildPhases(settings.phaseWeeks);

  const now = new Date();
  const currentWeekIdx = calendar.findIndex((w) => {
    const start = new Date(w.startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return now >= start && now < end;
  });
  const currentWeekNum = currentWeekIdx >= 0 ? calendar[currentWeekIdx].weekNumber : 0;

  const totalSessions = sessions.length;
  const completedSessions = sessions.filter((s) => s.completed).length;
  const overallProgress = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

  const currentPhase = phases.find((p) => currentWeekNum >= p.weeks[0] && currentWeekNum <= p.weeks[1]);
  const totalWeeks = settings.phaseWeeks.reduce((a, b) => a + b, 0);

  function toggleSession(id: string) { store.toggleSessionComplete(id); refresh(); }

  function openNewWeek() {
    setEditWeekNum(null);
    setWeekFocus('');
    setWeekNotes('');
    setWeekStartDate('');
    setShowWeekForm(true);
  }

  function openEditWeek(w: CalendarWeek) {
    setEditWeekNum(w.weekNumber);
    setWeekFocus(w.focus);
    setWeekNotes(w.notes);
    setWeekStartDate(w.startDate);
    setShowWeekForm(true);
  }

  function saveWeek() {
    if (!weekFocus.trim() || !weekStartDate) return;
    if (editWeekNum !== null) {
      store.updateWeek({ weekNumber: editWeekNum, focus: weekFocus.trim(), notes: weekNotes.trim(), startDate: weekStartDate });
    } else {
      const maxWeek = calendar.length > 0 ? Math.max(...calendar.map((w) => w.weekNumber)) : 0;
      const newNum = maxWeek + 1;
      store.addWeek({ weekNumber: newNum, focus: weekFocus.trim(), notes: weekNotes.trim(), startDate: weekStartDate });
      const days = settings.trainingDays.slice(0, settings.sessionsPerWeek);
      days.forEach((day, i) => {
        const d = new Date(weekStartDate);
        const dayOffset = ALL_DAYS.indexOf(day);
        const startDay = d.getDay() === 0 ? 6 : d.getDay() - 1;
        d.setDate(d.getDate() + (dayOffset - startDay + 7) % 7);
        store.addSession({
          id: `s-${Date.now()}-${i}`, weekNumber: newNum, day,
          date: d.toISOString().split('T')[0], focus: `${weekFocus.trim()} - Session ${i + 1}`, drills: [], completed: false,
        });
      });
    }
    setShowWeekForm(false);
    refresh();
  }

  function confirmDeleteWeek() {
    if (deleteWeekNum === null) return;
    store.deleteWeek(deleteWeekNum);
    setDeleteWeekNum(null);
    if (expandedWeek === deleteWeekNum) setExpandedWeek(null);
    refresh();
  }

  function openEditSession(s: TrainingSession) {
    setEditSessionId(s.id);
    setSessionFocus(s.focus);
    setSessionDay(s.day);
    setSessionDate(s.date);
  }

  function saveSession() {
    if (!editSessionId || !sessionFocus.trim()) return;
    const existing = sessions.find((s) => s.id === editSessionId);
    if (!existing) return;
    store.updateSession({ ...existing, focus: sessionFocus.trim(), day: sessionDay, date: sessionDate });
    setEditSessionId(null);
    refresh();
  }

  function getPhaseForWeek(weekNum: number) {
    return phases.find((p) => weekNum >= p.weeks[0] && weekNum <= p.weeks[1]);
  }

  const phaseColors = ['var(--phase-1)', 'var(--phase-2)', 'var(--phase-3)', 'var(--phase-4)', 'var(--phase-5)'];

  if (calendar.length === 0 && sessions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in-up">
          <h1 className="text-3xl font-heading font-extrabold" style={{ color: 'var(--dark)' }}>Training Schedule</h1>
          <button onClick={openNewWeek} className="btn-primary">+ Add Week</button>
        </div>
        <div className="card p-12 text-center animate-fade-in-up">
          <p className="text-5xl mb-4">📅</p>
          <p className="text-xl font-heading font-extrabold mb-2" style={{ color: 'var(--dark)' }}>No schedule set up yet</p>
          <p className="text-sm text-[var(--text-secondary)] mb-5">Add your first training week to build your {totalWeeks}-week schedule.</p>
          <button onClick={openNewWeek} className="btn-primary text-base px-8 py-3">+ Add First Week</button>
        </div>
        <WeekFormModal show={showWeekForm} onClose={() => setShowWeekForm(false)} isEdit={false}
          focus={weekFocus} setFocus={setWeekFocus} notes={weekNotes} setNotes={setWeekNotes}
          startDate={weekStartDate} setStartDate={setWeekStartDate} onSave={saveWeek} />
      </div>
    );
  }

  return (
    <div className="space-y-6 stagger-children">
      <div className="flex items-center justify-between flex-wrap gap-3 animate-fade-in-up">
        <h1 className="text-3xl font-heading font-extrabold" style={{ color: 'var(--dark)' }}>Training Schedule</h1>
        <button onClick={openNewWeek} className="btn-primary">+ Add Week</button>
      </div>

      {/* Modals */}
      <WeekFormModal show={showWeekForm} onClose={() => setShowWeekForm(false)} isEdit={editWeekNum !== null}
        focus={weekFocus} setFocus={setWeekFocus} notes={weekNotes} setNotes={setWeekNotes}
        startDate={weekStartDate} setStartDate={setWeekStartDate} onSave={saveWeek} />

      <Modal open={deleteWeekNum !== null} onClose={() => setDeleteWeekNum(null)} title="Delete Week"
        footer={<div className="flex gap-3"><button onClick={confirmDeleteWeek} className="flex-1 btn-danger">Delete</button><button onClick={() => setDeleteWeekNum(null)} className="flex-1 btn-secondary">Cancel</button></div>}>
        <p className="text-sm text-[var(--text-secondary)]">Delete Week {deleteWeekNum} and all its sessions? This cannot be undone.</p>
      </Modal>

      <Modal open={!!editSessionId} onClose={() => setEditSessionId(null)} title="Edit Session"
        footer={<div className="flex gap-3"><button onClick={saveSession} className="flex-1 btn-primary">Save</button><button onClick={() => setEditSessionId(null)} className="flex-1 btn-secondary">Cancel</button></div>}>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-bold text-[var(--dark)] mb-1">Session Name</label>
            <input type="text" value={sessionFocus} onChange={(e) => setSessionFocus(e.target.value)} className="w-full px-3 py-2.5 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-[var(--dark)] mb-1">Day</label>
              <select value={sessionDay} onChange={(e) => setSessionDay(e.target.value as SessionDay)} className="w-full px-3 py-2.5 text-sm">
                {ALL_DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--dark)] mb-1">Date</label>
              <input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} className="w-full px-3 py-2.5 text-sm" />
            </div>
          </div>
        </div>
      </Modal>

      {/* Overall Progress */}
      <div className="card-flat p-5 animate-fade-in-up">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-[var(--text-secondary)] uppercase font-bold tracking-wider">Overall Progress</p>
            <p className="text-2xl font-heading font-extrabold stat-number" style={{ color: 'var(--dark)' }}>{completedSessions}/{totalSessions} sessions</p>
          </div>
          {currentPhase && (
            <div className="text-right">
              <p className="text-xs text-[var(--text-secondary)] uppercase font-bold tracking-wider">Current Phase</p>
              <p className="text-lg font-heading font-extrabold" style={{ color: currentPhase.color }}>{currentPhase.name}</p>
            </div>
          )}
        </div>
        <div className="rounded-full h-4 overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>
          <div className="h-4 rounded-full animate-progress" style={{
            width: `${overallProgress}%`,
            background: `linear-gradient(90deg, var(--phase-1), var(--phase-2), var(--phase-3))`,
          }} />
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-1 font-bold stat-number">{overallProgress}% complete</p>

        <div className="flex gap-1.5 mt-4">
          {phases.map((phase, i) => {
            const phaseSessions = sessions.filter((s) => s.weekNumber >= phase.weeks[0] && s.weekNumber <= phase.weeks[1]);
            const phaseCompleted = phaseSessions.filter((s) => s.completed).length;
            const pct = phaseSessions.length > 0 ? Math.round((phaseCompleted / phaseSessions.length) * 100) : 0;
            const isCurrent = currentPhase?.id === phase.id;
            return (
              <div key={phase.id} className={`flex-1 rounded-xl p-2.5 text-center transition-all ${isCurrent ? 'ring-2 ring-offset-2 shadow-md' : ''}`}
                style={{
                  backgroundColor: phase.color + '15',
                  ...(isCurrent ? { ringColor: phase.color } : {}),
                }}>
                <p className="text-[10px] font-extrabold truncate" style={{ color: phase.color }}>{phase.name}</p>
                <p className="text-[10px] text-[var(--text-secondary)]">W{phase.weeks[0]}-{phase.weeks[1]}</p>
                <p className="text-sm font-extrabold stat-number mt-1" style={{ color: phase.color }}>{pct}%</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Phase Sections */}
      {phases.map((phase) => {
        const phaseWeeks = calendar.filter((w) => w.weekNumber >= phase.weeks[0] && w.weekNumber <= phase.weeks[1]);
        if (phaseWeeks.length === 0) return null;
        return (
          <div key={phase.id} className="animate-fade-in-up">
            <div className="flex items-center gap-3 mb-3 mt-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: phase.color }} />
              <h2 className="text-lg font-heading font-extrabold" style={{ color: phase.color }}>Phase {phase.id}: {phase.name}</h2>
              <span className="text-xs text-[var(--text-secondary)] font-medium">— {phase.description}</span>
            </div>

            <div className="space-y-3">
              {phaseWeeks.map((week) => {
                const weekSessions = sessions.filter((s) => s.weekNumber === week.weekNumber);
                const weekCompleted = weekSessions.filter((s) => s.completed).length;
                const isCurrent = week.weekNumber === currentWeekNum;
                const isPast = week.weekNumber < currentWeekNum;
                const isAllDone = weekSessions.length > 0 && weekCompleted === weekSessions.length;
                const isPartial = weekCompleted > 0 && weekCompleted < weekSessions.length;
                const isExpanded = expandedWeek === week.weekNumber;

                return (
                  <div key={week.weekNumber}
                    className={`card-flat transition-all ${isCurrent ? 'ring-2 ring-offset-2 shadow-lg' : ''} ${isAllDone && !isCurrent ? 'opacity-60' : ''}`}
                    style={isCurrent ? { borderColor: phase.color, boxShadow: `0 0 0 2px ${phase.color}40` } : {}}>
                    <div className="flex items-center gap-4 p-4">
                      <button onClick={() => setExpandedWeek(isExpanded ? null : week.weekNumber)}
                        className="flex items-center gap-4 flex-1 text-left">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shrink-0 ${isCurrent ? 'animate-pulse-soft' : ''}`}
                          style={{ backgroundColor: isAllDone ? 'var(--success)' : isPast ? '#9ca3af' : phase.color }}>
                          {isAllDone ? '✅' : `W${week.weekNumber}`}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-heading font-bold" style={{ color: 'var(--dark)' }}>{week.focus}</h3>
                            {isCurrent && (
                              <span className="text-[10px] px-2.5 py-1 rounded-full font-extrabold" style={{ backgroundColor: phase.color + '20', color: phase.color }}>This Week</span>
                            )}
                          </div>
                          <p className="text-xs text-[var(--text-secondary)]">{week.notes}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className="text-sm font-extrabold stat-number" style={{ color: 'var(--dark)' }}>{weekCompleted}/{weekSessions.length}</p>
                            <p className="text-[10px] text-[var(--text-secondary)] font-bold">sessions</p>
                          </div>
                          <svg className={`w-4 h-4 text-[var(--text-secondary)] transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => openEditWeek(week)} className="text-sm text-[var(--text-secondary)] hover:text-[var(--dark)] p-1" title="Edit week">✏️</button>
                        <button onClick={() => setDeleteWeekNum(week.weekNumber)} className="text-sm text-[var(--text-secondary)] hover:text-[var(--danger)] p-1" title="Delete week">🗑️</button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t p-4 space-y-3" style={{ borderColor: 'var(--background)' }}>
                        {weekSessions.length > 0 ? weekSessions.map((session) => (
                          <div key={session.id} className="rounded-xl p-4 transition-all"
                            style={{
                              backgroundColor: session.completed ? 'rgba(0, 214, 143, 0.06)' : 'var(--background)',
                              border: `1px solid ${session.completed ? 'rgba(0, 214, 143, 0.2)' : 'transparent'}`,
                            }}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <button onClick={() => toggleSession(session.id)}
                                  className="w-6 h-6 rounded-lg flex items-center justify-center transition-all"
                                  style={{
                                    backgroundColor: session.completed ? 'var(--success)' : 'transparent',
                                    border: session.completed ? '2px solid var(--success)' : '2px solid #d1d5db',
                                    color: session.completed ? 'white' : 'transparent',
                                  }}>
                                  {session.completed && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                </button>
                                <div>
                                  <p className={`font-bold text-sm ${session.completed ? 'line-through text-[var(--text-secondary)]' : ''}`} style={!session.completed ? { color: 'var(--dark)' } : {}}>{session.focus}</p>
                                  <p className="text-xs text-[var(--text-secondary)]">{session.day} — {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {session.drills.length > 0 && (
                                  <span className="text-xs text-[var(--text-secondary)] font-bold">{session.drills.reduce((t, d) => t + d.duration, 0)} min</span>
                                )}
                                <button onClick={() => openEditSession(session)} className="text-xs text-[var(--text-secondary)] hover:text-[var(--dark)]" title="Edit session">✏️</button>
                              </div>
                            </div>
                            {session.drills.length > 0 && (
                              <div className="ml-9 mt-2 space-y-1">
                                {session.drills.map((drill, i) => (
                                  <div key={i} className="flex items-center justify-between text-xs">
                                    <span className="text-[var(--text-secondary)]">{drill.name}</span>
                                    <span className="text-[var(--text-secondary)] shrink-0 ml-2 font-bold">{drill.duration} min</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )) : (
                          <p className="text-sm text-[var(--text-secondary)] text-center py-4">No sessions for this week.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Extra Weeks */}
      {(() => {
        const maxPhaseWeek = phases.length > 0 ? phases[phases.length - 1].weeks[1] : 0;
        const extraWeeks = calendar.filter((w) => w.weekNumber > maxPhaseWeek);
        if (extraWeeks.length === 0) return null;
        return (
          <div className="animate-fade-in-up">
            <div className="flex items-center gap-3 mb-3 mt-2">
              <div className="w-4 h-4 rounded-full bg-gray-400" />
              <h2 className="text-lg font-heading font-extrabold text-[var(--text-secondary)]">Extra Weeks</h2>
            </div>
            <div className="space-y-3">
              {extraWeeks.map((week) => {
                const weekSessions = sessions.filter((s) => s.weekNumber === week.weekNumber);
                const weekCompleted = weekSessions.filter((s) => s.completed).length;
                const isExpanded = expandedWeek === week.weekNumber;
                return (
                  <div key={week.weekNumber} className="card-flat">
                    <div className="flex items-center gap-4 p-4">
                      <button onClick={() => setExpandedWeek(isExpanded ? null : week.weekNumber)}
                        className="flex items-center gap-4 flex-1 text-left">
                        <div className="w-12 h-12 rounded-xl bg-gray-400 flex items-center justify-center text-white font-extrabold text-sm shrink-0">W{week.weekNumber}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-heading font-bold" style={{ color: 'var(--dark)' }}>{week.focus}</h3>
                          <p className="text-xs text-[var(--text-secondary)]">{week.notes}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-extrabold stat-number" style={{ color: 'var(--dark)' }}>{weekCompleted}/{weekSessions.length}</p>
                        </div>
                      </button>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => openEditWeek(week)} className="text-sm text-[var(--text-secondary)] hover:text-[var(--dark)] p-1">✏️</button>
                        <button onClick={() => setDeleteWeekNum(week.weekNumber)} className="text-sm text-[var(--text-secondary)] hover:text-[var(--danger)] p-1">🗑️</button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="border-t p-4 space-y-3" style={{ borderColor: 'var(--background)' }}>
                        {weekSessions.map((session) => (
                          <div key={session.id} className="rounded-xl p-4" style={{
                            backgroundColor: session.completed ? 'rgba(0, 214, 143, 0.06)' : 'var(--background)',
                            border: `1px solid ${session.completed ? 'rgba(0, 214, 143, 0.2)' : 'transparent'}`,
                          }}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <button onClick={() => toggleSession(session.id)}
                                  className="w-6 h-6 rounded-lg flex items-center justify-center transition-all"
                                  style={{
                                    backgroundColor: session.completed ? 'var(--success)' : 'transparent',
                                    border: session.completed ? '2px solid var(--success)' : '2px solid #d1d5db',
                                    color: session.completed ? 'white' : 'transparent',
                                  }}>
                                  {session.completed && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                </button>
                                <div>
                                  <p className={`font-bold text-sm ${session.completed ? 'line-through text-[var(--text-secondary)]' : ''}`} style={!session.completed ? { color: 'var(--dark)' } : {}}>{session.focus}</p>
                                  <p className="text-xs text-[var(--text-secondary)]">{session.day} — {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                </div>
                              </div>
                              <button onClick={() => openEditSession(session)} className="text-xs text-[var(--text-secondary)] hover:text-[var(--dark)]">✏️</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function WeekFormModal({ show, onClose, isEdit, focus, setFocus, notes, setNotes, startDate, setStartDate, onSave }: {
  show: boolean; onClose: () => void; isEdit: boolean;
  focus: string; setFocus: (v: string) => void;
  notes: string; setNotes: (v: string) => void;
  startDate: string; setStartDate: (v: string) => void;
  onSave: () => void;
}) {
  return (
    <Modal open={show} onClose={onClose} title={isEdit ? 'Edit Week' : 'Add Week'}
      footer={<div className="flex gap-3"><button onClick={onSave} className="flex-1 btn-primary">Save</button><button onClick={onClose} className="flex-1 btn-secondary">Cancel</button></div>}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-[var(--dark)] mb-1">Week Focus</label>
          <input type="text" value={focus} onChange={(e) => setFocus(e.target.value)} className="w-full px-3 py-2.5 text-sm" placeholder="e.g. Throwing Fundamentals" />
        </div>
        <div>
          <label className="block text-sm font-bold text-[var(--dark)] mb-1">Notes / Description</label>
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2.5 text-sm" placeholder="e.g. Focus on form over speed" />
        </div>
        <div>
          <label className="block text-sm font-bold text-[var(--dark)] mb-1">Week Start Date (Monday)</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2.5 text-sm" />
        </div>
      </div>
    </Modal>
  );
}
