/*
 * D.O.V.A. immersive hero scene
 * Source: extracted from prototype-v2/index.html on 2026-05-28.
 * Loaded by index.html as an ES module via importmap.
 * Skips 3D under 960 px, on prefers-reduced-motion, or when ?legacy=1.
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

(function () {
  'use strict';

  // === Bail-out gates ===
  const url = new URL(location.href);
  if (url.searchParams.get('legacy') === '1') {
    document.body.classList.add('legacy-mode');
    return;
  }
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || window.innerWidth < 480) {
    const loading = document.getElementById('loadingEl');
    if (loading) loading.classList.add('gone');
    initLenisOnly();
    return;
  }

  const stage = document.getElementById('immStage');
  const canvas = document.getElementById('scene3d');
  const loadingEl = document.getElementById('loadingEl');
  if (!stage || !canvas) return;

  // === Scene ===
  const scene = new THREE.Scene();
  scene.background = null;

  const stageRect = stage.getBoundingClientRect();
  const camera = new THREE.PerspectiveCamera(38, stageRect.width / stageRect.height, 0.1, 100);
  camera.position.set(3.5, 1.8, 5.0);
  camera.lookAt(0, 0.4, 0);

  // === Renderer ===
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(stageRect.width, stageRect.height, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth >= 960 ? 2.5 : 1.6));
  renderer.setClearColor(0x050E1C, 1);
  renderer.toneMapping = THREE.LinearToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // === HDR environment ===
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new RoomEnvironment(renderer);
  const envTexture = pmrem.fromScene(envScene, 0.04).texture;
  scene.environment = envTexture;
  envScene.children.forEach(c => { if (c.material) c.material.dispose(); });

  // === Lights ===
  scene.add(new THREE.HemisphereLight(0x4A88D6, 0x0A1A30, 0.42));
  const keyLight = new THREE.DirectionalLight(0xE0F0FF, 1.4);
  keyLight.position.set(3.5, 5.5, 4.2);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 1024;
  keyLight.shadow.mapSize.height = 1024;
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 18;
  keyLight.shadow.camera.left = -4; keyLight.shadow.camera.right = 4;
  keyLight.shadow.camera.top = 4;   keyLight.shadow.camera.bottom = -4;
  keyLight.shadow.bias = -0.0008;
  keyLight.shadow.radius = 4;
  scene.add(keyLight);
  // Kicker / back-rim light for silhouette separation
  const kicker = new THREE.DirectionalLight(0x4FC9E8, 0.8);
  kicker.position.set(-2.5, 3.5, -3.5);
  scene.add(kicker);
  const fillLight = new THREE.DirectionalLight(0xCFE4F4, 0.6); fillLight.position.set(-4, 2, 3); scene.add(fillLight);
  const rimLight = new THREE.PointLight(0x4FC9E8, 2.5, 14); rimLight.position.set(-2.5, 2.5, -2); scene.add(rimLight);
  const cloudFillLight = new THREE.PointLight(0x66D9F0, 1.5, 8); cloudFillLight.position.set(3.2, 1.5, -0.5); scene.add(cloudFillLight);

  // === Materials ===
  const NAVY_LIGHT = 0x223854;
  const CYAN = 0x00C8E8;
  const CHROME = 0xCED4DA;

  const navyPaint = new THREE.MeshPhysicalMaterial({
    color: 0x1A2E4A,
    metalness: 0.55,
    roughness: 0.28,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    envMapIntensity: 0.95,
    sheen: 0.25,
    sheenColor: new THREE.Color(0x4A7AB8)
  });
  const navyLightMat = new THREE.MeshPhysicalMaterial({
    color: NAVY_LIGHT, metalness: 0.7, roughness: 0.3, clearcoat: 0.4, envMapIntensity: 0.45
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: CHROME, metalness: 1.0, roughness: 0.22, envMapIntensity: 0.6
  });
  const plasticDark = new THREE.MeshStandardMaterial({
    color: 0x0C0F14, metalness: 0.15, roughness: 0.78, envMapIntensity: 0.4
  });
  const cyanGlow = new THREE.MeshStandardMaterial({
    color: CYAN, emissive: CYAN, emissiveIntensity: 1.4, metalness: 0.0, roughness: 0.4
  });
  const cyanRingMat = new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.9 });
  const wireframeShell = new THREE.MeshBasicMaterial({
    color: 0x4FC9E8, wireframe: true, transparent: true, opacity: 0.28
  });

  // === Floor plate ===
  const dashGroup = new THREE.Group();
  const dashFloor = new THREE.Mesh(
    new THREE.CircleGeometry(8, 64),
    new THREE.MeshStandardMaterial({ color: 0x0A1830, metalness: 0.05, roughness: 0.78 })
  );
  dashFloor.receiveShadow = true;
  dashFloor.rotation.x = -Math.PI / 2;
  dashFloor.position.y = -0.4;
  dashGroup.add(dashFloor);
  scene.add(dashGroup);

  // === OBD-II port ===
  const obdGroup = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.95), plasticDark);
  obdGroup.add(plate);

  const portShape = new THREE.Shape();
  portShape.moveTo(-0.42, -0.18);
  portShape.lineTo(0.42, -0.18);
  portShape.lineTo(0.36, 0.18);
  portShape.lineTo(-0.36, 0.18);
  portShape.closePath();
  const portGeo = new THREE.ExtrudeGeometry(portShape, {
    depth: 0.16, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2
  });
  const port = new THREE.Mesh(portGeo, plasticDark);
  port.rotation.x = -Math.PI / 2;
  port.position.set(0, 0.07, 0);
  obdGroup.add(port);

  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 8; col++) {
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.08, 12), chromeMat);
      pin.position.set((col - 3.5) * 0.082, 0.13, (row - 0.5) * 0.12);
      obdGroup.add(pin);
    }
  }
  scene.add(obdGroup);

  // === DOVA module ===
  const moduleGroup = new THREE.Group();
  moduleGroup.position.set(0, 1.6, 0);

  const bodyShape = new THREE.Shape();
  const w = 0.55, h = 0.32, r = 0.06;
  bodyShape.moveTo(-w + r, -h);
  bodyShape.lineTo(w - r, -h);
  bodyShape.quadraticCurveTo(w, -h, w, -h + r);
  bodyShape.lineTo(w, h - r);
  bodyShape.quadraticCurveTo(w, h, w - r, h);
  bodyShape.lineTo(-w + r, h);
  bodyShape.quadraticCurveTo(-w, h, -w, h - r);
  bodyShape.lineTo(-w, -h + r);
  bodyShape.quadraticCurveTo(-w, -h, -w + r, -h);
  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
    depth: 0.85, bevelEnabled: true,
    bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 4, curveSegments: 14
  });
  bodyGeo.translate(0, 0, -0.425);
  const body = new THREE.Mesh(bodyGeo, navyPaint); body.castShadow = true; body.receiveShadow = false;
  body.rotation.x = -Math.PI / 2;
  body.rotation.z = Math.PI / 2;
  moduleGroup.add(body);

  const accent = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.02, 0.03), cyanGlow);
  accent.position.set(0, 0.17, 0);
  moduleGroup.add(accent);

  const facePlate = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.005, 0.45), navyLightMat);
  facePlate.position.set(0, 0.21, 0);
  moduleGroup.add(facePlate);

  // === Detail: brushed metal bezel around the top face ===
  const bezelMat = new THREE.MeshPhysicalMaterial({
    color: 0xAAB4C2, metalness: 1.0, roughness: 0.32,
    clearcoat: 0.4, clearcoatRoughness: 0.2, envMapIntensity: 1.1
  });
  const bezelGeo = new THREE.TorusGeometry(0.43, 0.012, 6, 64);
  const bezel = new THREE.Mesh(bezelGeo, bezelMat);
  bezel.rotation.x = -Math.PI / 2;
  bezel.position.set(0, 0.214, 0);
  bezel.scale.set(1.6, 1.6, 1.0);
  bezel.castShadow = true;
  moduleGroup.add(bezel);

  // === Detail: vent grille (5 thin slots) on the top face, rear area ===
  const ventMat = new THREE.MeshStandardMaterial({
    color: 0x06101E, metalness: 0.6, roughness: 0.5, envMapIntensity: 0.4
  });
  for (let vi = 0; vi < 5; vi++) {
    const vent = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.005, 0.018),
      ventMat
    );
    vent.position.set(0, 0.214, -0.18 - vi * 0.04);
    moduleGroup.add(vent);
  }

  // === Detail: small DOVA wordmark stripe (cyan emissive accent on top) ===
  const wordmarkMat = new THREE.MeshBasicMaterial({ color: 0x4FC9E8, transparent: true, opacity: 0.42 });
  const wordmark = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.018), wordmarkMat);
  wordmark.rotation.x = -Math.PI / 2;
  wordmark.position.set(0, 0.216, 0.12);
  moduleGroup.add(wordmark);

  // === Detail: cable nub + extension exiting the back ===
  const cableMat = new THREE.MeshStandardMaterial({
    color: 0x0C0F14, metalness: 0.15, roughness: 0.7
  });
  const cableNub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.034, 0.10, 16),
    cableMat
  );
  cableNub.rotation.x = Math.PI / 2;
  cableNub.position.set(0, 0.05, -0.43);
  cableNub.castShadow = true;
  moduleGroup.add(cableNub);
  const cable = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.32, 12),
    cableMat
  );
  cable.rotation.x = Math.PI / 2;
  cable.position.set(0, 0.05, -0.58);
  cable.castShadow = true;
  moduleGroup.add(cable);
  const ledRing = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.012, 16, 48), cyanRingMat);
  ledRing.rotation.x = -Math.PI / 2;
  ledRing.position.set(0, 0.225, 0);
  moduleGroup.add(ledRing);

  const ledDisk = new THREE.Mesh(
    new THREE.CircleGeometry(0.075, 32),
    new THREE.MeshBasicMaterial({ color: 0x4FC9E8, transparent: true, opacity: 0.55 })
  );
  ledDisk.rotation.x = -Math.PI / 2;
  ledDisk.position.set(0, 0.222, 0);
  moduleGroup.add(ledDisk);
  scene.add(moduleGroup);

  // === Optional: load a bespoke .glb of the DOVA module if present ===
  // Drop a Draco-compressed model at /assets/models/dova-module.glb to replace the procedural one.
  // The procedural module stays in scene as a fallback; the GLB is swapped in once loaded.
  (function tryLoadModule() {
    fetch('/assets/models/dova-module.glb', { method: 'HEAD' })
      .then(r => {
        if (!r.ok) return;
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://unpkg.com/three@0.165.0/examples/jsm/libs/draco/');
        const loader = new GLTFLoader();
        loader.setDRACOLoader(dracoLoader);
        loader.load('/assets/models/dova-module.glb', (gltf) => {
          const bespoke = gltf.scene;
          bespoke.scale.set(1, 1, 1);
          bespoke.position.copy(moduleGroup.position);
          bespoke.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
          scene.add(bespoke);
          // Hide the procedural placeholder by setting children invisible
          moduleGroup.traverse(o => { if (o.isMesh) o.visible = false; });
          // Re-link the moduleGroup reference so the tick loop animates the new model
          window.__dovaModuleSwap = { from: moduleGroup, to: bespoke };
        }, undefined, () => {});
      })
      .catch(() => {});
  })();

  // === Cloud authorization ===
  const cloudGroup = new THREE.Group();
  cloudGroup.position.set(3.2, 1.2, -1.0);

  const cloudCore = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.42, 2),
    new THREE.MeshStandardMaterial({
      color: CYAN, emissive: CYAN, emissiveIntensity: 0.85,
      metalness: 0.0, roughness: 0.5, transparent: true, opacity: 0.85
    })
  );
  cloudGroup.add(cloudCore);

  cloudGroup.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 1), wireframeShell));

  const gates = [];
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.72 + i * 0.06, 0.006, 8, 80),
      new THREE.MeshBasicMaterial({
        color: i === 0 ? 0x1A9FD0 : (i === 1 ? 0x2FBAE0 : 0x4FC9E8),
        transparent: true, opacity: 0.85
      })
    );
    ring.rotation.x = Math.random() * Math.PI;
    ring.rotation.y = Math.random() * Math.PI;
    cloudGroup.add(ring);
    gates.push(ring);
  }
  scene.add(cloudGroup);

  // === Particle stream ===
  const PARTICLE_COUNT = 80;
  const partGeo = new THREE.BufferGeometry();
  const partPos = new Float32Array(PARTICLE_COUNT * 3);
  const partProgress = new Float32Array(PARTICLE_COUNT);
  for (let i = 0; i < PARTICLE_COUNT; i++) partProgress[i] = Math.random();
  partGeo.setAttribute('position', new THREE.BufferAttribute(partPos, 3));
  const partMat = new THREE.PointsMaterial({
    color: CYAN, size: 0.038, transparent: true, opacity: 0.95,
    sizeAttenuation: true, toneMapped: false, depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const partPoints = new THREE.Points(partGeo, partMat);
  scene.add(partPoints);

  // === Postprocessing ===
  const composer = new EffectComposer(renderer);
  composer.setSize(stageRect.width, stageRect.height);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(stageRect.width, stageRect.height),
    (window.innerWidth >= 960 ? 0.42 : 0.3), 0.85, 0.85
  );
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());

  setTimeout(() => loadingEl && loadingEl.classList.add('gone'), 250);

  // === Keyframes (6 acts for the multi-act scroll story) ===
  const keyframes = [
    { // ACT 1 - Install. Module floats above the dashboard, port visible.
      camPos: [2.0, 1.5, 3.6], camLook: [0, 0.4, 0],
      moduleY: 1.15, cloudIntensity: 0.5, label: 'Install',
      line1: 'Smarter,', line2: 'Safer Vehicle', line3: 'Access.',
      sub: 'The only cloud-connected OBD-II platform that works on every U.S. vehicle since 1996. No OEM agreements, no lockboxes, no lost keys.'
    },
    { // ACT 2 - Enroll. Module seats into the port. VIN handshake.
      camPos: [1.1, 0.85, 2.3], camLook: [0, 0.22, 0],
      moduleY: 0.32, cloudIntensity: 0.85, label: 'Enroll',
      line1: 'Plug In.', line2: 'VIN Handshake.', line3: 'Online.',
      sub: 'A thirty-second install. The module joins the cloud authorization engine. The vehicle is now part of your fleet.'
    },
    { // ACT 3 - Authorize. Pull back, data flow visible toward cloud.
      camPos: [2.5, 1.55, 2.95], camLook: [1.2, 0.85, -0.3],
      moduleY: 0.32, cloudIntensity: 1.15, label: 'Authorize',
      line1: 'Three Gates.', line2: 'Cloud Mediated.', line3: 'Verifiable.',
      sub: 'Every start, every door, every shift authorized at the platform layer. The patent-pending architecture closes the gaps lockboxes leave open.'
    },
    { // ACT 4 - Audit. Camera frames the cloud sphere. Particle stream peaks.
      camPos: [3.4, 1.45, 1.6], camLook: [2.9, 1.0, -0.7],
      moduleY: 0.32, cloudIntensity: 1.35, label: 'Audit',
      line1: 'Every Access.', line2: 'Cryptographic.', line3: 'Permanent.',
      sub: 'Each authorization is bound to a real-time diagnostic snapshot. Write-once, tamper-evident, legally admissible.'
    },
    { // ACT 5 - Network. Wide pull-back shows module-cloud-fleet relationship.
      camPos: [4.2, 2.1, 2.2], camLook: [2.4, 1.1, -0.6],
      moduleY: 0.32, cloudIntensity: 1.15, label: 'Network',
      line1: 'Every Vehicle.', line2: 'One Network.', line3: 'Real Time.',
      sub: 'Multiple makes, multiple model years, every vehicle on one cloud authorization engine. Fleets unified.'
    },
    { // ACT 6 - Outcome. Final hero framing, slight orbit, all subsystems lit.
      camPos: [2.6, 1.3, 4.0], camLook: [0.6, 0.5, -0.2],
      moduleY: 0.32, cloudIntensity: 1.5, label: 'Outcome',
      line1: 'Smarter,', line2: 'Safer Vehicle', line3: 'Access.',
      sub: 'Identity verified. Vehicle authorized. Diagnostic recorded. The full DOVA loop, on every vehicle you operate.'
    }
  ];

  const tracked = {
    camPosX: keyframes[0].camPos[0], camPosY: keyframes[0].camPos[1], camPosZ: keyframes[0].camPos[2],
    camLookX: keyframes[0].camLook[0], camLookY: keyframes[0].camLook[1], camLookZ: keyframes[0].camLook[2],
    moduleY: keyframes[0].moduleY,
    cloudIntensity: keyframes[0].cloudIntensity
  };
  const lerp = (a, b, t) => a + (b - a) * t;

  function applyScroll(globalProgress) {
    const segmentCount = keyframes.length - 1;
    const scaled = globalProgress * segmentCount;
    const idx = Math.min(Math.floor(scaled), segmentCount - 1);
    const t = scaled - idx;
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const a = keyframes[idx];
    const b = keyframes[idx + 1];

    tracked.camPosX = lerp(a.camPos[0], b.camPos[0], eased);
    tracked.camPosY = lerp(a.camPos[1], b.camPos[1], eased);
    tracked.camPosZ = lerp(a.camPos[2], b.camPos[2], eased);
    tracked.camLookX = lerp(a.camLook[0], b.camLook[0], eased);
    tracked.camLookY = lerp(a.camLook[1], b.camLook[1], eased);
    tracked.camLookZ = lerp(a.camLook[2], b.camLook[2], eased);
    tracked.moduleY = lerp(a.moduleY, b.moduleY, eased);
    tracked.cloudIntensity = lerp(a.cloudIntensity, b.cloudIntensity, eased);

    setState(eased > 0.5 ? idx + 1 : idx);
  }

  // === Text state ===
  const h1Line1 = document.getElementById('immH1Line1');
  const h1Line2 = document.getElementById('immH1Line2');
  const h1Line3 = document.getElementById('immH1Line3');
  const subEl = document.getElementById('immSub');
  const stepLabelEl = document.getElementById('stepLabel');
  const stepDots = document.querySelectorAll('.imm2-step-dots span');
  let currentState = 0;
  function setState(idx) {
    if (idx === currentState) return;
    if (idx < 0 || idx >= keyframes.length) return;
    currentState = idx;
    const k = keyframes[idx];
    if (window.gsap) {
      window.gsap.to([h1Line1, h1Line2, h1Line3, subEl], {
        opacity: 0, y: 12, duration: 0.22, ease: 'power2.in',
        onComplete: () => {
          h1Line1.textContent = k.line1;
          h1Line2.textContent = k.line2;
          h1Line3.textContent = k.line3;
          subEl.textContent = k.sub;
          window.gsap.to([h1Line1, h1Line2, h1Line3, subEl], {
            opacity: 1, y: 0, duration: 0.45, ease: 'power3.out', stagger: 0.05
          });
        }
      });
    } else {
      h1Line1.textContent = k.line1;
      h1Line2.textContent = k.line2;
      h1Line3.textContent = k.line3;
      subEl.textContent = k.sub;
    }
    if (stepLabelEl) stepLabelEl.textContent = k.label;
    stepDots.forEach((d, i) => d.classList.toggle('active', i === idx));
  }

  // === Animation loop ===
  const clock = new THREE.Clock();
  let scrollProgress = 0;
  let rafId = 0;
  let disposed = false;

  function tick() {
    if (disposed) return;
    const dt = clock.getDelta();
    const t = clock.elapsedTime;

    camera.position.set(tracked.camPosX, tracked.camPosY, tracked.camPosZ);
    camera.lookAt(tracked.camLookX, tracked.camLookY, tracked.camLookZ);

    moduleGroup.position.y = tracked.moduleY;
    if (tracked.moduleY > 0.5) moduleGroup.position.y += Math.sin(t * 1.5) * 0.04;
    moduleGroup.rotation.y = Math.sin(t * 0.4) * 0.12;

    const pulse = 0.7 + 0.3 * Math.sin(t * 3.0);
    ledRing.material.opacity = 0.7 + 0.25 * pulse;
    ledDisk.material.opacity = 0.4 + 0.3 * pulse;

    cloudGroup.rotation.y = t * 0.18;
    cloudCore.material.emissiveIntensity = tracked.cloudIntensity * (0.85 + 0.15 * Math.sin(t * 2.0));

    gates.forEach((g, i) => {
      g.rotation.x += dt * (0.4 + i * 0.15);
      g.rotation.y += dt * (0.25 + i * 0.1);
    });

    // Particle bezier from module to cloud
    const arr = partGeo.attributes.position.array;
    const startX = moduleGroup.position.x, startY = moduleGroup.position.y + 0.25, startZ = moduleGroup.position.z;
    const endX = cloudGroup.position.x, endY = cloudGroup.position.y, endZ = cloudGroup.position.z;
    const ctrlX = (startX + endX) / 2, ctrlY = Math.max(startY, endY) + 1.2, ctrlZ = (startZ + endZ) / 2;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      partProgress[i] += dt * (0.15 + (i % 3) * 0.05);
      if (partProgress[i] > 1) partProgress[i] -= 1;
      const p = partProgress[i];
      const inv = 1 - p;
      const x = inv * inv * startX + 2 * inv * p * ctrlX + p * p * endX;
      const y = inv * inv * startY + 2 * inv * p * ctrlY + p * p * endY;
      const z = inv * inv * startZ + 2 * inv * p * ctrlZ + p * p * endZ;
      arr[i * 3]     = x + Math.sin(t * 2 + i) * 0.015;
      arr[i * 3 + 1] = y + Math.cos(t * 1.5 + i * 0.7) * 0.015;
      arr[i * 3 + 2] = z + Math.sin(t * 1.7 + i * 0.5) * 0.015;
    }
    partGeo.attributes.position.needsUpdate = true;
    partMat.opacity = 0.5 + scrollProgress * 0.5;

    composer.render();
    rafId = requestAnimationFrame(tick);
  }
  tick();

  // === Lenis + ScrollTrigger ===
  function initLenisAndScroll() {
    if (!window.Lenis) return;
    const lenis = new window.Lenis({
      duration: 1.15,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false
    });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);

    if (window.gsap && window.ScrollTrigger) {
      window.gsap.registerPlugin(window.ScrollTrigger);
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add(time => lenis.raf(time * 1000));
      window.gsap.ticker.lagSmoothing(0);

      const heroSection = document.getElementById('immHero');
      // Adaptive pin: full multi-act only on wider viewports.
      const isWide = window.innerWidth >= 960;
      const isCompact = window.innerWidth >= 700 && window.innerWidth < 960;
      const pinEnd = isWide ? '+=300%' : (isCompact ? '+=180%' : '+=100%');
      window.ScrollTrigger.create({
        trigger: heroSection,
        start: 'top top',
        end: pinEnd,
        scrub: 0.4,
        pin: isWide || isCompact,
        pinSpacing: isWide || isCompact,
        anticipatePin: 1,
        onUpdate: (self) => {
          scrollProgress = self.progress;
          applyScroll(scrollProgress);
        }
      });
    }
  }
  initLenisAndScroll();

  function initLenisOnly() {
    if (!window.Lenis) return;
    const lenis = new window.Lenis({
      duration: 1.15,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true, smoothTouch: false
    });
    (function raf(time) { lenis.raf(time); requestAnimationFrame(raf); })(0);
  }

  // === Resize ===
  window.addEventListener('resize', () => {
    if (disposed) return;
    const r = stage.getBoundingClientRect();
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
    renderer.setSize(r.width, r.height, false);
    composer.setSize(r.width, r.height);
    bloomPass.setSize(r.width, r.height);
    // If we are now in non-pinned territory, force H1 back to Act 1.
    if (window.innerWidth < 700 && currentState !== 0) {
      currentState = -1; // force a transition next call
      setState(0);
    }
  });

  // === Tear-down on unload ===
  window.addEventListener('pagehide', () => {
    disposed = true;
    cancelAnimationFrame(rafId);
    composer && composer.dispose && composer.dispose();
    renderer && renderer.dispose && renderer.dispose();
    pmrem && pmrem.dispose && pmrem.dispose();
  });
})();
