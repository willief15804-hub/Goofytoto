'use client';

import { useState } from 'react';
import { useInitialize, useForceUpdate } from '@/hooks/useLocalStorage';
import { store } from '@/lib/store';
import type { CalendarWeek } from '@/lib/types';

export default function CalendarPage() {
  const ready = useInitialize();
  const refresh = useForceUpdate();
  const [editingWeek, setEditingWeek] = useState<CalendarWeek | null>(null);
  const [formFocus, setFormFocus] = useState('');
  const [formDrills, setFormDrills] = useState('');
  const [formNotes, setFormNotes] = useState('');

  if (!ready) return <div className="animate-pulse h-96 bg-gray-200 rounded-xl" />;

  const calendar = store.getCalendar();

  const now = new Date();
  const currentWeekIndex = calendar.findIndex((w) => {
    const start = new Date(w.startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return now >= start && now < end;
  });

  function openEdit(week: CalendarWeek) {
    setEditingWeek(week);
    setFormFocus(week.focus);
    setFormDrills(week.drills.join('\n'));
    setFormNotes(week.notes);
  }

  function saveEdit() {
    if (!editingWeek) return;
    store.updateWeek({
      ...editingWeek,
      focus: formFocus,
      drills: formDrills.split('\n').map((d) => d.trim()).filter(Boolean),
      notes: formNotes,
    });
    setEditingWeek(null);
    refresh();
  }

  function getWeekStatus(index: number): 'past' | 'current' | 'future' {
    if (currentWeekIndex === -1) {
      const lastWeek = calendar[calendar.length - 1];
      const lastEnd = new Date(lastWeek.startDate);
      lastEnd.setDate(lastEnd.getDate() + 7);
      return now >= lastEnd ? 'past' : 'future';
    }
    if (index < currentWeekIndex) return 'past';
    if (index === currentWeekIndex) return 'current';
    return 'future';
  }

  const focusColors: Record<string, string> = {
    'Fundamentals': 'bg-blue-500',
    'Offensive Concepts': 'bg-green-500',
    'Defense Basics': 'bg-red-500',
    'Conditioning': 'bg-orange-500',
    'Deep Game': 'bg-cyan-500',
    'Handler Movement': 'bg-purple-500',
    'Zone Offense': 'bg-emerald-500',
    'Zone Defense': 'bg-rose-500',
    'Scrimmage Week': 'bg-amber-500',
    'Endzone Offense': 'bg-lime-500',
    'Transition Play': 'bg-teal-500',
    'Advanced Throws': 'bg-indigo-500',
    'Team Chemistry': 'bg-pink-500',
    'Tournament Prep 1': 'bg-violet-500',
    'Tournament Prep 2': 'bg-violet-600',
    'Recovery & Film': 'bg-gray-500',
    'Intensive Drills': 'bg-red-600',
    'Skill Testing': 'bg-yellow-500',
    'Weakness Focus': 'bg-fuchsia-500',
    'Season Review': 'bg-sky-500',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">20-Week Training Calendar</h1>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Current</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300" /> Past</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400" /> Upcoming</span>
        </div>
      </div>

      {/* Edit Modal */}
      {editingWeek && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Edit Week {editingWeek.weekNumber}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Focus</label>
                <input type="text" value={formFocus} onChange={(e) => setFormFocus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Drills (one per line)</label>
                <textarea value={formDrills} onChange={(e) => setFormDrills(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={4} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input type="text" value={formNotes} onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={saveEdit} className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700">Save</button>
              <button onClick={() => setEditingWeek(null)} className="flex-1 border border-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-3">
        {calendar.map((week, index) => {
          const status = getWeekStatus(index);
          const startDate = new Date(week.startDate);
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 6);
          const colorClass = focusColors[week.focus] || 'bg-gray-500';

          return (
            <div
              key={week.weekNumber}
              className={`bg-white rounded-xl border p-4 transition-all ${
                status === 'current'
                  ? 'border-green-400 ring-2 ring-green-100 shadow-md'
                  : status === 'past'
                  ? 'border-gray-200 opacity-60'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Week Number */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                  status === 'current' ? 'bg-green-500' : status === 'past' ? 'bg-gray-400' : 'bg-purple-500'
                }`}>
                  W{week.weekNumber}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold">{week.focus}</h3>
                    <div className={`w-2 h-2 rounded-full ${colorClass}`} />
                    {status === 'current' && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">This Week</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {week.drills.map((drill, i) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">{drill}</span>
                    ))}
                  </div>
                  {week.notes && <p className="text-sm text-gray-500 italic">{week.notes}</p>}
                </div>

                {/* Edit Button */}
                <button onClick={() => openEdit(week)}
                  className="text-xs text-gray-400 hover:text-purple-600 shrink-0">
                  Edit
                </button>
              </div>

              {/* Progress bar for the entire season */}
              {status === 'current' && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Season Progress</span>
                    <span>{Math.round(((currentWeekIndex + 1) / calendar.length) * 100)}%</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full bg-green-500 transition-all"
                      style={{ width: `${((currentWeekIndex + 1) / calendar.length) * 100}%` }} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
