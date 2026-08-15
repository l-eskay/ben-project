import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLeague } from '../../contexts/LeagueContext';
import { fetchLadder } from '../../services/tennisApi';

const Home = () => {
  const { leagues, currentLeague, switchLeague } = useLeague();
  const navigate = useNavigate();
  const [leaders, setLeaders] = useState({});

  useEffect(() => {
    if (!leagues.length) return;
    let cancelled = false;
    Promise.all(
      leagues.map((lg) => fetchLadder(lg.slug).then((rows) => [lg.slug, rows[0]?.name || '—'])),
    ).then((entries) => {
      if (!cancelled) setLeaders(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, [leagues]);

  if (!currentLeague) return null;
  const s = currentLeague.settings;

  return (
    <>
      <section className="block">
        <div className="block-head">
          <h2>Two divisions, one club</h2>
        </div>
        <div className="cards-2">
          {leagues.map((lg) => (
            <div key={lg.slug} className={`card league-landing-card ${lg.slug}`}>
              <div className="lg-head">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="dot" />
                  <h3 style={{ margin: 0 }}>{lg.name}</h3>
                </div>
              </div>
              <p>{lg.blurb}</p>
              <div style={{ margin: '14px 0', fontSize: '13.5px', color: 'var(--muted)' }}>
                Teams: <strong style={{ color: 'var(--ink)' }}>{lg.team_count}</strong> · Leader:{' '}
                <strong style={{ color: 'var(--ink)' }}>{leaders[lg.slug] ?? '–'}</strong>
              </div>
              <button
                type="button"
                className="btn btn-outline small"
                onClick={() => {
                  switchLeague(lg.slug);
                  navigate('/ladder');
                }}
              >
                View {lg.name} ladder →
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="block">
        <div className="block-head">
          <h2>How points work — {currentLeague.name}</h2>
        </div>
        <div className="cards-3">
          <div className="card">
            <span className="pill lime">Singles win</span>
            <h3 style={{ marginTop: 12 }}>{s.pts_singles_win} points</h3>
            <p>Awarded for every singles rubber a team wins.</p>
          </div>
          <div className="card">
            <span className="pill lime">Doubles win</span>
            <h3 style={{ marginTop: 12 }}>{s.pts_doubles_win} points</h3>
            <p>Awarded for every doubles rubber a team wins.</p>
          </div>
          <div className="card">
            <span className="pill gold">Bonus</span>
            <h3 style={{ marginTop: 12 }}>{s.pts_per_game} pt / game won</h3>
            <p>
              Every game won across all rubbers adds to a team&apos;s weekly tally. If a player
              fills in for another team, their points go back to their own team.
            </p>
          </div>
        </div>
      </section>

      <section className="block">
        <div className="block-head">
          <h2>About the league</h2>
        </div>
        <div className="card">
          <p>
            Hot Shots Tennis League runs out of KT Academy across two divisions — Green Ball and
            Orange Ball — with teams facing off each round across a mix of singles and doubles
            rubbers. Results are entered by team each week and each ladder recalculates instantly.
            If a player fills in for a different team on the day, their points still count toward
            their own team&apos;s ladder tally. Use the switcher above to move between divisions.
          </p>
        </div>
      </section>
    </>
  );
};

export default Home;
