import { useEffect, useState } from 'react';
import { useLeague } from '../../contexts/LeagueContext';
import { fetchFixtures } from '../../services/tennisApi';
import EmptyState from './components/EmptyState';
import { formatDate, today } from './lib';

const Draw = () => {
  const { currentSlug, currentLeague } = useLeague();
  const [fixtures, setFixtures] = useState(null);

  useEffect(() => {
    if (!currentSlug) return;
    let cancelled = false;
    const load = async () => {
      setFixtures(null);
      const data = await fetchFixtures(currentSlug, { unscheduledOnly: true });
      if (!cancelled) {
        setFixtures([...data].sort((a, b) => (a.date || '').localeCompare(b.date || '')));
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [currentSlug]);

  return (
    <section className="block">
      <div className="block-head">
        <h2>{currentLeague?.name} Draw</h2>
      </div>
      {fixtures === null ? (
        <div className="loading-row">Loading draw…</div>
      ) : fixtures.length === 0 ? (
        <EmptyState
          title="No upcoming draws scheduled"
          sub="Once an admin schedules a round, fixtures will appear here."
        />
      ) : (
        fixtures.map((f) => {
          const overdue = f.date && f.date < today();
          return (
            <div className="match-card" key={f.id}>
              <div className="match-head">
                <div className="match-teams">
                  <span>{f.home_team_name || 'TBC'}</span>
                  <span className="vs">vs</span>
                  <span>{f.away_team_name || 'TBC'}</span>
                </div>
                <div>
                  {f.week && <span className="pill">{f.week}</span>}
                  {f.date && (
                    <span className="pill" style={{ marginLeft: 6 }}>
                      {formatDate(f.date)}
                    </span>
                  )}
                  {overdue && (
                    <span className="pill gold" style={{ marginLeft: 6 }}>
                      Awaiting result
                    </span>
                  )}
                </div>
              </div>
              {f.notes && <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>{f.notes}</p>}
            </div>
          );
        })
      )}
    </section>
  );
};

export default Draw;
