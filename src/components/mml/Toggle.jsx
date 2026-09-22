export default function Toggle({ on, onClick }) {
  return (
    <div
      className={`sw ${on ? "on" : ""}`}
      onClick={onClick}
      role="switch"
      aria-checked={on}
    />
  );
}