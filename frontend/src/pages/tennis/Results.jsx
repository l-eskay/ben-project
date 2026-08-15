import { useEffect, useState } from 'react';
import { useLeague } from '../../contexts/LeagueContext';
import { fetchMatches } from '../../services/tennisApi';
import EmptyState from './components/EmptyState';
import { formatDate, toNameArray } from './lib';

const rubberPoints = (rubber, settings) => {
  const hg = Number(rubber.home_games) || 0;
  const ag = Number(rubber.away_games) || 0;
  const winPts = rubber.type === 'singles' ? settings.pts_singles_win : settings.pts_doubles_win;
  return {
    home: hg * settings.pts_per_game + (hg > ag ? winPts : 0),
    away: ag * settings.pts_per_game + (ag > hg ? winPts : 0),
  };
};

const Results = () => {
  const { currentSlug, currentLeague } = useLeague();
  const [matches, setMatches] = useState(null);

  useEffect(() => {
    if (!currentSlug) return;
    let cancelled = false;
    const load = async () => {
      setMatches(null);
      const data = await fetchMatches(currentSlug);
      if (!cancelled) setMatches(data);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [currentSlug]);

  if (matches === null) {
    return (
      <section className="block">
        <div className="block-head">
          <h2>{currentLeague?.name} Results</h2>
        </div>
        <div className="loading-row">Loading results…</div>
      </section>
    );
  }

  if (matches.length === 0) {
    return (
      <section className="block">
        <div className="block-head">
          <h2>{currentLeague?.name} Results</h2>
        </div>
        <EmptyState
          title="No results yet"
          sub="Weekly scorecards will appear here as soon as an admin enters them."
        />
      </section>
    );
  }

  const byWeek = {};
  [...matches]
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .forEach((m) => {
      const key = m.week || 'Unlabelled round';
      (byWeek[key] ||= []).push(m);
    });

  const settings = currentLeague.settings;

  return (
    <section className="block">
      <div className="block-head">
        <h2>{currentLeague?.name} Results</h2>
      </div>
      {Object.entries(byWeek).map(([week, weekMatches]) => (
        <div className="week-group" key={week}>
          <div className="week-title">{week}</div>
          {weekMatches.map((m) => {
            let hPts = 0;
            let aPts = 0;
            m.rubbers.forEach((r) => {
              const pts = rubberPoints(r, settings);
              hPts += pts.home;
              aPts += pts.away;
            });
            return (
              <div className="match-card" key={m.id}>
                <div className="match-head">
                  <div className="match-teams">
                    <span className={hPts >= aPts ? 'win' : ''}>{m.home_team_name || 'Unknown'}</span>
                    <span className="vs">vs</span>
                    <span className={aPts >= hPts ? 'win' : ''}>{m.away_team_name || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="pill">{m.date ? formatDate(m.date) : ''}</span>
                    <span className="pill lime" style={{ marginLeft: 6 }}>
                      {hPts} – {aPts}
                    </span>
                  </div>
                </div>
                <table className="rubber-table">
                  <thead>
                    <tr>
                      <th>Rubber</th>
                      <th>Home</th>
                      <th>Away</th>
                      <th style={{ textAlign: 'center' }}>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {m.rubbers.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <span className="type-tag">
                            {r.type === 'singles' ? 'Singles' : 'Doubles'}
                          </span>
                        </td>
                        <td>{toNameArray(r.home_players).join(' & ') || '—'}</td>
                        <td>{toNameArray(r.away_players).join(' & ') || '—'}</td>
                        <td className="score">
                          {r.home_games} – {r.away_games}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      ))}
    </section>
  );
};

export default Results;
