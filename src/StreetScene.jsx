import React from 'react';
import './street-scene.css';

const buildings = [
  [72, 170, 110, 76, 42], [254, 118, 95, 63, 60],
  [1012, 83, 102, 68, 38], [1080, 155, 82, 58, 30],
  [360, 440, 102, 65, 46],
  [550, 368, 96, 58, 34], [730, 455, 100, 65, 52], [950, 460, 100, 67, 44],
];

function Building({ x, y, width, depth, height }) {
  const a = `${x},${y-height}`, b = `${x+width},${y-height-17}`, c = `${x+width+depth*.55},${y-height+depth*.28-17}`, d = `${x+depth*.55},${y-height+depth*.28}`;
  return <g filter="url(#street-shadow)">
    <path d={`M${x},${y} L${x+width},${y-17} L${x+width+depth*.55},${y+depth*.28-17} L${x+depth*.55},${y+depth*.28}Z`} fill="#dae8f0" />
    <path d={`M${x},${y-height} L${x+depth*.55},${y-height+depth*.28} L${x+depth*.55},${y+depth*.28} L${x},${y}Z`} fill="#cddde7" />
    <path d={`M${x+depth*.55},${y-height+depth*.28} L${x+width+depth*.55},${y-height+depth*.28-17} L${x+width+depth*.55},${y+depth*.28-17} L${x+depth*.55},${y+depth*.28}Z`} fill="#a9c2cf" />
    <path d={`M${a} L${b} L${c} L${d}Z`} fill="#f0f8ff" stroke="#cddde7" strokeWidth="2" />
    <path d={`M${x+15},${y-height+7} L${x+width-14},${y-height-6}`} stroke="#dce9f1" strokeWidth="3" />
    {[.2,.56].map(t => <path key={t} d={`M${x+depth*.55+width*t},${y-height+depth*.28-17*t+12} l16,-3 v8 l-16,3Z`} fill="#e4f2f8" opacity=".8" />)}
  </g>;
}

function Tree({ x, y, size = 1 }) {
  return <g transform={`translate(${x} ${y}) scale(${size})`}>
    <ellipse cx="14" cy="11" rx="19" ry="8" fill="#012a44" opacity=".15" />
    <path d="M0 0 0-19" stroke="#007b70" strokeWidth="5" strokeLinecap="round" />
    <path d="M-16-17 0-57 16-17Z" fill="#00bfa5" />
    <path d="M-13-22 0-55 0-22Z" fill="#79decf" />
  </g>;
}

