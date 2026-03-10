import { useState, useEffect, useRef } from "react";
import * as THREE from "three";

/* ── Planet Data ─── compressed distances so ALL planets fit on screen ── */
const PLANETS = [
  {
    id: "mercury", name: "Mercury", r: 0.22, dist: 2.8, speed: 0.047, tilt: 0.03,
    color: "#9C8878", diameter: "4,879 km", distReal: "57.9M km", moons: 0, temp: "430°C / -180°C", period: "88 days",
    fact: "A year on Mercury lasts just 88 Earth days — shorter than its day.", atmo: "Trace He, Na, O₂"
  },
  {
    id: "venus", name: "Venus", r: 0.52, dist: 4.2, speed: 0.035, tilt: 177,
    color: "#E8C058", diameter: "12,104 km", distReal: "108.2M km", moons: 0, temp: "465°C", period: "225 days",
    fact: "Venus spins backwards. The Sun rises in the west and sets in the east.", atmo: "CO₂ 96%, N₂ 3.5%"
  },
  {
    id: "earth", name: "Earth", r: 0.56, dist: 5.8, speed: 0.025, tilt: 23.4,
    color: "#2B6CB8", diameter: "12,742 km", distReal: "149.6M km", moons: 1, temp: "15°C avg", period: "365.25 days",
    fact: "Earth is the only known planet in the universe that harbors life.", atmo: "N₂ 78%, O₂ 21%"
  },
  {
    id: "mars", name: "Mars", r: 0.35, dist: 7.5, speed: 0.020, tilt: 25.2,
    color: "#C1440E", diameter: "6,779 km", distReal: "227.9M km", moons: 2, temp: "-65°C avg", period: "687 days",
    fact: "Olympus Mons on Mars is the tallest volcano in the solar system at 21km.", atmo: "CO₂ 95%, N₂ 3%"
  },
  {
    id: "jupiter", name: "Jupiter", r: 1.25, dist: 11.2, speed: 0.013, tilt: 3.1,
    color: "#C88B3A", diameter: "139,820 km", distReal: "778.5M km", moons: 95, temp: "-110°C", period: "12 yrs",
    fact: "Jupiter's Great Red Spot is a storm larger than Earth, raging for 350+ years.", atmo: "H₂ 89%, He 10%"
  },
  {
    id: "saturn", name: "Saturn", r: 1.05, dist: 14.8, speed: 0.009, tilt: 26.7,
    color: "#E8C86A", diameter: "116,460 km", distReal: "1.43B km", moons: 146, temp: "-140°C", period: "29 yrs",
    fact: "Saturn's rings span 282,000 km but are only about 10 metres thick.", atmo: "H₂ 96%, He 3%"
  },
  {
    id: "uranus", name: "Uranus", r: 0.72, dist: 18.2, speed: 0.007, tilt: 97.8,
    color: "#7DE8E0", diameter: "50,724 km", distReal: "2.87B km", moons: 28, temp: "-195°C", period: "84 yrs",
    fact: "Uranus rotates on its side — its poles point almost directly at the Sun.", atmo: "H₂ 83%, He 15%, CH₄ 2%"
  },
  {
    id: "neptune", name: "Neptune", r: 0.68, dist: 22.0, speed: 0.005, tilt: 28.3,
    color: "#3F56E8", diameter: "49,244 km", distReal: "4.5B km", moons: 16, temp: "-200°C", period: "165 yrs",
    fact: "Neptune has the fastest winds in the solar system — up to 2,100 km/h.", atmo: "H₂ 80%, He 19%, CH₄ 1%"
  },
];

