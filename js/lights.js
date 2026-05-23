import { scene } from './scene.js';
import { headlightMount } from './tank.js';

export const ambientLight = new THREE.AmbientLight(0x8899cc, 1.8);
scene.add(ambientLight);

export const sunLight = new THREE.DirectionalLight(0xffd580, 2.2);
sunLight.position.set(20, 50, 10);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width  = 4096;
sunLight.shadow.mapSize.height = 4096;
sunLight.shadow.camera.near   = 1;
sunLight.shadow.camera.far    = 120;
sunLight.shadow.camera.left   = -45;
sunLight.shadow.camera.right  =  45;
sunLight.shadow.camera.top    =  45;
sunLight.shadow.camera.bottom = -45;
scene.add(sunLight);

export const headlight = new THREE.SpotLight(0xffeedd, 3.5, 30, Math.PI / 7, 0.4, 1.5);
headlight.castShadow = true;
headlight.shadow.mapSize.width  = 512;
headlight.shadow.mapSize.height = 512;
scene.add(headlight);
scene.add(headlight.target);

// Visible spotlight cone
const coneGeo = new THREE.CylinderGeometry(0.05, 3.5, 8, 16, 1, true);
const coneMat = new THREE.MeshBasicMaterial({
  color: 0xffeedd,
  transparent: true,
  opacity: 0.06,
  side: THREE.DoubleSide,
  depthWrite: false,
});
export const spotlightCone = new THREE.Mesh(coneGeo, coneMat);
spotlightCone.rotation.x = Math.PI / 2;
spotlightCone.position.z = -4; // extend forward from mount
headlightMount.add(spotlightCone);

export const muzzleLight = new THREE.PointLight(0xff7700, 0, 10);
scene.add(muzzleLight);

export function toggleLights() {
  const isOn = headlight.intensity > 0;
  headlight.intensity = isOn ? 0 : 3.5;
  spotlightCone.visible = !isOn; // hide cone when lights off
  headlight.castShadow = !isOn;
  document.getElementById('lights-indicator').textContent =
    `Headlights: ${isOn ? 'ВЫКЛ' : 'ВКЛ'} [L]`;
}
