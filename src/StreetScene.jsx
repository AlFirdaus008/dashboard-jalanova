import React from 'react';

const buildings = [
  [72, 170, 110, 76, 42], [254, 118, 95, 63, 60],
  [1012, 83, 102, 68, 38], [1080, 155, 82, 58, 30],
  [360, 440, 102, 65, 46],
  [550, 368, 96, 58, 34], [730, 455, 100, 65, 52], [950, 460, 100, 67, 44],
];

function Building({ x, y, width, depth, height }) {
  const a = `${x},${y-height}`, b = `${x+width},${y-height-17}`, c = `${x+width+depth*.55},${y-height+depth*.28-17}`, d = `${x+depth*.55},${y-height+depth*.28}`;
  return <g filter="url(#street-shadow)">
    <path d={`M${x},${y} L${x+width},${y-17} L${x+width+depth*.55},${y+depth*.28-17} L${x+depth*.55},${y+depth*.28}Z`} fill="#dfe5da" />
    <path d={`M${x},${y-height} L${x+depth*.55},${y-height+depth*.28} L${x+depth*.55},${y+depth*.28} L${x},${y}Z`} fill="#d9ded9" />
    <path d={`M${x+depth*.55},${y-height+depth*.28} L${x+width+depth*.55},${y-height+depth*.28-17} L${x+width+depth*.55},${y+depth*.28-17} L${x+depth*.55},${y+depth*.28}Z`} fill="#bfc9c2" />
    <path d={`M${a} L${b} L${c} L${d}Z`} fill="#f7f8f5" stroke="#e0e5df" strokeWidth="2" />
    <path d={`M${x+15},${y-height+7} L${x+width-14},${y-height-6}`} stroke="#e4eae3" strokeWidth="3" />
    {[.2,.56].map(t => <path key={t} d={`M${x+depth*.55+width*t},${y-height+depth*.28-17*t+12} l16,-3 v8 l-16,3Z`} fill="#e1ece8" opacity=".8" />)}
  </g>;
}

function Tree({ x, y, size = 1 }) {
  return <g transform={`translate(${x} ${y}) scale(${size})`}>
    <ellipse cx="14" cy="11" rx="19" ry="8" fill="#6d8167" opacity=".15" />
    <path d="M0 0 0-19" stroke="#638260" strokeWidth="5" strokeLinecap="round" />
    <path d="M-16-17 0-57 16-17Z" fill="#7da973" />
    <path d="M-13-22 0-55 0-22Z" fill="#a7c999" />
  </g>;
}

