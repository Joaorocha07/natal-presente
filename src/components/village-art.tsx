/** Ilustração do vilarejo nevado em SVG (leve, sem WebGL): casas acesas, pinheiros, lua e estrelas. */

function Pine({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-3" y="-8" width="6" height="10" fill="#5a3a28" />
      <polygon points="0,-62 -20,-30 20,-30" fill="#2f6a55" />
      <polygon points="0,-48 -26,-14 26,-14" fill="#2a5a48" />
      <polygon points="0,-34 -32,2 32,2" fill="#245040" />
      <polygon points="0,-62 -8,-50 0,-52 8,-50" fill="#f5eadb" />
      <polygon points="-12,-30 -4,-36 4,-30 12,-36 20,-30 -20,-30" fill="#f5eadb" opacity=".9" />
      <circle cx="-9" cy="-14" r="2.6" fill="#d9744c" />
      <circle cx="10" cy="-24" r="2.6" fill="#ecc98f" />
      <circle cx="2" cy="-40" r="2.2" fill="#d9744c" />
    </g>
  );
}

function House({ x, y, w = 70, h = 44, roof = "#c4623d" }: { x: number; y: number; w?: number; h?: number; roof?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-w / 2} y={-h} width={w} height={h} rx="3" fill="#8a5c3e" />
      <rect x={-w / 2} y={-h} width={w} height="5" fill="#a87650" opacity=".6" />
      <polygon points={`${-w / 2 - 8},${-h} 0,${-h - 34} ${w / 2 + 8},${-h}`} fill={roof} />
      <path
        d={`M${-w / 2 - 10} ${-h + 1} Q ${-w / 4} ${-h - 10} 0 ${-h - 18} Q ${w / 4} ${-h - 10} ${w / 2 + 10} ${-h + 1} Q ${w / 3} ${-h + 7} ${w / 6} ${-h + 1} Q 0 ${-h + 8} ${-w / 6} ${-h + 1} Q ${-w / 3} ${-h + 7} ${-w / 2 - 10} ${-h + 1}Z`}
        fill="#f5eadb"
      />
      <rect x={w / 4} y={-h - 28} width="9" height="18" fill="#6b4130" />
      <rect x={w / 4 - 1} y={-h - 31} width="11" height="5" fill="#f5eadb" />
      <circle className="smoke" cx={w / 4 + 4.5} cy={-h - 36} r="4" fill="#f5eadb" opacity=".5" />
      <circle className="smoke" cx={w / 4 + 6} cy={-h - 40} r="5" fill="#f5eadb" opacity=".4" />
      <rect className="win" x={-w / 2 + 9} y={-h + 13} width="13" height="15" rx="2" fill="#ffb067" filter="url(#glow)" />
      <rect className="win" x={w / 2 - 22} y={-h + 13} width="13" height="15" rx="2" fill="#ffb067" filter="url(#glow)" />
      <rect x="-6" y={-22} width="12" height="22" rx="2" fill="#5a3724" />
      <circle cx="3" cy="-11" r="1.2" fill="#ecc98f" />
    </g>
  );
}

const STARS: [number, number, number][] = [
  [30, 30, 1.6], [78, 62, 1.1], [124, 22, 1.4], [170, 50, 1], [228, 26, 1.7],
  [284, 58, 1.2], [336, 24, 1.5], [372, 64, 1], [52, 98, 1], [318, 100, 1.2],
];

export function VillageArt({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 260"
      className={className}
      preserveAspectRatio="xMidYMax slice"
      role="img"
      aria-label="Vilarejo nevado com casas iluminadas"
    >
      <defs>
        <filter id="glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="moon" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fff6dc" />
          <stop offset="1" stopColor="#ecc98f" />
        </radialGradient>
        <linearGradient id="hill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbf3e6" />
          <stop offset="1" stopColor="#e6d5bb" />
        </linearGradient>
      </defs>

      {STARS.map(([cx, cy, r], i) => (
        <circle key={i} className="star" cx={cx} cy={cy} r={r} fill="#fff" />
      ))}
      <circle cx="326" cy="52" r="34" fill="#ecc98f" opacity=".12" />
      <circle cx="326" cy="52" r="18" fill="url(#moon)" />

      {/* colinas distantes */}
      <path d="M0 190 Q 70 150 150 178 T 300 168 T 400 184 V260 H0Z" fill="#1f3d33" />
      <Pine x={40} y={190} s={0.7} />
      <Pine x={86} y={184} s={0.55} />
      <Pine x={330} y={180} s={0.62} />
      <Pine x={372} y={190} s={0.75} />

      {/* chão nevado */}
      <path d="M0 214 Q 90 196 200 208 T 400 204 V260 H0Z" fill="url(#hill)" />

      <House x={116} y={218} w={74} h={46} />
      <House x={250} y={214} w={58} h={38} roof="#b9542f" />
      <Pine x={176} y={222} s={1} />
      <Pine x={300} y={220} s={0.85} />
      <Pine x={44} y={232} s={1.2} />
      <Pine x={352} y={236} s={1.1} />

      {/* neve em primeiro plano */}
      <path d="M0 240 Q 100 224 210 238 T 400 234 V260 H0Z" fill="#f5eadb" />
    </svg>
  );
}
