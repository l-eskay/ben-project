import { useEffect, useState } from 'react';
import { useLeague } from '../../contexts/LeagueContext';
import { fetchTeams } from '../../services/tennisApi';
import EmptyState from './components/EmptyState';

const Teams = () => {
  const { currentSlug, currentLeague } = useLeague();
  const [teams, setTeams] = useState(null);

  useEffect(() => {
    if (!currentSlug) return;
    let cancelled = false;
    const load = async () => {
      setTeams(null);
      const data = await fetchTeams(currentSlug);
      if (!cancelled) setTeams(data);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [currentSlug]);

  return (
    <section className="block">
      <div className="block-head">
        <h2>{currentLeague?.name} Teams</h2>
      </div>
      {teams === null ? (
        <div className="loading-row">Loading teams…</div>
      ) : teams.length === 0 ? (
        <EmptyState
          title="No teams added yet"
          sub="Teams entered by an admin will be listed here with their rosters."
        />
      ) : (
        <div className="cards-2">
          {teams.map((t) => (
            <div className="team-card" key={t.id}>
              <h3>{t.name}</h3>
              <div className="roster">
                {t.players.length ? (
                  t.players.map((p) => (
                    <span className="chip" key={p.id}>
                      {p.name}
                    </span>
                  ))
                ) : (
                  <span style={{ color: 'var(--muted)', fontSize: 13 }}>No players listed</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default Teams;
