/* hero-mini-scenes.js v4
 *
 * DOVA hero mini-scenes. Recognizable shapes, upgraded materials.
 *
 * Material strategy:
 *  - MeshPhysicalMaterial with clearcoat for paint, glass, metal.
 *  - Hemisphere light + key/fill/rim for grounded lighting.
 *  - ACES filmic tone mapping for cinematic contrast.
 *  - Cube-rendered env map at boot for usable reflections.
 *  - Subtle ground plane for shadow grounding.
 *
 * Each scene is positioned so the highest subject sits below the
 * top nav bar (group.position.y = -0.55).
 *
 * Performance: IntersectionObserver gate, pixelRatio cap 2.
 * Mobile/reduced-motion: SVG poster fallback.
 */

(function () {
  'use strict';
  if (typeof window === 'undefined') return;

  var CYAN = 0x22d3ee;
  var NAVY = 0x0a1929;
  var WHITE = 0xffffff;
  var GRAY = 0x94a3b8;
  var DARK_BODY = 0x1a2638;
  var MID_BODY = 0x13284a;
  var DEEP_BLUE = 0x0a1c34;

  var SCENES = {};
  var ENV_MAP = null;

  function isMobile() { return window.innerWidth < 720; }
  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function showPoster(canvas) {
    canvas.style.display = 'none';
    var poster = canvas.parentNode.querySelector('.hero-mini-poster');
    if (poster) poster.style.display = 'block';
  }

  function makeEnvMap(renderer) {
    if (ENV_MAP) return ENV_MAP;
    var size = 128;
    var cubeRT = new THREE.WebGLCubeRenderTarget(size, {
      generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter
    });
    var cubeCam = new THREE.CubeCamera(0.1, 100, cubeRT);
    var envScene = new THREE.Scene();
    // gradient backdrop sphere
    var bgGeo = new THREE.SphereGeometry(50, 32, 32);
    var bgMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: { top: { value: new THREE.Color(0x2a4d77) }, bot: { value: new THREE.Color(0x05101e) } },
      vertexShader: 'varying vec3 v; void main(){ v = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);}',
      fragmentShader: 'varying vec3 v; uniform vec3 top; uniform vec3 bot; void main(){ float t = clamp(normalize(v).y*0.5+0.5, 0.0, 1.0); gl_FragColor = vec4(mix(bot, top, t), 1.0);}'
    });
    envScene.add(new THREE.Mesh(bgGeo, bgMat));
    // ambient + cyan accent lights for highlights on metal
    envScene.add(new THREE.AmbientLight(0xffffff, 0.5));
    var l1 = new THREE.DirectionalLight(0xffffff, 1.2); l1.position.set(5, 8, 4); envScene.add(l1);
    var l2 = new THREE.DirectionalLight(CYAN, 0.6); l2.position.set(-6, 2, -3); envScene.add(l2);
    cubeCam.update(renderer, envScene);
    ENV_MAP = cubeRT.texture;
    return ENV_MAP;
  }

  function bootStage(canvas, sceneName) {
    if (typeof THREE === 'undefined') { showPoster(canvas); return; }
    var sceneFn = SCENES[sceneName];
    if (!sceneFn) { showPoster(canvas); return; }

    var width = canvas.clientWidth || 600;
    var height = canvas.clientHeight || 320;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(0, 0.3, 7.2);
    camera.lookAt(0, -0.2, 0);

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    } catch (err) { showPoster(canvas); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.outputEncoding = THREE.sRGBEncoding;

    var envMap = makeEnvMap(renderer);
    scene.environment = envMap;

    // Lights
    var hemi = new THREE.HemisphereLight(0xb6d4ee, 0x132238, 0.55);
    scene.add(hemi);
    var key = new THREE.DirectionalLight(0xffffff, 0.85);
    key.position.set(3, 4.5, 5);
    scene.add(key);
    var rim = new THREE.DirectionalLight(CYAN, 0.55);
    rim.position.set(-4.5, 1.5, -3);
    scene.add(rim);
    var fill = new THREE.DirectionalLight(0xffffff, 0.32);
    fill.position.set(-3, 2, 4);
    scene.add(fill);

    // Soft ground plane (catches light, gives depth) — tinted toward page bg
    var ground = new THREE.Mesh(
      new THREE.CircleGeometry(8, 32),
      new THREE.MeshStandardMaterial({
        color: 0x0a1626, metalness: 0.5, roughness: 0.55,
        envMap: envMap, envMapIntensity: 0.35,
        transparent: true, opacity: 0.55
      })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.4;
    scene.add(ground);

    var ctx = {
      scene: scene, camera: camera, renderer: renderer, canvas: canvas,
      width: width, height: height, time: 0, mouse: { x: 0, y: 0 }, envMap: envMap
    };

    var instance;
    try { instance = sceneFn(ctx); }
    catch (err) { showPoster(canvas); return; }

    var visible = false, running = false;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        visible = e.isIntersecting;
        if (visible && !running) start();
      });
    }, { threshold: 0.05 });
    io.observe(canvas);

    canvas.addEventListener('mousemove', function (e) {
      var rect = canvas.getBoundingClientRect();
      ctx.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ctx.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    });

    function onResize() {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      if (w === ctx.width && h === ctx.height) return;
      ctx.width = w; ctx.height = h;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }
    window.addEventListener('resize', onResize);

    var last = performance.now();
    function frame(now) {
      if (!visible) { running = false; return; }
      var dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      ctx.time += dt;
      if (instance && instance.update) instance.update(dt, ctx.time);
      renderer.render(scene, camera);
      requestAnimationFrame(frame);
    }
    function start() {
      if (running) return;
      running = true;
      last = performance.now();
      requestAnimationFrame(frame);
    }
  }

  function initAll() {
    var canvases = document.querySelectorAll('canvas.hero-mini');
    if (!canvases.length) return;
    if (isMobile() || reducedMotion()) {
      canvases.forEach(showPoster);
      return;
    }
    canvases.forEach(function (canvas) {
      var sceneName = canvas.getAttribute('data-scene');
      bootStage(canvas, sceneName);
    });
  }

  /* =========================================================
   * Geometry helpers
   * ========================================================= */

  function roundedBox(w, h, d, r, segments) {
    // Bevel-extruded rounded box as a stand-in for RoundedBoxGeometry.
    segments = segments || 4;
    r = Math.min(r, w / 2 - 0.001, h / 2 - 0.001);
    var shape = new THREE.Shape();
    var x = -w / 2, y = -h / 2;
    shape.moveTo(x + r, y);
    shape.lineTo(x + w - r, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + r);
    shape.lineTo(x + w, y + h - r);
    shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    shape.lineTo(x + r, y + h);
    shape.quadraticCurveTo(x, y + h, x, y + h - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);
    return new THREE.ExtrudeGeometry(shape, {
      depth: d,
      bevelEnabled: true,
      bevelThickness: r * 0.5,
      bevelSize: r * 0.5,
      bevelSegments: segments,
      curveSegments: 12
    });
  }

  function physicalPaint(color, opts) {
    opts = opts || {};
    return new THREE.MeshPhysicalMaterial({
      color: color,
      metalness: opts.metalness != null ? opts.metalness : 0.35,
      roughness: opts.roughness != null ? opts.roughness : 0.42,
      clearcoat: opts.clearcoat != null ? opts.clearcoat : 0.7,
      clearcoatRoughness: opts.clearcoatRoughness != null ? opts.clearcoatRoughness : 0.18,
      envMapIntensity: opts.envMapIntensity != null ? opts.envMapIntensity : 1.0,
      emissive: opts.emissive != null ? opts.emissive : 0x000000,
      emissiveIntensity: opts.emissiveIntensity != null ? opts.emissiveIntensity : 0
    });
  }

  function physicalMetal(color, opts) {
    opts = opts || {};
    return new THREE.MeshPhysicalMaterial({
      color: color,
      metalness: opts.metalness != null ? opts.metalness : 0.92,
      roughness: opts.roughness != null ? opts.roughness : 0.22,
      clearcoat: opts.clearcoat != null ? opts.clearcoat : 0.45,
      clearcoatRoughness: opts.clearcoatRoughness != null ? opts.clearcoatRoughness : 0.12,
      envMapIntensity: 1.1
    });
  }

  function physicalGlass(color) {
    return new THREE.MeshPhysicalMaterial({
      color: color || 0x0e1b30,
      metalness: 0.0,
      roughness: 0.05,
      transmission: 0.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      reflectivity: 0.6,
      envMapIntensity: 1.2
    });
  }

  function physicalCyan(color, intensity) {
    color = color || CYAN;
    intensity = intensity != null ? intensity : 0.9;
    return new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: intensity,
      metalness: 0.3,
      roughness: 0.4,
      toneMapped: false
    });
  }

  /* =========================================================
   * Shape builders — recognizable DOVA components
   * ========================================================= */

  function buildDovaModule(scale) {
    scale = scale || 1;
    var g = new THREE.Group();
    var bodyGeo = roundedBox(1.7 * scale, 0.55 * scale, 1.1 * scale, 0.06 * scale);
    bodyGeo.center();
    var body = new THREE.Mesh(bodyGeo, physicalPaint(0x223345, { metalness: 0.55, roughness: 0.32, clearcoat: 0.8 }));
    g.add(body);
    // top inset darker channel for depth
    var insetGeo = roundedBox(1.55 * scale, 0.05 * scale, 0.95 * scale, 0.03 * scale);
    insetGeo.center();
    var inset = new THREE.Mesh(insetGeo, physicalMetal(0x0a1626, { roughness: 0.5 }));
    inset.position.y = 0.31 * scale;
    g.add(inset);
    // cyan LED bar across top
    var bar = new THREE.Mesh(
      new THREE.BoxGeometry(0.85 * scale, 0.025 * scale, 0.04 * scale),
      physicalCyan()
    );
    bar.position.set(-0.05 * scale, 0.345 * scale, 0.4 * scale);
    g.add(bar);
    // led dot
    var led = new THREE.Mesh(
      new THREE.SphereGeometry(0.04 * scale, 16, 16),
      physicalCyan(WHITE, 1.3)
    );
    led.position.set(0.6 * scale, 0.345 * scale, 0.45 * scale);
    g.add(led);
    g.userData.led = led;
    return g;
  }

  function buildCar(scale, color) {
    scale = scale || 1;
    color = color || 0x2c3f56;
    var g = new THREE.Group();
    var paint = physicalPaint(color, { metalness: 0.45, roughness: 0.35, clearcoat: 0.95, clearcoatRoughness: 0.08 });

    // lower chassis (wider)
    var chassisGeo = roundedBox(1.95 * scale, 0.42 * scale, 0.86 * scale, 0.12 * scale);
    chassisGeo.center();
    var chassis = new THREE.Mesh(chassisGeo, paint);
    chassis.position.y = 0.22 * scale;
    g.add(chassis);
    // cabin
    var cabinShape = new THREE.Shape();
    cabinShape.moveTo(-0.7, 0);
    cabinShape.lineTo(-0.4, 0.4);
    cabinShape.lineTo(0.3, 0.4);
    cabinShape.lineTo(0.55, 0);
    cabinShape.lineTo(-0.7, 0);
    var cabinGeo = new THREE.ExtrudeGeometry(cabinShape, { depth: 0.78, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2 });
    cabinGeo.translate(0, 0, -0.39);
    cabinGeo.scale(scale, scale, scale);
    var cabin = new THREE.Mesh(cabinGeo, paint);
    cabin.position.y = 0.42 * scale;
    g.add(cabin);
    // windshield
    var glass = physicalGlass();
    var ws = new THREE.Mesh(new THREE.PlaneGeometry(0.45 * scale, 0.32 * scale), glass);
    ws.position.set(0.18 * scale, 0.55 * scale, 0);
    ws.rotation.y = -0.05;
    ws.rotation.x = -0.4;
    g.add(ws);
    // headlights
    var hlMat = physicalCyan(0xfff4c4, 1.3);
    [0.36, -0.36].forEach(function (z) {
      var hl = new THREE.Mesh(new THREE.SphereGeometry(0.05 * scale, 12, 12), hlMat);
      hl.position.set(0.92 * scale, 0.25 * scale, z * scale);
      g.add(hl);
    });
    // tail lights
    var tlMat = physicalCyan(0xff5566, 0.9);
    [0.36, -0.36].forEach(function (z) {
      var tl = new THREE.Mesh(new THREE.SphereGeometry(0.04 * scale, 12, 12), tlMat);
      tl.position.set(-0.92 * scale, 0.25 * scale, z * scale);
      g.add(tl);
    });
    // wheels
    var rimMat = physicalMetal(0xc6cdd6, { roughness: 0.25 });
    var tireMat = new THREE.MeshStandardMaterial({ color: 0x0a0e16, roughness: 0.85, metalness: 0.05 });
    var wheelGeo = new THREE.CylinderGeometry(0.17 * scale, 0.17 * scale, 0.14 * scale, 22);
    var hubGeo = new THREE.CylinderGeometry(0.08 * scale, 0.08 * scale, 0.16 * scale, 18);
    [[0.65, 0.42], [-0.65, 0.42], [0.65, -0.42], [-0.65, -0.42]].forEach(function (p) {
      var tire = new THREE.Mesh(wheelGeo, tireMat);
      tire.rotation.x = Math.PI / 2;
      tire.position.set(p[0] * scale, 0.16 * scale, p[1] * scale);
      g.add(tire);
      var hub = new THREE.Mesh(hubGeo, rimMat);
      hub.rotation.x = Math.PI / 2;
      hub.position.set(p[0] * scale, 0.16 * scale, p[1] * scale);
      g.add(hub);
    });
    return g;
  }

  function buildTruck(scale, color) {
    scale = scale || 1;
    color = color || MID_BODY;
    var g = new THREE.Group();
    var paint = physicalPaint(color, { metalness: 0.55, roughness: 0.32, clearcoat: 0.85 });
    // trailer
    var trailerGeo = roundedBox(2.0 * scale, 0.85 * scale, 0.92 * scale, 0.08 * scale);
    trailerGeo.center();
    var trailer = new THREE.Mesh(trailerGeo, paint);
    trailer.position.set(0.3 * scale, 0.55 * scale, 0);
    g.add(trailer);
    // cab
    var cabGeo = roundedBox(0.72 * scale, 0.88 * scale, 0.86 * scale, 0.08 * scale);
    cabGeo.center();
    var cab = new THREE.Mesh(cabGeo, paint);
    cab.position.set(-0.95 * scale, 0.55 * scale, 0);
    g.add(cab);
    // windshield
    var glass = physicalGlass();
    var ws = new THREE.Mesh(new THREE.PlaneGeometry(0.04 * scale, 0.42 * scale), glass);
    ws.position.set(-0.6 * scale, 0.7 * scale, 0);
    ws.rotation.y = Math.PI / 2;
    g.add(ws);
    // headlight bar
    var hl = new THREE.Mesh(
      new THREE.BoxGeometry(0.04 * scale, 0.06 * scale, 0.6 * scale),
      physicalCyan(0xfff4c4, 1.4)
    );
    hl.position.set(-1.32 * scale, 0.42 * scale, 0);
    g.add(hl);
    // wheels
    var tireMat = new THREE.MeshStandardMaterial({ color: 0x0a0e16, roughness: 0.85, metalness: 0.05 });
    var rimMat = physicalMetal(0xc6cdd6, { roughness: 0.25 });
    var wGeo = new THREE.CylinderGeometry(0.2 * scale, 0.2 * scale, 0.15 * scale, 18);
    var hGeo = new THREE.CylinderGeometry(0.09 * scale, 0.09 * scale, 0.17 * scale, 14);
    [-1.05, -0.42, 0.5, 1.0].forEach(function (x) {
      [0.46, -0.46].forEach(function (z) {
        var t = new THREE.Mesh(wGeo, tireMat);
        t.rotation.x = Math.PI / 2;
        t.position.set(x * scale, 0.18 * scale, z * scale);
        g.add(t);
        var h = new THREE.Mesh(hGeo, rimMat);
        h.rotation.x = Math.PI / 2;
        h.position.set(x * scale, 0.18 * scale, z * scale);
        g.add(h);
      });
    });
    return g;
  }

  function buildPhone(scale) {
    scale = scale || 1;
    var g = new THREE.Group();
    var caseMat = physicalPaint(0x101a2b, { metalness: 0.6, roughness: 0.28, clearcoat: 0.95, clearcoatRoughness: 0.07 });
    var bodyGeo = roundedBox(0.7 * scale, 1.35 * scale, 0.08 * scale, 0.08 * scale);
    bodyGeo.center();
    var body = new THREE.Mesh(bodyGeo, caseMat);
    g.add(body);
    // screen
    var screenMat = new THREE.MeshStandardMaterial({ color: NAVY, emissive: 0x0a1c2e, emissiveIntensity: 0.4 });
    var screen = new THREE.Mesh(new THREE.PlaneGeometry(0.58 * scale, 1.16 * scale), screenMat);
    screen.position.z = 0.046 * scale;
    g.add(screen);
    // status bar
    var statusBar = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5 * scale, 0.045 * scale),
      new THREE.MeshBasicMaterial({ color: CYAN, toneMapped: false })
    );
    statusBar.position.set(0, 0.51 * scale, 0.047 * scale);
    g.add(statusBar);
    // app icons (3x3 mini grid)
    var iconMat = new THREE.MeshBasicMaterial({ color: 0x1a3e63, toneMapped: false });
    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < 3; c++) {
        var icon = new THREE.Mesh(new THREE.PlaneGeometry(0.11 * scale, 0.11 * scale), iconMat);
        icon.position.set((c - 1) * 0.16 * scale, 0.3 * scale - r * 0.16 * scale, 0.048 * scale);
        g.add(icon);
      }
    }
    // central unlock icon (the action)
    var unlockHalo = new THREE.Mesh(
      new THREE.RingGeometry(0.10 * scale, 0.14 * scale, 32),
      new THREE.MeshBasicMaterial({ color: CYAN, side: THREE.DoubleSide, toneMapped: false })
    );
    unlockHalo.position.set(0, -0.32 * scale, 0.049 * scale);
    g.add(unlockHalo);
    g.userData.icon = unlockHalo;
    return g;
  }

  function buildBuilding(scale, color, signColor) {
    scale = scale || 1;
    var g = new THREE.Group();
    var paint = physicalPaint(color || 0x14253d, { metalness: 0.3, roughness: 0.5 });
    var bodyGeo = roundedBox(1.5 * scale, 1.1 * scale, 0.45 * scale, 0.05 * scale);
    bodyGeo.center();
    var body = new THREE.Mesh(bodyGeo, paint);
    g.add(body);
    // glass facade
    var glassMat = physicalGlass(0x0b1a30);
    var facade = new THREE.Mesh(new THREE.PlaneGeometry(1.32 * scale, 0.92 * scale), glassMat);
    facade.position.z = 0.241 * scale;
    g.add(facade);
    // sign
    var sign = new THREE.Mesh(
      new THREE.BoxGeometry(0.8 * scale, 0.18 * scale, 0.06 * scale),
      physicalCyan(signColor || CYAN, 1.1)
    );
    sign.position.set(0, 0.38 * scale, 0.25 * scale);
    g.add(sign);
    // window grid lines
    var lineMat = new THREE.MeshBasicMaterial({ color: 0x1a3a5e, transparent: true, opacity: 0.4 });
    for (var c = 1; c < 4; c++) {
      var vl = new THREE.Mesh(new THREE.PlaneGeometry(0.01 * scale, 0.85 * scale), lineMat);
      vl.position.set((c - 2) * 0.33 * scale, -0.03 * scale, 0.243 * scale);
      g.add(vl);
    }
    for (var r = 1; r < 3; r++) {
      var hl = new THREE.Mesh(new THREE.PlaneGeometry(1.3 * scale, 0.01 * scale), lineMat);
      hl.position.set(0, -0.03 * scale - r * 0.27 * scale + 0.25 * scale, 0.243 * scale);
      g.add(hl);
    }
    return g;
  }

  function buildSignalArc(start, end, color, lift, segments) {
    color = color || CYAN;
    lift = lift != null ? lift : 0.6;
    segments = segments || 30;
    var midY = Math.max(start.y, end.y) + lift;
    var mid = new THREE.Vector3((start.x + end.x) / 2, midY, (start.z + end.z) / 2);
    var curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    var pts = curve.getPoints(segments);
    var geo = new THREE.BufferGeometry().setFromPoints(pts);
    var mat = new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: 0.85, toneMapped: false });
    var line = new THREE.Line(geo, mat);
    line.userData.curve = curve;
    return line;
  }

  function buildSignalPacket(color) {
    return new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 14, 14),
      new THREE.MeshBasicMaterial({ color: color || CYAN, transparent: true, toneMapped: false })
    );
  }

  function buildLock(scale) {
    scale = scale || 1;
    var g = new THREE.Group();
    var bodyMat = physicalMetal(0x4a5a6e, { roughness: 0.35 });
    var bodyGeo = roundedBox(0.6 * scale, 0.55 * scale, 0.22 * scale, 0.06 * scale);
    bodyGeo.center();
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    g.add(body);
    // shackle (half torus)
    var shackleMat = physicalMetal(0xb0bac4, { roughness: 0.25 });
    var shackle = new THREE.Mesh(
      new THREE.TorusGeometry(0.18 * scale, 0.045 * scale, 10, 24, Math.PI),
      shackleMat
    );
    shackle.position.y = 0.27 * scale;
    g.add(shackle);
    // keyhole disc
    var disc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09 * scale, 0.09 * scale, 0.05 * scale, 24),
      physicalCyan()
    );
    disc.rotation.x = Math.PI / 2;
    disc.position.z = 0.13 * scale;
    g.add(disc);
    return g;
  }

  function buildLedger(scale) {
    scale = scale || 1;
    var g = new THREE.Group();
    // back paper (slightly darker)
    var backGeo = roundedBox(0.86 * scale, 1.05 * scale, 0.03 * scale, 0.02 * scale);
    backGeo.center();
    var back = new THREE.Mesh(backGeo, new THREE.MeshStandardMaterial({ color: 0xd9dde2, metalness: 0.05, roughness: 0.7 }));
    back.position.set(0.04 * scale, -0.03 * scale, 0);
    g.add(back);
    var paperGeo = roundedBox(0.86 * scale, 1.05 * scale, 0.03 * scale, 0.02 * scale);
    paperGeo.center();
    var paper = new THREE.Mesh(paperGeo, new THREE.MeshStandardMaterial({ color: 0xf6f8fb, metalness: 0.05, roughness: 0.6 }));
    g.add(paper);
    // header bar
    var header = new THREE.Mesh(
      new THREE.PlaneGeometry(0.7 * scale, 0.07 * scale),
      new THREE.MeshBasicMaterial({ color: CYAN, toneMapped: false })
    );
    header.position.set(0, 0.42 * scale, 0.017 * scale);
    g.add(header);
    // body lines
    var lineMat = new THREE.MeshBasicMaterial({ color: 0xa9b3bd });
    for (var i = 0; i < 5; i++) {
      var ln = new THREE.Mesh(new THREE.PlaneGeometry(0.6 * scale, 0.025 * scale), lineMat);
      ln.position.set(0, 0.28 * scale - i * 0.14 * scale, 0.017 * scale);
      g.add(ln);
    }
    // check mark
    var check1 = new THREE.Mesh(new THREE.BoxGeometry(0.06 * scale, 0.025 * scale, 0.006 * scale), new THREE.MeshBasicMaterial({ color: CYAN, toneMapped: false }));
    check1.rotation.z = -0.4;
    check1.position.set(-0.22 * scale, 0.42 * scale, 0.025 * scale);
    g.add(check1);
    return g;
  }

  function buildShield(scale) {
    scale = scale || 1;
    var g = new THREE.Group();
    var shape = new THREE.Shape();
    shape.moveTo(0, 0.55);
    shape.bezierCurveTo(0.55, 0.55, 0.55, 0.22, 0.4, -0.18);
    shape.bezierCurveTo(0.25, -0.5, 0, -0.6, 0, -0.6);
    shape.bezierCurveTo(0, -0.6, -0.25, -0.5, -0.4, -0.18);
    shape.bezierCurveTo(-0.55, 0.22, -0.55, 0.55, 0, 0.55);
    var geo = new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 3 });
    geo.center();
    var sh = new THREE.Mesh(geo, physicalPaint(0x1c3654, { metalness: 0.7, roughness: 0.32, clearcoat: 0.8, emissive: CYAN, emissiveIntensity: 0.2 }));
    sh.scale.setScalar(scale);
    g.add(sh);
    // inset check
    var check = new THREE.Mesh(
      new THREE.BoxGeometry(0.06 * scale, 0.04 * scale, 0.04 * scale),
      physicalCyan()
    );
    check.position.set(-0.05 * scale, -0.05 * scale, 0.12 * scale);
    check.rotation.z = -0.5;
    g.add(check);
    var check2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.16 * scale, 0.04 * scale, 0.04 * scale),
      physicalCyan()
    );
    check2.position.set(0.06 * scale, 0.02 * scale, 0.12 * scale);
    check2.rotation.z = 0.5;
    g.add(check2);
    return g;
  }

  function buildPin(scale) {
    scale = scale || 1;
    var g = new THREE.Group();
    var pinMat = physicalPaint(0x0e2c47, { metalness: 0.7, roughness: 0.32, clearcoat: 0.95, emissive: CYAN, emissiveIntensity: 0.4 });
    var head = new THREE.Mesh(new THREE.SphereGeometry(0.22 * scale, 24, 24), pinMat);
    head.position.y = 0.28 * scale;
    g.add(head);
    var tail = new THREE.Mesh(new THREE.ConeGeometry(0.18 * scale, 0.5 * scale, 18), pinMat);
    tail.position.y = -0.05 * scale;
    g.add(tail);
    var hole = new THREE.Mesh(new THREE.SphereGeometry(0.09 * scale, 16, 16), physicalCyan(WHITE, 1.6));
    hole.position.y = 0.28 * scale;
    g.add(hole);
    return g;
  }

  function buildKey(scale) {
    scale = scale || 1;
    var g = new THREE.Group();
    var mat = physicalMetal(0xe3c378, { roughness: 0.2 });
    var ring = new THREE.Mesh(new THREE.TorusGeometry(0.2 * scale, 0.05 * scale, 12, 28), mat);
    ring.position.x = -0.55 * scale;
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
    var shaft = new THREE.Mesh(roundedBox(0.55 * scale, 0.08 * scale, 0.08 * scale, 0.015 * scale), mat);
    shaft.geometry.center();
    shaft.position.x = -0.08 * scale;
    g.add(shaft);
    var tooth = new THREE.Mesh(roundedBox(0.06 * scale, 0.16 * scale, 0.08 * scale, 0.01 * scale), mat);
    tooth.geometry.center();
    tooth.position.set(0.17 * scale, -0.09 * scale, 0);
    g.add(tooth);
    var tooth2 = new THREE.Mesh(roundedBox(0.06 * scale, 0.12 * scale, 0.08 * scale, 0.01 * scale), mat);
    tooth2.geometry.center();
    tooth2.position.set(0.05 * scale, -0.09 * scale, 0);
    g.add(tooth2);
    return g;
  }

  function buildCellTower(scale) {
    scale = scale || 1;
    var g = new THREE.Group();
    var mat = physicalMetal(0x8a96a4, { roughness: 0.4 });
    // lattice mast (cone simplification)
    var mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04 * scale, 0.1 * scale, 1.0 * scale, 8), mat);
    g.add(mast);
    // three antennas
    var antMat = physicalMetal(0xbfc7d0, { roughness: 0.3 });
    [0, 2.1, 4.2].forEach(function (a) {
      var ant = new THREE.Mesh(new THREE.CylinderGeometry(0.02 * scale, 0.02 * scale, 0.3 * scale, 6), antMat);
      ant.position.y = 0.5 * scale;
      ant.position.x = Math.cos(a) * 0.12 * scale;
      ant.position.z = Math.sin(a) * 0.12 * scale;
      g.add(ant);
    });
    // top blinker
    var blink = new THREE.Mesh(new THREE.SphereGeometry(0.05 * scale, 12, 12), physicalCyan(0xff4040, 1.2));
    blink.position.y = 0.65 * scale;
    g.add(blink);
    g.userData.blink = blink;
    return g;
  }

  function buildCoinStack(scale) {
    scale = scale || 1;
    var g = new THREE.Group();
    var mat = physicalMetal(CYAN, { roughness: 0.18, metalness: 0.95 });
    mat.emissive = new THREE.Color(CYAN);
    mat.emissiveIntensity = 0.18;
    for (var i = 0; i < 8; i++) {
      var c = new THREE.Mesh(new THREE.CylinderGeometry(0.34 * scale, 0.34 * scale, 0.09 * scale, 32), mat);
      c.position.y = -0.4 * scale + i * 0.09 * scale;
      g.add(c);
    }
    // dollar sign on top
    return g;
  }

  function buildUSAMap(scale) {
    scale = scale || 1;
    var g = new THREE.Group();
    var outline = [
      [-2.5, 0.6], [-2.2, 1.0], [-1.6, 1.1], [-0.8, 1.1], [0.0, 1.0],
      [0.8, 0.9], [1.4, 0.6], [1.8, 0.3], [1.8, -0.1], [1.5, -0.5],
      [1.0, -0.9], [0.3, -1.0], [-0.4, -0.95], [-1.0, -0.8],
      [-1.6, -0.6], [-2.0, -0.2], [-2.5, 0.6]
    ];
    var dotGeo = new THREE.SphereGeometry(0.045 * scale, 8, 8);
    var dotMat = new THREE.MeshStandardMaterial({ color: 0x6c8aa8, metalness: 0.3, roughness: 0.5, transparent: true, opacity: 0.55 });
    for (var x = -2.4; x <= 1.8; x += 0.18) {
      for (var y = -0.9; y <= 1.0; y += 0.18) {
        if (pointInPolygon(x, y, outline)) {
          var d = new THREE.Mesh(dotGeo, dotMat);
          d.position.set(x * scale, y * scale, 0);
          g.add(d);
        }
      }
    }
    return g;
  }

  function pointInPolygon(x, y, poly) {
    var inside = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var xi = poly[i][0], yi = poly[i][1];
      var xj = poly[j][0], yj = poly[j][1];
      var intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi + 1e-9) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  /* =========================================================
   * SCENES — every group anchored at y = -0.55 to clear nav
   * ========================================================= */

  SCENES['module-spin'] = function (ctx) {
    var g = new THREE.Group();
    g.position.y = -0.4;
    ctx.scene.add(g);

    var phone = buildPhone(1.0);
    phone.position.set(-2.6, 0.75, 0);
    phone.rotation.set(-0.05, 0.18, -0.18);
    g.add(phone);

    var mod = buildDovaModule(1.5);
    mod.position.set(0, 0.0, 0);
    g.add(mod);

    var car = buildCar(0.95, 0x1f3656);
    car.position.set(2.6, -0.55, 0);
    car.rotation.y = -0.5;
    g.add(car);

    var arc1 = buildSignalArc(new THREE.Vector3(-2.6, 0.4, 0), new THREE.Vector3(-0.6, 0.2, 0), CYAN, 0.55);
    g.add(arc1);
    var arc2 = buildSignalArc(new THREE.Vector3(0.85, 0.2, 0), new THREE.Vector3(2.2, -0.05, 0), CYAN, 0.4);
    g.add(arc2);

    var packet1 = buildSignalPacket();
    var packet2 = buildSignalPacket();
    g.add(packet1); g.add(packet2);

    return {
      update: function (dt, t) {
        g.rotation.y = ctx.mouse.x * 0.18 + Math.sin(t * 0.22) * 0.04;
        g.rotation.x = ctx.mouse.y * 0.06;
        mod.rotation.y = Math.sin(t * 0.45) * 0.15;
        if (mod.userData.led) {
          mod.userData.led.material.emissiveIntensity = 1.0 + Math.sin(t * 3) * 0.6;
        }
        var p1 = (t % 1.4) / 1.4;
        packet1.position.copy(arc1.userData.curve.getPoint(p1));
        packet1.material.opacity = Math.sin(p1 * Math.PI);
        var p2 = ((t + 0.7) % 1.4) / 1.4;
        packet2.position.copy(arc2.userData.curve.getPoint(p2));
        packet2.material.opacity = Math.sin(p2 * Math.PI);
        car.position.y = -0.55 + Math.sin(t * 1.3) * 0.025;
      }
    };
  };

  SCENES['flow-timeline'] = function (ctx) {
    var g = new THREE.Group();
    g.position.y = -0.35;
    ctx.scene.add(g);

    var n = 8;
    var nodes = [];
    var R = 0.34;
    for (var i = 0; i < n; i++) {
      var x = (i / (n - 1) - 0.5) * 6.4;
      var y = (i % 2 === 0 ? 0.32 : -0.32);
      var node = new THREE.Group();
      node.position.set(x, y, 0);
      var ring = new THREE.Mesh(new THREE.TorusGeometry(R, 0.06, 14, 32), physicalMetal(0x3a5170, { roughness: 0.35 }));
      node.add(ring);
      var disc = new THREE.Mesh(
        new THREE.CircleGeometry(R - 0.04, 32),
        new THREE.MeshStandardMaterial({ color: 0x0e1e36, metalness: 0.7, roughness: 0.4 })
      );
      disc.position.z = 0.01;
      node.add(disc);
      var dot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), physicalCyan());
      dot.position.z = 0.05;
      node.add(dot);
      g.add(node);
      nodes.push({ node: node, ring: ring, dot: dot, x: x, y: y });
    }
    var lineMat = new THREE.LineBasicMaterial({ color: 0x6c8aa8, transparent: true, opacity: 0.6, toneMapped: false });
    for (var j = 0; j < n - 1; j++) {
      var pts = [
        new THREE.Vector3(nodes[j].x + R, nodes[j].y, 0),
        new THREE.Vector3(nodes[j + 1].x - R, nodes[j + 1].y, 0)
      ];
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
    }
    var halo = new THREE.Mesh(
      new THREE.RingGeometry(R + 0.08, R + 0.18, 32),
      new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.7, side: THREE.DoubleSide, toneMapped: false })
    );
    g.add(halo);
    var active = 0, lastSwitch = 0;
    return {
      update: function (dt, t) {
        if (t - lastSwitch > 1.0) { active = (active + 1) % n; lastSwitch = t; }
        nodes.forEach(function (node, idx) {
          var on = idx === active;
          node.dot.scale.setScalar(on ? 1.4 : 1);
          node.dot.material.emissiveIntensity = on ? 1.6 : 0.7;
          node.ring.scale.setScalar(on ? 1.06 : 1);
        });
        var p = nodes[active];
        halo.position.set(p.x, p.y, 0.02);
        var s = 1 + Math.sin(t * 4) * 0.14;
        halo.scale.set(s, s, 1);
        halo.material.opacity = 0.6 + Math.sin(t * 4) * 0.2;
        g.rotation.x = ctx.mouse.y * 0.05;
        g.rotation.y = ctx.mouse.x * 0.06;
      }
    };
  };

  SCENES['feature-grid'] = function (ctx) {
    var g = new THREE.Group();
    g.position.y = -0.35;
    ctx.scene.add(g);
    var positions = [
      [-2.4, 0.7], [0, 0.7], [2.4, 0.7],
      [-2.4, -0.7], [0, -0.7], [2.4, -0.7]
    ];
    var items = [
      buildLock(1.4), buildLedger(1.3), buildPin(1.1),
      buildKey(1.6), buildShield(0.85), buildDovaModule(0.9)
    ];
    items.forEach(function (item, i) {
      item.position.set(positions[i][0], positions[i][1], 0);
      item.userData.basePhase = i * 0.55;
      g.add(item);
    });
    return {
      update: function (dt, t) {
        items.forEach(function (item) {
          item.rotation.y = t * 0.4 + item.userData.basePhase;
          item.position.z = Math.sin(t * 0.7 + item.userData.basePhase) * 0.2;
        });
        g.rotation.y = ctx.mouse.x * 0.18;
        g.rotation.x = ctx.mouse.y * 0.08;
      }
    };
  };

  SCENES['vertical-tiles'] = function (ctx) {
    var g = new THREE.Group();
    g.position.y = -0.45;
    ctx.scene.add(g);
    var subjects = [
      { builder: buildCar, scale: 0.85, color: 0x223e62 },
      { builder: buildCar, scale: 0.8, color: 0x1f4c7d, rotY: 0.3 },
      { builder: buildTruck, scale: 0.8, color: MID_BODY },
      { builder: buildTruck, scale: 0.75, color: 0x0e2942 }
    ];
    var slots = [-3.1, -1.0, 1.2, 3.2];
    var items = subjects.map(function (s, i) {
      var item = s.builder(s.scale, s.color);
      item.position.x = slots[i];
      if (s.rotY) item.rotation.y = s.rotY;
      item.userData.phase = i * Math.PI / 2;
      g.add(item);
      var strip = new THREE.Mesh(
        new THREE.PlaneGeometry(1.5, 0.04),
        new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.75, toneMapped: false })
      );
      strip.position.set(slots[i], -0.05, 0);
      strip.rotation.x = -Math.PI / 2;
      g.add(strip);
      return item;
    });
    return {
      update: function (dt, t) {
        items.forEach(function (item, i) {
          item.position.y = Math.sin(t * 1.0 + i * 0.7) * 0.06;
        });
        g.rotation.y = Math.sin(t * 0.18) * 0.12 + ctx.mouse.x * 0.2;
        g.rotation.x = -0.04 + ctx.mouse.y * 0.05;
      }
    };
  };

  SCENES['lot-grid'] = function (ctx) {
    var g = new THREE.Group();
    g.position.y = -0.55;
    ctx.scene.add(g);

    var building = buildBuilding(1.3, 0x14253d, CYAN);
    building.position.set(0, 0.55, -1.5);
    g.add(building);

    var cars = [];
    var colors = [0x1f3656, 0x182d4a, 0x1a3052];
    [-1.7, 0, 1.7].forEach(function (x, i) {
      var car = buildCar(0.78, colors[i]);
      car.position.set(x, 0, 0.4);
      car.rotation.y = Math.PI / 2;
      g.add(car);
      cars.push(car);
    });

    var phone = buildPhone(0.6);
    phone.position.set(-3.0, 1.35, 0.7);
    phone.rotation.set(-0.1, 0.4, 0.15);
    g.add(phone);

    var arc = buildSignalArc(new THREE.Vector3(-2.8, 1.05, 0.7), new THREE.Vector3(0, 0.55, 0.4), CYAN, 0.6);
    g.add(arc);
    var packet = buildSignalPacket();
    g.add(packet);

    var ring = new THREE.Mesh(
      new THREE.RingGeometry(0.6, 0.7, 36),
      new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.75, side: THREE.DoubleSide, toneMapped: false })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, 0.02, 0.4);
    g.add(ring);

    var activeIdx = 0, lastSwitch = 0;
    return {
      update: function (dt, t) {
        if (t - lastSwitch > 1.6) { activeIdx = (activeIdx + 1) % cars.length; lastSwitch = t; }
        cars.forEach(function (c, i) {
          c.position.y = i === activeIdx ? Math.sin(t * 4) * 0.04 : 0;
        });
        ring.position.x = cars[activeIdx].position.x;
        var s = 1 + Math.sin(t * 4) * 0.14;
        ring.scale.set(s, s, 1);
        ring.material.opacity = 0.55 + Math.sin(t * 4) * 0.22;
        var newEnd = new THREE.Vector3(cars[activeIdx].position.x, 0.55, 0.4);
        var newMid = new THREE.Vector3((-2.8 + newEnd.x) / 2, 1.55, (0.7 + newEnd.z) / 2);
        var c = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-2.8, 1.05, 0.7), newMid, newEnd);
        arc.userData.curve = c;
        arc.geometry.setFromPoints(c.getPoints(30));
        var pp = (t % 1.6) / 1.6;
        packet.position.copy(c.getPoint(pp));
        packet.material.opacity = Math.sin(pp * Math.PI);
        g.rotation.y = ctx.mouse.x * 0.2;
        g.rotation.x = -0.05 + ctx.mouse.y * 0.05;
      }
    };
  };

  SCENES['fleet-truck'] = function (ctx) {
    var g = new THREE.Group();
    g.position.y = -0.55;
    ctx.scene.add(g);
    var trucks = [];
    [-2.6, 0, 2.6].forEach(function (x, i) {
      var t = buildTruck(0.9, [MID_BODY, 0x163358, 0x0e2942][i]);
      t.position.set(x, 0, i * 0.05);
      g.add(t);
      trucks.push(t);
    });
    var phone = buildPhone(0.7);
    phone.position.set(0, 1.85, 1.1);
    phone.rotation.set(-0.2, 0, 0.1);
    g.add(phone);
    var arcs = trucks.map(function (truck) {
      return g.add(buildSignalArc(
        new THREE.Vector3(0, 1.5, 1.1),
        new THREE.Vector3(truck.position.x, 0.95, truck.position.z),
        CYAN, 0.4
      )) ? g.children[g.children.length - 1] : null;
    });
    var packet = buildSignalPacket();
    g.add(packet);
    var activeIdx = 0, lastSwitch = 0;
    return {
      update: function (dt, t) {
        if (t - lastSwitch > 0.95) { activeIdx = (activeIdx + 1) % trucks.length; lastSwitch = t; }
        trucks.forEach(function (truck, i) {
          truck.position.y = i === activeIdx ? Math.sin(t * 4) * 0.05 : 0;
        });
        arcs.forEach(function (arc, i) {
          arc.material.opacity = i === activeIdx ? 0.9 : 0.18;
        });
        var pp = ((t - lastSwitch) / 0.95);
        packet.position.copy(arcs[activeIdx].userData.curve.getPoint(pp));
        packet.material.opacity = Math.sin(pp * Math.PI);
        g.rotation.y = -0.18 + Math.sin(t * 0.18) * 0.1 + ctx.mouse.x * 0.18;
        g.rotation.x = ctx.mouse.y * 0.05;
      }
    };
  };

  SCENES['logbook'] = function (ctx) {
    var g = new THREE.Group();
    g.position.y = -0.4;
    ctx.scene.add(g);
    var car = buildCar(0.85, 0x223e62);
    car.position.set(-2.6, -0.35, 0);
    car.rotation.y = 0.15;
    g.add(car);
    var key = buildKey(2.1);
    key.position.set(-0.5, 0.5, 0);
    g.add(key);
    var ledger = buildLedger(1.55);
    ledger.position.set(2.2, 0.1, 0);
    ledger.rotation.y = -0.25;
    g.add(ledger);
    var seal = new THREE.Mesh(
      new THREE.RingGeometry(0.22, 0.3, 36),
      new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0, side: THREE.DoubleSide, toneMapped: false })
    );
    seal.position.set(2.2, -0.15, 0.2);
    g.add(seal);
    return {
      update: function (dt, t) {
        var cycle = (t % 4) / 4;
        if (cycle < 0.5) {
          var p = cycle / 0.5;
          key.position.x = -0.5 + p * 2.0;
          key.position.y = 0.5 - p * 0.5;
          key.rotation.z = -p * 0.6;
          seal.material.opacity = 0;
        } else {
          var p2 = (cycle - 0.5) / 0.5;
          key.position.x = 1.5;
          key.position.y = 0;
          key.rotation.z = -0.6;
          seal.material.opacity = Math.sin(p2 * Math.PI) * 0.9;
          seal.scale.setScalar(1 + p2 * 0.3);
        }
        ledger.rotation.y = -0.25 + Math.sin(t * 0.5) * 0.04;
        car.position.y = -0.35 + Math.sin(t * 0.9) * 0.03;
        g.rotation.y = ctx.mouse.x * 0.12;
        g.rotation.x = ctx.mouse.y * 0.05;
      }
    };
  };

  SCENES['calculator-ring'] = function (ctx) {
    var g = new THREE.Group();
    g.position.y = -0.3;
    ctx.scene.add(g);
    var stack = buildCoinStack(1.5);
    g.add(stack);
    var ringMat = new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.85, toneMapped: false });
    var orbit = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.04, 14, 64), ringMat);
    g.add(orbit);
    var plates = [];
    var n = 8;
    for (var i = 0; i < n; i++) {
      var ang = (i / n) * Math.PI * 2;
      var plate = new THREE.Mesh(
        roundedBox(0.3, 0.3, 0.05, 0.04),
        physicalPaint(0x0e2c47, { metalness: 0.7, roughness: 0.32, clearcoat: 0.85, emissive: 0x000000 })
      );
      plate.geometry.center();
      plate.userData.ang = ang;
      g.add(plate);
      plates.push(plate);
    }
    var activeIdx = 0, lastSwitch = 0;
    return {
      update: function (dt, t) {
        var radius = 2.0;
        plates.forEach(function (plate) {
          var a = plate.userData.ang + t * 0.5;
          plate.position.set(Math.cos(a) * radius, Math.sin(a) * radius * 0.55, 0);
          plate.lookAt(0, 0, 2);
        });
        if (t - lastSwitch > 0.5) {
          plates[activeIdx].material.emissive.setHex(0x000000);
          plates[activeIdx].material.emissiveIntensity = 0;
          activeIdx = (activeIdx + 1) % n;
          plates[activeIdx].material.emissive.setHex(CYAN);
          plates[activeIdx].material.emissiveIntensity = 0.9;
          lastSwitch = t;
        }
        var b = 1 + Math.sin(t * 1.5) * 0.03;
        stack.scale.set(b, b, b);
        orbit.rotation.z = t * 0.8;
        g.rotation.y = ctx.mouse.x * 0.15;
        g.rotation.x = ctx.mouse.y * 0.05;
      }
    };
  };

  SCENES['signal-pulse'] = function (ctx) {
    var g = new THREE.Group();
    g.position.y = -0.3;
    g.scale.setScalar(1.15);
    ctx.scene.add(g);
    var map = buildUSAMap(1.5);
    g.add(map);
    var hubs = [
      { x: -2.2 * 1.5, y: 0.5 * 1.5 },
      { x: 0, y: -0.4 * 1.5 },
      { x: 1.5 * 1.5, y: 0.3 * 1.5 }
    ];
    var rings = [];
    hubs.forEach(function (h, i) {
      var tower = buildCellTower(0.7);
      tower.position.set(h.x, h.y, 0.15);
      g.add(tower);
      var ring = new THREE.Mesh(
        new THREE.RingGeometry(0.11, 0.14, 32),
        new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.85, side: THREE.DoubleSide, toneMapped: false })
      );
      ring.position.set(h.x, h.y, 0.05);
      ring.userData.phase = i * 0.85;
      g.add(ring);
      rings.push(ring);
    });
    return {
      update: function (dt, t) {
        rings.forEach(function (ring) {
          var cycle = ((t + ring.userData.phase) % 3) / 3;
          var s = 0.5 + cycle * 11;
          ring.scale.set(s, s, 1);
          ring.material.opacity = 0.85 * (1 - cycle);
        });
        g.rotation.y = ctx.mouse.x * 0.12 + Math.sin(t * 0.18) * 0.04;
        g.rotation.x = -0.05 + ctx.mouse.y * 0.05;
      }
    };
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
