import { Fragment, useEffect, useState } from 'react';
import { useLeague } from '../../contexts/LeagueContext';
import { fetchLadder, fetchMatches } from '../../services/tennisApi';
import EmptyState from './components/EmptyState';
import { formatDate, formatPts } from './lib';

const LadderTable = ({ rows }) => (
  <div className="ladder-wrap">
    <table className="ladder">
      <thead>
        <tr>
          <th></th>
          <th>Team</th>
          <th className="num">P</th>
          <th className="num">W</th>
          <th className="num">L</th>
          <th className="num">D</th>
          <th className="num">Rubbers</th>
          <th className="num">Games</th>
          <th className="num">Pts</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <Fragment key={r.id}>
            <tr className={i === 0 ? 'rank-1' : ''}>
              <td>
                <span className="rank-chip">{i + 1}</span>
              </td>
              <td className="team">{r.name}</td>
              <td className="num">{r.played}</td>
              <td className="num">{r.wins}</td>
              <td className="num">{r.losses}</td>
              <td className="num">{r.draws}</td>
              <td className="num">
                {r.rubbersW}-{r.rubbersL}
              </td>
              <td className="num">
                {r.gamesW}-{r.gamesL}
              </td>
              <td className="num pts">{formatPts(r.points)}</td>
            </tr>
            {i === 0 && (
              <tr className="divider-row">
                <td colSpan={9}></td>
              </tr>
            )}
          </Fragment>
        ))}
      </tbody>
    </table>
  </div>
);

const Ladder = () => {
  const { currentSlug, currentLeague } = useLeague();
  const [rows, setRows] = useState(null);
  const [updated, setUpdated] = useState('');

  useEffect(() => {
    if (!currentSlug) return;
    let cancelled = false;
    const load = async () => {
      setRows(null);
      const [ladder, matches] = await Promise.all([fetchLadder(currentSlug), fetchMatches(currentSlug)]);
      if (cancelled) return;
      setRows(ladder);
      if (matches.length === 0) {
        setUpdated('No results yet');
      } else {
        const dates = matches.map((m) => m.date).filter(Boolean).sort();
        const latest = dates[dates.length - 1];
        setUpdated(latest ? `Last updated ${formatDate(latest)}` : '');
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
        <h2>{currentLeague?.name} Ladder</h2>
        <span className="updated">{updated}</span>
      </div>
      {rows === null ? (
        <div className="loading-row">Loading ladder…</div>
      ) : rows.length === 0 ? (
        <EmptyState
          title="No teams on the ladder yet"
          sub="Add teams and enter a round of results in the Admin section to get the ladder started."
        />
      ) : (
        <>
          <LadderTable rows={rows} />
          <p className="ladder-note">
            P/W/L reflect the fixtures each team played. Points are credited to each player&apos;s
            own registered team — so a stand-in player&apos;s points flow back to their home
            team&apos;s tally, even when they play for someone else on the day.
          </p>
        </>
      )}
    </section>
  );
};

export default Ladder;
