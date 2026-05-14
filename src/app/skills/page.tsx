'use client';

import { useState } from 'react';
import { useInitialize, useForceUpdate } from '@/hooks/useLocalStorage';
import { store } from '@/lib/store';
import {
  SKILL_CATEGORIES, ALL_SKILL_KEYS, emptySkilScores,
  categoryAverage, overallAverage, getSkillLabel,
  type SkillScores, type SkillTest, type SkillName,
} from '@/lib/types';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, Legend,
} from 'recharts';

export default function SkillsPage() {
  const ready = useInitialize();
  const refresh = useForceUpdate();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formPlayerId, setFormPlayerId] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formScores, setFormScores] = useState<SkillScores>(emptySkilScores());
  const [comparePlayer, setComparePlayer] = useState<string>('');

  if (!ready) return <div className="animate-pulse h-96 bg-gray-200 rounded-xl" />;

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

  // Before/After comparison for selected player
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

  // Per-player summaries
  const playerSummaries = players.map((player) => {
    const tests = skillTests.filter((t) => t.playerId === player.id).sort((a, b) => a.date.localeCompare(b.date));
    const latest = tests[tests.length - 1];
    const first = tests[0];
    return { player, tests, latest, first };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Skill Evaluation</h1>
        <button onClick={openNew} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
          + New Evaluation
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">{editingId ? 'Edit Evaluation' : 'New Evaluation'}</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Player</label>
                  <select value={formPlayerId} onChange={(e) => setFormPlayerId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" disabled={!!editingId}>
                    {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              {SKILL_CATEGORIES.map((cat) => (
                <div key={cat.label} className="border border-gray-100 rounded-lg p-3">
                  <p className="text-sm font-semibold mb-2" style={{ color: cat.color }}>{cat.label}</p>
                  {cat.skills.map((skill) => (
                    <div key={skill.key} className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-600 w-28">{skill.label}</span>
                      <input type="range" min={1} max={10} value={formScores[skill.key]}
                        onChange={(e) => setFormScores({ ...formScores, [skill.key]: parseInt(e.target.value) })}
                        className="flex-1 accent-purple-600 h-2" />
                      <span className="text-xs font-bold w-5 text-right" style={{ color: cat.color }}>{formScores[skill.key]}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={save} className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700">Save</button>
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Before vs After Comparison */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-lg font-semibold">Before vs After Comparison</h2>
          <select value={comparePlayer} onChange={(e) => setComparePlayer(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
            <option value="">Select a player...</option>
            {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {comparePlayer && beforeTest && afterTest ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="skill" fontSize={11} />
                <PolarRadiusAxis domain={[0, 10]} fontSize={10} />
                <Radar dataKey="Before" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.2} />
                <Radar dataKey="After" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.3} />
                <Tooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                <span className="flex items-center gap-1"><span className="w-3 h-1 bg-gray-400 rounded" /> Before ({new Date(beforeTest.date).toLocaleDateString()})</span>
                <span className="flex items-center gap-1"><span className="w-3 h-1 bg-purple-500 rounded" /> After ({new Date(afterTest.date).toLocaleDateString()})</span>
              </div>
              {SKILL_CATEGORIES.map((cat) => {
                const before = categoryAverage(beforeTest.scores, cat);
                const after = categoryAverage(afterTest.scores, cat);
                const diff = after - before;
                return (
                  <div key={cat.label} className="flex items-center gap-2">
                    <span className="text-xs w-20 font-medium" style={{ color: cat.color }}>{cat.label}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 relative">
                      <div className="absolute h-2 rounded-full bg-gray-300" style={{ width: `${before * 10}%` }} />
                      <div className="absolute h-2 rounded-full" style={{ width: `${after * 10}%`, backgroundColor: cat.color, opacity: 0.7 }} />
                    </div>
                    <span className="text-xs w-8 text-right font-medium">{after.toFixed(1)}</span>
                    <span className={`text-xs w-10 text-right font-bold ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                      {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                    </span>
                  </div>
                );
              })}
              <div className="border-t pt-2 mt-2 flex items-center justify-between">
                <span className="text-sm font-semibold">Overall</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{overallAverage(beforeTest.scores).toFixed(1)} → <strong className="text-purple-700">{overallAverage(afterTest.scores).toFixed(1)}</strong></span>
                  {(() => {
                    const d = overallAverage(afterTest.scores) - overallAverage(beforeTest.scores);
                    return <span className={`text-xs font-bold ${d > 0 ? 'text-green-600' : 'text-red-500'}`}>{d > 0 ? '+' : ''}{d.toFixed(1)}</span>;
                  })()}
                </div>
              </div>
            </div>
          </div>
        ) : comparePlayer && compareTests.length < 2 ? (
          <p className="text-sm text-gray-400 text-center py-8">Need at least 2 evaluations to compare. This player has {compareTests.length}.</p>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">Select a player to see their before vs after comparison</p>
        )}
      </div>

      {/* Player Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {playerSummaries.map(({ player, latest, first, tests }) => {
          if (!latest) return (
            <div key={player.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: player.avatarColor }}>{player.name.charAt(0)}</div>
                <div>
                  <p className="font-medium">{player.name}</p>
                  <p className="text-xs text-gray-500">No evaluations recorded</p>
                </div>
              </div>
            </div>
          );

          const improvement = first && tests.length > 1 ? overallAverage(latest.scores) - overallAverage(first.scores) : 0;

          return (
            <div key={player.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: player.avatarColor }}>{player.name.charAt(0)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{player.name}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      player.skillLevel === 'A' ? 'bg-green-100 text-green-700' :
                      player.skillLevel === 'B' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{player.skillLevel}</span>
                  </div>
                  <p className="text-xs text-gray-500">Last eval: {new Date(latest.date).toLocaleDateString()} ({tests.length} total)</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-purple-700">{overallAverage(latest.scores).toFixed(1)}</p>
                  {improvement !== 0 && (
                    <span className={`text-xs font-bold ${improvement > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {improvement > 0 ? '↑' : '↓'}{Math.abs(improvement).toFixed(1)}
                    </span>
                  )}
                </div>
                <button onClick={() => openEdit(latest)}
                  className="text-xs text-purple-600 hover:text-purple-800 px-2 py-1 rounded border border-purple-200 hover:bg-purple-50">
                  Edit
                </button>
              </div>
              <div className="space-y-1.5">
                {SKILL_CATEGORIES.map((cat) => {
                  const avg = categoryAverage(latest.scores, cat);
                  const prevAvg = first && tests.length > 1 ? categoryAverage(first.scores, cat) : null;
                  const diff = prevAvg !== null ? avg - prevAvg : 0;
                  return (
                    <div key={cat.label} className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500 w-16 truncate">{cat.label}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${avg * 10}%`, backgroundColor: cat.color }} />
                      </div>
                      <span className="text-[10px] font-medium w-6 text-right">{avg.toFixed(1)}</span>
                      {diff !== 0 && (
                        <span className={`text-[10px] font-medium w-7 ${diff > 0 ? 'text-green-600' : 'text-red-500'}`}>
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
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">All Evaluation Records</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Player</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                {SKILL_CATEGORIES.map((c) => (
                  <th key={c.label} className="px-3 py-3 text-center text-xs font-semibold uppercase" style={{ color: c.color }}>{c.label.slice(0, 6)}</th>
                ))}
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Overall</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...skillTests].sort((a, b) => b.date.localeCompare(a.date)).map((test) => {
                const player = players.find((p) => p.id === test.playerId);
                return (
                  <tr key={test.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm font-medium">{player?.name || 'Unknown'}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{new Date(test.date).toLocaleDateString()}</td>
                    {SKILL_CATEGORIES.map((cat) => (
                      <td key={cat.label} className="px-3 py-2 text-center text-sm">{categoryAverage(test.scores, cat).toFixed(1)}</td>
                    ))}
                    <td className="px-3 py-2 text-center text-sm font-semibold text-purple-700">{overallAverage(test.scores).toFixed(1)}</td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => openEdit(test)} className="text-xs text-purple-600 hover:text-purple-800 mr-2">Edit</button>
                      <button onClick={() => { store.deleteSkillTest(test.id); refresh(); }} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
