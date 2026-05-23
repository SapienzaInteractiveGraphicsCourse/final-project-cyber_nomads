function makeCanvas(size, drawFn) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  drawFn(c.getContext('2d'), size);
  return new THREE.CanvasTexture(c);
}

export const metalTex = makeCanvas(256, (ctx, s) => {
  ctx.fillStyle = '#2a1f0e';
  ctx.fillRect(0, 0, s, s);

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

  ctx.strokeStyle = 'rgba(249,115,22,0.15)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * 40 + 20);
    ctx.lineTo(s, i * 40 + 20);
    ctx.stroke();
  }
});

export const normalTex = makeCanvas(256, (ctx, s) => {
  ctx.fillStyle = '#8080ff'; // нейтральный нормаль-цвет
  ctx.fillRect(0, 0, s, s);

  for (let i = 0; i < 60; i++) {
    const x = Math.random() * s;
    const y = Math.random() * s;
    const r = Math.random() * 8 + 2;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(180,180,255,0.8)');
    g.addColorStop(1, 'rgba(128,128,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
});

export const roughTex = makeCanvas(256, (ctx, s) => {
  for (let x = 0; x < s; x += 4) {
    for (let y = 0; y < s; y += 4) {
      const v = Math.random() * 80 + 100;
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(x, y, 4, 4);
    }
  }
});

export const emissiveTex = makeCanvas(256, (ctx, s) => {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, s, s);

  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(20, i * 60 + 30);
    ctx.lineTo(60, i * 60 + 30);
    ctx.lineTo(80, i * 60 + 50);
    ctx.lineTo(120, i * 60 + 50);
    ctx.stroke();
  }

  ctx.strokeStyle = '#fb923c';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(130, 10); ctx.lineTo(200, 10);
  ctx.lineTo(220, 40); ctx.lineTo(200, 70);
  ctx.lineTo(130, 70); ctx.closePath();
  ctx.stroke();
});

export const groundTex = makeCanvas(512, (ctx, s) => {
  ctx.fillStyle = '#6b5230';
  ctx.fillRect(0, 0, s, s);

  for (let i = 0; i < 2000; i++) {
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

  ctx.strokeStyle = 'rgba(249,115,22,0.12)';
  ctx.lineWidth = 1;
  for (let i = 0; i < s; i += 32) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(s, i); ctx.stroke();
  }
});

groundTex.wrapS = groundTex.wrapT = THREE.RepeatWrapping;
groundTex.repeat.set(12, 12);
