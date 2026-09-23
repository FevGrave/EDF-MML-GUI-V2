export default function EdfProgress({ value = 0, active = false }) {
  return (
    <div className="edfbar">
      <div
        className="fill"
        style={{ "--v": `${value}%`, animationPlayState: active ? "running" : "paused" }}
      />
    </div>
  );
}