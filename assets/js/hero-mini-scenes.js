/* hero-mini-scenes.js v3
 *
 * Information-bound 3D mini-scenes for each interior page hero.
 * Built from recognizable shapes: cars, phones, modules, trucks,
 * signal arcs, locks, ledgers, towers, shields. Each scene tells
 * a DOVA story visually.
 *
 * Palette: navy 0x0a1929, cyan 0x22d3ee, white 0xffffff, gray 0x94a3b8.
 * Performance: animate only when in viewport. Mobile / reduced-motion
 * fall back to inline SVG posters.
 */

(function () {
  'use strict';

  if (typeof window === 'undefined') return;

  var CYAN = 0x22d3ee;
  var NAVY = 0x0a1929;
  var WHITE = 0xffffff;
  var GRAY = 0x94a3b8;
  var DARK_BODY = 0x1a2638;
  var MID_BODY = 0x10243f;

  var SCENES = {};

  function isMobile() {
    return window.innerWidth < 720;
  }
  function reducedMotion() {
    return window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function showPoster(canvas) {
    canvas.style.display = 'none';
    var poster = canvas.parentNode.querySelector('.hero-mini-poster');
    if (poster) poster.style.display = 'block';
  }

  function bootStage(canvas, sceneName) {
    if (typeof THREE === 'undefined') { showPoster(canvas); return; }
    var sceneFn = SCENES[sceneName];
    if (!sceneFn) { showPoster(canvas); return; }

    var width = canvas.clientWidth || 600;
    var height = canvas.clientHeight || 320;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0, 7);

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    } catch (err) { showPoster(canvas); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    renderer.setClearColor(0x000000, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    var key = new THREE.DirectionalLight(0xffffff, 0.75);
    key.position.set(3, 4, 5);
    scene.add(key);
    var rim = new THREE.DirectionalLight(CYAN, 0.55);
    rim.position.set(-4, -1, -3);
    scene.add(rim);
    var fill = new THREE.DirectionalLight(0xffffff, 0.3);
    fill.position.set(-3, 2, 4);
    scene.add(fill);

    var ctx = {
      scene: scene, camera: camera, renderer: renderer, canvas: canvas,
      width: width, height: height, time: 0, mouse: { x: 0, y: 0 }
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
   * SHARED BUILDERS — recognizable DOVA shapes
   * ========================================================= */

  function buildDovaModule(scale) {
    scale = scale || 1;
    var g = new THREE.Group();
    var body = new THREE.Mesh(
      new THREE.BoxGeometry(1.6 * scale, 0.4 * scale, 1.0 * scale),
      new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.85, roughness: 0.32 })
    );
    g.add(body);
    var bezelMat = new THREE.MeshStandardMaterial({ color: NAVY, metalness: 0.95, roughness: 0.25 });
    var bezelTop = new THREE.Mesh(new THREE.BoxGeometry(1.65 * scale, 0.08 * scale, 1.05 * scale), bezelMat);
    bezelTop.position.y = 0.22 * scale;
    g.add(bezelTop);
    var bezelBot = bezelTop.clone();
    bezelBot.position.y = -0.22 * scale;
    g.add(bezelBot);
    var led = new THREE.Mesh(
      new THREE.SphereGeometry(0.06 * scale, 12, 12),
      new THREE.MeshBasicMaterial({ color: CYAN })
    );
    led.position.set(0.55 * scale, 0.21 * scale, 0.45 * scale);
    g.add(led);
    g.userData.led = led;
    return g;
  }

  function buildCar(scale, color) {
    scale = scale || 1;
    color = color || DARK_BODY;
    var g = new THREE.Group();
    var bodyMat = new THREE.MeshStandardMaterial({ color: color, metalness: 0.55, roughness: 0.45 });
    var chassis = new THREE.Mesh(new THREE.BoxGeometry(1.6 * scale, 0.35 * scale, 0.7 * scale), bodyMat);
    chassis.position.y = 0.17 * scale;
    g.add(chassis);
    var cabin = new THREE.Mesh(new THREE.BoxGeometry(1.0 * scale, 0.32 * scale, 0.66 * scale), bodyMat);
    cabin.position.set(-0.08 * scale, 0.50 * scale, 0);
    g.add(cabin);
    var glassMat = new THREE.MeshStandardMaterial({ color: 0x0e1b30, metalness: 0.4, roughness: 0.18 });
    var windshield = new THREE.Mesh(new THREE.BoxGeometry(0.05 * scale, 0.26 * scale, 0.6 * scale), glassMat);
    windshield.position.set(0.42 * scale, 0.50 * scale, 0);
    g.add(windshield);
    var wheelMat = new THREE.MeshStandardMaterial({ color: 0x0a1018, metalness: 0.25, roughness: 0.75 });
    var wheelGeo = new THREE.CylinderGeometry(0.14 * scale, 0.14 * scale, 0.12 * scale, 18);
    [[0.55, -0.4], [-0.55, -0.4], [0.55, 0.4], [-0.55, 0.4]].forEach(function (p) {
      var w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.x = Math.PI / 2;
      w.position.set(p[0] * scale, 0, p[1] * scale);
      g.add(w);
    });
    var hl = new THREE.Mesh(
      new THREE.SphereGeometry(0.04 * scale, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xfff4c0 })
    );
    hl.position.set(0.78 * scale, 0.2 * scale, 0.24 * scale);
    g.add(hl);
    var hl2 = hl.clone();
    hl2.position.z = -0.24 * scale;
    g.add(hl2);
    return g;
  }

  function buildTruck(scale, color) {
    scale = scale || 1;
    color = color || MID_BODY;
    var g = new THREE.Group();
    var bodyMat = new THREE.MeshStandardMaterial({ color: color, metalness: 0.6, roughness: 0.4 });
    var trailer = new THREE.Mesh(new THREE.BoxGeometry(1.6 * scale, 0.65 * scale, 0.7 * scale), bodyMat);
    trailer.position.set(0.2 * scale, 0.36 * scale, 0);
    g.add(trailer);
    var cab = new THREE.Mesh(new THREE.BoxGeometry(0.55 * scale, 0.7 * scale, 0.65 * scale), bodyMat);
    cab.position.set(-0.78 * scale, 0.38 * scale, 0);
    g.add(cab);
    var glass = new THREE.Mesh(
      new THREE.BoxGeometry(0.04 * scale, 0.32 * scale, 0.55 * scale),
      new THREE.MeshStandardMaterial({ color: 0x10243f, metalness: 0.4, roughness: 0.2 })
    );
    glass.position.set(-0.5 * scale, 0.5 * scale, 0);
    g.add(glass);
    var wheelMat = new THREE.MeshStandardMaterial({ color: 0x0a1018, metalness: 0.25, roughness: 0.75 });
    var wheelGeo = new THREE.CylinderGeometry(0.16 * scale, 0.16 * scale, 0.14 * scale, 16);
    [-0.85, -0.3, 0.4, 0.85].forEach(function (x) {
      [0.4, -0.4].forEach(function (z) {
        var w = new THREE.Mesh(wheelGeo, wheelMat);
        w.rotation.x = Math.PI / 2;
        w.position.set(x * scale, 0.05 * scale, z * scale);
        g.add(w);
      });
    });
    return g;
  }

  function buildPhone(scale) {
    scale = scale || 1;
    var g = new THREE.Group();
    var caseMat = new THREE.MeshStandardMaterial({ color: 0x111c2e, metalness: 0.5, roughness: 0.35 });
    var body = new THREE.Mesh(new THREE.BoxGeometry(0.6 * scale, 1.2 * scale, 0.08 * scale), caseMat);
    g.add(body);
    var screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5 * scale, 1.0 * scale),
      new THREE.MeshBasicMaterial({ color: NAVY })
    );
    screen.position.z = 0.041 * scale;
    g.add(screen);
    var icon = new THREE.Mesh(
      new THREE.RingGeometry(0.06 * scale, 0.10 * scale, 24),
      new THREE.MeshBasicMaterial({ color: CYAN, side: THREE.DoubleSide })
    );
    icon.position.z = 0.043 * scale;
    g.add(icon);
    g.userData.icon = icon;
    return g;
  }

  function buildBuilding(scale, color, signColor) {
    scale = scale || 1;
    var g = new THREE.Group();
    var bodyMat = new THREE.MeshStandardMaterial({ color: color || MID_BODY, metalness: 0.4, roughness: 0.55 });
    var body = new THREE.Mesh(new THREE.BoxGeometry(1.2 * scale, 1.0 * scale, 0.4 * scale), bodyMat);
    g.add(body);
    // sign
    var sign = new THREE.Mesh(
      new THREE.BoxGeometry(0.7 * scale, 0.18 * scale, 0.06 * scale),
      new THREE.MeshBasicMaterial({ color: signColor || CYAN })
    );
    sign.position.set(0, 0.36 * scale, 0.23 * scale);
    g.add(sign);
    // windows
    var winMat = new THREE.MeshBasicMaterial({ color: 0x163959 });
    for (var r = 0; r < 2; r++) {
      for (var c = 0; c < 3; c++) {
        var w = new THREE.Mesh(new THREE.PlaneGeometry(0.18 * scale, 0.14 * scale), winMat);
        w.position.set((c - 1) * 0.34 * scale, -0.04 * scale - r * 0.22 * scale, 0.21 * scale);
        g.add(w);
      }
    }
    return g;
  }

  function buildSignalArc(start, end, color, segments) {
    color = color || CYAN;
    segments = segments || 24;
    var midY = Math.max(start.y, end.y) + 0.6;
    var mid = new THREE.Vector3((start.x + end.x) / 2, midY, (start.z + end.z) / 2);
    var curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    var pts = curve.getPoints(segments);
    var geo = new THREE.BufferGeometry().setFromPoints(pts);
    var mat = new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: 0.85 });
    var line = new THREE.Line(geo, mat);
    line.userData.curve = curve;
    line.userData.points = pts;
    return line;
  }

  function buildSignalPacket(color) {
    var m = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 12, 12),
      new THREE.MeshBasicMaterial({ color: color || CYAN })
    );
    return m;
  }

  function buildLock(scale) {
    scale = scale || 1;
    var g = new THREE.Group();
    var bodyMat = new THREE.MeshStandardMaterial({ color: MID_BODY, metalness: 0.6, roughness: 0.4 });
    var body = new THREE.Mesh(new THREE.BoxGeometry(0.5 * scale, 0.4 * scale, 0.15 * scale), bodyMat);
    g.add(body);
    var shackleMat = new THREE.MeshStandardMaterial({ color: GRAY, metalness: 0.85, roughness: 0.25 });
    var shackle = new THREE.Mesh(
      new THREE.TorusGeometry(0.16 * scale, 0.04 * scale, 8, 24, Math.PI),
      shackleMat
    );
    shackle.position.y = 0.22 * scale;
    g.add(shackle);
    var keyhole = new THREE.Mesh(
      new THREE.CircleGeometry(0.05 * scale, 16),
      new THREE.MeshBasicMaterial({ color: CYAN })
    );
    keyhole.position.z = 0.076 * scale;
    g.add(keyhole);
    return g;
  }

  function buildLedger(scale) {
    scale = scale || 1;
    var g = new THREE.Group();
    var paperMat = new THREE.MeshStandardMaterial({ color: 0xf2f5f8, metalness: 0.05, roughness: 0.7 });
    var paper = new THREE.Mesh(new THREE.BoxGeometry(0.7 * scale, 0.9 * scale, 0.03 * scale), paperMat);
    g.add(paper);
    var lineMat = new THREE.MeshBasicMaterial({ color: GRAY });
    for (var i = 0; i < 4; i++) {
      var ln = new THREE.Mesh(new THREE.BoxGeometry(0.5 * scale, 0.02 * scale, 0.005 * scale), lineMat);
      ln.position.set(0, 0.28 * scale - i * 0.16 * scale, 0.016 * scale);
      g.add(ln);
    }
    var check = new THREE.Mesh(new THREE.BoxGeometry(0.1 * scale, 0.02 * scale, 0.005 * scale), new THREE.MeshBasicMaterial({ color: CYAN }));
    check.rotation.z = -0.4;
    check.position.set(0.27 * scale, 0.28 * scale, 0.02 * scale);
    g.add(check);
    return g;
  }

  function buildShield(scale) {
    scale = scale || 1;
    var g = new THREE.Group();
    var shape = new THREE.Shape();
    shape.moveTo(0, 0.5);
    shape.bezierCurveTo(0.55, 0.5, 0.55, 0.2, 0.4, -0.2);
    shape.bezierCurveTo(0.25, -0.45, 0, -0.55, 0, -0.55);
    shape.bezierCurveTo(0, -0.55, -0.25, -0.45, -0.4, -0.2);
    shape.bezierCurveTo(-0.55, 0.2, -0.55, 0.5, 0, 0.5);
    var geo = new THREE.ExtrudeGeometry(shape, { depth: 0.08, bevelEnabled: false });
    var mat = new THREE.MeshStandardMaterial({ color: MID_BODY, metalness: 0.6, roughness: 0.4, emissive: CYAN, emissiveIntensity: 0.18 });
    var sh = new THREE.Mesh(geo, mat);
    sh.scale.setScalar(scale);
    g.add(sh);
    var rim = new THREE.Mesh(geo.clone(), new THREE.MeshBasicMaterial({ color: CYAN, wireframe: true, transparent: true, opacity: 0.5 }));
    rim.scale.setScalar(scale * 1.05);
    g.add(rim);
    return g;
  }

  function buildPin(scale) {
    scale = scale || 1;
    var g = new THREE.Group();
    var pinMat = new THREE.MeshStandardMaterial({ color: CYAN, metalness: 0.4, roughness: 0.35, emissive: CYAN, emissiveIntensity: 0.4 });
    var head = new THREE.Mesh(new THREE.SphereGeometry(0.2 * scale, 16, 16), pinMat);
    head.position.y = 0.25 * scale;
    g.add(head);
    var tail = new THREE.Mesh(new THREE.ConeGeometry(0.15 * scale, 0.4 * scale, 12), pinMat);
    tail.position.y = -0.05 * scale;
    g.add(tail);
    var hole = new THREE.Mesh(new THREE.SphereGeometry(0.08 * scale, 12, 12), new THREE.MeshBasicMaterial({ color: NAVY }));
    hole.position.y = 0.25 * scale;
    g.add(hole);
    return g;
  }

  function buildKey(scale) {
    scale = scale || 1;
    var g = new THREE.Group();
    var mat = new THREE.MeshStandardMaterial({ color: 0xd4b863, metalness: 0.85, roughness: 0.25 });
    var ring = new THREE.Mesh(new THREE.TorusGeometry(0.18 * scale, 0.05 * scale, 8, 24), mat);
    ring.position.x = -0.5 * scale;
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
    var shaft = new THREE.Mesh(new THREE.BoxGeometry(0.5 * scale, 0.08 * scale, 0.06 * scale), mat);
    shaft.position.x = -0.05 * scale;
    g.add(shaft);
    var tooth = new THREE.Mesh(new THREE.BoxGeometry(0.06 * scale, 0.16 * scale, 0.06 * scale), mat);
    tooth.position.set(0.15 * scale, -0.08 * scale, 0);
    g.add(tooth);
    var tooth2 = new THREE.Mesh(new THREE.BoxGeometry(0.06 * scale, 0.12 * scale, 0.06 * scale), mat);
    tooth2.position.set(0.05 * scale, -0.08 * scale, 0);
    g.add(tooth2);
    return g;
  }

  function buildCloud(scale) {
    scale = scale || 1;
    var g = new THREE.Group();
    var mat = new THREE.MeshStandardMaterial({ color: 0xeaf3fa, metalness: 0.1, roughness: 0.8 });
    var positions = [
      [-0.35, 0, 0, 0.30],
      [0, 0.08, 0, 0.38],
      [0.32, -0.02, 0, 0.32],
      [-0.10, -0.10, 0, 0.27],
      [0.18, 0.08, 0, 0.30]
    ];
    positions.forEach(function (p) {
      var s = new THREE.Mesh(new THREE.SphereGeometry(p[3] * scale, 16, 16), mat);
      s.position.set(p[0] * scale, p[1] * scale, p[2] * scale);
      g.add(s);
    });
    return g;
  }

  function buildCellTower(scale) {
    scale = scale || 1;
    var g = new THREE.Group();
    var mat = new THREE.MeshStandardMaterial({ color: GRAY, metalness: 0.7, roughness: 0.4 });
    var mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * scale, 0.08 * scale, 1.0 * scale, 8), mat);
    g.add(mast);
    var disk1 = new THREE.Mesh(new THREE.TorusGeometry(0.18 * scale, 0.02 * scale, 8, 16), mat);
    disk1.position.y = 0.4 * scale;
    g.add(disk1);
    var disk2 = disk1.clone();
    disk2.position.y = 0.25 * scale;
    g.add(disk2);
    return g;
  }

  function buildCoinStack(scale) {
    scale = scale || 1;
    var g = new THREE.Group();
    var mat = new THREE.MeshStandardMaterial({ color: CYAN, metalness: 0.75, roughness: 0.3, emissive: CYAN, emissiveIntensity: 0.25 });
    for (var i = 0; i < 7; i++) {
      var c = new THREE.Mesh(new THREE.CylinderGeometry(0.32 * scale, 0.32 * scale, 0.08 * scale, 24), mat);
      c.position.y = -0.4 * scale + i * 0.08 * scale;
      g.add(c);
    }
    return g;
  }

  function buildUSAMap(scale) {
    scale = scale || 1;
    var g = new THREE.Group();
    // simplified outline of continental US made of dots
    var outline = [
      [-2.5, 0.6], [-2.2, 1.0], [-1.6, 1.1], [-0.8, 1.1], [0.0, 1.0],
      [0.8, 0.9], [1.4, 0.6], [1.8, 0.3], [1.8, -0.1], [1.5, -0.5],
      [1.0, -0.9], [0.3, -1.0], [-0.4, -0.95], [-1.0, -0.8],
      [-1.6, -0.6], [-2.0, -0.2], [-2.5, 0.6]
    ];
    var dotGeo = new THREE.SphereGeometry(0.04 * scale, 6, 6);
    var dotMat = new THREE.MeshBasicMaterial({ color: GRAY, transparent: true, opacity: 0.45 });
    // grid fill
    for (var x = -2.4; x <= 1.8; x += 0.2) {
      for (var y = -0.9; y <= 1.0; y += 0.2) {
        var inHull = pointInPolygon(x, y, outline);
        if (inHull) {
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
   * SCENES
   * ========================================================= */

  /* PRODUCT: phone above sends signal down to DOVA module, module
   * sends signal across to car. Three pieces, two arcs. The
   * three-layer system rendered as a story. */
  SCENES['module-spin'] = function (ctx) {
    var g = new THREE.Group();
    ctx.scene.add(g);
    g.scale.setScalar(1.05);

    var phone = buildPhone(0.95);
    phone.position.set(-2.4, 1.05, 0);
    phone.rotation.z = -0.18;
    g.add(phone);

    var mod = buildDovaModule(1.35);
    mod.position.set(0, -0.05, 0);
    g.add(mod);

    var car = buildCar(0.85);
    car.position.set(2.4, -0.5, 0);
    car.rotation.y = -0.25;
    g.add(car);

    var arc1 = buildSignalArc(
      new THREE.Vector3(-2.4, 0.5, 0),
      new THREE.Vector3(-0.7, 0.25, 0),
      CYAN
    );
    g.add(arc1);
    var arc2 = buildSignalArc(
      new THREE.Vector3(0.9, 0.25, 0),
      new THREE.Vector3(2.0, 0.05, 0),
      CYAN
    );
    g.add(arc2);

    var packet1 = buildSignalPacket();
    var packet2 = buildSignalPacket();
    g.add(packet1);
    g.add(packet2);

    return {
      update: function (dt, t) {
        g.rotation.y = ctx.mouse.x * 0.18 + Math.sin(t * 0.25) * 0.05;
        g.rotation.x = ctx.mouse.y * 0.08;
        mod.rotation.y = Math.sin(t * 0.5) * 0.15;
        if (mod.userData.led) {
          mod.userData.led.material.opacity = 0.6 + Math.sin(t * 3.2) * 0.4;
        }
        var p1 = (t % 1.4) / 1.4;
        var pt1 = arc1.userData.curve.getPoint(p1);
        packet1.position.copy(pt1);
        packet1.material.opacity = Math.sin(p1 * Math.PI);
        var p2 = ((t + 0.7) % 1.4) / 1.4;
        var pt2 = arc2.userData.curve.getPoint(p2);
        packet2.position.copy(pt2);
        packet2.material.opacity = Math.sin(p2 * Math.PI);
        car.position.y = -0.5 + Math.sin(t * 1.3) * 0.04;
      }
    };
  };

  /* HOW IT WORKS: eight icons arranged in flow. The active step
   * lights cyan in sequence. Each icon is recognizable: wrench,
   * key, phone, cloud, tower, lock, ledger, exit-arrow. */
  SCENES['flow-timeline'] = function (ctx) {
    var g = new THREE.Group();
    ctx.scene.add(g);

    var n = 8;
    var nodes = [];
    var radius = 0.32;

    for (var i = 0; i < n; i++) {
      var x = (i / (n - 1) - 0.5) * 6.2;
      var y = (i % 2 === 0 ? 0.35 : -0.35);
      var ringMat = new THREE.MeshStandardMaterial({
        color: MID_BODY, metalness: 0.5, roughness: 0.4,
        emissive: 0x000000
      });
      var ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.05, 12, 24), ringMat);
      ring.position.set(x, y, 0);
      g.add(ring);

      var disc = new THREE.Mesh(
        new THREE.CircleGeometry(radius - 0.04, 24),
        new THREE.MeshBasicMaterial({ color: NAVY })
      );
      disc.position.set(x, y, 0.01);
      g.add(disc);

      // step number visual marker
      var dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 12, 12),
        new THREE.MeshBasicMaterial({ color: CYAN })
      );
      dot.position.set(x, y, 0.05);
      g.add(dot);

      nodes.push({ ring: ring, dot: dot, x: x, y: y });
    }

    var lineMat = new THREE.LineBasicMaterial({ color: GRAY, transparent: true, opacity: 0.45 });
    for (var j = 0; j < n - 1; j++) {
      var pts = [
        new THREE.Vector3(nodes[j].x + radius, nodes[j].y, 0),
        new THREE.Vector3(nodes[j + 1].x - radius, nodes[j + 1].y, 0)
      ];
      var lg = new THREE.BufferGeometry().setFromPoints(pts);
      g.add(new THREE.Line(lg, lineMat));
    }

    var pulse = new THREE.Mesh(
      new THREE.RingGeometry(radius + 0.08, radius + 0.16, 32),
      new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.65, side: THREE.DoubleSide })
    );
    g.add(pulse);

    var active = 0, last = 0;
    return {
      update: function (dt, t) {
        if (t - last > 1.0) { active = (active + 1) % n; last = t; }
        nodes.forEach(function (node, idx) {
          var on = idx === active;
          node.ring.material.emissive.setHex(on ? CYAN : 0x000000);
          node.ring.material.emissiveIntensity = on ? 0.6 : 0;
          node.dot.scale.setScalar(on ? 1.35 : 1);
        });
        var p = nodes[active];
        pulse.position.set(p.x, p.y, 0);
        var s = 1 + Math.sin(t * 4) * 0.12;
        pulse.scale.set(s, s, 1);
        pulse.material.opacity = 0.6 + Math.sin(t * 4) * 0.18;
        g.rotation.x = ctx.mouse.y * 0.06;
        g.rotation.y = ctx.mouse.x * 0.08;
      }
    };
  };

  /* FEATURES: six recognizable feature icons floating in a 3x2 grid.
   * Lock, ledger, pin, key, shield, module — each labeled by shape. */
  SCENES['feature-grid'] = function (ctx) {
    var g = new THREE.Group();
    ctx.scene.add(g);

    var positions = [
      [-2.0, 0.9], [0, 0.9], [2.0, 0.9],
      [-2.0, -0.9], [0, -0.9], [2.0, -0.9]
    ];

    var builders = [
      function () { return buildLock(1.4); },
      function () { return buildLedger(1.3); },
      function () { return buildPin(1.1); },
      function () { return buildKey(1.5); },
      function () { return buildShield(0.8); },
      function () { return buildDovaModule(0.85); }
    ];

    var items = positions.map(function (pos, i) {
      var item = builders[i]();
      item.position.set(pos[0], pos[1], 0);
      item.userData.basePhase = i * 0.55;
      g.add(item);
      return item;
    });

    return {
      update: function (dt, t) {
        items.forEach(function (item) {
          item.rotation.y = t * 0.4 + item.userData.basePhase;
          item.position.z = Math.sin(t * 0.8 + item.userData.basePhase) * 0.18;
        });
        g.rotation.y = ctx.mouse.x * 0.18;
        g.rotation.x = ctx.mouse.y * 0.08;
      }
    };
  };

  /* SOLUTIONS: four industry vehicles representing the verticals.
   * Car (dealer), small car at angle (rental), truck (fleet),
   * delivery van (logistics). All lit with cyan accents. */
  SCENES['vertical-tiles'] = function (ctx) {
    var g = new THREE.Group();
    ctx.scene.add(g);
    g.position.y = -0.2;

    var car = buildCar(0.9);
    car.position.x = -3.0;
    g.add(car);

    var rental = buildCar(0.85, 0x102e4a);
    rental.position.x = -1.0;
    rental.rotation.y = 0.25;
    g.add(rental);

    var truck = buildTruck(0.85);
    truck.position.x = 1.2;
    g.add(truck);

    var van = buildTruck(0.78, 0x0e2942);
    van.position.x = 3.2;
    g.add(van);

    // ground plane with cyan strip under each
    var stripMat = new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.7 });
    [-3.0, -1.0, 1.2, 3.2].forEach(function (x, i) {
      var strip = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.04), stripMat.clone());
      strip.position.set(x, -0.25, 0.0);
      strip.rotation.x = -Math.PI / 6;
      strip.userData.phase = i * Math.PI / 2;
      g.add(strip);
    });

    return {
      update: function (dt, t) {
        car.position.y = Math.sin(t * 1.0) * 0.06;
        rental.position.y = Math.sin(t * 1.0 + 0.7) * 0.06;
        truck.position.y = Math.sin(t * 1.0 + 1.4) * 0.06;
        van.position.y = Math.sin(t * 1.0 + 2.1) * 0.06;
        g.rotation.y = Math.sin(t * 0.18) * 0.12 + ctx.mouse.x * 0.18;
        g.rotation.x = -0.05 + ctx.mouse.y * 0.05;
      }
    };
  };

  /* DEALERSHIPS: dealership building with three cars parked in
   * front. A phone above sends a signal to one car which glows cyan,
   * representing on-demand access. */
  SCENES['lot-grid'] = function (ctx) {
    var g = new THREE.Group();
    ctx.scene.add(g);
    g.position.y = -0.35;

    var building = buildBuilding(1.2, MID_BODY, CYAN);
    building.position.set(0, 0.5, -1.5);
    g.add(building);

    var cars = [];
    var colors = [DARK_BODY, 0x10243f, 0x0e1f36];
    [-1.6, 0, 1.6].forEach(function (x, i) {
      var car = buildCar(0.78, colors[i]);
      car.position.set(x, -0.05, 0.4);
      car.rotation.y = Math.PI / 2;
      car.userData.basePhase = i * 0.5;
      g.add(car);
      cars.push(car);
    });

    var phone = buildPhone(0.65);
    phone.position.set(-2.8, 1.6, 0.5);
    phone.rotation.z = 0.15;
    g.add(phone);

    var arc = buildSignalArc(
      new THREE.Vector3(-2.5, 1.2, 0.5),
      new THREE.Vector3(0, 0.4, 0.4),
      CYAN
    );
    g.add(arc);
    var packet = buildSignalPacket();
    g.add(packet);

    // Active highlight ring under the middle car
    var ring = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.65, 32),
      new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.7, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, -0.18, 0.4);
    g.add(ring);

    var activeIdx = 0, lastSwitch = 0;
    return {
      update: function (dt, t) {
        if (t - lastSwitch > 1.5) {
          activeIdx = (activeIdx + 1) % cars.length;
          lastSwitch = t;
        }
        cars.forEach(function (c, i) {
          if (i === activeIdx) {
            c.position.y = -0.02 + Math.sin(t * 4) * 0.03;
          } else {
            c.position.y = -0.05;
          }
        });
        ring.position.x = cars[activeIdx].position.x;
        var s = 1 + Math.sin(t * 4) * 0.12;
        ring.scale.set(s, s, 1);
        ring.material.opacity = 0.55 + Math.sin(t * 4) * 0.2;
        // signal arc to active car
        var newEnd = new THREE.Vector3(cars[activeIdx].position.x, 0.4, 0.4);
        var midY = 1.5;
        var newMid = new THREE.Vector3((-2.5 + newEnd.x) / 2, midY, (0.5 + newEnd.z) / 2);
        var c = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-2.5, 1.2, 0.5), newMid, newEnd);
        arc.userData.curve = c;
        var pts = c.getPoints(24);
        arc.geometry.setFromPoints(pts);
        var pp = (t % 1.5) / 1.5;
        var pt = c.getPoint(pp);
        packet.position.copy(pt);
        packet.material.opacity = Math.sin(pp * Math.PI);
        g.rotation.y = ctx.mouse.x * 0.2;
        g.rotation.x = -0.12 + ctx.mouse.y * 0.05;
      }
    };
  };

  /* FLEET: convoy of three trucks. Phone above sends a signal that
   * cascades down the convoy in sequence, communicating centralized
   * access control across the fleet. */
  SCENES['fleet-truck'] = function (ctx) {
    var g = new THREE.Group();
    ctx.scene.add(g);
    g.position.y = -0.3;

    var trucks = [];
    [-2.4, 0, 2.4].forEach(function (x, i) {
      var t = buildTruck(0.95, [MID_BODY, 0x10243f, 0x0e1f36][i]);
      t.position.set(x, 0, i * 0.05);
      g.add(t);
      trucks.push(t);
    });

    var phone = buildPhone(0.7);
    phone.position.set(0, 2.0, 1.0);
    phone.rotation.z = 0.1;
    g.add(phone);

    var arcs = trucks.map(function (truck) {
      var arc = buildSignalArc(
        new THREE.Vector3(0, 1.6, 1.0),
        new THREE.Vector3(truck.position.x, 0.7, truck.position.z),
        CYAN
      );
      g.add(arc);
      return arc;
    });

    var packet = buildSignalPacket();
    g.add(packet);

    var activeIdx = 0, lastSwitch = 0;
    return {
      update: function (dt, t) {
        if (t - lastSwitch > 0.9) {
          activeIdx = (activeIdx + 1) % trucks.length;
          lastSwitch = t;
        }
        trucks.forEach(function (truck, i) {
          truck.position.y = i === activeIdx ? Math.sin(t * 4) * 0.05 : 0;
        });
        arcs.forEach(function (arc, i) {
          arc.material.opacity = i === activeIdx ? 0.9 : 0.18;
        });
        var pp = ((t - lastSwitch) / 0.9);
        var pt = arcs[activeIdx].userData.curve.getPoint(pp);
        packet.position.copy(pt);
        packet.material.opacity = Math.sin(pp * Math.PI);
        g.rotation.y = -0.2 + Math.sin(t * 0.18) * 0.12 + ctx.mouse.x * 0.18;
        g.rotation.x = ctx.mouse.y * 0.05;
      }
    };
  };

  /* POST-SALE: car at left, key handed across to ledger at right.
   * Cyan checkmark seals the title transfer. The page is about the
   * record after the sale. */
  SCENES['logbook'] = function (ctx) {
    var g = new THREE.Group();
    ctx.scene.add(g);
    g.position.y = -0.1;

    var car = buildCar(0.85);
    car.position.set(-2.5, -0.2, 0);
    g.add(car);

    var key = buildKey(2.0);
    key.position.set(-0.5, 0.4, 0);
    g.add(key);

    var ledger = buildLedger(1.5);
    ledger.position.set(2.0, 0.0, 0);
    ledger.rotation.y = -0.2;
    g.add(ledger);

    var seal = new THREE.Mesh(
      new THREE.RingGeometry(0.2, 0.27, 32),
      new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0 })
    );
    seal.position.set(2.0, -0.2, 0.2);
    g.add(seal);

    var phase = 0; // 0 to 1: key moves; 1 to 2: seal appears
    return {
      update: function (dt, t) {
        var cycle = (t % 4) / 4;
        if (cycle < 0.5) {
          var p = cycle / 0.5;
          key.position.x = -0.5 + p * 2.0;
          key.position.y = 0.4 - p * 0.4;
          key.rotation.z = -p * 0.6;
          seal.material.opacity = 0;
        } else {
          var p2 = (cycle - 0.5) / 0.5;
          key.position.x = 1.5;
          key.position.y = 0;
          key.rotation.z = -0.6;
          seal.material.opacity = Math.sin(p2 * Math.PI) * 0.85;
          seal.scale.setScalar(1 + p2 * 0.3);
        }
        ledger.rotation.y = -0.2 + Math.sin(t * 0.5) * 0.05;
        car.position.y = -0.2 + Math.sin(t * 0.9) * 0.04;
        g.rotation.y = ctx.mouse.x * 0.15;
        g.rotation.x = ctx.mouse.y * 0.06;
      }
    };
  };

  /* ROI: cyan coin stack growing taller, with a count-up effect.
   * A counter ring rotates around it. Page is the ROI argument. */
  SCENES['calculator-ring'] = function (ctx) {
    var g = new THREE.Group();
    ctx.scene.add(g);

    var stack = buildCoinStack(1.5);
    g.add(stack);

    var checkRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.5, 0.06, 12, 48),
      new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.7 })
    );
    g.add(checkRing);

    var dollarPlates = [];
    var n = 8;
    for (var i = 0; i < n; i++) {
      var ang = (i / n) * Math.PI * 2;
      var plate = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.28, 0.05),
        new THREE.MeshStandardMaterial({ color: NAVY, metalness: 0.6, roughness: 0.35, emissive: 0x000000 })
      );
      plate.userData.ang = ang;
      g.add(plate);
      dollarPlates.push(plate);
    }

    var rising = new THREE.Mesh(
      new THREE.CircleGeometry(0.5, 32),
      new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.18, side: THREE.DoubleSide })
    );
    rising.rotation.x = -Math.PI / 2;
    rising.position.y = -0.55;
    g.add(rising);

    var activeIdx = 0, lastSwitch = 0;
    return {
      update: function (dt, t) {
        var radius = 2.2;
        dollarPlates.forEach(function (plate) {
          var a = plate.userData.ang + t * 0.5;
          plate.position.set(Math.cos(a) * radius, Math.sin(a) * radius * 0.55, 0);
          plate.lookAt(0, 0, 2);
        });
        if (t - lastSwitch > 0.5) {
          dollarPlates[activeIdx].material.emissive.setHex(0x000000);
          activeIdx = (activeIdx + 1) % n;
          dollarPlates[activeIdx].material.emissive.setHex(CYAN);
          dollarPlates[activeIdx].material.emissiveIntensity = 0.7;
          lastSwitch = t;
        }
        // breathe the stack
        var b = 1 + Math.sin(t * 1.5) * 0.04;
        stack.scale.set(b, b, b);
        checkRing.rotation.z = t * 0.8;
        rising.scale.setScalar(1 + Math.sin(t * 2) * 0.15);
        g.rotation.y = ctx.mouse.x * 0.15;
        g.rotation.x = ctx.mouse.y * 0.06;
      }
    };
  };

  /* CONTACT: continental USA dot-grid map. Three cell towers planted
   * on it pulse cyan signals that ripple outward, communicating
   * national coverage. */
  SCENES['signal-pulse'] = function (ctx) {
    var g = new THREE.Group();
    ctx.scene.add(g);
    g.scale.setScalar(1.1);

    var map = buildUSAMap(1.5);
    g.add(map);

    var hubs = [
      { x: -2.2 * 1.5, y: 0.5 * 1.5, z: 0 },
      { x: 0 * 1.5, y: -0.4 * 1.5, z: 0 },
      { x: 1.5 * 1.5, y: 0.3 * 1.5, z: 0 }
    ];
    var towers = [], rings = [];
    hubs.forEach(function (h, i) {
      var tower = buildCellTower(0.7);
      tower.position.set(h.x, h.y, 0.2);
      g.add(tower);
      towers.push(tower);

      var ring = new THREE.Mesh(
        new THREE.RingGeometry(0.1, 0.13, 32),
        new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
      );
      ring.position.set(h.x, h.y, 0.05);
      ring.userData.phase = i * 0.8;
      g.add(ring);
      rings.push(ring);
    });

    return {
      update: function (dt, t) {
        rings.forEach(function (ring) {
          var cycle = ((t + ring.userData.phase) % 3) / 3;
          var s = 0.5 + cycle * 12;
          ring.scale.set(s, s, 1);
          ring.material.opacity = 0.85 * (1 - cycle);
        });
        g.rotation.y = ctx.mouse.x * 0.12 + Math.sin(t * 0.18) * 0.05;
        g.rotation.x = ctx.mouse.y * 0.06;
      }
    };
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
