<template>
  <div ref="sceneContainer" class="scene-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
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

  // --- Renderers ---
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.physicallyCorrectLights = true;
  container.appendChild(renderer.domElement);

  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(container.clientWidth, container.clientHeight);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0px';
  container.appendChild(labelRenderer.domElement);

  controls = new OrbitControls(camera, labelRenderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 3, 0);

  // --- Lighting System ---
  const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
  scene.add(ambientLight);

  const headlight = new THREE.SpotLight(0xffffff, 10, 120, Math.PI / 6, 0.3);
  camera.add(headlight);
  camera.add(headlight.target);
  scene.add(camera);

  // 隧道内部点光源
  for (let i = -80; i <= 80; i += 30) {
    const pointLight = new THREE.PointLight(0xffffaa, 5, 30, 1.5);
    pointLight.position.set(0, 7, i);
    scene.add(pointLight);
  }

  // --- Scene Content ---
  const textureLoader = new THREE.TextureLoader();
  const wallTexture = textureLoader.load('https://www.cadhatch.com/media/texture_library/seamless/concrete/seamless_concrete_texture_039_1024.jpg');
  wallTexture.wrapS = THREE.RepeatWrapping;
  wallTexture.wrapT = THREE.RepeatWrapping;
  wallTexture.repeat.set(12, 2);

  // 完整圆形隧道
  const tunnelGeometry = new THREE.CylinderGeometry(8, 8, 200, 48, 1, true, 0, Math.PI * 2);
  const tunnelMaterial = new THREE.MeshStandardMaterial({
    map: wallTexture,
    side: THREE.BackSide,
    roughness: 0.4,
    metalness: 0.3,
    envMapIntensity: 1,
  });
  const tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
  tunnel.rotation.x = Math.PI / 2;
  tunnel.position.y = 8;
  scene.add(tunnel);

  const floorGeometry = new THREE.PlaneGeometry(16, 200);
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.6,
    metalness: 0.2,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // --- Create Track and Ceiling Lights ---
  createTracksAndSleepers();
  createTunnelCeilingLights(); // 顶部隐形灯
  addTunnelSideLights();

  // --- Mock Data ---
  const mockData = [
    { type: 'agv', position: { x: 0, y: 1.2, z: 40 }, label: '小车' },
    { type: 'defect', position: { x: 1.5, y: 3, z: 10 }, label: '缺陷' },
    { type: 'defect', position: { x: -1.5, y: 4, z: -25 }, label: '缺陷' },
  ];
  mockData.forEach(item => addMarkerAt(item.position, item.type, item.label));

  // --- Animation ---
  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
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
 * 创建顶部照明系统（增强版）
 */
function createTunnelCeilingLights() {
  const tunnelLength = 200;
  const lightColor = 0xfff0e0; // 暖白色（接近荧光灯效果）
  
  // --- 主顶部光源配置 ---
  const mainLightIntensity = 5;    // 降低基础强度
  const mainLightDistance = 30;    // 减小照射距离（模拟隧道内光照范围）
  const mainLightDecay = 2;        // 恢复标准衰减（1=线性，2=平方衰减）
  const mainLightCount = 40;       // 恢复原光源数量
  const mainLightSpacing = tunnelLength / mainLightCount;
  
// --- 辅助光源配置 ---
  const sideLightIntensity = 3;    // 侧方辅助光强度（大幅降低）
  const sideLightDistance = 20;    // 侧方光照射距离
  const sideLightOffset = 3;       // 侧方光水平偏移量
  
  // 主顶部光源（沿隧道中心线分布）
  for (let i = 0; i < mainLightCount; i++) {
    const zPos = -tunnelLength/2 + i * mainLightSpacing;
    
    // 创建点光源（模拟隧道顶部射灯）
    const ceilingLight = new THREE.PointLight(
      lightColor, 
      mainLightIntensity, 
      mainLightDistance, 
      mainLightDecay
    );
    ceilingLight.position.set(0, 15.5, zPos);
    scene.add(ceilingLight);
  }
  
  // 两侧辅助光源（增强横向照明）
  for (let i = 0; i < mainLightCount; i += 2) { // 密度减半节省性能
    const zPos = -tunnelLength/2 + i * mainLightSpacing;
    
    // 左侧辅助光
    const leftLight = new THREE.PointLight(
      lightColor, 
      sideLightIntensity, 
      sideLightDistance, 
      mainLightDecay
    );
    leftLight.position.set(-sideLightOffset, 12, zPos);
    scene.add(leftLight);
    
    // 右侧辅助光
    const rightLight = new THREE.PointLight(
      lightColor, 
      sideLightIntensity, 
      sideLightDistance, 
      mainLightDecay
    );
    rightLight.position.set(sideLightOffset, 12, zPos);
    scene.add(rightLight);
  }
  
  // 添加顶部面光源增强整体亮度
  const areaLight = new THREE.RectAreaLight(
    lightColor,
    10,  // 强度
    16,  // 宽度（覆盖隧道直径）
    200  // 长度（覆盖隧道全长）
  );
  areaLight.position.set(0, 18, 0); // 位置略高于隧道顶部
  areaLight.rotation.x = -Math.PI / 2; // 朝向下方
  scene.add(areaLight);
  
  // 添加环境光补充阴影区域
  const ambientLight = new THREE.AmbientLight(
    0x404040,  // 颜色
    0.3        // 强度（较低值避免过曝）
  );
  scene.add(ambientLight);
}
function addTunnelSideLights() {
  const leftSideLight = new THREE.DirectionalLight(0x66ccff, 1.5);
  leftSideLight.position.set(-10, 10, 0);
  scene.add(leftSideLight);
  
  const rightSideLight = new THREE.DirectionalLight(0xffcc66, 1.5);
  rightSideLight.position.set(10, 10, 0);
  scene.add(rightSideLight);
}

/**
 * 创建标记和标签
 */
const addMarkerAt = (coords, type, labelText) => {
  let marker;
  if (type === 'agv') {
    marker = new THREE.Group();
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x00d4ff, 
      emissive: 0x00d4ff, 
      emissiveIntensity: 2, 
      metalness: 0.5, 
      roughness: 0.5 
    });
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.1, roughness: 0.2 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.8, 2.5), bodyMaterial);
    marker.add(body);

    const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.3, 16);
    wheelGeo.rotateZ(Math.PI / 2);

    const wheelPositions = [ 
      {x: -0.9, y: -0.2, z: 0.8 }, 
      {x: 0.9, y: -0.2, z: 0.8 }, 
      {x: -0.9, y: -0.2, z: -0.8 }, 
      {x: 0.9, y: -0.2, z: -0.8 } 
    ];
    wheelPositions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMaterial);
      wheel.position.set(pos.x, pos.y, pos.z);
      marker.add(wheel);
    });

  } else { // 'defect'
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

  const markerDiv = document.createElement('div');
  markerDiv.className = 'marker-label';
  markerDiv.textContent = labelText;

  const markerLabel = new CSS2DObject(markerDiv);
  markerLabel.position.copy(marker.position);
  markerLabel.position.y += 1.5;
  scene.add(markerLabel);
};

</script>

<style>
.scene-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.marker-label {
  color: #ffffff;
  background-color: rgba(20, 20, 20, 0.7);
  padding: 4px 8px;
  border-radius: 4px;
  font-family: sans-serif;
  font-size: 14px;
  white-space: nowrap;
  user-select: none;
  pointer-events: none;
}
</style>