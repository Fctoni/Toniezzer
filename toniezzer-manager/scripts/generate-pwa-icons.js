/**
 * Script para gerar icones PWA
 * Execute: node scripts/generate-pwa-icons.js
 * Requer: npm install sharp (ou canvas)
 */

const fs = require('fs');
const path = require('path');

// Tenta usar sharp, se nao tiver, usa uma alternativa
async function generateIcons() {
  const iconsDir = path.join(__dirname, '../public/icons');
  
  // Criar diretorio se nao existir
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  try {
    // Tenta usar sharp
    const sharp = require('sharp');
    
    const sizes = [192, 512];
    const backgroundColor = '#0a0a0a';
    const textColor = '#fafafa';
    const accentColor = '#3b82f6';

    for (const size of sizes) {
      const fontSize = Math.floor(size * 0.35);
      const barHeight = Math.floor(size * 0.03);
      const barY = Math.floor(size * 0.72);
      const barWidth = Math.floor(size * 0.6);
      const barX = Math.floor((size - barWidth) / 2);
      const cornerRadius = Math.floor(size * 0.12);

      const svg = `
        <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${size}" height="${size}" rx="${cornerRadius}" fill="${backgroundColor}"/>
          <text x="${size/2}" y="${size * 0.55}" 
                font-family="system-ui, -apple-system, sans-serif" 
                font-size="${fontSize}" 
                font-weight="700" 
                fill="${textColor}" 
                text-anchor="middle">TM</text>
          <rect x="${barX}" y="${barY}" width="${barWidth}" height="${barHeight}" rx="${barHeight/2}" fill="${accentColor}"/>
        </svg>
      `;

      // Gerar PNG normal
      await sharp(Buffer.from(svg))
        .png()
        .toFile(path.join(iconsDir, `icon-${size}.png`));

      console.log(`Gerado: icon-${size}.png`);

      // Gerar PNG maskable (com padding)
      const padding = Math.floor(size * 0.1);
      const innerSize = size - padding * 2;
      const innerFontSize = Math.floor(innerSize * 0.35);
      const innerBarHeight = Math.floor(innerSize * 0.03);
      const innerBarY = padding + Math.floor(innerSize * 0.72);
      const innerBarWidth = Math.floor(innerSize * 0.6);
      const innerBarX = padding + Math.floor((innerSize - innerBarWidth) / 2);

      const maskableSvg = `
        <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${size}" height="${size}" fill="${backgroundColor}"/>
          <text x="${size/2}" y="${padding + innerSize * 0.55}" 
                font-family="system-ui, -apple-system, sans-serif" 
                font-size="${innerFontSize}" 
                font-weight="700" 
                fill="${textColor}" 
                text-anchor="middle">TM</text>
          <rect x="${innerBarX}" y="${innerBarY}" width="${innerBarWidth}" height="${innerBarHeight}" rx="${innerBarHeight/2}" fill="${accentColor}"/>
        </svg>
      `;

      await sharp(Buffer.from(maskableSvg))
        .png()
        .toFile(path.join(iconsDir, `icon-maskable-${size}.png`));

      console.log(`Gerado: icon-maskable-${size}.png`);
    }

    console.log('\n✅ Todos os icones foram gerados com sucesso!');
    console.log('📁 Pasta:', iconsDir);

  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.log('⚠️  O pacote "sharp" nao esta instalado.');
      console.log('Execute: npm install sharp --save-dev');
      console.log('\nOu use um gerador online:');
      console.log('https://www.pwabuilder.com/imageGenerator');
      console.log('https://realfavicongenerator.net/');
    } else {
      console.error('Erro:', error);
    }
  }
}

generateIcons();
