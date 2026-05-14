'use client';

import { useState } from 'react';
import { useInitialize, useForceUpdate } from '@/hooks/useLocalStorage';
import { store } from '@/lib/store';
import { PHASES } from '@/lib/types';

export default function CalendarPage() {
  const ready = useInitialize();
  const refresh = useForceUpdate();
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);

  if (!ready) return <div className="animate-pulse h-96 bg-gray-200 rounded-xl" />;

  const calendar = store.getCalendar();
  const sessions = store.getSessions();

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

  const currentPhase = PHASES.find((p) => currentWeekNum >= p.weeks[0] && currentWeekNum <= p.weeks[1]);

  function toggleSession(id: string) {
    store.toggleSessionComplete(id);
    refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">20-Week Training Schedule</h1>
      </div>

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

        {/* Phase Progress Segments */}
        <div className="flex gap-1 mt-4">
          {PHASES.map((phase) => {
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
      {PHASES.map((phase) => {
        const phaseWeeks = calendar.filter((w) => w.weekNumber >= phase.weeks[0] && w.weekNumber <= phase.weeks[1]);
        return (
          <div key={phase.id}>
            {/* Phase Header */}
            <div className="flex items-center gap-3 mb-3 mt-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: phase.color }} />
              <h2 className="text-lg font-bold" style={{ color: phase.color }}>Phase {phase.id}: {phase.name}</h2>
              <span className="text-xs text-gray-500">— {phase.description}</span>
            </div>

            {/* Weeks in this phase */}
            <div className="space-y-3">
              {phaseWeeks.map((week) => {
                const weekSessions = sessions.filter((s) => s.weekNumber === week.weekNumber);
                const weekCompleted = weekSessions.filter((s) => s.completed).length;
                const isCurrent = week.weekNumber === currentWeekNum;
                const isPast = week.weekNumber < currentWeekNum;
                const isExpanded = expandedWeek === week.weekNumber;

                return (
                  <div key={week.weekNumber}
                    className={`bg-white rounded-xl border transition-all ${
                      isCurrent ? 'border-green-400 ring-2 ring-green-100 shadow-md' : isPast ? 'border-gray-200 opacity-70' : 'border-gray-200'
                    }`}>
                    {/* Week Header - clickable */}
                    <button
                      onClick={() => setExpandedWeek(isExpanded ? null : week.weekNumber)}
                      className="w-full flex items-center gap-4 p-4 text-left"
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                        isCurrent ? 'bg-green-500' : isPast ? 'bg-gray-400' : ''
                      }`} style={!isCurrent && !isPast ? { backgroundColor: phase.color } : {}}>
                        W{week.weekNumber}
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
                          <p className="text-sm font-bold">{weekCompleted}/3</p>
                          <p className="text-[10px] text-gray-400">sessions</p>
                        </div>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {/* Expanded: 3 Sessions */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 p-4 space-y-3">
                        {weekSessions.map((session) => (
                          <div key={session.id} className={`rounded-lg border p-4 ${session.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                            <div className="flex items-center justify-between mb-2">
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
                              <span className="text-xs text-gray-400">{session.drills.reduce((t, d) => t + d.duration, 0)} min</span>
                            </div>
                            {/* Drills */}
                            <div className="ml-8 space-y-1">
                              {session.drills.map((drill, i) => (
                                <div key={i} className="flex items-center justify-between text-xs">
                                  <span className="text-gray-600">{drill.name}</span>
                                  <span className="text-gray-400 shrink-0 ml-2">{drill.duration} min</span>
                                </div>
                              ))}
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
      })}
    </div>
  );
}
