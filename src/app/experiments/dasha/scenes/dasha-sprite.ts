import * as Phaser from 'phaser';

// Pixel-art sprite for Dasha. Grid is 28 wide × 34 tall, rendered at
// PIXEL_SIZE per cell, so the final texture is 112 × 136 at pixel size 4.

const PIXEL_SIZE = 4;

const PALETTE: Record<string, number | null> = {
  '.': null,
  'H': 0x3a2823, // hair (dark brown)
  'h': 0x5a3e33, // hair highlight
  'S': 0xfad0ab, // skin
  's': 0xe8ba8d, // skin shadow
  'G': 0x1c1f2e, // eye dark
  'L': 0xffffff, // catchlight / white
  'M': 0xc94978, // lips
  'C': 0xff9eb8, // blush
  'P': 0xd49fb2, // pink jacket
  'p': 0xb58599, // pink jacket shade
  'W': 0xffffff, // white collar
  'Z': 0x7a5566, // zipper line
  'N': 0xffd700, // (reserved) gold accent
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
  '...HSSSSSSSSSSSSSSSSSSSSSSH.', // 9  (no glasses)
  '...HSSSSSGGSSSSSSSSGGSSSSSH.', // 10 (eyes — two small pupils)
  '...HSSSSSSSSSSSSSSSSSSSSSSH.', // 11 (no glasses)
  '...HSSSSSSSSSSGGSSSSSSSSSSH.', // 12 (nose)
  '...HSSCSSSSSSSSSSSSSSSCCSSH.', // 13 (blush)
  '...HSSSSSSSSSMMMMMMSSSSSSSH.', // 14 (smile)
  '...HSSSSSSSSSSMMMMSSSSSSSSH.', // 15
  '....HSSSSSSSSSSSSSSSSSSSSH..', // 16
  '.....HSSSSSSSSSSSSSSSSSSH...', // 17
  '......HSSSSSSSSSSSSSSSH.....', // 18 chin
  '.......HSSSSSSSSSSSSSH......', // 19
  '........SSSSSSSSSSSS........', // 20 neck
  '.......HSSSSSSSSSSSSH.......', // 21 hair curving forward onto shoulders
  '.....HHHWWWWWWWWWWHHH.......', // 22 white collar, hair peeking
  '....HPPPPPWWWWWWPPPPPH......', // 23 pink jacket + V-collar
  '...HPPPPPPPPZPPPPPPPPPH.....', // 24 zipper starts
  '...PPPPPPPPPZPPPPPPPPPPP....', // 25
  '..PPpPPPPPPPZPPPPPPPPPpPP...', // 26 side shading
  '..PPPPPPPPPPZPPPPPPPPPPPP...', // 27
  '..PPPPPPPPPPZPPPPPPPPPPPPP..', // 28
  '..PPpPPPPPPPZPPPPPPPPPpPPPP.', // 29
  '..PPPPPPPPPPPPPPPPPPPPPPPPP.', // 30
  '..PPPPPPPPPPPPPPPPPPPPPPPPP.', // 31
  '..PPPPPPPPPPPPPPPPPPPPPPPPP.', // 32
  '..PPPPPPPPPPPPPPPPPPPPPPPPP.', // 33
];

// Blink frame — eyes replaced with skin (closed).
const DASHA_FRAME_BLINK = DASHA_FRAME_IDLE.map((row, i) => {
  if (i !== 10) return row;
  // Two tiny dashes instead of round pupils
  return '...HSSSSSSSSSSSSSSSSSSSSSSSH.';
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
