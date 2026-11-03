import { deflateSync } from 'node:zlib';

const WIDTH = 720;
const HEIGHT = 440;
const GLYPHS = {
  D:['11110','10001','10001','10001','10001','10001','11110'],
  E:['11111','10000','10000','11110','10000','10000','11111'],
  M:['10001','11011','10101','10101','10001','10001','10001'],
  O:['01110','10001','10001','10001','10001','10001','01110'],
};

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type, 'ascii');
  const size = Buffer.alloc(4), checksum = Buffer.alloc(4);
  size.writeUInt32BE(data.length);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([size, name, data, checksum]);
}

export function demoRoadPng(variant = 0) {
  const pixels = Buffer.alloc(WIDTH * HEIGHT * 3);
  const put = (x, y, r, g, b) => {
    if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return;
    const at = (y * WIDTH + x) * 3;
    pixels[at] = r; pixels[at + 1] = g; pixels[at + 2] = b;
  };
  const rect = (x0, y0, x1, y1, color) => {
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) put(x, y, ...color);
  };
  const line = (x0, y0, x1, y1, width, color) => {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let step = 0; step <= steps; step++) {
      const x = Math.round(x0 + (x1 - x0) * step / steps);
      const y = Math.round(y0 + (y1 - y0) * step / steps);
      for (let dy = -width; dy <= width; dy++) for (let dx = -width; dx <= width; dx++) if (dx * dx + dy * dy <= width * width) put(x + dx, y + dy, ...color);
    }
  };
  const oval = (cx, cy, rx, ry, color) => {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) put(x, y, ...color);
    }
  };
  for (let y = 0; y < HEIGHT; y++) for (let x = 0; x < WIDTH; x++) {
    const grain = ((x * 17 + y * 29 + variant * 43) % 17) - 8;
    if (y < 135) put(x, y, 210 + grain, 222 + grain, 220 + grain);
    else if (y < 164) put(x, y, 162 + grain, 182 + grain, 166 + grain);
    else put(x, y, 147 + grain, 171 + grain, 145 + grain);
    const left = 295 - (y - 126) * 1.08, right = 425 + (y - 126) * 1.08;
    if (y >= 126 && x >= left && x <= right) put(x, y, 84 + grain, 94 + grain, 91 + grain);
  }
  line(295, 126, 0, 439, 4, [202, 207, 194]);
  line(425, 126, 719, 439, 4, [202, 207, 194]);
  for (const [y0, y1] of [[172, 187], [220, 245], [290, 330], [382, 438]]) {
    line(360, y0, 360, y1, Math.max(2, Math.round(y0 / 65)), [219, 211, 173]);
  }
  for (const x of [70, 170, 570, 655]) {
    line(x, 124, x, 178, 5, [91, 105, 73]);
    oval(x, 116, 30, 26, [93, 139, 96]);
    oval(x - 10, 108, 18, 14, [120, 158, 109]);
  }
  if (variant === 0) {
    oval(295, 318, 88, 32, [144, 143, 128]);
    oval(300, 318, 73, 25, [40, 47, 46]);
    oval(310, 323, 45, 12, [29, 36, 36]);
    line(210, 309, 187, 299, 3, [54, 58, 55]);
    line(390, 326, 421, 339, 3, [54, 58, 55]);
  } else if (variant === 1) {
    const points = [[250, 196], [269, 219], [255, 240], [292, 267], [275, 291], [316, 321], [299, 347], [344, 386], [325, 438]];
    for (let i = 1; i < points.length; i++) line(...points[i - 1], ...points[i], 3 + Math.floor(i / 3), [35, 42, 41]);
    line(275, 291, 238, 307, 2, [46, 51, 48]);
    line(316, 321, 370, 336, 2, [46, 51, 48]);
  } else {
    oval(290, 312, 108, 25, [58, 67, 65]);
    oval(420, 352, 135, 26, [56, 64, 63]);
    oval(290, 308, 102, 13, [80, 86, 80]);
    oval(420, 348, 124, 13, [79, 84, 79]);
  }
  rect(22, 22, 204, 82, [247, 248, 238]);
  const word = 'DEMO';
  for (let index = 0; index < word.length; index++) {
    const glyph = GLYPHS[word[index]];
    for (let row = 0; row < glyph.length; row++) for (let col = 0; col < 5; col++) if (glyph[row][col] === '1') rect(38 + index * 38 + col * 6, 31 + row * 6, 44 + index * 38 + col * 6, 37 + row * 6, [30, 89, 69]);
  }
  const raw = Buffer.alloc(HEIGHT * (1 + WIDTH * 3));
  for (let y = 0; y < HEIGHT; y++) pixels.copy(raw, y * (1 + WIDTH * 3) + 1, y * WIDTH * 3, (y + 1) * WIDTH * 3);
  const header = Buffer.alloc(13);
  header.writeUInt32BE(WIDTH, 0); header.writeUInt32BE(HEIGHT, 4); header[8] = 8; header[9] = 2;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', deflateSync(raw, {level:9})), chunk('IEND', Buffer.alloc(0))]);
}
