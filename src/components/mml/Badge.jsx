export default function Badge({ state }) {
  if (state === "warn") return <span className="badge up">UPD</span>;
  if (state === "error") return <span className="badge">!</span>;
  return null;
}