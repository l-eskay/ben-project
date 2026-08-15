export const toNameArray = (raw) =>
  (raw || '')
    .split(/&|,/)
    .map((s) => s.trim())
    .filter(Boolean);

export const formatDate = (d) => {
  try {
    return new Date(`${d}T00:00:00`).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return d;
  }
};

export const formatPts = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export const today = () => new Date().toISOString().slice(0, 10);
