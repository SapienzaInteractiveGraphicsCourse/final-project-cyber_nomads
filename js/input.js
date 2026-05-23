import { toggleLights } from './lights.js';

export const keys = {};

window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'KeyL') toggleLights();
  // запрещаем скролл страницы стрелками
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
    e.preventDefault();
  }
});

window.addEventListener('keyup', e => {
  keys[e.code] = false;
});

export const mouse = { x: 0, z: 0 };

const raycaster   = new THREE.Raycaster();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

/**
 * from main.js after camera is created, to track mouse position on the ground plane
 * @param {THREE.Camera} camera
 */
export function initMouseTracking(camera) {
  window.addEventListener('mousemove', e => {
    const ndc = new THREE.Vector2(
      (e.clientX / window.innerWidth)  *  2 - 1,
      (e.clientY / window.innerHeight) * -2 + 1
    );
    raycaster.setFromCamera(ndc, camera);
    const pt = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(groundPlane, pt)) {
      mouse.x = pt.x;
      mouse.z = pt.z;
    }
  });
}

export function onShoot(callback) {
  window.addEventListener('pointerdown', e => {
    if (e.button !== 0 || e.target?.id !== 'canvas') return;
    callback();
  });
}
