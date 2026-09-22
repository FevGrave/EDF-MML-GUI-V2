export default function Panel({ style, className = "", title, right, children }) {
  return (
    <div className={`win ${className}`} style={style}>
      {title && <h3>{title}{right}</h3>}
      {children}
    </div>
  );
}