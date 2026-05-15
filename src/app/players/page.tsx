'use client';

import { useState } from 'react';
import { useInitialize, useForceUpdate } from '@/hooks/useLocalStorage';
import { store } from '@/lib/store';
import { overallAverage } from '@/lib/types';
import type { Player, Position, SkillLevel } from '@/lib/types';
import Link from 'next/link';
import Modal from '@/components/Modal';

const POSITIONS: Position[] = ['Handler', 'Cutter', 'Hybrid'];
const LEVELS: SkillLevel[] = ['A', 'B', 'C'];
const AVATAR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#14b8a6'];

export default function PlayersPage() {
  const ready = useInitialize();
  const refresh = useForceUpdate();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formJersey, setFormJersey] = useState(0);
  const [formPosition, setFormPosition] = useState<Position>('Handler');
  const [formLevel, setFormLevel] = useState<SkillLevel>('B');
  const [formColor, setFormColor] = useState(AVATAR_COLORS[0]);
  const [filterPosition, setFilterPosition] = useState<string>('All');
  const [filterLevel, setFilterLevel] = useState<string>('All');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  if (!ready) return <div className="animate-pulse h-96 bg-gray-200 rounded-xl" />;

  const players = store.getPlayers();
  const practices = store.getPractices();
  const skillTests = store.getSkillTests();

  let filtered = players;
  if (filterPosition !== 'All') filtered = filtered.filter((p) => p.position === filterPosition);
  if (filterLevel !== 'All') filtered = filtered.filter((p) => p.skillLevel === filterLevel);

  function openNew() {
    setEditingId(null);
    setFormName('');
    setFormJersey(Math.max(0, ...players.map((p) => p.jerseyNumber)) + 1);
    setFormPosition('Handler');
    setFormLevel('B');
    setFormColor(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]);
    setShowForm(true);
  }

  function openEdit(p: Player) {
    setEditingId(p.id);
    setFormName(p.name);
    setFormJersey(p.jerseyNumber);
    setFormPosition(p.position);
    setFormLevel(p.skillLevel);
    setFormColor(p.avatarColor);
    setShowForm(true);
  }

  function save() {
    if (!formName.trim()) return;
    if (editingId) {
      const existing = players.find((p) => p.id === editingId)!;
      store.updatePlayer({ ...existing, name: formName.trim(), jerseyNumber: formJersey, position: formPosition, skillLevel: formLevel, avatarColor: formColor });
    } else {
      store.addPlayer({
        id: `p-${Date.now()}`,
        name: formName.trim(),
        jerseyNumber: formJersey,
        position: formPosition,
        skillLevel: formLevel,
        joinedDate: new Date().toISOString().split('T')[0],
        avatarColor: formColor,
      });
    }
    setShowForm(false);
    refresh();
  }

  function confirmDelete(id: string) {
    store.deletePlayer(id);
    setDeleteConfirmId(null);
    setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; });
    refresh();
  }

  function bulkDelete() {
    selected.forEach((id) => store.deletePlayer(id));
    setSelected(new Set());
    setBulkDeleteConfirm(false);
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
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p.id)));
    }
  }

  const levelColors = { A: 'bg-green-100 text-green-700', B: 'bg-blue-100 text-blue-700', C: 'bg-gray-100 text-gray-600' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Players</h1>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Position Filter */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {['All', ...POSITIONS].map((pos) => (
              <button key={pos} onClick={() => setFilterPosition(pos)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  filterPosition === pos ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}>{pos}</button>
            ))}
          </div>
          {/* Level Filter */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {['All', ...LEVELS].map((lvl) => (
              <button key={lvl} onClick={() => setFilterLevel(lvl)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  filterLevel === lvl ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}>{lvl === 'All' ? 'All Levels' : `Level ${lvl}`}</button>
            ))}
          </div>
          <button onClick={openNew} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
            + Add Player
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {players.length > 0 && (
        <div className="flex items-center gap-3">
          <button onClick={toggleSelectAll}
            className="text-xs text-purple-600 hover:text-purple-800 font-medium">
            {selected.size === filtered.length && filtered.length > 0 ? 'Deselect All' : 'Select All'}
          </button>
          {selected.size > 0 && (
            <button onClick={() => setBulkDeleteConfirm(true)}
              className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium transition-colors">
              Delete Selected ({selected.size})
            </button>
          )}
        </div>
      )}

      {/* Form Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Player' : 'New Player'}
        footer={
          <div className="flex gap-3">
            <button onClick={save} className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700">Save</button>
            <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          </div>
        }>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Player name" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jersey #</label>
              <input type="number" value={formJersey} onChange={(e) => setFormJersey(parseInt(e.target.value) || 0)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
              <select value={formPosition} onChange={(e) => setFormPosition(e.target.value as Position)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
              <select value={formLevel} onChange={(e) => setFormLevel(e.target.value as SkillLevel)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {LEVELS.map((l) => <option key={l} value={l}>Level {l}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <div className="flex gap-2 flex-wrap">
              {AVATAR_COLORS.map((c) => (
                <button key={c} onClick={() => setFormColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform ${formColor === c ? 'ring-2 ring-purple-500 ring-offset-2 scale-110' : ''}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} title="Delete Player"
        footer={
          <div className="flex gap-3">
            <button onClick={() => deleteConfirmId && confirmDelete(deleteConfirmId)}
              className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700">Delete</button>
            <button onClick={() => setDeleteConfirmId(null)}
              className="flex-1 border border-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          </div>
        }>
        <p className="text-sm text-gray-600">
          Are you sure you want to delete <strong>{players.find((p) => p.id === deleteConfirmId)?.name}</strong>?
          This will also remove their attendance records and skill evaluations.
        </p>
      </Modal>

      {/* Bulk Delete Confirm Modal */}
      <Modal open={bulkDeleteConfirm} onClose={() => setBulkDeleteConfirm(false)} title="Delete Selected Players"
        footer={
          <div className="flex gap-3">
            <button onClick={bulkDelete}
              className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700">Delete {selected.size} Players</button>
            <button onClick={() => setBulkDeleteConfirm(false)}
              className="flex-1 border border-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          </div>
        }>
        <p className="text-sm text-gray-600">
          Are you sure you want to delete <strong>{selected.size} players</strong>?
          This will also remove their attendance records and skill evaluations.
        </p>
      </Modal>

      {/* Empty State */}
      {players.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-lg font-semibold text-gray-700 mb-1">No players yet</p>
          <p className="text-sm text-gray-500 mb-4">Add your first player to get started tracking your team.</p>
          <button onClick={openNew} className="bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
            + Add First Player
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-sm">No players match the current filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((player) => {
            const attended = practices.filter((p) => p.attendees.includes(player.id)).length;
            const attendRate = practices.length > 0 ? Math.round((attended / practices.length) * 100) : 0;
            const tests = skillTests.filter((t) => t.playerId === player.id);
            const latestTest = tests.sort((a, b) => b.date.localeCompare(a.date))[0];
            const avgScore = latestTest ? overallAverage(latestTest.scores).toFixed(1) : '—';
            const isSelected = selected.has(player.id);

            return (
              <div key={player.id} className={`bg-white rounded-xl border p-5 transition-shadow group relative ${
                isSelected ? 'border-purple-400 ring-2 ring-purple-100' : 'border-gray-200 hover:shadow-md'
              }`}>
                {/* Checkbox */}
                <button onClick={() => toggleSelect(player.id)}
                  className={`absolute top-3 left-3 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-purple-500 border-purple-500 text-white' : 'border-gray-300 hover:border-purple-400'
                  }`}>
                  {isSelected && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </button>

                <Link href={`/players/${player.id}`} className="block">
                  <div className="flex items-start gap-3 ml-5">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0"
                      style={{ backgroundColor: player.avatarColor }}>{player.name.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate group-hover:text-purple-700 transition-colors">{player.name}</h3>
                        <span className="text-xs text-gray-400">#{player.jerseyNumber}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{player.position}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${levelColors[player.skillLevel]}`}>{player.skillLevel}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-lg font-bold text-purple-700">{avgScore}</p>
                      <p className="text-[10px] text-gray-500 uppercase">Skill Avg</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{attended}</p>
                      <p className="text-[10px] text-gray-500 uppercase">Practices</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{attendRate}%</p>
                      <p className="text-[10px] text-gray-500 uppercase">Attend</p>
                    </div>
                  </div>
                </Link>

                {/* Action buttons */}
                <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.preventDefault(); openEdit(player); }}
                    className="text-sm text-gray-400 hover:text-purple-600 p-1" title="Edit">✏️</button>
                  <button onClick={(e) => { e.preventDefault(); setDeleteConfirmId(player.id); }}
                    className="text-sm text-gray-400 hover:text-red-500 p-1" title="Delete">🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
