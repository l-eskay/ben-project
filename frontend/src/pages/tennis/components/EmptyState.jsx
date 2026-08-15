const EmptyState = ({ title, sub }) => (
  <div className="empty">
    <div className="display">{title}</div>
    <div>{sub}</div>
  </div>
);

export default EmptyState;
