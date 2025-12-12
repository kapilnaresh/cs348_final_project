import { useEffect, useState } from 'react';
import { getPlayers, getTeams, reportSummary } from './api';

export default function Report({ teams: propTeams, players: propPlayers, onTeamsPlayersUpdate }) {
  const [teams, setTeams] = useState(propTeams || []);
  const [players, setPlayers] = useState(propPlayers || []);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    team_ids: [],
    player_ids: [],
    min_stake: '',
    max_stake: '',
    status: '',
  });
  const [stats, setStats] = useState(null);
  const [matchingParlays, setMatchingParlays] = useState([]);

  useEffect(() => {
    if (propTeams && propPlayers) {
      setTeams(propTeams);
      setPlayers(propPlayers);
    } else {
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
  }, [propTeams, propPlayers]);

  async function runReport() {
    const payload = {
      ...filters,
      start_date: filters.start_date || null,
      end_date: filters.end_date || null,
      team_ids: filters.team_ids.length ? filters.team_ids.map(Number) : null,
      player_ids: filters.player_ids.length ? filters.player_ids.map(Number) : null,
      min_stake: filters.min_stake === '' ? null : Number(filters.min_stake),
      max_stake: filters.max_stake === '' ? null : Number(filters.max_stake),
      status: filters.status || null,
    };
    const s = await reportSummary(payload);
    setStats(s);
    setMatchingParlays(s.parlays || []);
  }

  function toggleMulti(listKey, id) {
    setFilters(prev => {
      const list = new Set(prev[listKey]);
      if (list.has(id)) list.delete(id); else list.add(id);
      return { ...prev, [listKey]: Array.from(list) };
    });
  }

  return (
    <div>
      <div className="card">
        <h2 className="card-title">Reports & Analytics</h2>
        <p style={{ color: '#666', marginBottom: '24px' }}>
          Filter your parlay history and view detailed statistics
        </p>

        <div className="form-group">
          <div className="form-row">
            <div>
              <label className="form-label">Start Date</label>
              <input 
                type="date" 
                className="form-input"
                value={filters.start_date} 
                onChange={e => setFilters({ ...filters, start_date: e.target.value })} 
              />
            </div>
            <div>
              <label className="form-label">End Date</label>
              <input 
                type="date" 
                className="form-input"
                value={filters.end_date} 
                onChange={e => setFilters({ ...filters, end_date: e.target.value })} 
              />
            </div>
          </div>

          <div className="form-row">
            <div>
              <label className="form-label">Min Stake ($)</label>
              <input 
                type="number" 
                step="0.01" 
                className="form-input"
                value={filters.min_stake} 
                onChange={e => setFilters({ ...filters, min_stake: e.target.value })} 
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="form-label">Max Stake ($)</label>
              <input 
                type="number" 
                step="0.01" 
                className="form-input"
                value={filters.max_stake} 
                onChange={e => setFilters({ ...filters, max_stake: e.target.value })} 
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Status</label>
            <select 
              className="form-select"
              value={filters.status} 
              onChange={e => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">Any Status</option>
              <option value="pending">Pending</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>

          <div className="filter-section">
            <div className="filter-title">Filter by Teams</div>
            <div className="checkbox-group">
              {teams.map(t => (
                <label key={t.id} className="checkbox-item">
                  <input 
                    type="checkbox" 
                    checked={filters.team_ids.includes(String(t.id))}
                    onChange={() => toggleMulti('team_ids', String(t.id))} 
                  />
                  <span>{t.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <div className="filter-title">Filter by Players</div>
            <div className="checkbox-group">
              {players.map(p => (
                <label key={p.id} className="checkbox-item">
                  <input 
                    type="checkbox" 
                    checked={filters.player_ids.includes(String(p.id))}
                    onChange={() => toggleMulti('player_ids', String(p.id))} 
                  />
                  <span>{p.name}</span>
                </label>
              ))}
            </div>
          </div>

          <button className="btn-primary" onClick={runReport} style={{ padding: '14px 28px', fontSize: '16px' }}>
            Generate Report
          </button>
        </div>
      </div>

      {stats && (
        <>
          <div className="card">
            <h3 className="card-title">Summary Statistics</h3>
            <div className="stats-grid">
              <Stat label="Total Parlays" value={stats.total_parlays} />
              <Stat label="Won Parlays" value={stats.won_parlays} />
              <Stat label="Lost Parlays" value={stats.lost_parlays} />
              <Stat label="Pending Parlays" value={stats.pending_parlays} />
              <Stat label="Success Rate" value={(stats.success_rate * 100).toFixed(1) + '%'} />
              <Stat label="Average Stake" value={`$${stats.average_stake.toFixed(2)}`} />
              <Stat label="Total Staked" value={`$${stats.total_staked.toFixed(2)}`} />
              <Stat label="Total Returned" value={`$${stats.total_returned.toFixed(2)}`} />
              <Stat 
                label="Net Profit" 
                value={`${stats.net_profit >= 0 ? '+' : ''}$${stats.net_profit.toFixed(2)}`} 
              />
              <Stat 
                label="ROI" 
                value={`${stats.roi >= 0 ? '+' : ''}${(stats.roi * 100).toFixed(1)}%`} 
              />
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">Matching Parlays ({matchingParlays.length})</h3>
            {matchingParlays.length === 0 ? (
              <div className="empty-state">No parlays match the selected filters.</div>
            ) : (
              <ul className="parlay-list">
                {matchingParlays.map(p => (
                  <li key={p.id} className="parlay-item">
                    <div className="parlay-header">
                      <div className="parlay-meta">
                        <strong>{p.date}</strong> • ${parseFloat(p.stake).toFixed(2)} • 
                        <span className={`status-badge status-${p.status}`} style={{ marginLeft: '8px' }}>
                          {p.status}
                        </span>
                        {p.potential_payout && (
                          <span style={{ marginLeft: '8px', color: '#666' }}>
                            (Potential: ${parseFloat(p.potential_payout).toFixed(2)})
                          </span>
                        )}
                        {p.sportsbook && (
                          <span style={{ marginLeft: '8px', color: '#666', fontSize: '14px' }}>
                            • {p.sportsbook}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="parlay-legs" style={{ marginTop: '12px' }}>
                      <strong>Legs ({p.legs.length}):</strong>
                      <div style={{ marginTop: '8px', display: 'grid', gap: '8px' }}>
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
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                              <span style={{ fontWeight: 600 }}>
                                {l.leg_type === 'team' && l.team_id 
                                  ? teams.find(t => t.id === l.team_id)?.name || 'Unknown Team'
                                  : l.leg_type === 'player' && l.player_id
                                  ? players.find(pl => pl.id === l.player_id)?.name || 'Unknown Player'
                                  : 'N/A'}
                              </span>
                              <span>•</span>
                              <span>{l.market}</span>
                              <span>•</span>
                              <span style={{ fontWeight: 600 }}>{l.selection}</span>
                              {l.odds && (
                                <>
                                  <span>•</span>
                                  <span style={{ color: l.odds > 0 ? '#059669' : '#dc2626' }}>
                                    {l.odds > 0 ? '+' : ''}{l.odds}
                                  </span>
                                </>
                              )}
                              <span>•</span>
                              <span className={`status-badge status-${l.result}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                                {l.result}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {p.notes && (
                      <div style={{ marginTop: '12px', color: '#666', fontSize: '14px', fontStyle: 'italic', padding: '8px', background: '#f8f9fa', borderRadius: '6px' }}>
                        <strong>Notes:</strong> {p.notes}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}


