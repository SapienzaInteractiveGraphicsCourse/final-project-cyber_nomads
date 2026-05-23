import { scene } from './scene.js';
import { metalTex, normalTex, roughTex, emissiveTex } from './textures.js';

const tankMat = new THREE.MeshStandardMaterial({
  map:          metalTex,
  normalMap:    normalTex,
  roughnessMap: roughTex,
  emissiveMap:  emissiveTex,
  emissive:     0xf97316,
  emissiveIntensity: 0.4,
  roughness: 0.6,
  metalness: 0.7,
});

const darkMat = new THREE.MeshStandardMaterial({
  color: 0x1a0e05, roughness: 0.9, metalness: 0.3,
});

const wheelMat = new THREE.MeshStandardMaterial({
  color: 0x111111, roughness: 0.95, metalness: 0.1,
});

export function setTankColor(color) {
  tankMat.color.set(color);
  tankMat.emissive.set(color);
}

export const tankGroup = new THREE.Group();
scene.add(tankGroup);

export const chassis = new THREE.Mesh(
  new THREE.BoxGeometry(2.6, 0.7, 4.0),
  tankMat
);
chassis.position.y = 0.55;
chassis.castShadow = true;
tankGroup.add(chassis);

[-1.5, 1.5].forEach(sx => {
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.4, 3.6), darkMat);
  skirt.position.set(sx, -0.1, 0);
  chassis.add(skirt);
});

export const wheels = [];
const wheelPositions = [
  [-1.4, -0.25,  1.4],
  [ 1.4, -0.25,  1.4],
  [-1.4, -0.25,  0  ],
  [ 1.4, -0.25,  0  ],
  [-1.4, -0.25, -1.4],
  [ 1.4, -0.25, -1.4],
];

wheelPositions.forEach(([x, y, z]) => {
  const w = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.4, 0.3, 10),
    wheelMat
  );
  w.rotation.z = Math.PI / 2;
  w.position.set(x, y, z);
  w.castShadow = true;
  chassis.add(w);
  wheels.push(w);
});

export const turretGroup = new THREE.Group();
turretGroup.position.set(0, 0.9, 0.2);
chassis.add(turretGroup);

const turretBody = new THREE.Mesh(
  new THREE.CylinderGeometry(0.75, 0.9, 0.6, 8),
  tankMat
);
turretBody.castShadow = true;
turretGroup.add(turretBody);

export const headlightMount = new THREE.Object3D();
headlightMount.position.set(0, 0.3, -1);
turretGroup.add(headlightMount);

export const barrelGroup = new THREE.Group();
barrelGroup.position.set(0, 0.1, 0);
turretGroup.add(barrelGroup);

const barrelMesh = new THREE.Mesh(
  new THREE.CylinderGeometry(0.12, 0.15, 2.2, 8),
  darkMat
);
barrelMesh.rotation.x = Math.PI / 2;
barrelMesh.position.set(0, 0, -1.1);
barrelMesh.castShadow = true;
barrelGroup.add(barrelMesh);

export const muzzleTip = new THREE.Mesh(
  new THREE.CylinderGeometry(0.1, 0.12, 0.2, 8),
  new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5, metalness: 0.9 })
);
muzzleTip.rotation.x = Math.PI / 2;
muzzleTip.position.set(0, 0, -2.25);
barrelGroup.add(muzzleTip);
