import { scene } from './scene.js';

export const ambientLight = new THREE.AmbientLight(0x8899cc, 1.8);
scene.add(ambientLight);

export const sunLight = new THREE.DirectionalLight(0xffd580, 2.2);
sunLight.position.set(20, 50, 10);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width  = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near   = 1;
sunLight.shadow.camera.far    = 120;
sunLight.shadow.camera.left   = -50;
sunLight.shadow.camera.right  =  50;
sunLight.shadow.camera.top    =  50;
sunLight.shadow.camera.bottom = -50;
scene.add(sunLight);

export const headlight = new THREE.SpotLight(0xffeedd, 3.5, 30, Math.PI / 7, 0.4, 1.5);
headlight.castShadow = true;
headlight.shadow.mapSize.width  = 1024;
headlight.shadow.mapSize.height = 1024;
scene.add(headlight);
scene.add(headlight.target);

export const muzzleLight = new THREE.PointLight(0xff7700, 0, 10);
scene.add(muzzleLight);

export function toggleLights() {
  const isOn = headlight.intensity > 0;
  headlight.intensity = isOn ? 0 : 3.5;
  document.getElementById('lights-indicator').textContent =
    `Headlights: ${isOn ? 'ВЫКЛ' : 'ВКЛ'} [L]`;
}
