/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { fetchLeagues } from '../services/tennisApi';

const LeagueContext = createContext();

const DEFAULT_SLUG = 'green';

export const LeagueProvider = ({ children }) => {
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlug, setCurrentSlug] = useState(DEFAULT_SLUG);

  const reloadLeagues = useCallback(async () => {
    const data = await fetchLeagues();
    setLeagues(data);
    return data;
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const data = await fetchLeagues();
      if (cancelled) return;
      setLeagues(data);
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentLeague = useMemo(
    () => leagues.find((l) => l.slug === currentSlug) || null,
    [leagues, currentSlug],
  );

  useEffect(() => {
    if (!currentLeague) return;
    const root = document.documentElement;
    root.style.setProperty('--lime', currentLeague.accent);
    root.style.setProperty('--lime-dark', currentLeague.accent_dark);
    document.title = `Hot Shots ${currentLeague.name} · KT Academy`;
  }, [currentLeague]);

  const value = {
    leagues,
    loading,
    currentSlug,
    currentLeague,
    switchLeague: setCurrentSlug,
    reloadLeagues,
  };

  return <LeagueContext.Provider value={value}>{children}</LeagueContext.Provider>;
};

export const useLeague = () => useContext(LeagueContext);

export default LeagueContext;
