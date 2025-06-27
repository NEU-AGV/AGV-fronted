<template>
  <div ref="sceneContainer" class="scene-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// Import the CSS2DRenderer for rendering HTML labels
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

const sceneContainer = ref(null);

let scene, camera, renderer, labelRenderer, controls, animationFrameId;

onMounted(() => {
  const container = sceneContainer.value;
  if (!container) return;

  // --- Core Scene Setup ---
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0a);
  scene.fog = new THREE.Fog(0x0a0a0a, 50, 150);

  camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(0, 5, 50);
  camera.lookAt(0, 0, 0);

  // --- WebGL Renderer (for 3D objects) ---
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.physicallyCorrectLights = true; // Use physically correct lighting
  container.appendChild(renderer.domElement);

  // --- CSS2D Renderer (for HTML labels) ---
  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(container.clientWidth, container.clientHeight);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0px';
  container.appendChild(labelRenderer.domElement);

  controls = new OrbitControls(camera, labelRenderer.domElement); // Controls should interact with the label renderer's element
  controls.enableDamping = true;
  controls.target.set(0, 3, 0);

  // --- Enhanced Lighting System ---
  // 1. Softer ambient light for base illumination
  const ambientLight = new THREE.AmbientLight(0x707070, 0.8);
  scene.add(ambientLight);

  // 2. Camera headlight (SpotLight) for a focused forward view
  const headlight = new THREE.SpotLight(0xffffff, 8, 90, Math.PI / 8, 0.2);
  headlight.position.set(0, 0, 1);
  headlight.target.position.set(0, 0, -1);
  camera.add(headlight);
  camera.add(headlight.target);
  scene.add(camera);

  // 3. Warmer point lights inside the tunnel for atmosphere
  for (let i = -80; i <= 80; i += 25) {
    const pointLight = new THREE.PointLight(0xffaa55, 4, 40, 1.5); // Added decay for more realistic falloff
    pointLight.position.set(0, 7, i);
    scene.add(pointLight);
  }

  // --- Improved Scene Content ---
  const textureLoader = new THREE.TextureLoader();
  const wallTexture = textureLoader.load('https://www.cadhatch.com/media/texture_library/seamless/concrete/seamless_concrete_texture_039_1024.jpg');
  wallTexture.wrapS = THREE.RepeatWrapping;
  wallTexture.wrapT = THREE.RepeatWrapping;
  wallTexture.repeat.set(12, 2);

  // Tunnel Wall
  const tunnelGeometry = new THREE.CylinderGeometry(8, 8, 200, 32, 1, true, 0, Math.PI * 1.5); // Cutout bottom
  const tunnelMaterial = new THREE.MeshStandardMaterial({
    map: wallTexture,
    side: THREE.BackSide,
    roughness: 0.9, // More rough for a less shiny concrete
    metalness: 0.1,
  });
  const tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
  tunnel.rotation.x = Math.PI / 2;
  tunnel.position.y = 8; // Lift tunnel to sit on the floor
  scene.add(tunnel);

  // Tunnel Floor
  const floorGeometry = new THREE.PlaneGeometry(16, 200);
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x252525,
    roughness: 0.8,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);


  createTracksAndSleepers();

  // --- Mock Data with Markers and Labels ---
  const mockData = [
    { type: 'agv', position: { x: 0, y: 1.2, z: 40 }, label: '小车' },
    { type: 'defect', position: { x: 1.5, y: 3, z: 10 }, label: '缺陷' },
    { type: 'defect', position: { x: -1.5, y: 4, z: -25 }, label: '缺陷' },
  ];
  mockData.forEach(item => addMarkerAt(item.position, item.type, item.label));

  // --- Animation Loop ---
  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera); // Render labels
  };
  animate();

  // --- Resize Handling ---
  const resizeObserver = new ResizeObserver(() => {
    if (!container) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
    labelRenderer.setSize(container.clientWidth, container.clientHeight);
  });
  resizeObserver.observe(container);

  onUnmounted(() => {
    cancelAnimationFrame(animationFrameId);
    renderer.dispose();
    // Also remove the label renderer's dom element
    if (labelRenderer && labelRenderer.domElement.parentElement) {
      labelRenderer.domElement.parentElement.removeChild(labelRenderer.domElement);
    }
    resizeObserver.disconnect();
  });
});