function Car({ x, y, angle = 0, color = '#f0f8ff', roofColor = '#ffffff', scale = 1 }) {
  return <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`} filter="url(#car-shadow)">
    <ellipse cx="3" cy="7" rx="37" ry="18" fill="#012a44" opacity=".17" />
    <path d="M-27-18h11v5h-11zm45 0h11v5H18zm-45 31h11v5h-11zm45 0h11v5H18z" fill="#263641" />
    <path d="M-33-10Q-33-16-26-16H23Q31-16 34-10L35-6V8Q33 16 24 17H-26Q-33 16-35 9V-7Z" fill={color} stroke="#35586b" strokeWidth="1.5" />
    <path d="M-30-11H28Q31-10 33-7V-5H-33V-7Q-32-10-30-11Z" fill="#ffffff" opacity=".28" />
    <path d="M-16-13H12Q20-12 23-7V8Q20 13 12 14H-16Q-23 11-24 7V-7Q-22-12-16-13Z" fill={roofColor} stroke="#7199ab" strokeWidth="1.3" />
    <path d="M10-11Q18-10 20-6V7Q18 11 10 12L8 7V-6Z" fill="#85b8c9" stroke="#5d8da0" strokeWidth="1" />
    <path d="M-14-11L-9-7V8L-15 11Q-21 8-21 5V-6Q-20-9-14-11Z" fill="#9cc8d6" stroke="#6b98a8" strokeWidth="1" />
    <path d="M-7-12V13M7-12V13" stroke="#7199ab" strokeWidth="1" opacity=".7" />
    <path d="M-5-10H5M-5 11H5" stroke="#ffffff" strokeWidth="1.4" opacity=".75" />
    <path d="M-29-13h6m-6 27h6" stroke="#d84b43" strokeWidth="3" strokeLinecap="round" />
    <path d="M29-12h4m-4 25h4" stroke="#fff5d8" strokeWidth="3" strokeLinecap="round" />
    <path d="M-2-17h7m-7 33h7" stroke="#35586b" strokeWidth="2.5" strokeLinecap="round" />
  </g>;
}

export function StreetScene() {
  return <svg className="street-scene" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 520" role="img" aria-labelledby="street-scene-title street-scene-description" preserveAspectRatio="xMidYMid slice">
    <title id="street-scene-title">Ilustrasi jalan dan lingkungan perkotaan</title>
    <desc id="street-scene-description">Ilustrasi isometrik jalan dengan mobil yang bergerak berulang, pepohonan, bangunan, taman, serta penanda kerusakan yang muncul di jalan. Ini bukan peta lokasi sebenarnya.</desc>
    <defs>
      <linearGradient id="scene-ground" x2=".95" y2="1"><stop stopColor="#f9fcff" /><stop offset="1" stopColor="#e3f1f8" /></linearGradient>
      <linearGradient id="road-fill" x2=".8" y2="1"><stop stopColor="#e7f2f8" /><stop offset="1" stopColor="#cbdfe9" /></linearGradient>
      <filter id="street-shadow" x="-30%" y="-40%" width="160%" height="190%"><feDropShadow dx="5" dy="12" stdDeviation="7" floodColor="#012a44" floodOpacity=".15" /></filter>
      <filter id="car-shadow" x="-50%" y="-70%" width="200%" height="240%"><feDropShadow dx="2" dy="6" stdDeviation="3" floodColor="#012a44" floodOpacity=".3" /></filter>
      <pattern id="scene-grain" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".45" fill="#4b8298" opacity=".18" /></pattern>
    </defs>
    <rect width="1200" height="520" fill="url(#scene-ground)" />
    <path d="M0 0 H1200 V520 H0Z" fill="url(#scene-grain)" />
    <path d="M0 115 233 10 521 140 781 18 1200 204 V520 H0Z" fill="#f0f8ff" opacity=".7" />
    <path d="M95 264 275 182 353 217 165 307Z" fill="#b9eee6" stroke="#f0f8ff" strokeWidth="7" />
    <path d="M912 200 1036 143 1110 183 982 244Z" fill="#b9eee6" stroke="#f0f8ff" strokeWidth="7" />
    <path d="M574 452 684 399 756 432 640 490Z" fill="#b9eee6" stroke="#f0f8ff" strokeWidth="7" />
    <path d="M-90 478 1100-57 M318-15 1280 448" fill="none" stroke="#c9e5ec" strokeWidth="128" opacity=".48" />
    <path d="M-90 478 1100-57 M318-15 1280 448" fill="none" stroke="#fff" strokeWidth="119" />
    <path d="M-90 478 1100-57 M318-15 1280 448" fill="none" stroke="url(#road-fill)" strokeWidth="94" />
    <path d="M-30 451 70 406 M735 107 1040-30 M358 4 570 106 M1048 336 1235 426" fill="none" stroke="#fff" strokeWidth="3" strokeDasharray="20 17" opacity=".95" />
    {buildings.map(([x,y,width,depth,height]) => <Building key={`${x}-${y}`} x={x} y={y} width={width} depth={depth} height={height} />)}
    {[[141,262,1],[207,255,.8],[278,215,.76],[958,206,.9],[1015,218,.75],[1069,182,.88],[615,456,.75],[690,450,.9],[1140,216,.66]].map(([x,y,size]) => <Tree key={`${x}-${y}`} x={x} y={y} size={size} />)}
    <path className="scene-route" d="M110 388 585 174 Q625 154 650 145 Q670 146 694 163 L1005 316" fill="none" stroke="#012a44" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M110 388 585 174 Q625 154 650 145 Q670 146 694 163 L1005 316" fill="none" stroke="#00bfa5" strokeWidth="2" strokeDasharray="4 9" strokeLinecap="round" />
    <g className="scene-still-cars" aria-hidden="true">
      <Car x={330} y={307} angle={-24} color="#f0f8ff" scale={1} />
      <Car x={850} y={218} angle={206} color="#f7941d" roofColor="#ffc274" scale={.92} />
    </g>
    <g className="scene-moving-car" aria-hidden="true">
      <Car x={0} y={0} angle={0} color="#f0f8ff" scale={1} />
      <animateMotion dur="16s" begin="-4s" repeatCount="indefinite" calcMode="paced" rotate="auto" path="M-90 496 L565 201 C610 181 630 165 648 163 C665 162 680 168 700 180 L1290 465" />
    </g>
    <g className="scene-moving-car" aria-hidden="true">
      <Car x={0} y={0} angle={0} color="#f7941d" roofColor="#ffc274" scale={.92} />
      <animateMotion dur="18s" begin="-5s" repeatCount="indefinite" calcMode="paced" rotate="auto" path="M1290 430 L704 147 C681 135 663 128 648 128 C630 128 607 141 569 158 L-90 460" />
    </g>
    <g className="scene-damage-alert" transform="translate(850 240)" aria-hidden="true">
      <circle className="scene-damage-halo" r="17" fill="#d84242" opacity=".22" />
      <circle r="8" fill="#d84242" stroke="#fff" strokeWidth="3" />
      <path d="M0-10V-50" fill="none" stroke="#d84242" strokeWidth="2" />
      <g transform="translate(-64 -84)">
        <g className="scene-damage-popover" filter="url(#car-shadow)">
          <rect width="128" height="34" rx="10" fill="#d84242" />
          <circle cx="18" cy="17" r="9" fill="#fff" opacity=".2" />
          <path d="M18 12v7m0 3v.3" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          <text x="34" y="21" fill="#fff" fontFamily="DM Sans, Arial, sans-serif" fontSize="11" fontWeight="600">Jalan rusak</text>
        </g>
      </g>
    </g>
    <g transform="translate(1005 293)" filter="url(#car-shadow)"><path d="M0 33C-11 18-17 11-17 0a17 17 0 0 1 34 0C17 11 11 18 0 33Z" fill="#012a44" /><circle r="7" fill="#f0f8ff" /></g>
    <g transform="translate(110 368)" filter="url(#car-shadow)"><circle r="12" fill="#fff" stroke="#012a44" strokeWidth="5" /><circle r="4" fill="#012a44" /></g>
  </svg>;
}
