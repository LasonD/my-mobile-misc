import * as Phaser from 'phaser';

// Pixel-art sprite for Dasha. Grid is 28 wide × 34 tall, rendered at
// PIXEL_SIZE per cell, so the final texture is 112 × 136 at pixel size 4.

const PIXEL_SIZE = 4;

const PALETTE: Record<string, number | null> = {
  '.': null,
  'H': 0x3a2823, // hair (dark)
  'h': 0x5a3e33, // hair highlight
  'S': 0xfad0ab, // skin
  's': 0xe8ba8d, // skin shadow
  'G': 0x1c1f2e, // glasses / eye dark
  'L': 0xffffff, // eye catchlight
  'M': 0xc94978, // lips
  'C': 0xff9eb8, // blush
  'B': 0xcdb4db, // sweater
  'b': 0xa593c4, // sweater shade
  'T': 0xe0cfec, // sweater collar highlight
  'N': 0xffd700, // necklace
  'W': 0xffffff, // pearl / diploma edge
  'O': 0xf1c179, // diploma parchment
};

// Full-body-ish: head, shoulders, sweater with a tiny book (КШЕ diploma).
const DASHA_FRAME_IDLE = [
  '.........HHHHHHHHHH.........', // 0
  '.......HHHHHHHHHHHHHH.......', // 1
  '......HHHhhhhhhhHhhhHHH.....', // 2
  '.....HHHHHHhhhHhHhHHHHHH....', // 3
  '....HHHHHHHHHHHHHHHHHHHHH...', // 4
  '....HHSSSSSSSSSSSSSSSSSHHH..', // 5
  '...HHSSSSSSSSSSSSSSSSSSSSH..', // 6
  '...HHSSSSSSSSSSSSSSSSSSSSSH.', // 7
  '...HSSSSSSSSSSSSSSSSSSSSSSH.', // 8
  '...HSSGGGGGSSSSSSSSGGGGGSSH.', // 9  (glasses tops)
  '...HSGGGLGGGGGGGGGGGLGGGSSH.', // 10 (eyes inside glasses)
  '...HSSGGGGGSSSSSSSSGGGGGSSH.', // 11 (glasses bottoms)
  '...HSSSSSSSSSSGGSSSSSSSSSSH.', // 12 (nose)
  '...HSSCSSSSSSSSSSSSSSSCCSSH.', // 13 (blush)
  '...HSSSSSSSSSMMMMMMSSSSSSSH.', // 14 (smile)
  '...HSSSSSSSSSSMMMMSSSSSSSSH.', // 15
  '....HSSSSSSSSSSSSSSSSSSSSH..', // 16
  '.....HSSSSSSSSSSSSSSSSSSH...', // 17
  '......HSSSSSSSSSSSSSSSH.....', // 18 chin
  '.......HSSSSSSSSSSSSSH......', // 19
  '........SSSSSSSSSSSS........', // 20 neck
  '.......SSSSSSSSSSSSSS.......', // 21
  '.....BBBBBBBBTTTBBBBBBBB....', // 22 collar
  '...BBBBBBBBBBTTBBBBBBBBBBB..', // 23
  '..BBBbBBBBBBBBBBBBBBBBbBBB..', // 24
  '..BBBBBBBBBBBBNBBBBBBBBBBBB.', // 25 necklace
  '..BBBBBBBBBBBBBBBBBBBBBBBBB.', // 26
  '..BbBBBBBBBBBBBBBBBBBBBBBBB.', // 27
  '..BBBBBBBBBBBBBBBBBBBBBBBBB.', // 28
  '..BBBBBBBBBBBBBBBBBBBBBBBBB.', // 29
  '..BBBBBBBBBBBBBBBBBBBBBBBBB.', // 30
  '..BBBBBBBBBBBBBBBBBBBBBBBBB.', // 31
  '..BBBBBBBBBBBBBBBBBBBBBBBBB.', // 32
  '..BBBBBBBBBBBBBBBBBBBBBBBBB.', // 33
];

// Blink frame — same as idle but eyes closed (G instead of L pixel).
const DASHA_FRAME_BLINK = DASHA_FRAME_IDLE.map((row, i) => {
  if (i !== 10) return row;
  return '...HSGGGGGGGGGGGGGGGGGGGGGSSH.'.slice(0, row.length);
});

function drawPixels(
  g: Phaser.GameObjects.Graphics,
  rows: string[]
): { width: number; height: number } {
  const gridWidth = rows.reduce((m, r) => Math.max(m, r.length), 0);
  const width = gridWidth * PIXEL_SIZE;
  const height = rows.length * PIXEL_SIZE;

  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      const color = PALETTE[ch];
      if (color == null) continue;
      g.fillStyle(color, 1);
      g.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
    }
  }
  return { width, height };
}

export function buildDashaTextures(scene: Phaser.Scene) {
  {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    const { width, height } = drawPixels(g, DASHA_FRAME_IDLE);
    g.generateTexture('dasha_idle', width, height);
    g.destroy();
  }
  {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    const { width, height } = drawPixels(g, DASHA_FRAME_BLINK);
    g.generateTexture('dasha_blink', width, height);
    g.destroy();
  }
}
