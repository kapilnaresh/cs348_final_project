import { useEffect, useState } from 'react';
import { createParlay, deleteParlay, getPlayers, getTeams, listParlays, updateParlay } from './api';

function emptyLeg() {
  return { leg_type: 'team', team_id: '', player_id: '', market: '', selection: '', odds: '', result: 'pending' };
}

export default function ParlayForm({ teams: propTeams, players: propPlayers, onTeamsPlayersUpdate }) {
  const [teams, setTeams] = useState(propTeams || []);
  const [players, setPlayers] = useState(propPlayers || []);
  const [parlays, setParlays] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const [form, setForm] = useState({
    date: '',
    stake: '',
    potential_payout: '',
    sportsbook: '',
    status: 'pending',
    notes: '',
    legs: [emptyLeg()],
  });

  useEffect(() => {
    // Update teams and players whenever they change from props
    setTeams(propTeams || []);
    setPlayers(propPlayers || []);
  }, [propTeams, propPlayers]);

  useEffect(() => {
    // Load teams and players on initial mount if not provided via props
    if (!propTeams || !propPlayers) {
      (async () => {
        const [t, p] = await Promise.all([getTeams(), getPlayers()]);
        setTeams(t);
        setPlayers(p);
        if (onTeamsPlayersUpdate) {
          onTeamsPlayersUpdate(t, p);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refreshParlays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshParlays() {
    const items = await listParlays();
    setParlays(items);
  }

  const toggleExpanded = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  function setLeg(idx, patch) {
    setForm(prev => {
      const legs = prev.legs.map((l, i) => (i === idx ? { ...l, ...patch } : l));
      return { ...prev, legs };
    });
  }

  function addLeg() {
    setForm(prev => ({ ...prev, legs: [...prev.legs, emptyLeg()] }));
  }

  function removeLeg(idx) {
    setForm(prev => ({ ...prev, legs: prev.legs.filter((_, i) => i !== idx) }));
  }

  function resetForm() {
    setEditingId(null);
    setForm({ date: '', stake: '', potential_payout: '', sportsbook: '', status: 'pending', notes: '', legs: [emptyLeg()] });
  }

  async function onSubmit(e) {
    e.preventDefault();
    
    // Validate legs have required fields
    for (let i = 0; i < form.legs.length; i++) {
      const leg = form.legs[i];
      if (!leg.market || leg.market.trim() === '') {
        alert(`Leg ${i + 1}: Market is required`);
        return;
      }
      if (!leg.selection || leg.selection.trim() === '') {
        alert(`Leg ${i + 1}: Selection is required`);
        return;
      }
      if (leg.leg_type === 'team' && (!leg.team_id || leg.team_id === '')) {
        alert(`Leg ${i + 1}: Team selection is required`);
        return;
      }
      if (leg.leg_type === 'player' && (!leg.player_id || leg.player_id === '')) {
        alert(`Leg ${i + 1}: Player selection is required`);
        return;
      }
    }
    
    const legsPayload = form.legs.map(l => {
      // Ensure result is valid
      const validResults = ['pending', 'won', 'lost'];
      const resultValue = l.result && validResults.includes(l.result) ? l.result : 'pending';
      
      const leg = {
        leg_type: l.leg_type,
        market: l.market.trim(),
        selection: l.selection.trim(),
        result: resultValue,
      };
      
      // Set team_id or player_id based on leg_type
      if (l.leg_type === 'team') {
        const teamIdStr = String(l.team_id || '').trim();
        leg.team_id = teamIdStr !== '' ? Number(teamIdStr) : null;
        leg.player_id = null;
      } else {
        const playerIdStr = String(l.player_id || '').trim();
        leg.player_id = playerIdStr !== '' ? Number(playerIdStr) : null;
        leg.team_id = null;
      }
      
      // Handle odds
      const oddsStr = String(l.odds || '').trim();
      leg.odds = oddsStr !== '' ? Number(oddsStr) : null;
      
      return leg;
    });

    try {
      if (editingId) {
        const payload = {
          date: form.date ? form.date : null,
          stake: parseFloat(form.stake || 0),
          potential_payout: form.potential_payout ? parseFloat(form.potential_payout) : null,
          sportsbook: form.sportsbook && form.sportsbook.trim() ? form.sportsbook.trim() : null,
          status: form.status,
          notes: form.notes && form.notes.trim() ? form.notes.trim() : null,
          legs: legsPayload,
        };
        console.log('Updating parlay with payload:', JSON.stringify(payload, null, 2));
        await updateParlay(editingId, payload);
      } else {
        const payload = {
          date: form.date,
          stake: parseFloat(form.stake || 0),
          potential_payout: form.potential_payout ? parseFloat(form.potential_payout) : null,
          sportsbook: form.sportsbook && form.sportsbook.trim() ? form.sportsbook.trim() : null,
          status: form.status,
          notes: form.notes && form.notes.trim() ? form.notes.trim() : null,
          legs: legsPayload,
        };
        await createParlay(payload);
      }
      await refreshParlays();
      resetForm();
    } catch (error) {
      alert('Error: ' + error.message);
      console.error('Parlay submission error:', error);
    }
  }

  function startEdit(p) {
    setEditingId(p.id);
    setForm({
      date: p.date,
      stake: String(p.stake),
      potential_payout: p.potential_payout != null ? String(p.potential_payout) : '',
      sportsbook: p.sportsbook || '',
      status: p.status,
      notes: p.notes || '',
      legs: p.legs.map(l => ({
        leg_type: l.leg_type,
        team_id: l.team_id ? String(l.team_id) : '',
        player_id: l.player_id ? String(l.player_id) : '',
        market: l.market,
        selection: l.selection,
        odds: l.odds == null ? '' : String(l.odds),
        result: l.result,
      })),
    });
  }

  async function removeParlay(id) {
    await deleteParlay(id);
    if (editingId === id) resetForm();
    await refreshParlays();
  }

  return (
    <div>
      <div className="card">
        <h2 className="card-title">{editingId ? 'Edit Parlay' : 'Create New Parlay'}</h2>

        <form onSubmit={onSubmit} className="form-group">
          <div className="form-row">
            <div>
              <label className="form-label">Date</label>
              <input 
                type="date" 
                className="form-input"
                value={form.date} 
                onChange={e => setForm({ ...form, date: e.target.value })} 
                required 
              />
            </div>
            <div>
              <label className="form-label">Stake ($)</label>
              <input 
                type="number" 
                step="0.01" 
                className="form-input"
                value={form.stake} 
                onChange={e => setForm({ ...form, stake: e.target.value })} 
                required 
              />
            </div>
            <div>
              <label className="form-label">Potential Payout ($)</label>
              <input 
                type="number" 
                step="0.01" 
                className="form-input"
                value={form.potential_payout} 
                onChange={e => setForm({ ...form, potential_payout: e.target.value })} 
              />
            </div>
          </div>

          <div className="form-row">
            <div>
              <label className="form-label">Sportsbook</label>
              <input 
                className="form-input"
                value={form.sportsbook} 
                onChange={e => setForm({ ...form, sportsbook: e.target.value })} 
                placeholder="e.g., DraftKings, FanDuel"
              />
            </div>
            <div>
              <label className="form-label">Status</label>
              <select 
                className="form-select"
                value={form.status} 
                onChange={e => setForm({ ...form, status: e.target.value })}
              >
                <option value="pending">Pending</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Notes</label>
            <textarea 
              className="form-textarea"
              value={form.notes} 
              onChange={e => setForm({ ...form, notes: e.target.value })} 
              placeholder="Add any additional notes about this parlay..."
            />
          </div>

          <div className="section-divider">
            <h3 className="section-title">Parlay Legs</h3>
            {form.legs.map((leg, idx) => (
              <div key={idx} className="leg-card">
                <div className="leg-grid">
                  <div>
                    <label className="form-label">Type</label>
                    <select 
                      className="form-select"
                      value={leg.leg_type} 
                      onChange={e => setLeg(idx, { leg_type: e.target.value })}
                    >
                      <option value="team">Team</option>
                      <option value="player">Player</option>
                    </select>
                  </div>

                  {leg.leg_type === 'team' ? (
                    <div>
                      <label className="form-label">Team</label>
                      <select 
                        className="form-select"
                        value={String(leg.team_id || '')} 
                        onChange={e => setLeg(idx, { team_id: e.target.value, player_id: '' })}
                      >
                        <option value="">Select team</option>
                        {teams.map(t => (
                          <option key={t.id} value={String(t.id)}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="form-label">Player</label>
                      <select 
                        className="form-select"
                        value={String(leg.player_id || '')} 
                        onChange={e => setLeg(idx, { player_id: e.target.value, team_id: '' })}
                      >
                        <option value="">Select player</option>
                        {players.map(p => (
                          <option key={p.id} value={String(p.id)}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="form-label">Market</label>
                    <input 
                      className="form-input"
                      value={leg.market} 
                      onChange={e => setLeg(idx, { market: e.target.value })} 
                      placeholder="Points, Assists, ML, etc."
                    />
                  </div>
                  <div>
                    <label className="form-label">Selection</label>
                    <input 
                      className="form-input"
                      value={leg.selection} 
                      onChange={e => setLeg(idx, { selection: e.target.value })} 
                      placeholder="Over 24.5, BOS ML, etc."
                    />
                  </div>
                  <div>
                    <label className="form-label">Odds</label>
                    <input 
                      type="number" 
                      className="form-input"
                      value={leg.odds} 
                      onChange={e => setLeg(idx, { odds: e.target.value })} 
                      placeholder="-110, +250"
                    />
                  </div>
                  <div>
                    <label className="form-label">Result</label>
                    <select 
                      className="form-select"
                      value={leg.result} 
                      onChange={e => setLeg(idx, { result: e.target.value })}
                    >
                      <option value="pending">Pending</option>
                      <option value="won">Won</option>
                      <option value="lost">Lost</option>
                    </select>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="btn-danger" 
                  onClick={() => removeLeg(idx)}
                >
                  Remove Leg
                </button>
              </div>
            ))}
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={addLeg}
            >
              Add Another Leg
            </button>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button type="submit" className="btn-primary">
              {editingId ? 'Update Parlay' : 'Create Parlay'}
            </button>
            {editingId && (
              <button type="button" className="btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <h3 className="card-title">Your Parlays</h3>
        {parlays.length === 0 && (
          <div className="empty-state">
            No parlays yet. Create your first parlay above!
          </div>
        )}
        <ul className="parlay-list">
          {parlays.map(p => (
            <li key={p.id} className="parlay-item">
              <div className="parlay-header">
                <div className="parlay-meta">
                  {p.date} • ${parseFloat(p.stake).toFixed(2)} • 
                  <span className={`status-badge status-${p.status}`}>
                    {p.status}
                  </span>
                  {p.potential_payout && (
                    <span style={{ marginLeft: '8px', color: '#666' }}>
                      (Potential: ${parseFloat(p.potential_payout).toFixed(2)})
                    </span>
                  )}
                </div>
                <div className="parlay-actions">
                  <button 
                    className="btn-secondary" 
                    onClick={() => toggleExpanded(p.id)}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  >
                    {expandedId === p.id ? 'Hide Legs' : 'View Legs'}
                  </button>
                  <button 
                    className="btn-secondary" 
                    onClick={() => startEdit(p)}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn-danger" 
                    onClick={() => removeParlay(p.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              {expandedId === p.id && (
                <div style={{ marginTop: '12px', display: 'grid', gap: '8px' }}>
                  {p.legs.map((l, i) => (
                    <div 
                      key={i}
                      style={{
                        background: '#f0f0f0',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '14px',
                      }}
                    >
                      <div><strong>Type:</strong> {l.leg_type}</div>
                      {l.team_id && <div><strong>Team ID:</strong> {l.team_id}</div>}
                      {l.player_id && <div><strong>Player ID:</strong> {l.player_id}</div>}
                      <div><strong>Market:</strong> {l.market}</div>
                      <div><strong>Selection:</strong> {l.selection}</div>
                      {l.odds != null && <div><strong>Odds:</strong> {l.odds}</div>}
                      <div><strong>Result:</strong> {l.result}</div>
                    </div>
                  ))}
                </div>
              )}
              {p.notes && (
                <div style={{ marginTop: '8px', color: '#666', fontSize: '14px', fontStyle: 'italic' }}>
                  {p.notes}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}