function Car({ x, y, angle = -19, color = '#f7f8f3', scale = 1 }) {
  return <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`} filter="url(#car-shadow)">
    <ellipse cx="1" cy="11" rx="39" ry="15" fill="#526458" opacity=".22" />
    <path d="M-37-5 Q-37-13-27-14 L22-14 Q34-12 37-4 L37 8 Q32 13 22 13 L-28 13 Q-37 10-37 3Z" fill={color} stroke="#82938a" strokeWidth="1.4" />
    <path d="M-14-12 Q-8-23 2-24 L19-23 Q25-20 29-12 L23 2 L-18 2Z" fill="#c6d6d4" stroke="#8ca09e" strokeWidth="1.2" />
    <path d="M-12-11 20-11 M2-22 2 1" stroke="#f8fbfa" strokeWidth="2" opacity=".9" />
    <path d="M-34 5 H-29 M27 5 H33" stroke="#273a34" strokeWidth="4" strokeLinecap="round" />
    <circle cx="-23" cy="12" r="5" fill="#2a3532" /><circle cx="24" cy="12" r="5" fill="#2a3532" />
  </g>;
}

export function StreetScene() {
  return <svg className="street-scene" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 520" role="img" aria-labelledby="street-scene-title street-scene-description" preserveAspectRatio="xMidYMid slice">
    <title id="street-scene-title">Ilustrasi jalan dan lingkungan perkotaan</title>
    <desc id="street-scene-description">Ilustrasi isometrik jalan dengan mobil, pepohonan, bangunan, taman, serta rute menuju titik kerusakan. Ini bukan peta lokasi sebenarnya.</desc>
    <defs>
      <linearGradient id="scene-ground" x2=".95" y2="1"><stop stopColor="#fafbf7" /><stop offset="1" stopColor="#e6eee4" /></linearGradient>
      <linearGradient id="road-fill" x2=".8" y2="1"><stop stopColor="#eef2ed" /><stop offset="1" stopColor="#dfe6e0" /></linearGradient>
      <filter id="street-shadow" x="-30%" y="-40%" width="160%" height="190%"><feDropShadow dx="5" dy="12" stdDeviation="7" floodColor="#536a58" floodOpacity=".15" /></filter>
      <filter id="car-shadow" x="-50%" y="-70%" width="200%" height="240%"><feDropShadow dx="2" dy="6" stdDeviation="3" floodColor="#526459" floodOpacity=".3" /></filter>
      <pattern id="scene-grain" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".45" fill="#73917f" opacity=".18" /></pattern>
    </defs>
    <rect width="1200" height="520" fill="url(#scene-ground)" />
    <path d="M0 0 H1200 V520 H0Z" fill="url(#scene-grain)" />
    <path d="M0 115 233 10 521 140 781 18 1200 204 V520 H0Z" fill="#f5f7f2" opacity=".7" />
    <path d="M95 264 275 182 353 217 165 307Z" fill="#d7e7cd" stroke="#f5f8f0" strokeWidth="7" />
    <path d="M912 200 1036 143 1110 183 982 244Z" fill="#dce9d1" stroke="#f5f8f0" strokeWidth="7" />
    <path d="M574 452 684 399 756 432 640 490Z" fill="#d8e9d2" stroke="#f5f8f0" strokeWidth="7" />
    <path d="M-90 478 1100-57 M318-15 1280 448" fill="none" stroke="#d3e1d5" strokeWidth="128" opacity=".48" />
    <path d="M-90 478 1100-57 M318-15 1280 448" fill="none" stroke="#fff" strokeWidth="119" />
    <path d="M-90 478 1100-57 M318-15 1280 448" fill="none" stroke="url(#road-fill)" strokeWidth="94" />
    <path d="M-30 451 70 406 M735 107 1040-30 M358 4 570 106 M1048 336 1235 426" fill="none" stroke="#fff" strokeWidth="3" strokeDasharray="20 17" opacity=".95" />
    {buildings.map(([x,y,width,depth,height]) => <Building key={`${x}-${y}`} x={x} y={y} width={width} depth={depth} height={height} />)}
    {[[141,262,1],[207,255,.8],[278,215,.76],[958,206,.9],[1015,218,.75],[1069,182,.88],[615,456,.75],[690,450,.9],[1140,216,.66]].map(([x,y,size]) => <Tree key={`${x}-${y}`} x={x} y={y} size={size} />)}
    <path className="scene-route" d="M110 388 585 174 Q625 154 650 145 Q670 146 694 163 L1005 316" fill="none" stroke="#174b3d" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M110 388 585 174 Q625 154 650 145 Q670 146 694 163 L1005 316" fill="none" stroke="#cfe1c9" strokeWidth="2" strokeDasharray="4 9" strokeLinecap="round" />
    <Car x={330} y={289} angle={-24} color="#f8f9f5" scale={1} />
    <Car x={850} y={244} angle={26} color="#e9a662" scale={.92} />
    <g transform="translate(1005 293)" filter="url(#car-shadow)"><path d="M0 33C-11 18-17 11-17 0a17 17 0 0 1 34 0C17 11 11 18 0 33Z" fill="#164a3c" /><circle r="7" fill="#f5f8f0" /></g>
    <g transform="translate(110 368)" filter="url(#car-shadow)"><circle r="12" fill="#fff" stroke="#174b3d" strokeWidth="5" /><circle r="4" fill="#174b3d" /></g>
  </svg>;
}