/* ── Procedural Canvas Textures ──────────────────────────── */
function makeTex(id) {
  const W = 512, H = 256;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const c = cv.getContext("2d");

  const rng = (a, b) => a + Math.random() * (b - a);

  if (id === "mercury") {
    c.fillStyle = "#7a6e62"; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) {
      const x = rng(0, W), y = rng(0, H), r = rng(4, 22);
      c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2);
      c.fillStyle = `rgba(${rng(60, 110)},${rng(55, 100)},${rng(50, 90)},${rng(.3, .7)})`; c.fill();
      c.beginPath(); c.arc(x - r * .3, y - r * .3, r * .7, 0, Math.PI * 2);
      c.fillStyle = `rgba(140,130,118,0.3)`; c.fill();
    }
  }
  else if (id === "venus") {
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#d4a830"); g.addColorStop(.4, "#e8c855"); g.addColorStop(.7, "#f0d070"); g.addColorStop(1, "#d0a025");
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 14; i++) {
      const y = rng(0, H), th = rng(6, 22);
      c.beginPath(); c.moveTo(0, y);
      for (let x = 0; x < W; x += 30) c.lineTo(x, y + Math.sin(x * .04 + i) * 18);
      c.strokeStyle = `rgba(255,240,160,${rng(.15, .35)})`; c.lineWidth = th; c.stroke();
    }
  }
  else if (id === "earth") {
    c.fillStyle = "#1a5fa0"; c.fillRect(0, 0, W, H);
    // continents
    const land = (x, y, w, h, br = 8) => {
      c.beginPath(); c.roundRect(x, y, w, h, br);
      c.fillStyle = "#2d7030"; c.fill();
      c.beginPath(); c.roundRect(x + 2, y + 2, w - 4, h - 4, br);
      c.fillStyle = "#3a8038"; c.fill();
    };
    land(50, 45, 75, 85); land(90, 140, 48, 75); land(52, 50, 70, 78);
    land(222, 35, 50, 150); land(264, 28, 138, 108); land(335, 145, 65, 52);
    land(222, 38, 48, 145, 6); // africa
    land(268, 32, 132, 102, 4); // asia
    // polar
    c.fillStyle = "rgba(220,235,255,0.85)";
    c.beginPath(); c.ellipse(256, 8, 200, 24, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(256, 248, 160, 18, 0, 0, Math.PI * 2); c.fill();
    // clouds
    for (let i = 0; i < 20; i++) {
      c.beginPath(); c.ellipse(rng(0, W), rng(0, H), rng(25, 65), rng(10, 25), rng(0, Math.PI), 0, Math.PI * 2);
      c.fillStyle = `rgba(255,255,255,${rng(.12, .25)})`; c.fill();
    }
  }
  else if (id === "mars") {
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#bb3e15"); g.addColorStop(.5, "#d05025"); g.addColorStop(1, "#a83010");
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 15; i++) {
      c.beginPath(); c.ellipse(rng(0, W), rng(30, 220), rng(20, 80), rng(10, 40), rng(0, Math.PI), 0, Math.PI * 2);
      c.fillStyle = `rgba(80,28,8,${rng(.15, .35)})`; c.fill();
    }
    // polar caps
    c.beginPath(); c.ellipse(256, 10, 180, 26, 0, 0, Math.PI * 2);
    c.fillStyle = "rgba(245,240,235,0.9)"; c.fill();
    c.beginPath(); c.ellipse(256, 246, 110, 18, 0, 0, Math.PI * 2);
    c.fillStyle = "rgba(235,230,228,0.75)"; c.fill();
    // Valles Marineris hint
    c.beginPath(); c.moveTo(140, 128); c.lineTo(320, 118);
    c.strokeStyle = "rgba(80,20,5,0.35)"; c.lineWidth = 18; c.stroke();
  }
  else if (id === "jupiter") {
    // Base
    c.fillStyle = "#c8944a"; c.fillRect(0, 0, W, H);
    // Bands
    const bands = [
      [0, 18, "#b8782a"], [18, 16, "#e0c880"], [34, 22, "#a86020"],
      [56, 14, "#ddc070"], [70, 28, "#b87030"], [98, 18, "#e8d090"],
      [116, 26, "#c07835"], [142, 14, "#ddc878"], [156, 24, "#a86828"],
      [180, 16, "#e0cc80"], [196, 20, "#b87530"], [216, 18, "#d8c070"],
      [234, 22, "#c08040"],
    ];
    bands.forEach(([y, h, col]) => { c.fillStyle = col; c.fillRect(0, y, W, h); });
    // Band texture / turbulence
    for (let i = 0; i < 60; i++) {
      c.beginPath(); c.ellipse(rng(0, W), rng(0, H), rng(10, 35), rng(5, 12), 0, 0, Math.PI * 2);
      c.fillStyle = `rgba(${rng(100, 180)},${rng(80, 140)},${rng(20, 60)},0.12)`; c.fill();
    }
    // Great Red Spot
    c.beginPath(); c.ellipse(175, 155, 42, 26, 0, 0, Math.PI * 2);
    c.fillStyle = "#c03515"; c.fill();
    c.beginPath(); c.ellipse(175, 155, 34, 20, 0, 0, Math.PI * 2);
    c.fillStyle = "#d94428"; c.fill();
    c.beginPath(); c.ellipse(172, 153, 22, 13, -.1, 0, Math.PI * 2);
    c.fillStyle = "#e05535"; c.fill();
  }
  else if (id === "saturn") {
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#b89040"); g.addColorStop(.2, "#e8d070");
    g.addColorStop(.5, "#d4b855"); g.addColorStop(.8, "#e0c860"); g.addColorStop(1, "#c0a040");
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 10; i++) {
      const y = i * 26;
      c.fillStyle = `rgba(${i % 2 ? 180 : 140},${i % 2 ? 150 : 120},${i % 2 ? 50 : 35},0.12)`;
      c.fillRect(0, y, W, 13);
    }
  }
  else if (id === "uranus") {
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#5dd8d0"); g.addColorStop(.45, "#7de8e0");
    g.addColorStop(.7, "#68ddd5"); g.addColorStop(1, "#55ccc4");
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 5; i++) {
      c.fillStyle = `rgba(100,220,210,0.12)`; c.fillRect(0, i * 52, W, 22);
    }
  }
  else if (id === "neptune") {
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#1830a8"); g.addColorStop(.4, "#2848d8");
    g.addColorStop(.7, "#2040c0"); g.addColorStop(1, "#101888");
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // Dark storm
    c.beginPath(); c.ellipse(195, 115, 28, 20, 0, 0, Math.PI * 2);
    c.fillStyle = "rgba(15,20,120,0.55)"; c.fill();
    // White clouds
    c.beginPath(); c.ellipse(330, 78, 38, 14, 0.4, 0, Math.PI * 2);
    c.fillStyle = "rgba(180,200,255,0.45)"; c.fill();
    c.beginPath(); c.ellipse(100, 165, 28, 11, -0.3, 0, Math.PI * 2);
    c.fillStyle = "rgba(160,190,255,0.38)"; c.fill();
  }

  return new THREE.CanvasTexture(cv);
}

