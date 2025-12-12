import { useEffect, useState } from 'react';
import { createTeam, createPlayer, getTeams, getPlayers, deleteTeam, deletePlayer } from './api';

export default function ManageTeamsPlayers({ onUpdate }) {
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [teamForm, setTeamForm] = useState({ name: '', abbreviation: '' });
  const [playerForm, setPlayerForm] = useState({ name: '', team_id: '' });

  useEffect(() => {
    refreshData();
  }, []);

  async function refreshData() {
    const [t, p] = await Promise.all([getTeams(), getPlayers()]);
    setTeams(t);
    setPlayers(p);
    if (onUpdate) {
      onUpdate(t, p);
    }
  }

  async function handleAddTeam(e) {
    e.preventDefault();
    try {
      await createTeam({
        name: teamForm.name,
        abbreviation: teamForm.abbreviation || null,
      });
      setTeamForm({ name: '', abbreviation: '' });
      await refreshData();
    } catch (error) {
      alert('Error creating team: ' + error.message);
    }
  }

  async function handleAddPlayer(e) {
    e.preventDefault();
    try {
      await createPlayer({
        name: playerForm.name,
        team_id: playerForm.team_id ? Number(playerForm.team_id) : null,
      });
      setPlayerForm({ name: '', team_id: '' });
      await refreshData();
    } catch (error) {
      alert('Error creating player: ' + error.message);
    }
  }

  async function handleDeleteTeam(id) {
    if (!window.confirm('Delete this team? This may fail if referenced by parlays.')) return;
    try {
      await deleteTeam(id);
      await refreshData();
    } catch (error) {
      alert('Error deleting team: ' + error.message);
    }
  }

  async function handleDeletePlayer(id) {
    if (!window.confirm('Delete this player?')) return;
    try {
      await deletePlayer(id);
      await refreshData();
    } catch (error) {
      alert('Error deleting player: ' + error.message);
    }
  }

  return (
    <div>
      <div className="card">
        <h2 className="card-title">Manage Teams</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Add teams to the database. Teams will appear in parlay dropdowns.
        </p>

        <form onSubmit={handleAddTeam} className="form-group">
          <div className="form-row">
            <div>
              <label className="form-label">Team Name *</label>
              <input
                type="text"
                className="form-input"
                value={teamForm.name}
                onChange={e => setTeamForm({ ...teamForm, name: e.target.value })}
                placeholder="e.g., Boston Celtics"
                required
              />
            </div>
            <div>
              <label className="form-label">Abbreviation</label>
              <input
                type="text"
                className="form-input"
                value={teamForm.abbreviation}
                onChange={e => setTeamForm({ ...teamForm, abbreviation: e.target.value })}
                placeholder="e.g., BOS"
                maxLength={10}
              />
            </div>
          </div>
          <button type="submit" className="btn-primary">
            Add Team
          </button>
        </form>

        <div style={{ marginTop: '24px', borderTop: '2px solid #e0e0e0', paddingTop: '20px' }}>
          <h3 className="section-title">Existing Teams ({teams.length})</h3>
          {teams.length === 0 ? (
            <div className="empty-state">No teams in database. Add your first team above!</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {teams.map(team => (
                <div
                  key={team.id}
                  style={{
                    background: '#f8f9fa',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{team.name}</div>
                    {team.abbreviation && (
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        {team.abbreviation}
                      </div>
                    )}
                  </div>
                  <button
                    className="btn-danger"
                    style={{ fontSize: '12px', padding: '6px 10px' }}
                    onClick={() => handleDeleteTeam(team.id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Manage Players</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Add players to the database. Players will appear in parlay dropdowns.
        </p>

        <form onSubmit={handleAddPlayer} className="form-group">
          <div className="form-row">
            <div>
              <label className="form-label">Player Name *</label>
              <input
                type="text"
                className="form-input"
                value={playerForm.name}
                onChange={e => setPlayerForm({ ...playerForm, name: e.target.value })}
                placeholder="e.g., LeBron James"
                required
              />
            </div>
            <div>
              <label className="form-label">Team (Optional)</label>
              <select
                className="form-select"
                value={playerForm.team_id}
                onChange={e => setPlayerForm({ ...playerForm, team_id: e.target.value })}
              >
                <option value="">No Team</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary">
            Add Player
          </button>
        </form>

        <div style={{ marginTop: '24px', borderTop: '2px solid #e0e0e0', paddingTop: '20px' }}>
          <h3 className="section-title">Existing Players ({players.length})</h3>
          {players.length === 0 ? (
            <div className="empty-state">No players in database. Add your first player above!</div>
          ) : (
            <div style={{ display: 'grid', gap: '8px' }}>
              {players.map(player => (
                <div
                  key={player.id}
                  style={{
                    background: '#f8f9fa',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{player.name}</div>
                    {player.team_id && (
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        {teams.find(t => t.id === player.team_id)?.name || 'Unknown Team'}
                      </div>
                    )}
                  </div>
                  <button
                    className="btn-danger"
                    style={{ fontSize: '12px', padding: '6px 10px' }}
                    onClick={() => handleDeletePlayer(player.id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

