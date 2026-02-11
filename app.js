// ESM CDN с корректным резолвом внутренних импортов three/examples в браузере.
import * as THREE from 'https://esm.sh/three@0.162.0';
import { OrbitControls } from 'https://esm.sh/three@0.162.0/examples/jsm/controls/OrbitControls.js';
import { ConvexGeometry } from 'https://esm.sh/three@0.162.0/examples/jsm/geometries/ConvexGeometry.js';

const canvasHost = document.getElementById('three-canvas');
const swatchGrid = document.getElementById('swatch-grid');
const selectedName = document.getElementById('selected-name');
const colorMeaning = document.getElementById('color-meaning');
const saveButton = document.getElementById('save-button');

/**
 * Фиксированный набор цветов и коротких смыслов.
 */
const COLOR_PRESETS = [
  { id: 'green', label: 'Зелёный', hex: '#3e8c63', meaning: 'Спокойствие и стабильность.' },
  { id: 'blue', label: 'Синий', hex: '#4068d4', meaning: 'Фокус и ясность.' },
  { id: 'red', label: 'Красный', hex: '#cf4e45', meaning: 'Энергия и действие.' },
  { id: 'yellow', label: 'Жёлтый', hex: '#d4a43d', meaning: 'Уверенность и оптимизм.' },
  { id: 'violet', label: 'Фиолетовый', hex: '#6d53be', meaning: 'Интуиция и глубина.' },
  { id: 'white', label: 'Белый', hex: '#f5f7fa', meaning: 'Баланс и чистота.' },
  { id: 'teal', label: 'Бирюзовый', hex: '#2f9f9c', meaning: 'Внутренняя свежесть и мягкий тонус.' },
  { id: 'orange', label: 'Оранжевый', hex: '#d97832', meaning: 'Тёплая мотивация и движение вперёд.' },
  { id: 'rose', label: 'Розовый', hex: '#c96d8d', meaning: 'Эмоциональная открытость и забота о себе.' },
  { id: 'graphite', label: 'Графитовый', hex: '#4f5867', meaning: 'Собранность и уверенное присутствие.' },
];

const state = {
  selectedMesh: null,
  activeColorId: null,
};

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
canvasHost.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = null;

const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
camera.position.set(4.3, 3.4, 5.6);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 3;
controls.maxDistance = 10;
controls.dampingFactor = 0.07;

// Мягкий свет для аккуратного премиального вида без агрессивных бликов.
const hemisphere = new THREE.HemisphereLight(0xffffff, 0xd8dce2, 0.85);
scene.add(hemisphere);

const keyLight = new THREE.DirectionalLight(0xffffff, 0.55);
keyLight.position.set(4, 6, 5);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.25);
fillLight.position.set(-5, 2.5, -3.5);
scene.add(fillLight);

const crystalGroup = new THREE.Group();
scene.add(crystalGroup);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const rhombicGeometry = createRhombicDodecahedronGeometry(0.58);
const crystalMeshes = buildCrystalCluster(rhombicGeometry);

function createRhombicDodecahedronGeometry(size = 1) {
  // Набор вершин ромбододекаэдра:
  // 6 осевых точек + 8 "углов" куба (уменьшенных).
  const vertices = [
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 0, -1),
    new THREE.Vector3(0.5, 0.5, 0.5),
    new THREE.Vector3(0.5, 0.5, -0.5),
    new THREE.Vector3(0.5, -0.5, 0.5),
    new THREE.Vector3(0.5, -0.5, -0.5),
    new THREE.Vector3(-0.5, 0.5, 0.5),
    new THREE.Vector3(-0.5, 0.5, -0.5),
    new THREE.Vector3(-0.5, -0.5, 0.5),
    new THREE.Vector3(-0.5, -0.5, -0.5),
  ].map((v) => v.multiplyScalar(size));

  const geometry = new ConvexGeometry(vertices);
  geometry.computeVertexNormals();
  return geometry;
}

function buildCrystalCluster(geometry) {
  const meshes = [];
  const spacing = 1.15;

  // Центральный элемент
  meshes.push(createCrystalPart(geometry, new THREE.Vector3(0, 0, 0), 0));

  // 12 элементов по направлениям граней (векторы типа ±1, ±1, 0)
  const faceVectors = [];
  const signs = [-1, 1];
  for (const sx of signs) {
    for (const sy of signs) {
      faceVectors.push(new THREE.Vector3(sx, sy, 0));
      faceVectors.push(new THREE.Vector3(sx, 0, sy));
      faceVectors.push(new THREE.Vector3(0, sx, sy));
    }
  }

  faceVectors.forEach((v, index) => {
    const position = v.normalize().multiplyScalar(spacing);
    meshes.push(createCrystalPart(geometry, position, index + 1));
  });

  return meshes;
}

