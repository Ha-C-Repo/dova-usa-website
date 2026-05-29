/* hero-mini-scenes.js
 *
 * Lightweight Three.js mini-scenes for the hero-compact section of
 * every interior page. Each canvas declares a data-scene preset.
 * The infrastructure here is shared. The preset functions live in
 * the SCENES table below.
 *
 * Color palette:
 *   cyan   #22d3ee
 *   navy   #0a1929
 *   white  #ffffff
 *   gray   #94a3b8
 *
 * Performance: animations only run when the canvas intersects the
 * viewport. Mobile (<720) and prefers-reduced-motion skip Three.js
 * entirely and reveal the SVG poster sibling.
 */

(function () {
  'use strict';

  if (typeof window === 'undefined') return;

  var CYAN = 0x22d3ee;
  var NAVY = 0x0a1929;
  var WHITE = 0xffffff;
  var GRAY = 0x94a3b8;

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
    if (typeof THREE === 'undefined') {
      showPoster(canvas);
      return;
    }

    var sceneFn = SCENES[sceneName];
    if (!sceneFn) {
      showPoster(canvas);
      return;
    }

    var width = canvas.clientWidth || 600;
    var height = canvas.clientHeight || 240;

    var scene = new THREE.Scene();

    var camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 6);

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true
      });
    } catch (err) {
      showPoster(canvas);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    renderer.setClearColor(0x000000, 0);

    var ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambient);

    var key = new THREE.DirectionalLight(0xffffff, 0.7);
    key.position.set(3, 4, 5);
    scene.add(key);

    var rim = new THREE.DirectionalLight(CYAN, 0.5);
    rim.position.set(-4, -2, -3);
    scene.add(rim);

    var ctx = {
      scene: scene,
      camera: camera,
      renderer: renderer,
      canvas: canvas,
      width: width,
      height: height,
      time: 0,
      mouse: { x: 0, y: 0 }
    };

    var instance;
    try {
      instance = sceneFn(ctx);
    } catch (err) {
      showPoster(canvas);
      return;
    }

    var visible = false;
    var running = false;
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
      var w = canvas.clientWidth;
      var h = canvas.clientHeight;
      if (w === ctx.width && h === ctx.height) return;
      ctx.width = w;
      ctx.height = h;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }
    window.addEventListener('resize', onResize);

    var last = performance.now();
    function frame(now) {
      if (!visible) {
        running = false;
        return;
      }
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

  /* ---------- Scene presets ---------- */

  /* signal-pulse: a USA-shaped grid of points with three concentric
   * rings expanding outward from random hubs, then resetting.
   * Used on /contact/.
   */
  SCENES['signal-pulse'] = function (ctx) {
    var group = new THREE.Group();
    ctx.scene.add(group);

    // Background dot grid in a wide aspect.
    var dotGeo = new THREE.SphereGeometry(0.03, 6, 6);
    var dotMat = new THREE.MeshBasicMaterial({ color: GRAY, transparent: true, opacity: 0.35 });
    var cols = 28, rows = 12;
    for (var i = 0; i < cols; i++) {
      for (var j = 0; j < rows; j++) {
        var x = (i / (cols - 1) - 0.5) * 6;
        var y = (j / (rows - 1) - 0.5) * 2.4;
        var d = new THREE.Mesh(dotGeo, dotMat);
        d.position.set(x, y, 0);
        group.add(d);
      }
    }

    // Three pulse rings at fixed hub points.
    var hubs = [
      { x: -1.8, y: 0.3 },
      { x: 0.6, y: -0.4 },
      { x: 2.1, y: 0.6 }
    ];
    var ringMat = new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
    var rings = hubs.map(function (h, idx) {
      var g = new THREE.RingGeometry(0.1, 0.12, 32);
      var m = new THREE.Mesh(g, ringMat.clone());
      m.position.set(h.x, h.y, 0.01);
      group.add(m);
      return { mesh: m, hub: h, phase: idx * 0.6 };
    });

    return {
      update: function (dt, t) {
        rings.forEach(function (r) {
          var cycle = ((t + r.phase) % 3) / 3;
          var scale = 0.5 + cycle * 18;
          r.mesh.scale.set(scale, scale, 1);
          r.mesh.material.opacity = 0.7 * (1 - cycle);
        });
        group.rotation.y = Math.sin(t * 0.15) * 0.06;
      }
    };
  };

  /* module-spin: a slowly rotating brushed aluminum block with
   * cellular signal arcs pulsing from its top. The hero of /product/.
   */
  SCENES['module-spin'] = function (ctx) {
    var group = new THREE.Group();
    ctx.scene.add(group);

    var bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937, metalness: 0.85, roughness: 0.35
    });
    var body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 0.6), bodyMat);
    group.add(body);

    var bezelMat = new THREE.MeshStandardMaterial({
      color: 0x0a1929, metalness: 0.95, roughness: 0.2
    });
    var bezel = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.18, 0.7), bezelMat);
    bezel.position.y = 0.6;
    group.add(bezel);
    var bezelB = bezel.clone();
    bezelB.position.y = -0.6;
    group.add(bezelB);

    var ledMat = new THREE.MeshBasicMaterial({ color: CYAN });
    var led = new THREE.Mesh(new THREE.CircleGeometry(0.05, 16), ledMat);
    led.position.set(0.85, 0.32, 0.31);
    group.add(led);

    // Signal arcs above the module.
    var arcs = [];
    for (var k = 0; k < 3; k++) {
      var arcGeo = new THREE.RingGeometry(0.6 + k * 0.3, 0.62 + k * 0.3, 48, 1, Math.PI, Math.PI);
      var arcMat = new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
      var arc = new THREE.Mesh(arcGeo, arcMat);
      arc.position.set(0, 0.7, 0);
      group.add(arc);
      arcs.push({ mesh: arc, phase: k * 0.5 });
    }

    return {
      update: function (dt, t) {
        group.rotation.y = Math.sin(t * 0.35) * 0.4 + ctx.mouse.x * 0.3;
        group.rotation.x = ctx.mouse.y * 0.15;
        led.material.opacity = 0.6 + Math.sin(t * 3) * 0.4;
        arcs.forEach(function (a) {
          var c = ((t + a.phase) % 2) / 2;
          a.mesh.material.opacity = 0.7 * (1 - c);
        });
      }
    };
  };

  /* flow-timeline: eight numbered nodes connected by a glowing path.
   * The active node advances every two seconds. Tied to /how-it-works/.
   */
  SCENES['flow-timeline'] = function (ctx) {
    var group = new THREE.Group();
    ctx.scene.add(group);

    var nodes = [];
    var n = 8;
    var nodeGeo = new THREE.SphereGeometry(0.16, 16, 16);
    var nodeMatDim = new THREE.MeshStandardMaterial({ color: NAVY, metalness: 0.6, roughness: 0.4 });
    var nodeMatBright = new THREE.MeshBasicMaterial({ color: CYAN });

    for (var i = 0; i < n; i++) {
      var x = (i / (n - 1) - 0.5) * 5;
      var y = (i % 2 === 0 ? 0.25 : -0.25);
      var node = new THREE.Mesh(nodeGeo, nodeMatDim.clone());
      node.position.set(x, y, 0);
      group.add(node);
      nodes.push(node);
    }

    // Path lines between consecutive nodes.
    var lineMat = new THREE.LineBasicMaterial({ color: GRAY, transparent: true, opacity: 0.45 });
    for (var j = 0; j < n - 1; j++) {
      var pts = [nodes[j].position.clone(), nodes[j + 1].position.clone()];
      var lg = new THREE.BufferGeometry().setFromPoints(pts);
      var line = new THREE.Line(lg, lineMat);
      group.add(line);
    }

    var activeIdx = 0;
    var lastSwitch = 0;
    var brightHalo = new THREE.Mesh(
      new THREE.RingGeometry(0.22, 0.32, 32),
      new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
    );
    group.add(brightHalo);

    return {
      update: function (dt, t) {
        if (t - lastSwitch > 1.2) {
          activeIdx = (activeIdx + 1) % n;
          lastSwitch = t;
        }
        nodes.forEach(function (node, idx) {
          if (idx === activeIdx) {
            node.material = nodeMatBright;
            node.scale.setScalar(1.15);
          } else {
            node.material = nodeMatDim;
            node.scale.setScalar(1);
          }
        });
        brightHalo.position.copy(nodes[activeIdx].position);
        var pulse = 1 + Math.sin(t * 5) * 0.12;
        brightHalo.scale.set(pulse, pulse, 1);
        brightHalo.material.opacity = 0.5 + Math.sin(t * 5) * 0.2;
        group.rotation.x = ctx.mouse.y * 0.08;
        group.rotation.y = ctx.mouse.x * 0.08;
      }
    };
  };

  /* feature-grid: six floating tile cards in a 3x2 arrangement,
   * each lit with cyan rim. Slow drift. Tied to /features/.
   */
  SCENES['feature-grid'] = function (ctx) {
    var group = new THREE.Group();
    ctx.scene.add(group);

    var cols = 3, rows = 2;
    var tiles = [];
    var tileGeo = new THREE.BoxGeometry(0.9, 0.6, 0.08);
    for (var i = 0; i < cols; i++) {
      for (var j = 0; j < rows; j++) {
        var mat = new THREE.MeshStandardMaterial({
          color: 0x0f1f3a, metalness: 0.4, roughness: 0.5,
          emissive: CYAN, emissiveIntensity: 0.08
        });
        var tile = new THREE.Mesh(tileGeo, mat);
        tile.position.set(
          (i - 1) * 1.15,
          (j - 0.5) * 0.95,
          0
        );
        tile.userData.basePhase = (i * rows + j) * 0.4;
        group.add(tile);
        tiles.push(tile);

        // Cyan accent strip on each tile.
        var stripGeo = new THREE.BoxGeometry(0.7, 0.04, 0.09);
        var strip = new THREE.Mesh(stripGeo, new THREE.MeshBasicMaterial({ color: CYAN }));
        strip.position.set(tile.position.x, tile.position.y - 0.22, tile.position.z);
        group.add(strip);
      }
    }

    return {
      update: function (dt, t) {
        tiles.forEach(function (tile) {
          tile.position.z = Math.sin(t * 0.7 + tile.userData.basePhase) * 0.15;
          tile.rotation.y = Math.sin(t * 0.5 + tile.userData.basePhase) * 0.12;
        });
        group.rotation.y = ctx.mouse.x * 0.18;
        group.rotation.x = ctx.mouse.y * 0.1;
      }
    };
  };

  /* vertical-tiles: four illuminated industry tiles standing on edge.
   * Used on /solutions/.
   */
  SCENES['vertical-tiles'] = function (ctx) {
    var group = new THREE.Group();
    ctx.scene.add(group);

    var labels = ['DEALER', 'RENTAL', 'FLEET', 'LOGIST'];
    var tiles = [];
    var n = 4;
    for (var i = 0; i < n; i++) {
      var mat = new THREE.MeshStandardMaterial({
        color: 0x102542, metalness: 0.55, roughness: 0.4,
        emissive: CYAN, emissiveIntensity: 0.15
      });
      var tile = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.5, 0.12), mat);
      tile.position.x = (i - (n - 1) / 2) * 1.25;
      tile.position.y = 0;
      tile.userData.phase = i * 0.5;
      group.add(tile);
      tiles.push(tile);

      var topGeo = new THREE.BoxGeometry(0.95, 0.06, 0.14);
      var top = new THREE.Mesh(topGeo, new THREE.MeshBasicMaterial({ color: CYAN }));
      top.position.set(tile.position.x, 0.78, 0);
      group.add(top);
    }

    return {
      update: function (dt, t) {
        tiles.forEach(function (tile, idx) {
          tile.position.y = Math.sin(t * 0.8 + tile.userData.phase) * 0.08;
          tile.material.emissiveIntensity =
            0.1 + Math.max(0, Math.sin(t * 1.2 + idx * Math.PI / 2)) * 0.3;
        });
        group.rotation.y = Math.sin(t * 0.2) * 0.15 + ctx.mouse.x * 0.2;
      }
    };
  };

  /* lot-grid: a top-down dealership lot with parked rectangles. A few
   * glow cyan to indicate DOVA-active. Used on /solutions/dealerships/.
   */
  SCENES['lot-grid'] = function (ctx) {
    var group = new THREE.Group();
    group.rotation.x = -0.9; // tilt to top-down
    ctx.scene.add(group);

    var rows = 4, cols = 9;
    var active = { '0,2': 1, '1,5': 1, '2,1': 1, '2,7': 1, '3,4': 1 };
    var slots = [];
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var isActive = active[r + ',' + c];
        var mat = new THREE.MeshStandardMaterial({
          color: isActive ? 0x0a1929 : 0x1a2638,
          metalness: 0.6, roughness: 0.45,
          emissive: isActive ? CYAN : 0x000000,
          emissiveIntensity: isActive ? 0.5 : 0
        });
        var car = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.18, 0.85), mat);
        car.position.set(
          (c - (cols - 1) / 2) * 0.6,
          0,
          (r - (rows - 1) / 2) * 1.0
        );
        car.userData.active = !!isActive;
        car.userData.phase = (r * cols + c) * 0.3;
        group.add(car);
        slots.push(car);
      }
    }

    // Lot floor.
    var floorMat = new THREE.MeshStandardMaterial({
      color: 0x050c18, metalness: 0.1, roughness: 0.9
    });
    var floor = new THREE.Mesh(new THREE.PlaneGeometry(7, 5), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.12;
    group.add(floor);

    return {
      update: function (dt, t) {
        slots.forEach(function (car) {
          if (car.userData.active) {
            car.material.emissiveIntensity =
              0.4 + Math.sin(t * 2 + car.userData.phase) * 0.25;
          }
        });
        group.rotation.z = Math.sin(t * 0.18) * 0.1 + ctx.mouse.x * 0.15;
      }
    };
  };

  /* fleet-truck: a stylized commercial truck silhouette with a
   * glowing module icon on the dashboard. Used on /solutions/fleet/.
   */
  SCENES['fleet-truck'] = function (ctx) {
    var group = new THREE.Group();
    ctx.scene.add(group);

    var bodyMat = new THREE.MeshStandardMaterial({
      color: 0x10243f, metalness: 0.6, roughness: 0.4
    });
    var trailer = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.0, 1.1), bodyMat);
    trailer.position.set(0.4, 0.1, 0);
    group.add(trailer);

    var cab = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.3, 1.0), bodyMat);
    cab.position.set(-1.55, 0.25, 0);
    group.add(cab);

    var wheelMat = new THREE.MeshStandardMaterial({
      color: 0x0a1018, metalness: 0.3, roughness: 0.7
    });
    var wheelGeo = new THREE.CylinderGeometry(0.27, 0.27, 0.2, 18);
    [-1.8, -0.4, 0.9, 1.8].forEach(function (x) {
      var wL = new THREE.Mesh(wheelGeo, wheelMat);
      wL.rotation.z = Math.PI / 2;
      wL.position.set(x, -0.42, 0.55);
      group.add(wL);
      var wR = wL.clone();
      wR.position.z = -0.55;
      group.add(wR);
    });

    // Glowing module icon on the cab.
    var icon = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.22, 0.06),
      new THREE.MeshBasicMaterial({ color: CYAN })
    );
    icon.position.set(-1.55, 0.5, 0.52);
    group.add(icon);

    group.position.y = -0.1;

    return {
      update: function (dt, t) {
        group.rotation.y = -0.35 + Math.sin(t * 0.25) * 0.12 + ctx.mouse.x * 0.25;
        group.rotation.x = ctx.mouse.y * 0.05;
        icon.material.opacity = 0.7 + Math.sin(t * 3.5) * 0.3;
      }
    };
  };

  /* logbook: a stack of paper sheets with green checkmark stamps
   * appearing one by one. Used on /post-sale/.
   */
  SCENES['logbook'] = function (ctx) {
    var group = new THREE.Group();
    group.rotation.x = -0.4;
    group.rotation.y = 0.3;
    ctx.scene.add(group);

    var sheetMat = new THREE.MeshStandardMaterial({
      color: 0xf3f5f8, metalness: 0.05, roughness: 0.7
    });
    var checks = [];
    var n = 5;
    for (var i = 0; i < n; i++) {
      var sheet = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.04, 1.6), sheetMat);
      sheet.position.y = i * 0.07 - 0.1;
      sheet.position.x = (i - n / 2) * 0.05;
      group.add(sheet);

      var ringGeo = new THREE.TorusGeometry(0.22, 0.04, 8, 24);
      var ringMat = new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0 });
      var ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(sheet.position.x + 0.7, sheet.position.y + 0.05, 0.3);
      group.add(ring);
      checks.push({ ring: ring, phase: i * 0.8 });
    }

    return {
      update: function (dt, t) {
        checks.forEach(function (c) {
          var cycle = ((t + c.phase) % 4) / 4;
          c.ring.material.opacity = cycle < 0.3 ? cycle / 0.3 : Math.max(0, 1 - (cycle - 0.3) / 0.7);
          c.ring.scale.setScalar(1 + (1 - c.ring.material.opacity) * 0.3);
        });
        group.rotation.y = 0.3 + Math.sin(t * 0.2) * 0.1 + ctx.mouse.x * 0.15;
      }
    };
  };

  /* calculator-ring: a ring of currency-mark plates orbiting a cyan
   * core, with one plate brightening at a time. Used on /roi/.
   */
  SCENES['calculator-ring'] = function (ctx) {
    var group = new THREE.Group();
    ctx.scene.add(group);

    var core = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 24, 24),
      new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.85 })
    );
    group.add(core);

    var coreHalo = new THREE.Mesh(
      new THREE.RingGeometry(0.5, 0.55, 32),
      new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
    );
    group.add(coreHalo);

    var plates = [];
    var n = 8;
    for (var i = 0; i < n; i++) {
      var ang = (i / n) * Math.PI * 2;
      var mat = new THREE.MeshStandardMaterial({
        color: 0x102542, metalness: 0.6, roughness: 0.35,
        emissive: 0x000000
      });
      var plate = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.06), mat);
      plate.userData.ang = ang;
      group.add(plate);
      plates.push(plate);
    }

    var activeIdx = 0;
    var lastSwitch = 0;

    return {
      update: function (dt, t) {
        var radius = 1.8;
        plates.forEach(function (plate) {
          var a = plate.userData.ang + t * 0.4;
          plate.position.set(Math.cos(a) * radius, Math.sin(a) * radius * 0.6, 0);
          plate.lookAt(0, 0, 0);
        });
        if (t - lastSwitch > 0.6) {
          plates[activeIdx].material.emissive.setHex(0x000000);
          activeIdx = (activeIdx + 1) % n;
          plates[activeIdx].material.emissive.setHex(CYAN);
          lastSwitch = t;
        }
        core.material.opacity = 0.7 + Math.sin(t * 2) * 0.15;
        coreHalo.scale.setScalar(1 + Math.sin(t * 2) * 0.1);
        group.rotation.x = ctx.mouse.y * 0.1;
      }
    };
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
