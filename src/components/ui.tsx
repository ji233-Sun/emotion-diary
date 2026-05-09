export function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="metric-item">
      <span className="label">{label}</span>
      <span className="value">{value}</span>
    </div>
  );
}

export function InfoBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="info-section">
      <h3 className="title">{title}</h3>
      <p className="content">{value}</p>
    </div>
  );
}

export function EmptyState({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <div className="empty-state">
      <p>{title}</p>
      <small>{description}</small>
    </div>
  );
}
