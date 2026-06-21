function makeCanvas(size, drawFn) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  drawFn(c.getContext('2d'), size);
  return new THREE.CanvasTexture(c);
}

// ─── Brushed metal with wear ────────────────────────────────────────────────
export const metalTex = makeCanvas(256, (ctx, s) => {
  ctx.fillStyle = '#2a1f0e';
  ctx.fillRect(0, 0, s, s);

  // Brushed metal streaks
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * s;
    const y = Math.random() * s;
    const l = Math.random() * 30 + 10;
    ctx.strokeStyle = `rgba(
      ${80 + Math.random() * 60},
      ${50 + Math.random() * 30},
      ${20 + Math.random() * 20},
      ${0.3 + Math.random() * 0.4}
    )`;
    ctx.lineWidth = Math.random() * 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + l, y + Math.random() * 4 - 2);
    ctx.stroke();
  }

  // Emissive accent lines
  ctx.strokeStyle = 'rgba(249,115,22,0.15)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * 40 + 20);
    ctx.lineTo(s, i * 40 + 20);
    ctx.stroke();
  }
});

// ─── Rivet & panel normal map ───────────────────────────────────────────────
export const normalTex = makeCanvas(256, (ctx, s) => {
  ctx.fillStyle = '#8080ff';
  ctx.fillRect(0, 0, s, s);

  // Rivet heads — small bumps along panel edges
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const cx = 40 + col * 50;
      const cy = 40 + row * 50;
      for (let r = 0; r < 4; r++) {
        const rx = cx + (r % 2 === 0 ? -12 : 12);
        const ry = cy + (r < 2 ? -12 : 12);
        const grad = ctx.createRadialGradient(rx, ry, 0, rx, ry, 5);
        grad.addColorStop(0, 'rgba(220,220,255,1)');
        grad.addColorStop(0.5, 'rgba(180,180,255,0.8)');
        grad.addColorStop(1, 'rgba(128,128,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(rx, ry, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Panel seam lines
  ctx.strokeStyle = 'rgba(200,200,255,0.3)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * 64 + 32);
    ctx.lineTo(s, i * 64 + 32);
    ctx.stroke();
  }
});

// ─── Roughness / specular map with directional brush ────────────────────────
export const roughTex = makeCanvas(256, (ctx, s) => {
  // Base roughness noise
  for (let x = 0; x < s; x += 2) {
    for (let y = 0; y < s; y += 2) {
      const v = Math.random() * 60 + 80;
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(x, y, 2, 2);
    }
  }

  // Brushed directional marks (darker = smoother/more metallic)
  for (let i = 0; i < 80; i++) {
    const y = Math.random() * s;
    ctx.strokeStyle = `rgba(180,180,180,${0.1 + Math.random() * 0.2})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(s, y + Math.random() * 6 - 3);
    ctx.stroke();
  }

  // Wear spots — higher roughness at edges
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * s + 10;
    const y = Math.random() * s;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, 12);
    grad.addColorStop(0, 'rgba(255,255,255,0.6)');
    grad.addColorStop(1, 'rgba(128,128,128,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();
  }
});

// ─── Circuit-board emissive texture ─────────────────────────────────────────
export const emissiveTex = makeCanvas(256, (ctx, s) => {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, s, s);

  // Main circuit traces
  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 2;
  const traces = [
    // Central vertical spine
    [[120, 0], [120, 60], [160, 100], [160, 160], [120, 200], [120, 256]],
    // Left branch
    [[120, 60], [80, 80], [80, 130], [40, 150]],
    // Right branch
    [[160, 100], [200, 120], [200, 180]],
    // Lower left
    [[120, 200], [60, 220], [30, 200]],
    // Upper right
    [[160, 40], [200, 20], [230, 40]],
  ];
  traces.forEach(points => {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.stroke();
  });

  // Nodes at trace junctions
  ctx.fillStyle = '#fb923c';
  [[120, 60], [160, 100], [120, 200]].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // Small glowing dots
  ctx.fillStyle = '#ffddaa';
  for (let i = 0; i < 12; i++) {
    ctx.beginPath();
    ctx.arc(20 + Math.random() * 200, 20 + Math.random() * 200, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Central icon: diamond
  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(130, 10); ctx.lineTo(200, 10);
  ctx.lineTo(220, 40); ctx.lineTo(200, 70);
  ctx.lineTo(130, 70); ctx.closePath();
  ctx.stroke();
});

// ─── Ground texture with tire tracks ────────────────────────────────────────
export const groundTex = makeCanvas(512, (ctx, s) => {
  ctx.fillStyle = '#6b5230';
  ctx.fillRect(0, 0, s, s);

  // Terrain noise — scattered dirt speckles
  for (let i = 0; i < 3000; i++) {
    ctx.fillStyle = `rgba(
      ${140 + Math.random() * 60},
      ${100 + Math.random() * 40},
      ${40  + Math.random() * 30},
      ${Math.random() * 0.5}
    )`;
    const x = Math.random() * s;
    const y = Math.random() * s;
    const r = Math.random() * 3 + 1;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Tire tracks — curved darker paths
  ctx.strokeStyle = 'rgba(40,30,15,0.2)';
  ctx.lineWidth = 3;
  for (let t = 0; t < 6; t++) {
    const sx = Math.random() * s;
    const sy = Math.random() * s;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    for (let i = 0; i < 20; i++) {
      ctx.lineTo(
        sx + i * 8 + Math.sin(i * 0.3 + t) * 12,
        sy + i * 6 + Math.cos(i * 0.4 + t) * 8
      );
    }
    ctx.stroke();
  }

  // Scattered small rocks
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * s;
    const y = Math.random() * s;
    ctx.fillStyle = `rgba(
      ${100 + Math.random() * 40},
      ${80 + Math.random() * 30},
      ${50 + Math.random() * 20},
      0.5
    )`;
    ctx.beginPath();
    ctx.arc(x, y, 2 + Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Subtle grid
  ctx.strokeStyle = 'rgba(249,115,22,0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i < s; i += 32) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(s, i); ctx.stroke();
  }
});

groundTex.wrapS = groundTex.wrapT = THREE.RepeatWrapping;
groundTex.repeat.set(12, 12);
