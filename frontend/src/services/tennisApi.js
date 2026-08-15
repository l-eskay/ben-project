import api from './api';

export const fetchLeagues = () => api.get('leagues/').then((r) => r.data);

export const fetchLadder = (slug) => api.get(`leagues/${slug}/ladder/`).then((r) => r.data);

export const fetchTeams = (slug) => api.get(`leagues/${slug}/teams/`).then((r) => r.data);

export const createTeam = (slug, name) =>
  api.post(`leagues/${slug}/teams/`, { name }).then((r) => r.data);

export const deleteTeam = (slug, teamId) => api.delete(`leagues/${slug}/teams/${teamId}/`);

export const addPlayer = (teamId, name) =>
  api.post(`teams/${teamId}/players/`, { name }).then((r) => r.data);

export const removePlayer = (teamId, playerId) =>
  api.delete(`teams/${teamId}/players/${playerId}/`);

export const fetchMatches = (slug) => api.get(`leagues/${slug}/matches/`).then((r) => r.data);

export const createMatch = (slug, payload) =>
  api.post(`leagues/${slug}/matches/`, payload).then((r) => r.data);

export const fetchFixtures = (slug, { unscheduledOnly } = {}) =>
  api
    .get(`leagues/${slug}/fixtures/`, {
      params: unscheduledOnly ? { unscheduled: 1 } : undefined,
    })
    .then((r) => r.data);

export const createFixture = (slug, payload) =>
  api.post(`leagues/${slug}/fixtures/`, payload).then((r) => r.data);

export const deleteFixture = (slug, fixtureId) =>
  api.delete(`leagues/${slug}/fixtures/${fixtureId}/`);

export const fetchSettings = (slug) => api.get(`leagues/${slug}/settings/`).then((r) => r.data);

export const updateSettings = (slug, payload) =>
  api.patch(`leagues/${slug}/settings/`, payload).then((r) => r.data);
