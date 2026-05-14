'use client';

import { useState } from 'react';
import { useInitialize, useForceUpdate } from '@/hooks/useLocalStorage';
import { store } from '@/lib/store';
import type { Practice } from '@/lib/types';

const PRACTICE_TYPES: Practice['type'][] = ['Regular', 'Scrimmage', 'Tournament Prep', 'Conditioning'];

export default function AttendancePage() {
  const ready = useInitialize();
  const refresh = useForceUpdate();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formDate, setFormDate] = useState('');
  const [formType, setFormType] = useState<Practice['type']>('Regular');
  const [formNotes, setFormNotes] = useState('');
  const [formAttendees, setFormAttendees] = useState<string[]>([]);

  if (!ready) return <div className="animate-pulse h-96 bg-gray-200 rounded-xl" />;

  const players = store.getPlayers();
  const practices = store.getPractices().sort((a, b) => b.date.localeCompare(a.date));

  function openNew() {
    setEditingId(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormType('Regular');
    setFormNotes('');
    setFormAttendees([]);
    setShowForm(true);
  }

  function openEdit(p: Practice) {
    setEditingId(p.id);
    setFormDate(p.date);
    setFormType(p.type);
    setFormNotes(p.notes);
    setFormAttendees([...p.attendees]);
    setShowForm(true);
  }

  function toggleAttendee(id: string) {
    setFormAttendees((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function selectAll() {
    setFormAttendees(players.map((p) => p.id));
  }

  function selectNone() {
    setFormAttendees([]);
  }

  function save() {
    if (!formDate) return;
    if (editingId) {
      store.updatePractice({
        id: editingId,
        date: formDate,
        type: formType,
        notes: formNotes,
        attendees: formAttendees,
      });
    } else {
      store.addPractice({
        id: `pr-${Date.now()}`,
        date: formDate,
        type: formType,
        notes: formNotes,
        attendees: formAttendees,
      });
    }
    setShowForm(false);
    refresh();
  }

  function deletePractice(id: string) {
    store.deletePractice(id);
    refresh();
  }

  const typeColors: Record<Practice['type'], string> = {
    Regular: 'bg-blue-100 text-blue-700',
    Scrimmage: 'bg-green-100 text-green-700',
    'Tournament Prep': 'bg-purple-100 text-purple-700',
    Conditioning: 'bg-orange-100 text-orange-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Practice Attendance</h1>
        <button onClick={openNew} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
          + New Practice
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">{editingId ? 'Edit Practice' : 'New Practice'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={formType} onChange={(e) => setFormType(e.target.value as Practice['type'])}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {PRACTICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input type="text" value={formNotes} onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Practice focus..." />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Attendance ({formAttendees.length}/{players.length})</label>
                  <div className="flex gap-2">
                    <button onClick={selectAll} className="text-xs text-purple-600 hover:text-purple-800">All</button>
                    <button onClick={selectNone} className="text-xs text-gray-500 hover:text-gray-700">None</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {players.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => toggleAttendee(p.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                        formAttendees.includes(p.id) ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-300' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: p.avatarColor }}>
                        {p.name.charAt(0)}
                      </div>
                      <span className="truncate">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={save} className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700">
                Save
              </button>
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Grid */}
      {practices.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No practices recorded yet. Add one to get started!</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-xl border border-gray-200 overflow-hidden">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Notes</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Present</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {practices.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">
                    {new Date(p.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${typeColors[p.type]}`}>{p.type}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.notes}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <div className="flex -space-x-1">
                        {p.attendees.slice(0, 5).map((aid) => {
                          const player = players.find((pl) => pl.id === aid);
                          return player ? (
                            <div key={aid} className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold"
                              style={{ backgroundColor: player.avatarColor }} title={player.name}>
                              {player.name.charAt(0)}
                            </div>
                          ) : null;
                        })}
                        {p.attendees.length > 5 && (
                          <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                            +{p.attendees.length - 5}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 ml-1">{p.attendees.length}/{players.length}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(p)} className="text-xs text-purple-600 hover:text-purple-800 mr-2">Edit</button>
                    <button onClick={() => deletePractice(p.id)} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
                  style={{ backgroundColor: player.avatarColor }}>
                  {player.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{player.name}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="h-2 rounded-full bg-purple-500 transition-all" style={{ width: `${rate}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-16 text-right">{attended}/{practices.length} ({rate}%)</span>
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
