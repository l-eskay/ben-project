import { useContext, useEffect, useState } from 'react';
import { SnackbarContext } from '../../../contexts/SnackbarContext';
import { useLeague } from '../../../contexts/LeagueContext';
import { fetchSettings, updateSettings } from '../../../services/tennisApi';

const SettingsPanel = () => {
  const { currentSlug, reloadLeagues } = useLeague();
  const { showSnackbar } = useContext(SnackbarContext);
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (currentSlug) fetchSettings(currentSlug).then(setForm);
  }, [currentSlug]);

  const handleSave = async () => {
    try {
      await updateSettings(currentSlug, {
        pts_singles_win: Number(form.pts_singles_win) || 0,
        pts_doubles_win: Number(form.pts_doubles_win) || 0,
        pts_per_game: Number(form.pts_per_game) || 0,
        season_name: form.season_name.trim() || 'Current Season',
      });
      await reloadLeagues();
      showSnackbar('Settings saved', 'success');
    } catch {
      showSnackbar('Could not save settings', 'error');
    }
  };

  if (!form) return null;

  return (
    <div className="admin-panel active">
      <div className="card settings-form">
        <h3>Points & season settings</h3>
        <div className="field-row">
          <div className="field">
            <label>Points per singles win</label>
            <input
              type="number"
              min="0"
              value={form.pts_singles_win}
              onChange={(e) => setForm((f) => ({ ...f, pts_singles_win: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Points per doubles win</label>
            <input
              type="number"
              min="0"
              value={form.pts_doubles_win}
              onChange={(e) => setForm((f) => ({ ...f, pts_doubles_win: e.target.value }))}
            />
          </div>
        </div>
        <div className="field">
          <label>Bonus points per game won</label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={form.pts_per_game}
            onChange={(e) => setForm((f) => ({ ...f, pts_per_game: e.target.value }))}
          />
        </div>
        <div className="field">
          <label>Season name</label>
          <input
            type="text"
            placeholder="e.g. Winter 2026"
            value={form.season_name}
            onChange={(e) => setForm((f) => ({ ...f, season_name: e.target.value }))}
          />
        </div>
        <button type="button" className="btn btn-lime" onClick={handleSave}>
          Save settings
        </button>
      </div>
    </div>
  );
};

export default SettingsPanel;