// --- Helper Functions ---

function createTracksAndSleepers() {
  const sleeperGeometry = new THREE.BoxGeometry(4, 0.2, 0.5);
  const sleeperMaterial = new THREE.MeshStandardMaterial({ color: 0x3c2f2f, roughness: 0.9 });
  for (let i = -100; i < 100; i += 2) {
    const sleeper = new THREE.Mesh(sleeperGeometry, sleeperMaterial);
    sleeper.position.set(0, 0.1, i);
    scene.add(sleeper);
  }

  const trackGeometry = new THREE.BoxGeometry(0.2, 0.3, 200);
  const trackMaterial = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.9, roughness: 0.5 });
  const track1 = new THREE.Mesh(trackGeometry, trackMaterial);
  track1.position.set(-1.5, 0.35, 0);
  scene.add(track1);

  const track2 = new THREE.Mesh(trackGeometry, trackMaterial);
  track2.position.set(1.5, 0.35, 0);
  scene.add(track2);
}

/**
 * Creates a visually distinct marker and an HTML label at a given position.
 * @param {THREE.Vector3Like} coords The position for the marker.
 * @param {'agv' | 'defect'} type The type of marker to create.
 * @param {string} labelText The text for the label.
 */
const addMarkerAt = (coords, type, labelText) => {
  let marker;
  // --- Create Marker Mesh ---
  if (type === 'agv') {
    // Create a composite shape for the AGV
    marker = new THREE.Group();
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x00d4ff, emissive: 0x00d4ff, emissiveIntensity: 2, metalness: 0.5, roughness: 0.5 });
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.1, roughness: 0.2 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.8, 2.5), bodyMaterial);
    marker.add(body);

    const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.3, 16);
    wheelGeo.rotateZ(Math.PI / 2); // Orient wheels correctly

    const wheelPositions = [ {x: -0.9, y: -0.2, z: 0.8 }, {x: 0.9, y: -0.2, z: 0.8 }, {x: -0.9, y: -0.2, z: -0.8 }, {x: 0.9, y: -0.2, z: -0.8 } ];
    wheelPositions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMaterial);
      wheel.position.set(pos.x, pos.y, pos.z);
      marker.add(wheel);
    });

  } else { // 'defect'
    // Use a spiky, glowing shape for defects
    const geometry = new THREE.IcosahedronGeometry(0.6, 0);
    const material = new THREE.MeshStandardMaterial({
      color: 0xff4d4f,
      emissive: 0xff4d4f,
      emissiveIntensity: 3,
      metalness: 0.2,
      roughness: 0.3,
    });
    marker = new THREE.Mesh(geometry, material);
  }
  marker.position.set(coords.x, coords.y, coords.z);
  scene.add(marker);

  // --- Create HTML Label ---
  const markerDiv = document.createElement('div');
  markerDiv.className = 'marker-label';
  markerDiv.textContent = labelText;

  const markerLabel = new CSS2DObject(markerDiv);
  markerLabel.position.copy(marker.position);
  markerLabel.position.y += 1.5; // Position label above the marker
  scene.add(markerLabel);
};

</script>

<style>
/* Scoped styles won't work on the CSS2DRenderer elements, so we use a global style block */
.scene-container {
  width: 100%;
  height: 100%;
  position: relative; /* Needed for the renderer overlay */
}

.marker-label {
  color: #ffffff;
  background-color: rgba(20, 20, 20, 0.7);
  padding: 4px 8px;
  border-radius: 4px;
  font-family: sans-serif;
  font-size: 14px;
  white-space: nowrap; /* Prevent line breaks */
  user-select: none; /* Prevent text selection */
  pointer-events: none; /* Clicks will pass through to the 3D scene */
}
</style>