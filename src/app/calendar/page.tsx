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

  // Week form
  const [showWeekForm, setShowWeekForm] = useState(false);
  const [editWeekNum, setEditWeekNum] = useState<number | null>(null);
  const [weekFocus, setWeekFocus] = useState('');
  const [weekNotes, setWeekNotes] = useState('');
  const [weekStartDate, setWeekStartDate] = useState('');

  // Session editing within week
  const [editSessionId, setEditSessionId] = useState<string | null>(null);
  const [sessionFocus, setSessionFocus] = useState('');
  const [sessionDay, setSessionDay] = useState<SessionDay>('Mon');
  const [sessionDate, setSessionDate] = useState('');

  // Delete
  const [deleteWeekNum, setDeleteWeekNum] = useState<number | null>(null);

  if (!ready) return <div className="animate-pulse h-96 bg-gray-200 rounded-xl" />;

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

  function toggleSession(id: string) {
    store.toggleSessionComplete(id);
    refresh();
  }

  // Week CRUD
  function openNewWeek() {
    const maxWeek = calendar.length > 0 ? Math.max(...calendar.map((w) => w.weekNumber)) : 0;
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
      // Create default sessions for this week
      const days = settings.trainingDays.slice(0, settings.sessionsPerWeek);
      days.forEach((day, i) => {
        const d = new Date(weekStartDate);
        const dayOffset = ALL_DAYS.indexOf(day);
        const startDay = d.getDay() === 0 ? 6 : d.getDay() - 1; // Mon=0
        d.setDate(d.getDate() + (dayOffset - startDay + 7) % 7);
        store.addSession({
          id: `s-${Date.now()}-${i}`,
          weekNumber: newNum,
          day,
          date: d.toISOString().split('T')[0],
          focus: `${weekFocus.trim()} - Session ${i + 1}`,
          drills: [],
          completed: false,
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

  // Session editing
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

  if (calendar.length === 0 && sessions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Training Schedule</h1>
          <button onClick={openNewWeek} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
            + Add Week
          </button>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-lg font-semibold text-gray-700 mb-1">No schedule set up yet</p>
          <p className="text-sm text-gray-500 mb-4">Add your first training week to build your {totalWeeks}-week schedule.</p>
          <button onClick={openNewWeek} className="bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
            + Add First Week
          </button>
        </div>
        <WeekFormModal show={showWeekForm} onClose={() => setShowWeekForm(false)} isEdit={false}
          focus={weekFocus} setFocus={setWeekFocus} notes={weekNotes} setNotes={setWeekNotes}
          startDate={weekStartDate} setStartDate={setWeekStartDate} onSave={saveWeek} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Training Schedule</h1>
        <button onClick={openNewWeek} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
          + Add Week
        </button>
      </div>

      {/* Modals */}
      <WeekFormModal show={showWeekForm} onClose={() => setShowWeekForm(false)} isEdit={editWeekNum !== null}
        focus={weekFocus} setFocus={setWeekFocus} notes={weekNotes} setNotes={setWeekNotes}
        startDate={weekStartDate} setStartDate={setWeekStartDate} onSave={saveWeek} />

      <Modal open={deleteWeekNum !== null} onClose={() => setDeleteWeekNum(null)} title="Delete Week"
        footer={
          <div className="flex gap-3">
            <button onClick={confirmDeleteWeek} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700">Delete</button>
            <button onClick={() => setDeleteWeekNum(null)} className="flex-1 border border-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          </div>
        }>
        <p className="text-sm text-gray-600">Delete Week {deleteWeekNum} and all its sessions? This cannot be undone.</p>
      </Modal>

      <Modal open={!!editSessionId} onClose={() => setEditSessionId(null)} title="Edit Session"
        footer={
          <div className="flex gap-3">
            <button onClick={saveSession} className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700">Save</button>
            <button onClick={() => setEditSessionId(null)} className="flex-1 border border-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          </div>
        }>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session Name</label>
            <input type="text" value={sessionFocus} onChange={(e) => setSessionFocus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
              <select value={sessionDay} onChange={(e) => setSessionDay(e.target.value as SessionDay)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {ALL_DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
        </div>
      </Modal>

      {/* Overall Progress */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm text-gray-500">Overall Progress</p>
            <p className="text-2xl font-bold">{completedSessions}/{totalSessions} sessions</p>
          </div>
          {currentPhase && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Current Phase</p>
              <p className="text-lg font-bold" style={{ color: currentPhase.color }}>{currentPhase.name}</p>
            </div>
          )}
        </div>
        <div className="bg-gray-100 rounded-full h-4 overflow-hidden">
          <div className="h-4 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all" style={{ width: `${overallProgress}%` }} />
        </div>
        <p className="text-xs text-gray-400 mt-1">{overallProgress}% complete</p>

        <div className="flex gap-1 mt-4">
          {phases.map((phase) => {
            const phaseSessions = sessions.filter((s) => s.weekNumber >= phase.weeks[0] && s.weekNumber <= phase.weeks[1]);
            const phaseCompleted = phaseSessions.filter((s) => s.completed).length;
            const pct = phaseSessions.length > 0 ? Math.round((phaseCompleted / phaseSessions.length) * 100) : 0;
            const isCurrent = currentPhase?.id === phase.id;
            return (
              <div key={phase.id} className={`flex-1 rounded-lg p-2 text-center ${isCurrent ? 'ring-2 ring-offset-1' : ''}`}
                style={{ backgroundColor: phase.color + '15', borderColor: phase.color, ...(isCurrent ? { ringColor: phase.color } : {}) }}>
                <p className="text-[10px] font-semibold truncate" style={{ color: phase.color }}>{phase.name}</p>
                <p className="text-xs text-gray-500">W{phase.weeks[0]}-{phase.weeks[1]}</p>
                <p className="text-xs font-bold mt-1">{pct}%</p>
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
          <div key={phase.id}>
            <div className="flex items-center gap-3 mb-3 mt-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: phase.color }} />
              <h2 className="text-lg font-bold" style={{ color: phase.color }}>Phase {phase.id}: {phase.name}</h2>
              <span className="text-xs text-gray-500">— {phase.description}</span>
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

                let bgClass = 'border-gray-200';
                if (isCurrent) bgClass = 'border-green-400 ring-2 ring-green-100 shadow-md';
                else if (isAllDone) bgClass = 'border-green-300 bg-green-50/30';
                else if (isPartial) bgClass = 'border-yellow-300 bg-yellow-50/30';
                else if (isPast) bgClass = 'border-gray-200 opacity-70';

                return (
                  <div key={week.weekNumber} className={`bg-white rounded-xl border transition-all ${bgClass}`}>
                    <div className="flex items-center gap-4 p-4">
                      <button onClick={() => setExpandedWeek(isExpanded ? null : week.weekNumber)}
                        className="flex items-center gap-4 flex-1 text-left">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                          isCurrent ? 'bg-green-500' : isAllDone ? 'bg-green-400' : isPast ? 'bg-gray-400' : ''
                        }`} style={!isCurrent && !isAllDone && !isPast ? { backgroundColor: phase.color } : {}}>
                          {isAllDone ? '✅' : `W${week.weekNumber}`}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold">{week.focus}</h3>
                            {isCurrent && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">This Week</span>}
                          </div>
                          <p className="text-xs text-gray-500">{week.notes}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className="text-sm font-bold">{weekCompleted}/{weekSessions.length}</p>
                            <p className="text-[10px] text-gray-400">sessions</p>
                          </div>
                          <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>
                      {/* Week actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => openEditWeek(week)} className="text-sm text-gray-400 hover:text-purple-600 p-1" title="Edit week">✏️</button>
                        <button onClick={() => setDeleteWeekNum(week.weekNumber)} className="text-sm text-gray-400 hover:text-red-500 p-1" title="Delete week">🗑️</button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-gray-100 p-4 space-y-3">
                        {weekSessions.length > 0 ? weekSessions.map((session) => (
                          <div key={session.id} className={`rounded-lg border p-4 ${session.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => toggleSession(session.id)}
                                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                                    session.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-green-400'
                                  }`}
                                >
                                  {session.completed && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                </button>
                                <div>
                                  <p className={`font-medium text-sm ${session.completed ? 'line-through text-gray-500' : ''}`}>{session.focus}</p>
                                  <p className="text-xs text-gray-400">{session.day} — {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {session.drills.length > 0 && (
                                  <span className="text-xs text-gray-400">{session.drills.reduce((t, d) => t + d.duration, 0)} min</span>
                                )}
                                <button onClick={() => openEditSession(session)} className="text-xs text-gray-400 hover:text-purple-600" title="Edit session">✏️</button>
                              </div>
                            </div>
                            {session.drills.length > 0 && (
                              <div className="ml-8 mt-2 space-y-1">
                                {session.drills.map((drill, i) => (
                                  <div key={i} className="flex items-center justify-between text-xs">
                                    <span className="text-gray-600">{drill.name}</span>
                                    <span className="text-gray-400 shrink-0 ml-2">{drill.duration} min</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )) : (
                          <p className="text-sm text-gray-400 text-center py-4">No sessions for this week.</p>
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

      {/* Weeks not in any phase */}
      {(() => {
        const maxPhaseWeek = phases.length > 0 ? phases[phases.length - 1].weeks[1] : 0;
        const extraWeeks = calendar.filter((w) => w.weekNumber > maxPhaseWeek);
        if (extraWeeks.length === 0) return null;
        return (
          <div>
            <div className="flex items-center gap-3 mb-3 mt-2">
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <h2 className="text-lg font-bold text-gray-500">Extra Weeks</h2>
            </div>
            <div className="space-y-3">
              {extraWeeks.map((week) => {
                const weekSessions = sessions.filter((s) => s.weekNumber === week.weekNumber);
                const weekCompleted = weekSessions.filter((s) => s.completed).length;
                const isExpanded = expandedWeek === week.weekNumber;
                return (
                  <div key={week.weekNumber} className="bg-white rounded-xl border border-gray-200">
                    <div className="flex items-center gap-4 p-4">
                      <button onClick={() => setExpandedWeek(isExpanded ? null : week.weekNumber)}
                        className="flex items-center gap-4 flex-1 text-left">
                        <div className="w-11 h-11 rounded-xl bg-gray-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          W{week.weekNumber}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold">{week.focus}</h3>
                          <p className="text-xs text-gray-500">{week.notes}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold">{weekCompleted}/{weekSessions.length}</p>
                        </div>
                      </button>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => openEditWeek(week)} className="text-sm text-gray-400 hover:text-purple-600 p-1">✏️</button>
                        <button onClick={() => setDeleteWeekNum(week.weekNumber)} className="text-sm text-gray-400 hover:text-red-500 p-1">🗑️</button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="border-t border-gray-100 p-4 space-y-3">
                        {weekSessions.map((session) => (
                          <div key={session.id} className={`rounded-lg border p-4 ${session.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <button onClick={() => toggleSession(session.id)}
                                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                                    session.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-green-400'
                                  }`}>
                                  {session.completed && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                </button>
                                <div>
                                  <p className={`font-medium text-sm ${session.completed ? 'line-through text-gray-500' : ''}`}>{session.focus}</p>
                                  <p className="text-xs text-gray-400">{session.day} — {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                </div>
                              </div>
                              <button onClick={() => openEditSession(session)} className="text-xs text-gray-400 hover:text-purple-600">✏️</button>
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
      footer={
        <div className="flex gap-3">
          <button onClick={onSave} className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700">Save</button>
          <button onClick={onClose} className="flex-1 border border-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
        </div>
      }>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Week Focus</label>
          <input type="text" value={focus} onChange={(e) => setFocus(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Throwing Fundamentals" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Description</label>
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Focus on form over speed" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Week Start Date (Monday)</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>
    </Modal>
  );
}
