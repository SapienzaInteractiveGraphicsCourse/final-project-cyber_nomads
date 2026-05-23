// Generates procedural PBR textures via Canvas — meeting course requirements
// for color, normal, specular, and emissive texture maps without external files.
export class TextureGenerator {
  static createPanelTexture(size = 256) {
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');

    // Base dark metal
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, size, size);

    // Panel lines
    ctx.strokeStyle = '#2a2a4a';
    ctx.lineWidth = 2;
    for (let i = 0; i < size; i += 32) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke();
    }

    // Bolts at panel intersections
    ctx.fillStyle = '#3a3a5a';
    for (let x = 16; x < size; x += 32) {
      for (let y = 16; y < size; y += 32) {
        ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Scratches / wear
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 20; i++) {
      const sx = Math.random() * size, sy = Math.random() * size;
      ctx.beginPath(); ctx.moveTo(sx, sy);
      ctx.lineTo(sx + (Math.random() - 0.5) * 40, sy + (Math.random() - 0.5) * 40);
      ctx.stroke();
    }

    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = c.toDataURL();
    });
  }

  static createNormalMap(size = 256) {
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');

    // Base flat normal (128, 128, 255) = flat surface
    ctx.fillStyle = 'rgb(128,128,255)';
    ctx.fillRect(0, 0, size, size);

    // Panel ridges
    for (let i = 0; i < size; i += 32) {
      ctx.fillStyle = 'rgb(128,128,220)';
      ctx.fillRect(i - 1, 0, 3, size);
      ctx.fillRect(0, i - 1, size, 3);
    }

    // Bolts (raised bumps)
    ctx.fillStyle = 'rgb(128,128,200)';
    for (let x = 16; x < size; x += 32) {
      for (let y = 16; y < size; y += 32) {
        ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
      }
    }

    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = c.toDataURL();
    });
  }

  static createRoughnessMap(size = 256) {
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');

    // Dark = smooth/reflective, Light = rough
    ctx.fillStyle = 'rgb(30,30,30)';
    ctx.fillRect(0, 0, size, size);

    // Scratched rough areas
    ctx.strokeStyle = 'rgba(180,180,180,0.25)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 40; i++) {
      const sx = Math.random() * size, sy = Math.random() * size;
      ctx.beginPath(); ctx.moveTo(sx, sy);
      ctx.lineTo(sx + (Math.random() - 0.5) * 60, sy + (Math.random() - 0.5) * 60);
      ctx.stroke();
    }

    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = c.toDataURL();
    });
  }

  static createEmissiveMap(size = 256) {
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');

    // Black background (no emission by default)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);

    // Neon cyan lines
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 8;
    for (let i = 0; i < size; i += 32) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke();
    }

    // Neon magenta accents
    ctx.strokeStyle = '#ff00ff';
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 6;
    for (let i = 16; i < size; i += 32) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke();
    }

    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = c.toDataURL();
    });
  }

  static createGroundTexture(size = 512) {
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');

    // Base
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, size, size);

    // Grid (subtle)
    ctx.strokeStyle = 'rgba(0,255,255,0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i < size; i += 16) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke();
    }

    // Noise/grit
    const imgData = ctx.getImageData(0, 0, size, size);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 10;
      imgData.data[i] += noise;
      imgData.data[i + 1] += noise;
      imgData.data[i + 2] += noise;
    }
    ctx.putImageData(imgData, 0, 0);

    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = c.toDataURL();
    });
  }
}
