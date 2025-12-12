import './App.css';
import ParlayForm from './ParlayForm';
import Report from './Report';
import ManageTeamsPlayers from './ManageTeamsPlayers';
import { useState, useCallback, useEffect } from 'react';
import { seedBasic, getTeams, getPlayers } from './api';

function App() {
  const [tab, setTab] = useState('parlays');
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    // Load teams and players on app startup
    (async () => {
      try {
        const [t, p] = await Promise.all([getTeams(), getPlayers()]);
        setTeams(t);
        setPlayers(p);
      } catch (error) {
        console.error('Error loading teams/players:', error);
      }
    })();
  }, []);

  const handleSeed = async () => {
    try {
      await seedBasic();
      alert('Sample teams and players seeded successfully! You can also add your own teams/players in the "Manage Teams & Players" tab.');
    } catch (error) {
      alert('Error seeding data: ' + error.message);
    }
  };

  const handleTeamsPlayersUpdate = useCallback((updatedTeams, updatedPlayers) => {
    setTeams(updatedTeams);
    setPlayers(updatedPlayers);
  }, []);

  return (
    <div className="app-container">
      <div className="app-header">
        <h1 className="app-title">NBA Parlay Tracker</h1>
        <div className="tab-container">
          <button 
            className="tab-button" 
            onClick={() => setTab('parlays')} 
            disabled={tab === 'parlays'}
          >
            Manage Parlays
          </button>
          <button 
            className="tab-button" 
            onClick={() => setTab('report')} 
            disabled={tab === 'report'}
          >
            Reports & Analytics
          </button>
          <button 
            className="tab-button" 
            onClick={() => setTab('teams')} 
            disabled={tab === 'teams'}
          >
            Manage Teams & Players
          </button>
          <button 
            className="btn-secondary" 
            onClick={handleSeed}
            title="Add sample teams and players (optional)"
          >
            Seed Sample Data
          </button>
        </div>
      </div>
      {tab === 'parlays' && <ParlayForm teams={teams} players={players} onTeamsPlayersUpdate={handleTeamsPlayersUpdate} />}
      {tab === 'report' && <Report teams={teams} players={players} onTeamsPlayersUpdate={handleTeamsPlayersUpdate} />}
      {tab === 'teams' && <ManageTeamsPlayers onUpdate={handleTeamsPlayersUpdate} />}
    </div>
  );
}

export default App;
