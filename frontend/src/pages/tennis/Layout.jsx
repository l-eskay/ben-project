import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useLeague } from '../../contexts/LeagueContext';
import { fetchLadder, fetchMatches } from '../../services/tennisApi';
import '../../styles/tennis.css';

const NAV_ITEMS = [
  { to: '/', label: 'Home', end: true },
  { to: '/ladder', label: 'Ladder' },
  { to: '/draw', label: 'Draw' },
  { to: '/results', label: 'Results' },
  { to: '/teams', label: 'Teams' },
  { to: '/admin', label: 'Admin' },
];

const Layout = () => {
  const { leagues, currentSlug, currentLeague, switchLeague } = useLeague();
  const navigate = useNavigate();
  const [heroStats, setHeroStats] = useState({ leader: '–', rounds: '–' });

  useEffect(() => {
    if (!currentLeague) return;
    let cancelled = false;
    Promise.all([fetchLadder(currentSlug), fetchMatches(currentSlug)]).then(([ladder, matches]) => {
      if (cancelled) return;
      const rounds = new Set(matches.map((m) => m.week)).size;
      setHeroStats({ leader: ladder.length ? ladder[0].name : '–', rounds });
    });
    return () => {
      cancelled = true;
    };
  }, [currentSlug, currentLeague]);

  return (
    <div className="tennis-root">
      <header className="topnav">
        <div className="nav-inner">
          <button type="button" className="brand" onClick={() => navigate('/')}>
            <div className="wordmark">
              HOT <span>SHOTS</span>
            </div>
            <div className="sub">
              Tennis League · KT Academy{currentLeague ? ` — ${currentLeague.name}` : ''}
            </div>
          </button>
          <nav className="links">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <div className="league-bar">
        <div className="league-bar-inner">
          <span className="league-bar-label">Viewing:</span>
          <div className="league-toggle">
            {leagues.map((lg) => (
              <button
                key={lg.slug}
                type="button"
                className={`league-btn${lg.slug === currentSlug ? ' active' : ''}`}
                data-lg={lg.slug}
                onClick={() => switchLeague(lg.slug)}
              >
                <span className="dot" />
                {lg.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="hero court-texture">
        <div className="hero-inner">
          <div className="hero-text">
            <div className="eyebrow">{currentLeague ? `${currentLeague.name} Division` : ''}</div>
            <h1>
              Hot Shots <span>Tennis League</span>
            </h1>
            <p className="lead">
              Weekly team tennis, based at KT Academy. Singles and doubles rubbers every round,
              points on the board, and a ladder that updates the moment scores go in.
            </p>
            <div className="hero-cta">
              <a className="btn btn-lime" onClick={() => navigate('/ladder')}>
                View the ladder
              </a>
              <a className="btn btn-ghost" onClick={() => navigate('/draw')}>
                Upcoming draw
              </a>
            </div>
          </div>
          <div className="hero-badge">
            <div className="row">
              <div className="k">Teams competing</div>
              <div className="v">{currentLeague ? currentLeague.team_count : '–'}</div>
            </div>
            <div className="row">
              <div className="k">Rounds played</div>
              <div className="v">{heroStats.rounds}</div>
            </div>
            <div className="row">
              <div className="k">Ladder leader</div>
              <div className="v" style={{ fontSize: 19 }}>
                {heroStats.leader}
              </div>
            </div>
          </div>
        </div>
      </section>

      <main>
        <div className="view active">
          <Outlet />
        </div>
      </main>

      <footer>
        <div className="f-inner">
          <div>
            <strong>Hot Shots Tennis League</strong>
            <br />
            Based at KT Academy — 112 Lady Musgrave Dr, Mountain Creek QLD
          </div>
          <div>
            Green Ball and Orange Ball run as separate divisions, each with their own draw,
            ladder, teams and results.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
