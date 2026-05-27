// Generates PWA icons from public/logo-petita.png
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

(async () => {
  const src = path.join(__dirname, '..', 'public', 'logo-petita.png');
  const outDir = path.join(__dirname, '..', 'public', 'icons');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  if (!fs.existsSync(src)) {
    console.error('logo-petita.png not found');
    process.exit(1);
  }
  for (const size of [192, 512]) {
    const padded = await sharp({
      create: { width: size, height: size, channels: 4, background: '#f6f9ff' },
    })
      .composite([{ input: await sharp(src).resize(Math.round(size * 0.75), Math.round(size * 0.75), { fit: 'contain', background: { r: 246, g: 249, b: 255, alpha: 1 } }).toBuffer(), gravity: 'center' }])
      .png()
      .toBuffer();
    fs.writeFileSync(path.join(outDir, `icon-${size}.png`), padded);
    console.log('icon-' + size + '.png');
  }
})();
