import { useContext, useEffect, useMemo, useState } from 'react';
import { SnackbarContext } from '../../../contexts/SnackbarContext';
import { useLeague } from '../../../contexts/LeagueContext';
import { fetchTeams, fetchFixtures, createMatch } from '../../../services/tennisApi';

let rowSeq = 0;
const newRow = (type = 'singles') => ({
  key: `rr_${(rowSeq += 1)}`,
  type,
  homeP1: '',
  homeP2: '',
  homeGames: 0,
  awayP1: '',
  awayP2: '',
  awayGames: 0,
});

const defaultRows = () => [newRow('singles'), newRow('singles'), newRow('doubles')];

const EnterResults = ({ initialFixtureId, onFixtureConsumed }) => {
  const { currentSlug } = useLeague();
  const { showSnackbar } = useContext(SnackbarContext);
  const [teams, setTeams] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [linkedFixtureId, setLinkedFixtureId] = useState('');
  const [week, setWeek] = useState('');
  const [date, setDate] = useState('');
  const [home, setHome] = useState('');
  const [away, setAway] = useState('');
  const [rows, setRows] = useState(defaultRows());

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

  useEffect(() => {
    if (!initialFixtureId || !fixtures.length) return;
    const applyLinkedFixture = (f) => {
      setLinkedFixtureId(String(f.id));
      setWeek(f.week || '');
      setDate(f.date || '');
      setHome(String(f.home_team || ''));
      setAway(String(f.away_team || ''));
    };
    const f = fixtures.find((x) => x.id === initialFixtureId);
    if (f) {
      applyLinkedFixture(f);
    }
    onFixtureConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFixtureId, fixtures]);

  const playerNames = useMemo(() => {
    const names = new Set();
    teams.forEach((t) => t.players.forEach((p) => names.add(p.name)));
    return Array.from(names).sort();
  }, [teams]);

  const handleLinkChange = (id) => {
    setLinkedFixtureId(id);
    if (!id) return;
    const f = fixtures.find((x) => String(x.id) === id);
    if (!f) return;
    setWeek(f.week || '');
    setDate(f.date || '');
    setHome(String(f.home_team || ''));
    setAway(String(f.away_team || ''));
  };

  const updateRow = (key, patch) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const removeRow = (key) => setRows((prev) => prev.filter((r) => r.key !== key));

  const handleSave = async () => {
    if (!home || !away) {
      showSnackbar('Choose both teams', 'error');
      return;
    }
    if (home === away) {
      showSnackbar('Home and away teams must differ', 'error');
      return;
    }
    if (rows.length === 0) {
      showSnackbar('Add at least one rubber', 'error');
      return;
    }
    const rubbers = rows.map((r) => ({
      type: r.type,
      home_players: [r.homeP1.trim(), r.type === 'doubles' ? r.homeP2.trim() : '']
        .filter(Boolean)
        .join(' & '),
      away_players: [r.awayP1.trim(), r.type === 'doubles' ? r.awayP2.trim() : '']
        .filter(Boolean)
        .join(' & '),
      home_games: Number(r.homeGames) || 0,
      away_games: Number(r.awayGames) || 0,
    }));

    try {
      await createMatch(currentSlug, {
        week: week.trim() || 'Unlabelled round',
        date: date || null,
        home_team: Number(home),
        away_team: Number(away),
        fixture_id: linkedFixtureId ? Number(linkedFixtureId) : null,
        rubbers,
      });
      setWeek('');
      setDate('');
      setLinkedFixtureId('');
      setRows(defaultRows());
      await reload();
      showSnackbar('Result saved — ladder updated', 'success');
    } catch {
      showSnackbar('Could not save result', 'error');
    }
  };

  return (
    <div className="admin-panel active">
      <datalist id="playersDatalist">
        {playerNames.map((n) => (
          <option value={n} key={n} />
        ))}
      </datalist>
      <div className="card">
        <h3>Add a round result</h3>
        <div className="field">
          <label>Link to a scheduled draw (optional)</label>
          <select value={linkedFixtureId} onChange={(e) => handleLinkChange(e.target.value)}>
            <option value="">— No linked draw (ad hoc result) —</option>
            {fixtures.map((f) => (
              <option key={f.id} value={f.id}>
                {(f.week || '') +
                  ' — ' +
                  (f.home_team_name || '?') +
                  ' vs ' +
                  (f.away_team_name || '?') +
                  (f.date ? ` (${f.date})` : '')}
              </option>
            ))}
          </select>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Round / Week label</label>
            <input
              type="text"
              placeholder="e.g. Round 4"
              value={week}
              onChange={(e) => setWeek(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Home team</label>
            <select value={home} onChange={(e) => setHome(e.target.value)}>
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
            <select value={away} onChange={(e) => setAway(e.target.value)}>
              <option value="">{teams.length ? 'Select…' : 'No teams yet'}</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <hr className="sep" />
        <label>Rubbers</label>
        <p className="helper-text">
          Type each player&apos;s real name. If a player is filling in for a different team, their
          points are automatically credited back to their own team&apos;s ladder tally — just enter
          their actual name.
        </p>
        <div>
          {rows.map((r) => {
            const isDoubles = r.type === 'doubles';
            return (
              <div className="rubber-row" key={r.key}>
                <div className="rr-top">
                  <select value={r.type} onChange={(e) => updateRow(r.key, { type: e.target.value })}>
                    <option value="singles">Singles</option>
                    <option value="doubles">Doubles</option>
                  </select>
                  <button
                    type="button"
                    className="rm-btn"
                    title="Remove rubber"
                    onClick={() => removeRow(r.key)}
                  >
                    ×
                  </button>
                </div>
                <div className="rr-side">
                  <span className="rr-side-label">Home</span>
                  <input
                    type="text"
                    list="playersDatalist"
                    placeholder="Player name"
                    value={r.homeP1}
                    onChange={(e) => updateRow(r.key, { homeP1: e.target.value })}
                  />
                  {isDoubles && (
                    <input
                      type="text"
                      list="playersDatalist"
                      placeholder="Partner name"
                      value={r.homeP2}
                      onChange={(e) => updateRow(r.key, { homeP2: e.target.value })}
                    />
                  )}
                  <input
                    type="number"
                    min="0"
                    placeholder="Games"
                    value={r.homeGames}
                    onChange={(e) => updateRow(r.key, { homeGames: e.target.value })}
                  />
                </div>
                <div className="rr-side">
                  <span className="rr-side-label">Away</span>
                  <input
                    type="text"
                    list="playersDatalist"
                    placeholder="Player name"
                    value={r.awayP1}
                    onChange={(e) => updateRow(r.key, { awayP1: e.target.value })}
                  />
                  {isDoubles && (
                    <input
                      type="text"
                      list="playersDatalist"
                      placeholder="Partner name"
                      value={r.awayP2}
                      onChange={(e) => updateRow(r.key, { awayP2: e.target.value })}
                    />
                  )}
                  <input
                    type="number"
                    min="0"
                    placeholder="Games"
                    value={r.awayGames}
                    onChange={(e) => updateRow(r.key, { awayGames: e.target.value })}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          className="btn btn-outline small"
          onClick={() => setRows((prev) => [...prev, newRow('singles')])}
        >
          + Add rubber
        </button>
        <div style={{ marginTop: 22 }}>
          <button type="button" className="btn btn-lime" onClick={handleSave}>
            Save result
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnterResults;
