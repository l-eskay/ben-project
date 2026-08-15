import { useContext, useEffect, useState } from 'react';
import { SnackbarContext } from '../../../contexts/SnackbarContext';
import { useLeague } from '../../../contexts/LeagueContext';
import {
  fetchTeams,
  createTeam,
  deleteTeam,
  addPlayer,
  removePlayer,
} from '../../../services/tennisApi';
import EmptyState from '../components/EmptyState';

const ManageTeams = () => {
  const { currentSlug, reloadLeagues } = useLeague();
  const { showSnackbar } = useContext(SnackbarContext);
  const [teams, setTeams] = useState([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [playerInputs, setPlayerInputs] = useState({});

  const reload = () => fetchTeams(currentSlug).then(setTeams);

  useEffect(() => {
    if (currentSlug) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlug]);

  const handleAddTeam = async () => {
    const name = newTeamName.trim();
    if (!name) {
      showSnackbar('Enter a team name', 'error');
      return;
    }
    try {
      await createTeam(currentSlug, name);
      setNewTeamName('');
      await reload();
      await reloadLeagues();
      showSnackbar('Team added', 'success');
    } catch {
      showSnackbar('Could not add team', 'error');
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('Delete this team? Existing results referencing it will show as Unknown.')) {
      return;
    }
    try {
      await deleteTeam(currentSlug, teamId);
      await reload();
      await reloadLeagues();
      showSnackbar('Team deleted', 'success');
    } catch {
      showSnackbar('Could not delete team', 'error');
    }
  };

  const handleAddPlayer = async (teamId) => {
    const name = (playerInputs[teamId] || '').trim();
    if (!name) return;
    try {
      await addPlayer(teamId, name);
      setPlayerInputs((prev) => ({ ...prev, [teamId]: '' }));
      await reload();
      showSnackbar('Player added', 'success');
    } catch {
      showSnackbar('Could not add player', 'error');
    }
  };

  const handleRemovePlayer = async (teamId, playerId) => {
    try {
      await removePlayer(teamId, playerId);
      await reload();
      showSnackbar('Player removed', 'success');
    } catch {
      showSnackbar('Could not remove player', 'error');
    }
  };

  return (
    <div className="admin-panel active">
      <div className="card">
        <h3>Add a team</h3>
        <div className="field-row">
          <div className="field" style={{ flex: 2 }}>
            <label>Team name</label>
            <input
              type="text"
              placeholder="e.g. KT Aces"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTeam()}
            />
          </div>
          <div className="field">
            <label>&nbsp;</label>
            <button
              type="button"
              className="btn btn-dark"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={handleAddTeam}
            >
              Add team
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        {teams.length === 0 ? (
          <EmptyState title="No teams yet" sub="Add your first team above." />
        ) : (
          teams.map((t) => (
            <div className="card" style={{ marginBottom: 12 }} key={t.id}>
              <div className="team-row" style={{ background: 'none', padding: 0 }}>
                <span className="name">{t.name}</span>
                <button
                  type="button"
                  className="btn btn-danger small"
                  onClick={() => handleDeleteTeam(t.id)}
                >
                  Delete
                </button>
              </div>
              <div className="roster" style={{ marginTop: 12 }}>
                {t.players.map((p) => (
                  <span className="player-tag" key={p.id}>
                    {p.name}
                    <button type="button" onClick={() => handleRemovePlayer(t.id, p.id)}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="field-row" style={{ marginTop: 12 }}>
                <div className="field" style={{ flex: 2 }}>
                  <input
                    type="text"
                    placeholder="Add player name"
                    value={playerInputs[t.id] || ''}
                    onChange={(e) =>
                      setPlayerInputs((prev) => ({ ...prev, [t.id]: e.target.value }))
                    }
                    onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer(t.id)}
                  />
                </div>
                <div className="field" style={{ maxWidth: 120 }}>
                  <button
                    type="button"
                    className="btn btn-outline small"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => handleAddPlayer(t.id)}
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ManageTeams;
