'use client';

import { useState } from 'react';
import { useInitialize, useForceUpdate } from '@/hooks/useLocalStorage';
import { store } from '@/lib/store';
import {
  SKILL_CATEGORIES, emptySkilScores,
  categoryAverage, overallAverage,
  type SkillScores, type SkillTest,
} from '@/lib/types';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, Legend,
} from 'recharts';
import Link from 'next/link';
import Modal from '@/components/Modal';

export default function SkillsPage() {
  const ready = useInitialize();
  const refresh = useForceUpdate();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formPlayerId, setFormPlayerId] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formScores, setFormScores] = useState<SkillScores>(emptySkilScores());
  const [comparePlayer, setComparePlayer] = useState<string>('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (!ready) return <div className="animate-pulse h-96 rounded-2xl" style={{ backgroundColor: 'var(--accent-pink)', opacity: 0.1 }} />;

  const players = store.getPlayers();
  const skillTests = store.getSkillTests();

  function openNew() {
    setEditingId(null);
    setFormPlayerId(players[0]?.id || '');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormScores(emptySkilScores());
    setShowForm(true);
  }

  function openEdit(test: SkillTest) {
    setEditingId(test.id);
    setFormPlayerId(test.playerId);
    setFormDate(test.date);
    setFormScores({ ...test.scores });
    setShowForm(true);
  }

  function save() {
    if (!formPlayerId || !formDate) return;
    if (editingId) {
      store.updateSkillTest({ id: editingId, playerId: formPlayerId, date: formDate, scores: { ...formScores } });
    } else {
      store.addSkillTest({ id: `st-${Date.now()}`, playerId: formPlayerId, date: formDate, scores: { ...formScores } });
    }
    setShowForm(false);
    refresh();
  }

  function confirmDelete() {
    if (!deleteConfirmId) return;
    store.deleteSkillTest(deleteConfirmId);
    setDeleteConfirmId(null);
    refresh();
  }

  const compareTests = comparePlayer
    ? skillTests.filter((t) => t.playerId === comparePlayer).sort((a, b) => a.date.localeCompare(b.date))
    : [];
  const beforeTest = compareTests.length >= 1 ? compareTests[0] : null;
  const afterTest = compareTests.length >= 2 ? compareTests[compareTests.length - 1] : null;

  const radarData = SKILL_CATEGORIES.map((cat) => {
    const entry: Record<string, string | number> = { skill: cat.label };
    if (beforeTest) entry['Before'] = Math.round(categoryAverage(beforeTest.scores, cat) * 10) / 10;
    if (afterTest) entry['After'] = Math.round(categoryAverage(afterTest.scores, cat) * 10) / 10;
    return entry;
  });

  const playerSummaries = players.map((player) => {
    const tests = skillTests.filter((t) => t.playerId === player.id).sort((a, b) => a.date.localeCompare(b.date));
    const latest = tests[tests.length - 1];
    const first = tests[0];
    return { player, tests, latest, first };
  });

  return (
    <div className="space-y-6 stagger-children">
      <div className="flex items-center justify-between animate-fade-in-up">
        <h1 className="text-3xl font-heading font-extrabold" style={{ color: 'var(--dark)' }}>Skill Evaluation</h1>
        <button onClick={openNew} disabled={players.length === 0} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
          + New Evaluation
        </button>
      </div>

      {/* Evaluation Form Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)}
        title={editingId ? 'Edit Evaluation' : 'New Evaluation'}
        maxWidth="max-w-lg"
        footer={
          <div className="flex gap-3">
            <button onClick={save} className="flex-1 btn-primary">{editingId ? 'Update' : 'Submit'}</button>
            <button onClick={() => setShowForm(false)} className="flex-1 btn-secondary">Cancel</button>
          </div>
        }>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-[var(--dark)] mb-1">Player</label>
              <select value={formPlayerId} onChange={(e) => setFormPlayerId(e.target.value)}
                className="w-full px-3 py-2.5 text-sm" disabled={!!editingId}>
                {players.length === 0 && <option value="">No players</option>}
                {players.map((p) => <option key={p.id} value={p.id}>{p.name} (#{p.jerseyNumber})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--dark)] mb-1">Date</label>
              <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)}
                className="w-full px-3 py-2.5 text-sm" />
            </div>
          </div>

          {SKILL_CATEGORIES.map((cat) => (
            <div key={cat.label} className="rounded-xl p-3" style={{ backgroundColor: cat.color + '10', border: `1px solid ${cat.color}20` }}>
              <p className="text-sm font-heading font-bold mb-2" style={{ color: cat.color }}>{cat.label}</p>
              {cat.skills.map((skill) => (
                <div key={skill.key} className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-[var(--text-secondary)] w-28 shrink-0">{skill.label}</span>
                  <input type="range" min={1} max={10} value={formScores[skill.key]}
                    onChange={(e) => setFormScores({ ...formScores, [skill.key]: parseInt(e.target.value) })}
                    className="flex-1 h-2" style={{ accentColor: cat.color }} />
                  <input type="number" min={1} max={10} value={formScores[skill.key]}
                    onChange={(e) => {
                      const v = Math.min(10, Math.max(1, parseInt(e.target.value) || 1));
                      setFormScores({ ...formScores, [skill.key]: v });
                    }}
                    className="w-12 rounded-lg px-1 py-0.5 text-xs text-center" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} title="Delete Evaluation"
        footer={<div className="flex gap-3"><button onClick={confirmDelete} className="flex-1 btn-danger">Delete</button><button onClick={() => setDeleteConfirmId(null)} className="flex-1 btn-secondary">Cancel</button></div>}>
        <p className="text-sm text-[var(--text-secondary)]">Are you sure you want to delete this evaluation? This cannot be undone.</p>
      </Modal>

      {/* Empty States */}
      {players.length === 0 ? (
        <div className="card p-12 text-center animate-fade-in-up">
          <p className="text-5xl mb-4">🎯</p>
          <p className="text-xl font-heading font-extrabold mb-2" style={{ color: 'var(--dark)' }}>No players yet</p>
          <p className="text-sm text-[var(--text-secondary)]">Add players first before creating skill evaluations.</p>
          <Link href="/players" className="inline-block mt-3 text-sm font-bold" style={{ color: 'var(--secondary)' }}>Go to Players →</Link>
        </div>
      ) : skillTests.length === 0 ? (
        <div className="card p-12 text-center animate-fade-in-up">
          <p className="text-5xl mb-4">🎯</p>
          <p className="text-xl font-heading font-extrabold mb-2" style={{ color: 'var(--dark)' }}>No evaluations yet</p>
          <p className="text-sm text-[var(--text-secondary)] mb-5">Create your first skill evaluation to start tracking player progress.</p>
          <button onClick={openNew} className="btn-primary text-base px-8 py-3">+ First Evaluation</button>
        </div>
      ) : (
        <>
          {/* Before vs After */}
          <div className="card-flat p-5 animate-fade-in-up">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-lg font-heading font-bold" style={{ color: 'var(--dark)' }}>Before vs After Comparison</h2>
              <select value={comparePlayer} onChange={(e) => setComparePlayer(e.target.value)}
                className="px-3 py-2 text-sm rounded-xl">
                <option value="">Select a player...</option>
                {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            {comparePlayer && beforeTest && afterTest ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="skill" fontSize={11} tick={{ fill: 'var(--text-secondary)' }} />
                    <PolarRadiusAxis domain={[0, 10]} fontSize={10} />
                    <Radar dataKey="Before" stroke="#d1d5db" fill="#d1d5db" fillOpacity={0.2} />
                    <Radar dataKey="After" stroke="var(--secondary)" fill="var(--secondary)" fillOpacity={0.3} />
                    <Tooltip />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)] mb-2">
                    <span className="flex items-center gap-1"><span className="w-3 h-1 bg-gray-400 rounded" /> Before ({new Date(beforeTest.date).toLocaleDateString()})</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-1 rounded" style={{ backgroundColor: 'var(--secondary)' }} /> After ({new Date(afterTest.date).toLocaleDateString()})</span>
                  </div>
                  {SKILL_CATEGORIES.map((cat) => {
                    const before = categoryAverage(beforeTest.scores, cat);
                    const after = categoryAverage(afterTest.scores, cat);
                    const diff = after - before;
                    return (
                      <div key={cat.label} className="flex items-center gap-2">
                        <span className="text-xs w-20 font-bold" style={{ color: cat.color }}>{cat.label}</span>
                        <div className="flex-1 rounded-full h-2.5 relative" style={{ backgroundColor: 'var(--background)' }}>
                          <div className="absolute h-2.5 rounded-full bg-gray-300" style={{ width: `${before * 10}%` }} />
                          <div className="absolute h-2.5 rounded-full animate-progress" style={{ width: `${after * 10}%`, backgroundColor: cat.color, opacity: 0.7 }} />
                        </div>
                        <span className="text-xs w-8 text-right font-bold stat-number">{after.toFixed(1)}</span>
                        <span className="text-xs w-10 text-right font-bold" style={{ color: diff > 0 ? 'var(--success)' : diff < 0 ? 'var(--danger)' : 'var(--text-secondary)' }}>
                          {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                        </span>
                      </div>
                    );
                  })}
                  <div className="border-t pt-2 mt-2 flex items-center justify-between" style={{ borderColor: 'var(--background)' }}>
                    <span className="text-sm font-heading font-bold">Overall</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm stat-number">{overallAverage(beforeTest.scores).toFixed(1)} → <strong style={{ color: 'var(--secondary)' }}>{overallAverage(afterTest.scores).toFixed(1)}</strong></span>
                      {(() => {
                        const d = overallAverage(afterTest.scores) - overallAverage(beforeTest.scores);
                        return <span className="text-xs font-bold" style={{ color: d > 0 ? 'var(--success)' : 'var(--danger)' }}>{d > 0 ? '+' : ''}{d.toFixed(1)}</span>;
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            ) : comparePlayer && compareTests.length < 2 ? (
              <p className="text-sm text-[var(--text-secondary)] text-center py-8">Need at least 2 evaluations to compare. This player has {compareTests.length}.</p>
            ) : (
              <p className="text-sm text-[var(--text-secondary)] text-center py-8">Select a player to see their before vs after comparison</p>
            )}
          </div>

          {/* Player Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up">
            {playerSummaries.map(({ player, latest, first, tests }) => {
              if (!latest) return (
                <div key={player.id} className="card-sm p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: player.avatarColor }}>{player.name.charAt(0)}</div>
                    <div>
                      <Link href={`/players/${player.id}`} className="font-heading font-bold hover:opacity-80 transition-opacity" style={{ color: 'var(--dark)' }}>{player.name}</Link>
                      <p className="text-xs text-[var(--text-secondary)]">No evaluations recorded</p>
                    </div>
                  </div>
                </div>
              );

              const improvement = first && tests.length > 1 ? overallAverage(latest.scores) - overallAverage(first.scores) : 0;
              const lvlStyle: Record<string, { bg: string; text: string }> = {
                A: { bg: 'rgba(0, 214, 143, 0.15)', text: 'var(--success)' },
                B: { bg: 'rgba(78, 205, 196, 0.15)', text: 'var(--secondary)' },
                C: { bg: 'rgba(107, 114, 128, 0.15)', text: 'var(--text-secondary)' },
              };

              return (
                <div key={player.id} className="card-sm p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: player.avatarColor }}>{player.name.charAt(0)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Link href={`/players/${player.id}`} className="font-heading font-bold hover:opacity-80 transition-opacity" style={{ color: 'var(--dark)' }}>{player.name}</Link>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-extrabold" style={{ backgroundColor: lvlStyle[player.skillLevel].bg, color: lvlStyle[player.skillLevel].text }}>{player.skillLevel}</span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)]">Last eval: {new Date(latest.date).toLocaleDateString()} ({tests.length} total)</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-extrabold stat-number" style={{ color: 'var(--secondary)' }}>{overallAverage(latest.scores).toFixed(1)}</p>
                      {improvement !== 0 && (
                        <span className="text-xs font-bold" style={{ color: improvement > 0 ? 'var(--success)' : 'var(--danger)' }}>
                          {improvement > 0 ? '↑' : '↓'}{Math.abs(improvement).toFixed(1)}
                        </span>
                      )}
                    </div>
                    <button onClick={() => openEdit(latest)}
                      className="text-sm text-[var(--text-secondary)] hover:text-[var(--dark)] p-1" title="Edit latest">✏️</button>
                  </div>
                  <div className="space-y-1.5">
                    {SKILL_CATEGORIES.map((cat) => {
                      const avg = categoryAverage(latest.scores, cat);
                      const prevAvg = first && tests.length > 1 ? categoryAverage(first.scores, cat) : null;
                      const diff = prevAvg !== null ? avg - prevAvg : 0;
                      return (
                        <div key={cat.label} className="flex items-center gap-2">
                          <span className="text-[10px] text-[var(--text-secondary)] w-16 truncate font-medium">{cat.label}</span>
                          <div className="flex-1 rounded-full h-1.5" style={{ backgroundColor: cat.color + '20' }}>
                            <div className="h-1.5 rounded-full transition-all animate-progress" style={{ width: `${avg * 10}%`, backgroundColor: cat.color }} />
                          </div>
                          <span className="text-[10px] font-bold stat-number w-6 text-right">{avg.toFixed(1)}</span>
                          {diff !== 0 && (
                            <span className="text-[10px] font-bold w-7" style={{ color: diff > 0 ? 'var(--success)' : 'var(--danger)' }}>
                              {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* All Records Table */}
          <div className="card-flat overflow-hidden animate-fade-in-up">
            <div className="p-5 border-b" style={{ borderColor: 'var(--background)' }}>
              <h2 className="text-lg font-heading font-bold" style={{ color: 'var(--dark)' }}>All Evaluation Records</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: 'var(--background)' }}>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Player</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Date</th>
                    {SKILL_CATEGORIES.map((c) => (
                      <th key={c.label} className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-wider" style={{ color: c.color }}>{c.label.slice(0, 6)}</th>
                    ))}
                    <th className="px-3 py-3 text-center text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Overall</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...skillTests].sort((a, b) => b.date.localeCompare(a.date)).map((test) => {
                    const player = players.find((p) => p.id === test.playerId);
                    return (
                      <tr key={test.id} className="border-b hover:bg-black/[0.02] transition-colors" style={{ borderColor: 'var(--background)' }}>
                        <td className="px-4 py-2.5 text-sm font-bold" style={{ color: 'var(--dark)' }}>
                          {player ? (
                            <Link href={`/players/${player.id}`} className="hover:opacity-80 transition-opacity">{player.name}</Link>
                          ) : 'Unknown'}
                        </td>
                        <td className="px-4 py-2.5 text-sm text-[var(--text-secondary)]">{new Date(test.date).toLocaleDateString()}</td>
                        {SKILL_CATEGORIES.map((cat) => (
                          <td key={cat.label} className="px-3 py-2.5 text-center text-sm stat-number">{categoryAverage(test.scores, cat).toFixed(1)}</td>
                        ))}
                        <td className="px-3 py-2.5 text-center text-sm font-extrabold stat-number" style={{ color: 'var(--secondary)' }}>{overallAverage(test.scores).toFixed(1)}</td>
                        <td className="px-4 py-2.5 text-right">
                          <button onClick={() => openEdit(test)} className="text-sm text-[var(--text-secondary)] hover:text-[var(--dark)] mr-1" title="Edit">✏️</button>
                          <button onClick={() => setDeleteConfirmId(test.id)} className="text-sm text-[var(--text-secondary)] hover:text-[var(--danger)]" title="Delete">🗑️</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
