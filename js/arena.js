import { scene } from './scene.js';
import { groundTex } from './textures.js';

export const ARENA_SIZE = 38; 
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.95, metalness: 0.0 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

function makeEdge(x1, z1, x2, z2) {
  const pts = [new THREE.Vector3(x1, 0.05, z1), new THREE.Vector3(x2, 0.05, z2)];
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({ color: 0xf97316, opacity: 0.5, transparent: true });
  scene.add(new THREE.Line(geo, mat));
}

const B = 40;
makeEdge(-B,  0, -B,  B); makeEdge( B,  0,  B,  B);
makeEdge(-B,  0,  B,  0); makeEdge(-B,  B,  B,  B);
makeEdge(-B,  0, -B, -B); makeEdge( B,  0,  B, -B);
makeEdge(-B, -B,  B, -B);

const starGeo = new THREE.BufferGeometry();
const starVerts = [];
for (let i = 0; i < 1200; i++) {
  starVerts.push(
    (Math.random() - 0.5) * 200,
    Math.random() * 60 + 10,
    (Math.random() - 0.5) * 200
  );
}
starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3));

export const starField = new THREE.Points(starGeo, new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.25,
  transparent: true,
  opacity: 1,
}));
scene.add(starField);

export const obsMat = new THREE.MeshStandardMaterial({
  color: 0x8b6530, roughness: 0.7, metalness: 0.2,
  emissive: 0xf97316, emissiveIntensity: 0.08,
});

const OBS_LAYOUT = [
  [-15,  10, 4, 4, 3], [ 15,  10, 3, 5, 2.5], [  0, 20, 6, 3, 2  ],
  [-20,  -5, 3, 3, 4], [ 20,  -5, 4, 3, 3  ], [ -8,-18, 5, 2, 3.5],
  [  8, -18, 2, 5, 3], [-25,  25, 3, 3, 2  ], [ 25, 25, 3, 3, 2  ],
  [  0, -25, 4, 4, 2], [ 12,   0, 2, 2, 5  ], [-12,  0, 2, 2, 4  ],
  [ 20,  20, 3, 2, 3],
];

export const obstacles = [];

OBS_LAYOUT.forEach(([x, z, rx, rz, h]) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(rx, h, rz), obsMat);
  mesh.position.set(x, h / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const rotOffset = Math.random() * 0.4 - 0.2;
  mesh.rotation.y = rotOffset;
  scene.add(mesh);
  obstacles.push({
    mesh, hx: rx / 2 + 0.5, hz: rz / 2 + 0.5,
    baseY: h / 2,
    phase: Math.random() * Math.PI * 2,
    rotSpeed: 0.05 + Math.random() * 0.1,
    h, rx,
  });
});
