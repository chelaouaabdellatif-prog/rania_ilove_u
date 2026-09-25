const SPEED = { slow: 0.45, normal: 0.3, fast: 0.18 }; // seconds per character

export default function Marquee({ ann, preview = false }) {
  if (!ann || !ann.active || !ann.text.trim()) return null;
  const duration = Math.max(10, ann.text.length * (SPEED[ann.speed] || SPEED.normal) + 8);
  return (
    <div className={`marquee${preview ? ' preview' : ''}`} role="status" aria-label="إعلان">
      <span className="marquee-badge">إعلان</span>
      <div className="marquee-view">
        <div className="marquee-track" style={{ animationDuration: `${duration}s` }}>
          <span dir="rtl">{ann.text}</span>
          <span dir="rtl" aria-hidden="true">{ann.text}</span>
        </div>
        <p className="marquee-static" dir="rtl">{ann.text}</p>
      </div>
    </div>
  );
}
