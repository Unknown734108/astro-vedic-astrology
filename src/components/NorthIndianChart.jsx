/**
 * NorthIndianChart.jsx
 *
 * The North Indian style diamond birth-chart SVG component, extracted
 * verbatim from the original single-file ASTRO source. Rendering logic,
 * house layout, colors, and click handlers are unchanged — only moved
 * into its own module and given a default export.
 */
import React from 'react';

export default function NorthIndianChart({ chartData, onSelectHouse, onSelectPlanet }) {
  if (!chartData || !chartData.lagna) return null;

  const lagnaSign = chartData.lagna.signIndex;
  const houseSigns = {};
  for (let h = 1; h <= 12; h++) {
    houseSigns[h] = ((lagnaSign + h - 2) % 12) + 1;
  }

  const houseOccupants = {};
  for (let h = 1; h <= 12; h++) {
    houseOccupants[h] = chartData.planets.filter((p) => p.house === h);
  }

  const houseCenters = {
    1: { x: 200, y: 130 },
    2: { x: 100, y: 55 },
    3: { x: 45, y: 110 },
    4: { x: 120, y: 200 },
    5: { x: 45, y: 290 },
    6: { x: 100, y: 345 },
    7: { x: 200, y: 270 },
    8: { x: 300, y: 345 },
    9: { x: 355, y: 290 },
    10: { x: 280, y: 200 },
    11: { x: 355, y: 110 },
    12: { x: 300, y: 55 }
  };

  return (
    <div className="relative w-full max-w-[430px] mx-auto select-none group">
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-amber-500/20 via-indigo-500/20 to-amber-500/20 blur-xl opacity-60 group-hover:opacity-90 transition duration-700 pointer-events-none" />

      <svg
        viewBox="0 0 400 400"
        className="relative w-full h-auto drop-shadow-2xl rounded-2xl overflow-hidden bg-slate-950/90 border border-amber-500/30"
      >
        <defs>
          <linearGradient id="chartBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#818cf8" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#eab308" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="lagnaGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ca8a04" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        <rect x="10" y="10" width="380" height="380" fill="none" stroke="url(#chartBorderGrad)" strokeWidth="2.5" rx="8" />
        <line x1="10" y1="10" x2="390" y2="390" stroke="#f59e0b" strokeOpacity="0.5" strokeWidth="1.5" />
        <line x1="390" y1="10" x2="10" y2="390" stroke="#f59e0b" strokeOpacity="0.5" strokeWidth="1.5" />
        <polygon points="200,10 390,200 200,390 10,200" fill="rgba(15, 23, 42, 0.65)" stroke="#f59e0b" strokeOpacity="0.8" strokeWidth="1.8" />
        <polygon points="200,10 295,105 200,200 105,105" fill="url(#lagnaGlow)" />

        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((h) => {
          const signNum = houseSigns[h];
          const occ = houseOccupants[h] || [];
          const pos = houseCenters[h];

          return (
            <g
              key={h}
              className="cursor-pointer transition-all hover:opacity-90"
              onClick={() => onSelectHouse && onSelectHouse(h)}
            >
              <text
                x={pos.x}
                y={pos.y - 14}
                textAnchor="middle"
                className="text-[12px] font-bold fill-amber-400 select-none drop-shadow"
              >
                {signNum}
              </text>

              {occ.length > 0 ? (
                occ.map((p, idx) => {
                  const yOffset = pos.y + idx * 14 + 2;
                  return (
                    <g
                      key={p.name}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPlanet && onSelectPlanet(p);
                      }}
                      className="hover:scale-110 transition-transform"
                    >
                      <text
                        x={pos.x}
                        y={yOffset}
                        textAnchor="middle"
                        className={`text-[11px] font-semibold select-none ${
                          p.name === 'Sun'
                            ? 'fill-amber-300'
                            : p.name === 'Moon'
                            ? 'fill-slate-100'
                            : p.name === 'Jupiter'
                            ? 'fill-yellow-300'
                            : p.name === 'Venus'
                            ? 'fill-pink-300'
                            : p.name === 'Mars'
                            ? 'fill-red-400'
                            : p.name === 'Mercury'
                            ? 'fill-emerald-300'
                            : p.name === 'Saturn'
                            ? 'fill-blue-400'
                            : 'fill-purple-300'
                        }`}
                      >
                        {p.sanskrit.slice(0, 3)}
                        {p.isRetro ? '*' : ''}
                      </text>
                    </g>
                  );
                })
              ) : (
                <text
                  x={pos.x}
                  y={pos.y + 2}
                  textAnchor="middle"
                  className="text-[9px] fill-slate-500/60 select-none font-mono"
                >
                  H{h}
                </text>
              )}
            </g>
          );
        })}
        <circle cx="200" cy="200" r="4.5" fill="#f59e0b" opacity="0.9" />
      </svg>
      <div className="flex justify-between items-center text-[11px] text-slate-400 px-2 mt-2 font-mono">
        <span>* Retrograde (Vakri)</span>
        <span className="text-amber-400 font-medium">Click House or Graha to inspect</span>
      </div>
    </div>
  );
}
