import * as THREE from 'three';
import { ARENA_SIZE, COLORS } from '../utils/constants.js';

export class SceneSetup {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050510);
    this.scene.fog = new THREE.FogExp2(0x050510, 0.0004);

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.5, 200);
    this.camera.position.set(0, 30, 35);
    this.camera.lookAt(0, 0, 0);

    this._addLights();
    this._addSky();
    this._addGround();
    this._addBoundaries();

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  _addLights() {
    // Low ambient — directional and point lights do the heavy lifting
    this.ambient = new THREE.AmbientLight(0x111133, 0.2);
    this.scene.add(this.ambient);

    // Moonlight — primary directional shadow-caster
    this.moonLight = new THREE.DirectionalLight(0x8888cc, 2.0);
    this.moonLight.position.set(20, 35, -25);
    this.moonLight.castShadow = true;
    this.moonLight.shadow.mapSize.set(2048, 2048);
    this.moonLight.shadow.camera.left = -50;
    this.moonLight.shadow.camera.right = 50;
    this.moonLight.shadow.camera.top = 50;
    this.moonLight.shadow.camera.bottom = -50;
    this.scene.add(this.moonLight);

    // Hemisphere — sky/ground color gradient on all surfaces
    const hemi = new THREE.HemisphereLight(0x4444aa, 0x221133, 0.3);
    this.scene.add(hemi);

    // Four corner accent lights create dramatic rim lighting
    // when the tank moves between them, and specular highlights on the metal body
    const half = ARENA_SIZE / 2 - 2;
    [
      { pos: [-half, 8, -half], color: COLORS.NEON_MAGENTA },
      { pos: [half, 8, -half], color: COLORS.NEON_CYAN },
      { pos: [-half, 8, half], color: COLORS.NEON_CYAN },
      { pos: [half, 8, half], color: COLORS.NEON_MAGENTA },
    ].forEach(({ pos, color }) => {
      const light = new THREE.PointLight(color, 12, 40, 2);
      light.position.set(...pos);
      this.scene.add(light);
    });
  }

  _addSky() {
    // Simple starfield
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 800;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 1] = Math.random() * 60 + 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starsMat = new THREE.PointsMaterial({ color: 0x8888cc, size: 0.15 });
    this.scene.add(new THREE.Points(starsGeo, starsMat));
  }

  _addGround() {
    const geo = new THREE.PlaneGeometry(ARENA_SIZE, ARENA_SIZE);
    const mat = new THREE.MeshStandardMaterial({
      color: COLORS.GROUND,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(geo, mat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Grid lines on the ground
    const gridHelper = new THREE.PolarGridHelper(ARENA_SIZE / 2, 32, 20, 128, COLORS.CYAN, COLORS.CYAN);
    gridHelper.material.opacity = 0.15;
    gridHelper.material.transparent = true;
    this.scene.add(gridHelper);
  }

  _addBoundaries() {
    const half = ARENA_SIZE / 2;
    const wallH = 1.5;
    const wallGeo = new THREE.BoxGeometry(ARENA_SIZE + 2, wallH, 0.3);
    const wallMat = new THREE.MeshStandardMaterial({
      color: COLORS.BOUNDARY,
      roughness: 0.3,
      metalness: 0.8,
      emissive: COLORS.NEON_MAGENTA,
      emissiveIntensity: 0.5,
    });

    const walls = [
      { pos: [0, wallH / 2, -half], rot: [0, 0, 0] },
      { pos: [0, wallH / 2, half], rot: [0, 0, 0] },
      { pos: [-half, wallH / 2, 0], rot: [0, Math.PI / 2, 0] },
      { pos: [half, wallH / 2, 0], rot: [0, Math.PI / 2, 0] },
    ];

    walls.forEach(({ pos, rot }) => {
      const wall = new THREE.Mesh(wallGeo, wallMat);
      wall.position.set(...pos);
      wall.rotation.set(...rot);
      wall.castShadow = true;
      wall.receiveShadow = true;
      this.scene.add(wall);
    });
  }
}
