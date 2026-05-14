'use client';

import { useState } from 'react';
import { useInitialize, useForceUpdate } from '@/hooks/useLocalStorage';
import { store } from '@/lib/store';
import { PHASES } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function AttendancePage() {
  const ready = useInitialize();
  const refresh = useForceUpdate();
  const [quickSessionId, setQuickSessionId] = useState<string | null>(null);
  const [quickAttendees, setQuickAttendees] = useState<string[]>([]);

  if (!ready) return <div className="animate-pulse h-96 bg-gray-200 rounded-xl" />;

  const players = store.getPlayers();
  const practices = store.getPractices();
  const sessions = store.getSessions();
  const calendar = store.getCalendar();

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

  // Sessions that are completed but don't have attendance recorded yet
  const completedSessions = sessions.filter((s) => s.completed);
  const unrecordedSessions = completedSessions.filter((s) => !practices.find((p) => p.sessionId === s.id));

  function openQuickAttendance(sessionId: string) {
    const existing = practices.find((p) => p.sessionId === sessionId);
    setQuickSessionId(sessionId);
    setQuickAttendees(existing ? [...existing.attendees] : []);
  }

  function togglePlayer(playerId: string) {
    setQuickAttendees((prev) => prev.includes(playerId) ? prev.filter((x) => x !== playerId) : [...prev, playerId]);
  }

  function saveQuickAttendance() {
    if (!quickSessionId) return;
    const session = sessions.find((s) => s.id === quickSessionId);
    if (!session) return;
    const existing = practices.find((p) => p.sessionId === quickSessionId);
    if (existing) {
      store.updatePractice({ ...existing, attendees: quickAttendees });
    } else {
      store.addPractice({
        id: `pr-${Date.now()}`,
        sessionId: quickSessionId,
        date: session.date,
        type: session.focus.split(' ')[0],
        notes: session.focus,
        attendees: quickAttendees,
      });
    }
    setQuickSessionId(null);
    refresh();
  }

  function getPhaseForWeek(weekNum: number) {
    return PHASES.find((p) => weekNum >= p.weeks[0] && weekNum <= p.weeks[1]);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Attendance</h1>

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

      {/* Unrecorded Sessions Alert */}
      {unrecordedSessions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-700 mb-2">{unrecordedSessions.length} completed sessions need attendance</p>
          <div className="flex flex-wrap gap-2">
            {unrecordedSessions.slice(0, 6).map((s) => (
              <button key={s.id} onClick={() => openQuickAttendance(s.id)}
                className="text-xs bg-white border border-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors">
                W{s.weekNumber} {s.day} — {s.focus.slice(0, 25)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Attendance Modal */}
      {quickSessionId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            {(() => {
              const session = sessions.find((s) => s.id === quickSessionId);
              return session ? (
                <>
                  <h2 className="text-lg font-semibold mb-1">Quick Attendance</h2>
                  <p className="text-sm text-gray-500 mb-4">{session.focus} — {session.day}, {new Date(session.date).toLocaleDateString()}</p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">{quickAttendees.length}/{players.length} present</span>
                    <div className="flex gap-2">
                      <button onClick={() => setQuickAttendees(players.map((p) => p.id))} className="text-xs text-purple-600 hover:text-purple-800">All</button>
                      <button onClick={() => setQuickAttendees([])} className="text-xs text-gray-500 hover:text-gray-700">None</button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {players.map((p) => (
                      <button key={p.id} onClick={() => togglePlayer(p.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                          quickAttendees.includes(p.id) ? 'bg-green-50 text-green-800 ring-1 ring-green-200' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}>
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                          quickAttendees.includes(p.id) ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
                        }`}>
                          {quickAttendees.includes(p.id) && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ backgroundColor: p.avatarColor }}>{p.name.charAt(0)}</div>
                        <span className="flex-1">{p.name}</span>
                        <span className="text-xs text-gray-400">#{p.jerseyNumber}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button onClick={saveQuickAttendance} className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700">Save</button>
                    <button onClick={() => setQuickSessionId(null)} className="flex-1 border border-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                  </div>
                </>
              ) : null;
            })()}
          </div>
        </div>
      )}

      {/* Session Attendance Grid */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Session Attendance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Session</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Phase</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Present</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {completedSessions.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30).map((session) => {
                const practice = practices.find((p) => p.sessionId === session.id);
                const phase = getPhaseForWeek(session.weekNumber);
                return (
                  <tr key={session.id} className="border-b border-gray-100 hover:bg-gray-50">
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
                      <button onClick={() => openQuickAttendance(session.id)}
                        className="text-xs text-purple-600 hover:text-purple-800">
                        {practice ? 'Edit' : 'Record'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-Player Stats */}
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
    </div>
  );
}
