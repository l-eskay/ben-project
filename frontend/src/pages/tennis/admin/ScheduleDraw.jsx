import { useContext, useEffect, useState } from 'react';
import { SnackbarContext } from '../../../contexts/SnackbarContext';
import { useLeague } from '../../../contexts/LeagueContext';
import { fetchTeams, fetchFixtures, createFixture, deleteFixture } from '../../../services/tennisApi';
import EmptyState from '../components/EmptyState';
import { formatDate } from '../lib';

const ScheduleDraw = ({ onJumpToEnterResult }) => {
  const { currentSlug } = useLeague();
  const { showSnackbar } = useContext(SnackbarContext);
  const [teams, setTeams] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [form, setForm] = useState({ week: '', date: '', home: '', away: '', notes: '' });

  const reload = async () => {
    const [teamsData, fixturesData] = await Promise.all([
      fetchTeams(currentSlug),
      fetchFixtures(currentSlug, { unscheduledOnly: true }),
    ]);
    setTeams(teamsData);
    setFixtures([...fixturesData].sort((a, b) => (a.date || '').localeCompare(b.date || '')));
  };

  useEffect(() => {
    if (!currentSlug) return;
    let cancelled = false;
    (async () => {
      const [teamsData, fixturesData] = await Promise.all([
        fetchTeams(currentSlug),
        fetchFixtures(currentSlug, { unscheduledOnly: true }),
      ]);
      if (cancelled) return;
      setTeams(teamsData);
      setFixtures([...fixturesData].sort((a, b) => (a.date || '').localeCompare(b.date || '')));
    })();
    return () => {
      cancelled = true;
    };
  }, [currentSlug]);

  const handleSave = async () => {
    if (!form.home || !form.away) {
      showSnackbar('Choose both teams', 'error');
      return;
    }
    if (form.home === form.away) {
      showSnackbar('Home and away teams must differ', 'error');
      return;
    }
    try {
      await createFixture(currentSlug, {
        week: form.week.trim() || 'Unlabelled round',
        date: form.date || null,
        home_team: Number(form.home),
        away_team: Number(form.away),
        notes: form.notes.trim(),
      });
      setForm({ week: '', date: '', home: '', away: '', notes: '' });
      await reload();
      showSnackbar('Draw scheduled', 'success');
    } catch {
      showSnackbar('Could not schedule draw', 'error');
    }
  };

  const handleDelete = async (fixtureId) => {
    if (!window.confirm('Delete this scheduled draw?')) return;
    try {
      await deleteFixture(currentSlug, fixtureId);
      await reload();
      showSnackbar('Draw deleted', 'success');
    } catch {
      showSnackbar('Could not delete draw', 'error');
    }
  };

  return (
    <div className="admin-panel active">
      <div className="card">
        <h3>Schedule a draw</h3>
        <div className="field-row">
          <div className="field">
            <label>Round / Week label</label>
            <input
              type="text"
              placeholder="e.g. Round 5"
              value={form.week}
              onChange={(e) => setForm((f) => ({ ...f, week: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Home team</label>
            <select value={form.home} onChange={(e) => setForm((f) => ({ ...f, home: e.target.value }))}>
              <option value="">{teams.length ? 'Select…' : 'No teams yet'}</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Away team</label>
            <select value={form.away} onChange={(e) => setForm((f) => ({ ...f, away: e.target.value }))}>
              <option value="">{teams.length ? 'Select…' : 'No teams yet'}</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <label>Notes (optional)</label>
          <input
            type="text"
            placeholder="e.g. Court 3, 4:30pm"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>
        <button type="button" className="btn btn-lime" onClick={handleSave}>
          Schedule draw
        </button>
      </div>

      <div style={{ marginTop: 18 }}>
        {fixtures.length === 0 ? (
          <EmptyState title="No draws scheduled yet" sub="Schedule your first round above." />
        ) : (
          fixtures.map((f) => (
            <div className="draw-manage-row" key={f.id}>
              <div>
                <strong>
                  {f.home_team_name || '?'} vs {f.away_team_name || '?'}
                </strong>
                <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>
                  {f.week || ''}
                  {f.date ? ` · ${formatDate(f.date)}` : ''}
                  {f.notes ? ` · ${f.notes}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline small"
                  onClick={() => onJumpToEnterResult(f.id)}
                >
                  Enter result
                </button>
                <button type="button" className="btn btn-danger small" onClick={() => handleDelete(f.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ScheduleDraw;