/* ── Sun surface texture ─────────────────────────────────── */
function makeSunTex() {
  const W = 512, H = 256;
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const c = cv.getContext("2d");
  c.fillStyle = "#ff9900"; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * W, y = Math.random() * H, r = 2 + Math.random() * 18;
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2);
    const bright = Math.random() > .5;
    c.fillStyle = bright ? `rgba(255,220,80,0.4)` : `rgba(200,80,0,0.3)`; c.fill();
  }
  return new THREE.CanvasTexture(cv);
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function SolarSystem() {
  const mountRef = useRef(null);
  const threeRef = useRef({});
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [speed, setSpeed] = useState(1);
  const [showLabels, setShowLabels] = useState(true);
  const speedRef = useRef(1);
  const labelMeshesRef = useRef([]);

  useEffect(() => { speedRef.current = speed; }, [speed]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const W = el.clientWidth, H = el.clientHeight;

    /* ── Renderer ─────────────────────────────────────── */
    const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setClearColor(0x010208, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);

    /* ── Scene / Camera ───────────────────────────────── */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, W / H, 0.01, 2000);
    // Position camera so all 8 planets (max dist 22) fit on screen
    camera.position.set(0, 30, 50);
    camera.lookAt(0, 0, 0);

    /* ── Lights ───────────────────────────────────────── */
    // Sun point light — bright warm light, no distance limit
    const sunLight = new THREE.PointLight(0xfff5e0, 6.0, 0, 1.2);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);
    // Secondary sun fill — wide reach so outer planets are well-lit
    const sunFill = new THREE.PointLight(0xffe8c0, 2.5, 0, 0.8);
    sunFill.position.set(0, 0, 0);
    scene.add(sunFill);
    // Hemisphere light — warm from above, cool from below
    const hemiLight = new THREE.HemisphereLight(0x445588, 0x112233, 1.0);
    scene.add(hemiLight);
    // Ambient so shadowed sides stay visible
    scene.add(new THREE.AmbientLight(0x334466, 0.6));

    /* ── Stars ─────────────────────────────────────────── */
    for (let layer = 0; layer < 3; layer++) {
      const count = [6000, 2500, 600][layer];
      const spread = [800, 400, 200][layer];
      const geo = new THREE.BufferGeometry();
      const verts = [];
      for (let i = 0; i < count; i++) {
        verts.push(
          (Math.random() - .5) * spread,
          (Math.random() - .5) * spread,
          (Math.random() - .5) * spread
        );
      }
      geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
      scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
        color: [0xaaccff, 0xffffff, 0xfff0dd][layer],
        size: [.12, .22, .4][layer],
        transparent: true,
        opacity: [.5, .7, .95][layer],
        sizeAttenuation: true,
      })));
    }

    /* ── Sun ───────────────────────────────────────────── */
    const sunGroup = new THREE.Group();
    scene.add(sunGroup);
    // Core
    const sunCore = new THREE.Mesh(
      new THREE.SphereGeometry(1.8, 40, 40),
      new THREE.MeshBasicMaterial({ map: makeSunTex(), color: 0xffdd44 })
    );
    sunGroup.add(sunCore);
    // Glow layers
    const glowLayers = [
      [2.15, 0xffcc00, .30], [2.65, 0xff9900, .16],
      [3.30, 0xff5500, .09], [4.50, 0xff2200, .04],
    ];
    glowLayers.forEach(([r, col, op]) => {
      sunGroup.add(new THREE.Mesh(
        new THREE.SphereGeometry(r, 32, 32),
        new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, side: THREE.FrontSide })
      ));
    });

    /* ── Asteroid Belt ─────────────────────────────────── */
    const beltGeo = new THREE.BufferGeometry();
    const bv = [];
    for (let i = 0; i < 1200; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 9.0 + (Math.random() - .5) * 1.6;
      bv.push(Math.cos(a) * r, (Math.random() - .5) * .4, Math.sin(a) * r);
    }
    beltGeo.setAttribute("position", new THREE.Float32BufferAttribute(bv, 3));
    scene.add(new THREE.Points(beltGeo, new THREE.PointsMaterial({
      color: 0x887766, size: .06, transparent: true, opacity: .65, sizeAttenuation: true
    })));

    /* ── Build Planets ─────────────────────────────────── */
    const planetMeshes = [];
    const pivots = [];
    const labelMeshes = [];

    PLANETS.forEach((p, idx) => {
      // Orbit ring
      const orbitPts = [];
      for (let i = 0; i <= 128; i++) {
        const a = (i / 128) * Math.PI * 2;
        orbitPts.push(Math.cos(a) * p.dist, 0, Math.sin(a) * p.dist);
      }
      const orbitGeo = new THREE.BufferGeometry();
      orbitGeo.setAttribute("position", new THREE.Float32BufferAttribute(orbitPts, 3));
      scene.add(new THREE.Line(orbitGeo, new THREE.LineBasicMaterial({
        color: new THREE.Color(p.color).multiplyScalar(.45),
        transparent: true, opacity: .5
      })));

      // Planet mesh — MeshStandardMaterial for PBR lighting with specular
      const tex = makeTex(p.id);
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const roughnessMap = { mercury: .95, venus: .7, earth: .65, mars: .9, jupiter: .55, saturn: .5, uranus: .35, neptune: .4 };
      const metalnessMap = { mercury: .05, venus: .0, earth: .08, mars: .02, jupiter: .0, saturn: .0, uranus: .12, neptune: .1 };
      const mat = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: roughnessMap[p.id] ?? 0.7,
        metalness: metalnessMap[p.id] ?? 0.0,
      });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(p.r, 40, 40), mat);
      mesh.userData = { idx, name: p.name };
      mesh.rotation.z = (p.tilt * Math.PI) / 180;

      // Atmosphere haze for Earth + Venus
      if (p.id === "earth") {
        const atmoMesh = new THREE.Mesh(
          new THREE.SphereGeometry(p.r * 1.06, 32, 32),
          new THREE.MeshBasicMaterial({ color: 0x4488ff, transparent: true, opacity: .14, side: THREE.FrontSide })
        );
        mesh.add(atmoMesh);
        // Cloud layer
        const cloudMesh = new THREE.Mesh(
          new THREE.SphereGeometry(p.r * 1.022, 32, 32),
          new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .12 })
        );
        mesh.add(cloudMesh);
        mesh.userData.cloudMesh = cloudMesh;
      }
      if (p.id === "venus") {
        mesh.add(new THREE.Mesh(
          new THREE.SphereGeometry(p.r * 1.08, 32, 32),
          new THREE.MeshBasicMaterial({ color: 0xeecc44, transparent: true, opacity: .18 })
        ));
      }

      // Saturn rings — lit by the sun for realism
      if (p.id === "saturn") {
        const ringSpecs = [
          [p.r * 1.25, p.r * 1.70, 0xd4b060, .55],
          [p.r * 1.72, p.r * 2.20, 0xe8d080, .75],
          [p.r * 2.22, p.r * 2.55, 0xc8a840, .45],
          [p.r * 2.58, p.r * 2.70, 0xaa8830, .22],
        ];
        ringSpecs.forEach(([inner, outer, col, op]) => {
          const rMesh = new THREE.Mesh(
            new THREE.RingGeometry(inner, outer, 80),
            new THREE.MeshStandardMaterial({
              color: col, side: THREE.DoubleSide,
              transparent: true, opacity: op,
              roughness: 0.8, metalness: 0.1,
            })
          );
          rMesh.rotation.x = Math.PI / 2;
          mesh.add(rMesh);
        });
      }

      // Uranus thin rings (pole-on)
      if (p.id === "uranus") {
        [p.r * 1.4, p.r * 1.6].forEach(r => {
          const rm = new THREE.Mesh(
            new THREE.RingGeometry(r, r + .025, 64),
            new THREE.MeshBasicMaterial({ color: 0x88cccc, side: THREE.DoubleSide, transparent: true, opacity: .35 })
          );
          rm.rotation.x = Math.PI / 2;
          rm.rotation.z = Math.PI * .06;
          mesh.add(rm);
        });
      }

      // Earth's Moon
      if (p.id === "earth") {
        const moon = new THREE.Mesh(
          new THREE.SphereGeometry(.14, 20, 20),
          new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.9, metalness: 0.0 })
        );
        moon.position.set(p.r + .55, 0, 0);
        mesh.add(moon);
        mesh.userData.moon = moon;
      }

      // Hover glow halo
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(p.r * 1.38, 20, 20),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(p.color), transparent: true, opacity: 0 })
      );
      mesh.add(halo);
      mesh.userData.halo = halo;

      // Pivot for orbit
      const pivot = new THREE.Group();
      pivot.rotation.y = Math.random() * Math.PI * 2;
      mesh.position.set(p.dist, 0, 0);
      pivot.add(mesh);
      scene.add(pivot);
      planetMeshes.push(mesh);
      pivots.push({ pivot, p, mesh });

      // 2D label (canvas sprite)
      const lc = document.createElement("canvas"); lc.width = 256; lc.height = 64;
      const lctx = lc.getContext("2d");
      lctx.font = "bold 28px 'Rajdhani', Arial"; lctx.textAlign = "center";
      lctx.fillStyle = "rgba(0,0,0,0)"; lctx.fillRect(0, 0, 256, 64);
      lctx.strokeStyle = "rgba(0,0,0,0.6)"; lctx.lineWidth = 5;
      lctx.strokeText(p.name, 128, 40);
      lctx.fillStyle = "#ccddff"; lctx.fillText(p.name, 128, 40);
      const lTex = new THREE.CanvasTexture(lc);
      const lMesh = new THREE.Sprite(new THREE.SpriteMaterial({ map: lTex, transparent: true, depthTest: false }));
      lMesh.scale.set(2.5, .65, 1);
      lMesh.position.set(0, p.r * 1.7 + .6, 0);
      mesh.add(lMesh);
      labelMeshes.push(lMesh);
    });

    labelMeshesRef.current = labelMeshes;

    /* ── Camera Controls ───────────────────────────────── */
    const cam = { rotY: 0, rotX: .52, zoom: 55 };
    const target = { rotY: 0, rotX: .52, zoom: 55 };
    const drag = { active: false, prevX: 0, prevY: 0 };

    const updateCamera = () => {
      camera.position.x = Math.sin(cam.rotY) * Math.cos(cam.rotX) * cam.zoom;
      camera.position.y = Math.sin(cam.rotX) * cam.zoom;
      camera.position.z = Math.cos(cam.rotY) * Math.cos(cam.rotX) * cam.zoom;
      camera.lookAt(0, 0, 0);
    };
    updateCamera();

    const onDown = e => { drag.active = true; drag.prevX = e.clientX; drag.prevY = e.clientY; renderer.domElement.style.cursor = "grabbing"; };
    const onUp = () => { drag.active = false; renderer.domElement.style.cursor = "grab"; };
    const onMove = e => {
      if (drag.active) {
        target.rotY += (e.clientX - drag.prevX) * .005;
        target.rotX = Math.max(-.5, Math.min(.85, target.rotX + (e.clientY - drag.prevY) * .003));
        drag.prevX = e.clientX; drag.prevY = e.clientY;
      }
      // Hover detection
      const rect = renderer.domElement.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const my = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2(mx, my), camera);
      const hits = ray.intersectObjects(planetMeshes, false);
      planetMeshes.forEach(m => { if (m.userData.halo) m.userData.halo.material.opacity = 0; });
      if (hits.length) {
        const h = hits[0].object;
        if (h.userData.halo) h.userData.halo.material.opacity = .18;
        renderer.domElement.style.cursor = drag.active ? "grabbing" : "pointer";
        threeRef.current.hoveredIdx = h.userData.idx;
      } else {
        threeRef.current.hoveredIdx = null;
        if (!drag.active) renderer.domElement.style.cursor = "grab";
      }
    };
    const onClick = e => {
      const rect = renderer.domElement.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const my = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2(mx, my), camera);
      const hits = ray.intersectObjects(planetMeshes, false);
      if (hits.length) {
        const idx = hits[0].object.userData.idx;
        setSelected(s => s?.id === PLANETS[idx].id ? null : PLANETS[idx]);
        // Fly to planet
        const p = PLANETS[idx];
        const wp = new THREE.Vector3(); hits[0].object.getWorldPosition(wp);
        const angle = Math.atan2(wp.z, wp.x);
        target.rotY = -angle;
        target.rotX = .22;
        target.zoom = p.dist + p.r * 5 + 6;
      } else {
        setSelected(null);
      }
    };
    const onWheel = e => {
      target.zoom = Math.max(6, Math.min(90, target.zoom + e.deltaY * .04));
    };
    renderer.domElement.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    renderer.domElement.addEventListener("mousemove", onMove);
    renderer.domElement.addEventListener("click", onClick);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: true });
    renderer.domElement.style.cursor = "grab";

    /* ── Animation Loop ────────────────────────────────── */
    let frameId;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const s = speedRef.current;

      // Smooth camera
      cam.rotY += (target.rotY - cam.rotY) * .07;
      cam.rotX += (target.rotX - cam.rotX) * .07;
      cam.zoom += (target.zoom - cam.zoom) * .07;
      updateCamera();

      // Orbit planets
      pivots.forEach(({ pivot, p, mesh }) => {
        pivot.rotation.y += p.speed * s * dt * 8;
        mesh.rotation.y += .006 * s;
        // Moon orbit
        if (mesh.userData.moon) {
          const t = Date.now() * .001;
          mesh.userData.moon.position.set(
            (p.r + .55) * Math.cos(t * 1.2 * s),
            0,
            (p.r + .55) * Math.sin(t * 1.2 * s)
          );
        }
        // Cloud rotation
        if (mesh.userData.cloudMesh) {
          mesh.userData.cloudMesh.rotation.y += .002 * s;
        }
      });

      // Sun pulse
      sunCore.rotation.y += .003 * s;
      const pulse = 1 + Math.sin(Date.now() * .001) * .012;
      sunCore.scale.setScalar(pulse);

      renderer.render(scene, camera);
    };
    animate();

    threeRef.current = { renderer, scene, camera, planetMeshes, pivots, cam, target };

    /* ── Resize ────────────────────────────────────────── */
    const onResize = () => {
      const W2 = el.clientWidth, H2 = el.clientHeight;
      renderer.setSize(W2, H2);
      camera.aspect = W2 / H2;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frameId);
      renderer.domElement.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      renderer.domElement.removeEventListener("mousemove", onMove);
      renderer.domElement.removeEventListener("click", onClick);
      renderer.domElement.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  // Toggle labels
  useEffect(() => {
    labelMeshesRef.current.forEach(l => { l.visible = showLabels; });
  }, [showLabels]);

  // Fly to planet from nav
  const flyTo = (idx) => {
    const p = PLANETS[idx];
    setSelected(s => s?.id === p.id ? null : p);
    const { target } = threeRef.current;
    if (!target) return;
    target.zoom = p.dist + p.r * 5 + 6;
    target.rotX = .22;
  };

  const resetView = () => {
    const { target } = threeRef.current;
    if (!target) return;
    target.rotY = 0; target.rotX = .52; target.zoom = 55;
    setSelected(null);
  };

  /* ── Styles ───────────────────────────────────────────── */
  const S = {
    glass: {
      background: "rgba(5,10,22,0.82)",
      backdropFilter: "blur(16px) saturate(160%)",
      border: "1px solid rgba(80,140,220,0.18)",
      borderRadius: 16,
    },
    cyTxt: { color: "#00d4ff", fontFamily: "'Orbitron','Rajdhani',sans-serif" },
    muted: { color: "#4a6888", fontFamily: "'Rajdhani','DM Sans',sans-serif" },
    txt: { color: "#b8d4f0", fontFamily: "'Rajdhani','DM Sans',sans-serif" },
  };

  const sel = selected;

  return (
    <div style={{ width: "100%", height: "100%", background: "#010208", position: "relative", overflow: "hidden", fontFamily: "'Rajdhani','DM Sans',sans-serif" }}>
      {/* ── Three.js Canvas ── */}
      <div ref={mountRef} style={{ position: "absolute", inset: 0 }} />

      {/* ── Top HUD ── */}
      <div style={{ position: "absolute", top: 16, left: 16, right: 16, display: "flex", alignItems: "center", gap: 12, pointerEvents: "none" }}>
        {/* Logo */}
        <div style={{ ...S.glass, padding: "10px 18px", display: "flex", alignItems: "center", gap: 10, pointerEvents: "auto" }}>
          <div style={{ fontSize: 22 }}>🪐</div>
          <div>
            <div style={{ ...S.cyTxt, fontSize: 15, fontWeight: 700, letterSpacing: 3 }}>SOLAR SYSTEM</div>
            <div style={{ ...S.muted, fontSize: 9, letterSpacing: 2 }}>EXPLORER v3.0</div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Controls */}
        <div style={{ ...S.glass, padding: "10px 18px", display: "flex", alignItems: "center", gap: 16, pointerEvents: "auto" }}>
          {/* Speed */}
          <span style={{ ...S.muted, fontSize: 11, letterSpacing: 1 }}>SPEED</span>
          <input type="range" min={0} max={100} value={Math.round((speed - 0.1) / 19.9 * 100)}
            onChange={e => setSpeed(0.1 + (e.target.value / 100) * 19.9)}
            style={{ width: 100, accentColor: "#00d4ff", cursor: "pointer" }} />
          <span style={{ ...S.cyTxt, fontSize: 13, fontWeight: 700, minWidth: 42 }}>{speed.toFixed(1)}×</span>
          {/* Labels toggle */}
          <button onClick={() => setShowLabels(l => !l)} style={{
            ...S.glass, border: `1px solid ${showLabels ? "rgba(0,212,255,0.4)" : "rgba(80,100,140,0.3)"}`,
            color: showLabels ? "#00d4ff" : "#4a6888", padding: "4px 12px", fontSize: 12,
            cursor: "pointer", background: "transparent", fontFamily: "'Rajdhani',sans-serif", fontWeight: 600,
          }}>Aa</button>
          {/* Reset */}
          <button onClick={resetView} style={{
            ...S.glass, border: "1px solid rgba(80,100,140,0.3)",
            color: "#4a6888", padding: "4px 12px", fontSize: 12,
            cursor: "pointer", background: "transparent", fontFamily: "'Rajdhani',sans-serif", fontWeight: 600,
          }}>↩</button>
        </div>
      </div>

      {/* ── Planet Info Panel ── */}
      <div style={{
        position: "absolute", right: sel ? 16 : -380, top: 80, bottom: 80,
        width: 340, ...S.glass, padding: 24,
        transition: "right .38s cubic-bezier(.22,1,.36,1)",
        overflowY: "auto", display: "flex", flexDirection: "column", gap: 16,
      }}>
        {sel && <>
          {/* Planet preview */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: `radial-gradient(circle at 35% 32%, ${sel.color}ff, ${sel.color}66 55%, ${sel.color}11)`,
              boxShadow: `0 0 32px ${sel.color}44, 0 0 64px ${sel.color}22`,
              flexShrink: 0, border: `1px solid ${sel.color}44`,
            }} />
            <div>
              <div style={{ color: "#eef4ff", fontSize: 24, fontWeight: 800, letterSpacing: 1, fontFamily: "'Orbitron','Rajdhani',sans-serif" }}>{sel.name}</div>
              <div style={{ ...S.muted, fontSize: 11, marginTop: 2, letterSpacing: .5 }}>{sel.atmo}</div>
            </div>
            <button onClick={() => setSelected(null)} style={{ marginLeft: "auto", background: "none", border: "none", color: "#4a6888", cursor: "pointer", fontSize: 20, lineHeight: 1 }}>✕</button>
          </div>

          {/* Stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              ["⬤ Diameter", sel.diameter],
              ["↔ Distance", sel.distReal],
              ["🌙 Moons", sel.moons],
              ["🌡 Temp", sel.temp],
              ["⏱ Period", sel.period],
            ].map(([k, v]) => (
              <div key={k} style={{ background: "rgba(255,255,255,.04)", borderRadius: 10, padding: "10px 12px", border: "1px solid rgba(80,120,180,.12)" }}>
                <div style={{ ...S.muted, fontSize: 9, letterSpacing: 1, marginBottom: 4 }}>{k.toUpperCase()}</div>
                <div style={{ color: "#d0e8ff", fontSize: 13, fontWeight: 700 }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Fact */}
          <div style={{ background: "rgba(0,212,255,.06)", border: "1px solid rgba(0,212,255,.15)", borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ ...S.cyTxt, fontSize: 9, letterSpacing: 1, marginBottom: 6 }}>💡 DID YOU KNOW</div>
            <div style={{ ...S.txt, fontSize: 13, lineHeight: 1.7 }}>{sel.fact}</div>
          </div>

          {/* Navigate */}
          <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
            {[["← Prev", () => {
              const i = PLANETS.findIndex(p => p.id === sel.id);
              const nxt = PLANETS[(i - 1 + PLANETS.length) % PLANETS.length];
              setSelected(nxt); flyTo(PLANETS.indexOf(nxt));
            }], ["Next →", () => {
              const i = PLANETS.findIndex(p => p.id === sel.id);
              const nxt = PLANETS[(i + 1) % PLANETS.length];
              setSelected(nxt); flyTo(PLANETS.indexOf(nxt));
            }]].map(([lbl, fn]) => (
              <button key={lbl} onClick={fn} style={{
                flex: 1, background: "rgba(0,212,255,.08)", border: "1px solid rgba(0,212,255,.2)",
                borderRadius: 10, color: "#00d4ff", padding: "9px 0", fontSize: 13, cursor: "pointer",
                fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, transition: "all .15s",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,212,255,.18)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,212,255,.08)"; }}>
                {lbl}
              </button>
            ))}
          </div>
        </>}
      </div>

      {/* ── Bottom Nav ── */}
      <div style={{
        position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
        ...S.glass, padding: "8px 12px",
        display: "flex", alignItems: "center", gap: 4,
      }}>
        {/* Overview */}
        <button onClick={resetView} style={{
          display: "flex", alignItems: "center", gap: 7, padding: "7px 16px",
          background: !sel ? "rgba(0,212,255,.15)" : "transparent",
          border: `1px solid ${!sel ? "rgba(0,212,255,.4)" : "transparent"}`,
          borderRadius: 10, color: !sel ? "#00d4ff" : "#4a6888",
          cursor: "pointer", fontFamily: "'Rajdhani',sans-serif", fontSize: 12, fontWeight: 700,
          transition: "all .15s",
        }}>
          <span style={{ fontSize: 14 }}>☉</span> Overview
        </button>

        <div style={{ width: 1, height: 24, background: "rgba(80,120,180,.2)", margin: "0 6px" }} />

        {PLANETS.map((p, i) => {
          const active = sel?.id === p.id;
          return (
            <button key={p.id} onClick={() => { flyTo(i); setSelected(p); }} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 12px",
              background: active ? `${p.color}18` : "transparent",
              border: `1px solid ${active ? p.color + "60" : "transparent"}`,
              borderRadius: 10, color: active ? p.color : "#4a6888",
              cursor: "pointer", fontFamily: "'Rajdhani',sans-serif", fontSize: 12, fontWeight: 600,
              transition: "all .15s",
              whiteSpace: "nowrap",
            }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.color = "#b8d4f0"; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.color = "#4a6888"; } }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, boxShadow: `0 0 6px ${p.color}99`, flexShrink: 0 }} />
              {p.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
