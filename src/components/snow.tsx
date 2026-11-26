/** Neve em CSS puro, com posições fixas (determinísticas) para não quebrar a hidratação. */
const FLAKES = Array.from({ length: 36 }, (_, i) => {
  const r = (n: number) => ((Math.sin(i * 9301 + n * 49297) + 1) / 2) % 1;
  return {
    left: `${(r(1) * 100).toFixed(2)}%`,
    size: 2 + Math.round(r(2) * 4),
    duration: 9 + r(3) * 14,
    delay: -r(4) * 20,
    opacity: 0.25 + r(5) * 0.55,
    drift: `${Math.round((r(6) - 0.5) * 80)}px`,
  };
});

export function Snow({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {FLAKES.map((f, i) => (
        <span
          key={i}
          className="snowflake"
          style={
            {
              left: f.left,
              width: f.size,
              height: f.size,
              opacity: f.opacity,
              animationDuration: `${f.duration}s`,
              animationDelay: `${f.delay}s`,
              "--drift": f.drift,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