function createCrystalPart(geometry, position, index) {
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#f5f7fa'),
    roughness: 0.35,
    metalness: 0.03,
    emissive: new THREE.Color('#000000'),
    emissiveIntensity: 0,
    flatShading: false,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  mesh.userData.index = index;
  mesh.userData.name = index === 0 ? 'Центральный ромбододекаэдр' : `Элемент ${index}`;
  mesh.userData.colorId = 'white';
  crystalGroup.add(mesh);

  return mesh;
}

function renderSwatches() {
  swatchGrid.innerHTML = '';

  COLOR_PRESETS.forEach((preset) => {
    const button = document.createElement('button');
    button.className = 'swatch';
    button.type = 'button';
    button.dataset.colorId = preset.id;
    button.innerHTML = `
      <span class="swatch-dot" style="background:${preset.hex}"></span>
      <span>${preset.label}</span>
    `;

    button.addEventListener('mouseenter', () => {
      colorMeaning.textContent = `${preset.label}: ${preset.meaning}`;
    });

    button.addEventListener('focus', () => {
      colorMeaning.textContent = `${preset.label}: ${preset.meaning}`;
    });

    button.addEventListener('mouseleave', () => {
      if (state.activeColorId) {
        const active = COLOR_PRESETS.find((c) => c.id === state.activeColorId);
        colorMeaning.textContent = `${active.label}: ${active.meaning}`;
      }
    });

    button.addEventListener('click', () => {
      if (!state.selectedMesh) {
        colorMeaning.textContent = 'Сначала выберите элемент кристалла, затем задайте цвет.';
        return;
      }

      applyColorToSelection(preset.id);
      setActiveSwatch(preset.id);
      colorMeaning.textContent = `${preset.label}: ${preset.meaning}`;
    });

    swatchGrid.appendChild(button);
  });
}

function setActiveSwatch(colorId) {
  const swatches = swatchGrid.querySelectorAll('.swatch');
  swatches.forEach((swatch) => {
    swatch.classList.toggle('active', swatch.dataset.colorId === colorId);
  });
}

function applyColorToSelection(colorId) {
  const color = COLOR_PRESETS.find((preset) => preset.id === colorId);
  if (!color || !state.selectedMesh) return;

  state.selectedMesh.material.color.set(color.hex);
  state.selectedMesh.userData.colorId = color.id;
  state.activeColorId = color.id;
}

function selectMesh(mesh) {
  if (state.selectedMesh) {
    state.selectedMesh.material.emissive.set('#000000');
    state.selectedMesh.material.emissiveIntensity = 0;
  }

  state.selectedMesh = mesh;
  selectedName.textContent = mesh.userData.name;

  mesh.material.emissive.set('#d8dee8');
  mesh.material.emissiveIntensity = 0.35;

  const currentColorId = mesh.userData.colorId;
  state.activeColorId = currentColorId;
  setActiveSwatch(currentColorId);

  const info = COLOR_PRESETS.find((preset) => preset.id === currentColorId);
  colorMeaning.textContent = `${info.label}: ${info.meaning}`;
}

function onPointerDown(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(crystalMeshes);

  if (intersects.length > 0) {
    selectMesh(intersects[0].object);
  }
}

function resizeRenderer() {
  const width = canvasHost.clientWidth;
  const height = canvasHost.clientHeight;

  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function saveConfiguration() {
  const payload = crystalMeshes.map((mesh) => ({
    index: mesh.userData.index,
    name: mesh.userData.name,
    colorId: mesh.userData.colorId,
  }));

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'rombicon-crystal.json';
  link.click();
  URL.revokeObjectURL(url);
}

function animate() {
  controls.update();
  crystalGroup.rotation.y += 0.0016;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

renderer.domElement.addEventListener('pointerdown', onPointerDown);
window.addEventListener('resize', resizeRenderer);
saveButton.addEventListener('click', saveConfiguration);

renderSwatches();
resizeRenderer();
animate();
