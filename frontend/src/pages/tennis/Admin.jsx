import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserContext from '../../contexts/UserContext';
import { useLeague } from '../../contexts/LeagueContext';
import EnterResults from './admin/EnterResults';
import ScheduleDraw from './admin/ScheduleDraw';
import ManageTeams from './admin/ManageTeams';
import SettingsPanel from './admin/SettingsPanel';

const TABS = [
  { key: 'enter', label: 'Enter Results' },
  { key: 'draw', label: 'Schedule Draw' },
  { key: 'teams', label: 'Manage Teams' },
  { key: 'settings', label: 'League Settings' },
];

const Admin = () => {
  const { user, logout, loading } = useContext(UserContext);
  const { currentLeague } = useLeague();
  const navigate = useNavigate();
  const [tab, setTab] = useState('enter');
  const [pendingFixtureId, setPendingFixtureId] = useState(null);

  if (loading || !currentLeague) return null;

  if (!user) {
    return (
      <section className="block">
        <div className="lockbox">
          <h2>{currentLeague.name} admin access</h2>
          <p>Log in to manage teams, schedule draws and enter weekly results.</p>
          <button
            type="button"
            className="btn btn-dark"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => navigate('/login')}
          >
            Log in
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="block">
      <div className="block-head">
        <h2>{currentLeague.name} Admin</h2>
        <button type="button" className="btn btn-outline small" onClick={logout}>
          Log out
        </button>
      </div>
      <div className="admin-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={tab === t.key ? 'active' : ''}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'enter' && (
        <EnterResults
          initialFixtureId={pendingFixtureId}
          onFixtureConsumed={() => setPendingFixtureId(null)}
        />
      )}
      {tab === 'draw' && (
        <ScheduleDraw
          onJumpToEnterResult={(fixtureId) => {
            setPendingFixtureId(fixtureId);
            setTab('enter');
          }}
        />
      )}
      {tab === 'teams' && <ManageTeams />}
      {tab === 'settings' && <SettingsPanel />}
    </section>
  );
};

export default Admin;
