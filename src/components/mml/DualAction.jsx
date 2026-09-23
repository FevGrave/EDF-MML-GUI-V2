export default function DualAction({ items, style }) {
  return (
    <div className="actrow" style={{ gap: 16, marginTop: 14, ...style }}>
      {items.map((it, i) => (
        <div
          key={i}
          className="mb big action"
          style={{ flex: 1, width: "auto", marginBottom: 0 }}
          onClick={it.onClick}
        >
          <i className="body" />
          <i className="acc" />
          <i className="bev" />
          <i className="u1" />
          <i className="u2" />
          <span className="t">{it.label}</span>
        </div>
      ))}
    </div>
  );
}