'use client';

import { useState } from 'react';
import { useInitialize, useForceUpdate } from '@/hooks/useLocalStorage';
import { store } from '@/lib/store';
import { SKILL_NAMES, SKILL_LABELS, SKILL_COLORS, type SkillScores, type SkillTest } from '@/lib/types';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts';

export default function SkillsPage() {
  const ready = useInitialize();
  const refresh = useForceUpdate();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formPlayerId, setFormPlayerId] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formScores, setFormScores] = useState<SkillScores>({
    throwing: 5, catching: 5, cutting: 5, marking: 5, handler: 5, fitness: 5,
  });
  const [compareIds, setCompareIds] = useState<string[]>([]);

  if (!ready) return <div className="animate-pulse h-96 bg-gray-200 rounded-xl" />;

  const players = store.getPlayers();
  const skillTests = store.getSkillTests();

  function openNew() {
    setEditingId(null);
    setFormPlayerId(players[0]?.id || '');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormScores({ throwing: 5, catching: 5, cutting: 5, marking: 5, handler: 5, fitness: 5 });
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
      store.updateSkillTest({
        id: editingId,
        playerId: formPlayerId,
        date: formDate,
        scores: { ...formScores },
      });
    } else {
      store.addSkillTest({
        id: `st-${Date.now()}`,
        playerId: formPlayerId,
        date: formDate,
        scores: { ...formScores },
      });
    }
    setShowForm(false);
    refresh();
  }

  function toggleCompare(playerId: string) {
    setCompareIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : prev.length < 4 ? [...prev, playerId] : prev
    );
  }

  const radarColors = ['#7c3aed', '#10b981', '#f59e0b', '#ef4444'];

  const compareData = SKILL_NAMES.map((skill) => {
    const entry: Record<string, string | number> = { skill: SKILL_LABELS[skill] };
    compareIds.forEach((pid) => {
      const tests = skillTests.filter((t) => t.playerId === pid).sort((a, b) => b.date.localeCompare(a.date));
      const player = players.find((p) => p.id === pid);
      if (tests[0] && player) {
        entry[player.name] = tests[0].scores[skill];
      }
    });
    return entry;
  });

  const playerTestSummary = players.map((player) => {
    const tests = skillTests.filter((t) => t.playerId === player.id).sort((a, b) => a.date.localeCompare(b.date));
    const latest = tests[tests.length - 1];
    const previous = tests.length > 1 ? tests[tests.length - 2] : null;
    return { player, tests, latest, previous };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Skill Tests</h1>
        <button onClick={openNew} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
          + New Test
        </button>
      </div>

      {/* New/Edit Test Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">{editingId ? 'Edit Skill Test' : 'New Skill Test'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Player</label>
                <select value={formPlayerId} onChange={(e) => setFormPlayerId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  disabled={!!editingId}>
                  {players.map((p) => <option key={p.id} value={p.id}>{p.name} (#{p.jerseyNumber})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              {SKILL_NAMES.map((skill) => (
                <div key={skill}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-gray-700">{SKILL_LABELS[skill]}</label>
                    <span className="text-sm font-bold" style={{ color: SKILL_COLORS[skill] }}>{formScores[skill]}</span>
                  </div>
                  <input
                    type="range" min={1} max={10} value={formScores[skill]}
                    onChange={(e) => setFormScores({ ...formScores, [skill]: parseInt(e.target.value) })}
                    className="w-full accent-purple-600"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={save} className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700">Save</button>
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Compare Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold mb-3">Compare Players (select up to 4)</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {players.map((p) => (
            <button
              key={p.id}
              onClick={() => toggleCompare(p.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                compareIds.includes(p.id) ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: p.avatarColor }} />
              {p.name}
            </button>
          ))}
        </div>
        {compareIds.length >= 2 && (
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={compareData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="skill" fontSize={11} />
              <PolarRadiusAxis domain={[0, 10]} fontSize={10} />
              {compareIds.map((pid, i) => {
                const player = players.find((p) => p.id === pid);
                return player ? (
                  <Radar key={pid} dataKey={player.name} stroke={radarColors[i]} fill={radarColors[i]} fillOpacity={0.15} />
                ) : null;
              })}
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        )}
        {compareIds.length < 2 && (
          <p className="text-sm text-gray-400 text-center py-8">Select at least 2 players to compare</p>
        )}
      </div>

      {/* Player Skill Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {playerTestSummary.map(({ player, latest, previous }) => {
          if (!latest) return (
            <div key={player.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: player.avatarColor }}>{player.name.charAt(0)}</div>
                <div>
                  <p className="font-medium">{player.name}</p>
                  <p className="text-xs text-gray-500">No tests recorded</p>
                </div>
              </div>
            </div>
          );

          return (
            <div key={player.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: player.avatarColor }}>{player.name.charAt(0)}</div>
                <div>
                  <p className="font-medium">{player.name}</p>
                  <p className="text-xs text-gray-500">Last tested: {new Date(latest.date).toLocaleDateString()}</p>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-lg font-bold text-purple-700">
                      {(Object.values(latest.scores).reduce((a, b) => a + b, 0) / 6).toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-500">avg score</p>
                  </div>
                  <button onClick={() => openEdit(latest)}
                    className="text-xs text-purple-600 hover:text-purple-800 px-2 py-1 rounded border border-purple-200 hover:bg-purple-50 transition-colors">
                    Edit
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {SKILL_NAMES.map((skill) => {
                  const val = latest.scores[skill];
                  const prevVal = previous?.scores[skill];
                  const diff = prevVal !== undefined ? val - prevVal : 0;
                  return (
                    <div key={skill} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-20">{SKILL_LABELS[skill]}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div className="h-2 rounded-full transition-all" style={{ width: `${val * 10}%`, backgroundColor: SKILL_COLORS[skill] }} />
                      </div>
                      <span className="text-xs font-medium w-6 text-right">{val}</span>
                      {diff !== 0 && (
                        <span className={`text-xs font-medium ${diff > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {diff > 0 ? '+' : ''}{diff}
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

      {/* All Tests Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">All Test Records</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Player</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                {SKILL_NAMES.map((s) => (
                  <th key={s} className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">{SKILL_LABELS[s].slice(0, 5)}</th>
                ))}
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Avg</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...skillTests].sort((a, b) => b.date.localeCompare(a.date)).map((test) => {
                const player = players.find((p) => p.id === test.playerId);
                const avg = Object.values(test.scores).reduce((a, b) => a + b, 0) / 6;
                return (
                  <tr key={test.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm font-medium">{player?.name || 'Unknown'}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{new Date(test.date).toLocaleDateString()}</td>
                    {SKILL_NAMES.map((s) => (
                      <td key={s} className="px-3 py-2 text-center text-sm">{test.scores[s]}</td>
                    ))}
                    <td className="px-3 py-2 text-center text-sm font-semibold text-purple-700">{avg.toFixed(1)}</td>
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
