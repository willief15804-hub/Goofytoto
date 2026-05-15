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

  if (!ready) return <div className="animate-pulse h-96 rounded-2xl" style={{ backgroundColor: 'var(--primary)', opacity: 0.1 }} />;

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
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((p) => p.id)));
  }

  const levelColors: Record<string, { bg: string; text: string; border: string }> = {
    A: { bg: 'rgba(0, 214, 143, 0.15)', text: 'var(--success)', border: 'var(--success)' },
    B: { bg: 'rgba(78, 205, 196, 0.15)', text: 'var(--secondary)', border: 'var(--secondary)' },
    C: { bg: 'rgba(107, 114, 128, 0.15)', text: 'var(--text-secondary)', border: 'var(--text-secondary)' },
  };

  return (
    <div className="space-y-6 stagger-children">
      <div className="flex items-center justify-between flex-wrap gap-3 animate-fade-in-up">
        <h1 className="text-3xl font-heading font-extrabold" style={{ color: 'var(--dark)' }}>Players</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex rounded-xl p-0.5" style={{ backgroundColor: 'var(--background)' }}>
            {['All', ...POSITIONS].map((pos) => (
              <button key={pos} onClick={() => setFilterPosition(pos)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterPosition === pos ? 'text-[var(--dark)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--dark)]'
                }`}
                style={filterPosition === pos ? { background: 'var(--primary)' } : {}}>{pos}</button>
            ))}
          </div>
          <div className="flex rounded-xl p-0.5" style={{ backgroundColor: 'var(--background)' }}>
            {['All', ...LEVELS].map((lvl) => (
              <button key={lvl} onClick={() => setFilterLevel(lvl)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterLevel === lvl ? 'text-[var(--dark)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--dark)]'
                }`}
                style={filterLevel === lvl ? { background: 'var(--primary)' } : {}}>{lvl === 'All' ? 'All Levels' : `Level ${lvl}`}</button>
            ))}
          </div>
          <button onClick={openNew} className="btn-primary">+ Add Player</button>
        </div>
      </div>

      {players.length > 0 && (
        <div className="flex items-center gap-3 animate-fade-in-up">
          <button onClick={toggleSelectAll}
            className="text-xs font-bold transition-colors" style={{ color: 'var(--secondary)' }}>
            {selected.size === filtered.length && filtered.length > 0 ? 'Deselect All' : 'Select All'}
          </button>
          {selected.size > 0 && (
            <button onClick={() => setBulkDeleteConfirm(true)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl transition-colors"
              style={{ backgroundColor: 'rgba(255, 107, 107, 0.1)', color: 'var(--danger)' }}>
              Delete Selected ({selected.size})
            </button>
          )}
        </div>
      )}

      {/* Form Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Player' : 'New Player'}
        footer={
          <div className="flex gap-3">
            <button onClick={save} className="flex-1 btn-primary">Save</button>
            <button onClick={() => setShowForm(false)} className="flex-1 btn-secondary">Cancel</button>
          </div>
        }>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[var(--dark)] mb-1">Name</label>
            <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)}
              className="w-full px-3 py-2.5 text-sm" placeholder="Player name" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-bold text-[var(--dark)] mb-1">Jersey #</label>
              <input type="number" value={formJersey} onChange={(e) => setFormJersey(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--dark)] mb-1">Position</label>
              <select value={formPosition} onChange={(e) => setFormPosition(e.target.value as Position)}
                className="w-full px-3 py-2.5 text-sm">
                {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--dark)] mb-1">Level</label>
              <select value={formLevel} onChange={(e) => setFormLevel(e.target.value as SkillLevel)}
                className="w-full px-3 py-2.5 text-sm">
                {LEVELS.map((l) => <option key={l} value={l}>Level {l}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--dark)] mb-1">Color</label>
            <div className="flex gap-2 flex-wrap">
              {AVATAR_COLORS.map((c) => (
                <button key={c} onClick={() => setFormColor(c)}
                  className={`w-9 h-9 rounded-full transition-transform ${formColor === c ? 'scale-110 ring-3' : ''}`}
                  style={{ backgroundColor: c, ...(formColor === c ? { boxShadow: `0 0 0 3px var(--card-bg), 0 0 0 5px ${c}` } : {}) }} />
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} title="Delete Player"
        footer={
          <div className="flex gap-3">
            <button onClick={() => deleteConfirmId && confirmDelete(deleteConfirmId)} className="flex-1 btn-danger">Delete</button>
            <button onClick={() => setDeleteConfirmId(null)} className="flex-1 btn-secondary">Cancel</button>
          </div>
        }>
        <p className="text-sm text-[var(--text-secondary)]">
          Are you sure you want to delete <strong>{players.find((p) => p.id === deleteConfirmId)?.name}</strong>?
          This will also remove their attendance records and skill evaluations.
        </p>
      </Modal>

      {/* Bulk Delete Confirm */}
      <Modal open={bulkDeleteConfirm} onClose={() => setBulkDeleteConfirm(false)} title="Delete Selected Players"
        footer={
          <div className="flex gap-3">
            <button onClick={bulkDelete} className="flex-1 btn-danger">Delete {selected.size} Players</button>
            <button onClick={() => setBulkDeleteConfirm(false)} className="flex-1 btn-secondary">Cancel</button>
          </div>
        }>
        <p className="text-sm text-[var(--text-secondary)]">
          Are you sure you want to delete <strong>{selected.size} players</strong>?
          This will also remove their attendance records and skill evaluations.
        </p>
      </Modal>

      {/* Empty State */}
      {players.length === 0 ? (
        <div className="card p-12 text-center animate-fade-in-up">
          <p className="text-5xl mb-4">👥</p>
          <p className="text-xl font-heading font-extrabold mb-2" style={{ color: 'var(--dark)' }}>No players yet</p>
          <p className="text-sm text-[var(--text-secondary)] mb-5">Add your first player to get started tracking your team.</p>
          <button onClick={openNew} className="btn-primary text-base px-8 py-3">+ Add First Player</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center animate-fade-in-up">
          <p className="text-[var(--text-secondary)] text-sm">No players match the current filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((player, idx) => {
            const attended = practices.filter((p) => p.attendees.includes(player.id)).length;
            const attendRate = practices.length > 0 ? Math.round((attended / practices.length) * 100) : 0;
            const tests = skillTests.filter((t) => t.playerId === player.id);
            const latestTest = tests.sort((a, b) => b.date.localeCompare(a.date))[0];
            const avgScore = latestTest ? overallAverage(latestTest.scores).toFixed(1) : '—';
            const isSelected = selected.has(player.id);
            const lvl = levelColors[player.skillLevel];

            return (
              <div key={player.id} className={`card p-5 transition-all group relative animate-fade-in-up ${
                isSelected ? 'ring-2' : ''
              }`}
                style={{
                  animationDelay: `${Math.min(idx * 50, 400)}ms`,
                  ...(isSelected ? { borderColor: 'var(--primary)', boxShadow: '0 0 0 2px rgba(204,255,0,0.3)' } : {}),
                }}>
                <button onClick={() => toggleSelect(player.id)}
                  className="absolute top-3 left-3 w-5 h-5 rounded-md flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: isSelected ? 'var(--primary)' : 'transparent',
                    border: isSelected ? '2px solid var(--primary)' : '2px solid #d1d5db',
                    color: isSelected ? 'var(--dark)' : 'transparent',
                  }}>
                  {isSelected && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </button>

                <Link href={`/players/${player.id}`} className="block">
                  <div className="flex items-start gap-3 ml-5">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0 ring-3 shadow-md"
                      style={{ backgroundColor: player.avatarColor, boxShadow: `0 0 0 3px var(--card-bg), 0 0 0 5px ${lvl.border}` }}>
                      {player.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading font-extrabold text-base truncate" style={{ color: 'var(--dark)' }}>{player.name}</h3>
                        <span className="text-xs text-[var(--text-secondary)]">#{player.jerseyNumber}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: 'var(--background)', color: 'var(--text-secondary)' }}>{player.position}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold" style={{ backgroundColor: lvl.bg, color: lvl.text }}>{player.skillLevel}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-lg font-extrabold stat-number" style={{ color: 'var(--secondary)' }}>{avgScore}</p>
                      <p className="text-[10px] text-[var(--text-secondary)] uppercase font-bold tracking-wide">Skill</p>
                    </div>
                    <div>
                      <p className="text-lg font-extrabold stat-number" style={{ color: 'var(--dark)' }}>{attended}</p>
                      <p className="text-[10px] text-[var(--text-secondary)] uppercase font-bold tracking-wide">Practices</p>
                    </div>
                    <div>
                      <p className="text-lg font-extrabold stat-number" style={{ color: attendRate >= 80 ? 'var(--success)' : attendRate >= 50 ? 'var(--warning)' : 'var(--danger)' }}>{attendRate}%</p>
                      <p className="text-[10px] text-[var(--text-secondary)] uppercase font-bold tracking-wide">Attend</p>
                    </div>
                  </div>
                </Link>

                <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.preventDefault(); openEdit(player); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-sm hover:bg-black/5 transition-colors text-[var(--text-secondary)]" title="Edit">✏️</button>
                  <button onClick={(e) => { e.preventDefault(); setDeleteConfirmId(player.id); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-sm hover:bg-red-50 transition-colors text-[var(--text-secondary)]" title="Delete">🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
