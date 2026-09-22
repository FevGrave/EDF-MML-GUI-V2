export default function Gauge({ label, value = 0, warn = false }) {
  return (
    <div className={`gauge ${warn ? "warn" : ""}`} style={{ "--v": value + "%" }}>
      <span className="lab">{label}</span>
      <div className="fill" />
    </div>
  );
}