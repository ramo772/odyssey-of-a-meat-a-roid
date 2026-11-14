// Physical stall props for the Uranus market. Shapes are built from primitives
// in the same style as the rest of the scene. There is no separate engine GLB.
// Each option is a different arrangement, not one mesh at three sizes.
(function (root) {
  let mats = null;
  function M(THREE) {
    if (mats) return mats;
    const metal = (color, emissive, intensity, rough) => new THREE.MeshStandardMaterial({
      color, metalness: 0.72, roughness: rough == null ? 0.32 : rough,
      emissive: emissive || 0x000000, emissiveIntensity: intensity || 0
    });
    mats = {
      steel: metal(0xd5e2ee),
      dark: metal(0x3a4d62, 0x000000, 0, 0.45),
      hot: metal(0xff8a3d, 0xff5a18, 1.6, 0.4),
      cyan: metal(0x8ef6ff, 0x149eb0, 1.35, 0.25),
      amber: metal(0xf0b429, 0xc98412, 0.65, 0.4),
      tank: metal(0xd86a32, 0x5a220c, 0.15, 0.38),
      glass: new THREE.MeshStandardMaterial({ color: 0x123844, emissive: 0x0a6a78, emissiveIntensity: 0.4, metalness: 0.45, roughness: 0.12, transparent: true, opacity: 0.9 }),
      solar: metal(0x1c4e86, 0x102848, 0.35, 0.28),
      cream: new THREE.MeshStandardMaterial({ color: 0xe6d7b8, metalness: 0.12, roughness: 0.62 }),
      slate: metal(0x5d7388, 0x000000, 0, 0.48),
      ion: metal(0xb7f4ff, 0x1aa8d0, 1.5, 0.2),
      frost: metal(0xe7f4fb, 0x9ec4de, 0.25, 0.3)
    };
    return mats;
  }
  function add(THREE, parent, geo, mat, x, y, z, rx, ry, rz) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    if (rx) mesh.rotation.x = rx;
    if (ry) mesh.rotation.y = ry;
    if (rz) mesh.rotation.z = rz;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  // Recreations from NASA photos and diagrams. Not official GLBs. Each kind is a
  // different silhouette: an ion grid, a long upper-stage nozzle, or a wide launch bell.
  function ionEngine(THREE, g, m) {
    add(THREE, g, new THREE.CylinderGeometry(0.2, 0.22, 0.58, 20), m.steel, 0, 0.36, 0, Math.PI / 2);
    add(THREE, g, new THREE.CylinderGeometry(0.24, 0.24, 0.05, 20), m.dark, 0, 0.36, 0.3, Math.PI / 2);
    add(THREE, g, new THREE.TorusGeometry(0.16, 0.016, 8, 28), m.ion, 0, 0.36, 0.34, Math.PI / 2);
    add(THREE, g, new THREE.TorusGeometry(0.09, 0.014, 8, 24), m.ion, 0, 0.36, 0.35, Math.PI / 2);
    add(THREE, g, new THREE.CircleGeometry(0.05, 16), m.cyan, 0, 0.36, 0.36);
    add(THREE, g, new THREE.SphereGeometry(0.15, 16, 12), m.slate, 0, 0.36, -0.4);
    add(THREE, g, new THREE.TorusGeometry(0.07, 0.02, 6, 14), m.amber, 0.2, 0.5, -0.05, Math.PI / 2);
    g.userData.kind = 'nstar';
  }
  function rl10Engine(THREE, g, m) {
    add(THREE, g, new THREE.CylinderGeometry(0.07, 0.22, 0.98, 20), m.dark, 0, 0.34, 0.12, -Math.PI / 2);
    add(THREE, g, new THREE.CylinderGeometry(0.09, 0.09, 0.2, 16), m.steel, 0, 0.34, -0.42, Math.PI / 2);
    add(THREE, g, new THREE.CylinderGeometry(0.03, 0.03, 0.42, 8), m.amber, 0.16, 0.58, -0.22);
    add(THREE, g, new THREE.CylinderGeometry(0.03, 0.03, 0.42, 8), m.cyan, -0.16, 0.58, -0.22);
    add(THREE, g, new THREE.BoxGeometry(0.22, 0.14, 0.18), m.steel, 0.24, 0.42, -0.36);
    add(THREE, g, new THREE.TorusGeometry(0.2, 0.02, 8, 20), m.frost, 0, 0.34, 0.58, Math.PI / 2);
    g.userData.kind = 'rl10';
  }
  function rs25Engine(THREE, g, m) {
    add(THREE, g, new THREE.CylinderGeometry(0.16, 0.46, 0.46, 22), m.dark, 0, 0.32, 0.16, -Math.PI / 2);
    add(THREE, g, new THREE.BoxGeometry(0.62, 0.36, 0.4), m.steel, 0, 0.5, -0.22);
    add(THREE, g, new THREE.BoxGeometry(0.16, 0.22, 0.16), m.amber, 0.4, 0.58, -0.18);
    add(THREE, g, new THREE.TorusGeometry(0.42, 0.035, 8, 24), m.hot, 0, 0.32, 0.38, Math.PI / 2);
    add(THREE, g, new THREE.CylinderGeometry(0.05, 0.05, 0.28, 8), m.slate, -0.28, 0.62, -0.1);
    g.userData.kind = 'rs25';
  }
  function slsStack(THREE, g, m, upper) {
    add(THREE, g, new THREE.CylinderGeometry(0.1, 0.1, 0.85, 12), m.frost, 0, 0.48, 0);
    add(THREE, g, new THREE.CylinderGeometry(0.07, 0.07, 0.7, 10), m.cream, -0.2, 0.4, 0);
    add(THREE, g, new THREE.CylinderGeometry(0.07, 0.07, 0.7, 10), m.cream, 0.2, 0.4, 0);
    if (upper === 'icps') {
      add(THREE, g, new THREE.CylinderGeometry(0.08, 0.08, 0.22, 12), m.steel, 0, 0.98, 0);
      add(THREE, g, new THREE.ConeGeometry(0.09, 0.16, 12), m.dark, 0, 1.16, 0);
      g.userData.kind = 'sls-block1';
    } else if (upper === 'eus') {
      add(THREE, g, new THREE.CylinderGeometry(0.1, 0.1, 0.42, 12), m.steel, 0, 1.08, 0);
      [[-0.04, -0.04], [0.04, -0.04], [-0.04, 0.04], [0.04, 0.04]].forEach(p => {
        add(THREE, g, new THREE.CylinderGeometry(0.012, 0.028, 0.08, 8), m.hot, p[0], 0.86, p[1]);
      });
      add(THREE, g, new THREE.ConeGeometry(0.1, 0.14, 12), m.dark, 0, 1.36, 0);
      g.userData.kind = 'sls-block1b';
    } else {
      add(THREE, g, new THREE.CylinderGeometry(0.08, 0.08, 0.78, 10), m.cream, -0.2, 0.52, 0);
      add(THREE, g, new THREE.CylinderGeometry(0.08, 0.08, 0.78, 10), m.cream, 0.2, 0.52, 0);
      add(THREE, g, new THREE.CylinderGeometry(0.16, 0.16, 0.28, 12), m.slate, 0, 1.02, 0);
      add(THREE, g, new THREE.SphereGeometry(0.16, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), m.dark, 0, 1.16, 0);
      g.userData.kind = 'sls-block2';
    }
  }
  function preview(THREE, cat, id) {
    const m = M(THREE);
    const g = new THREE.Group();
    g.name = 'preview';
    g.userData.sig = cat + ':' + id;
    if (cat === 'engine' && id === 'small') ionEngine(THREE, g, m);
    else if (cat === 'engine' && id === 'medium') rl10Engine(THREE, g, m);
    else if (cat === 'engine') rs25Engine(THREE, g, m);
    else if (cat === 'tank' && id === 'small') {
      add(THREE, g, new THREE.CylinderGeometry(0.11, 0.11, 0.48, 16), m.tank, 0, 0.32, 0);
      add(THREE, g, new THREE.SphereGeometry(0.11, 14, 10), m.tank, 0, 0.56, 0);
      add(THREE, g, new THREE.TorusGeometry(0.07, 0.018, 6, 14), m.steel, 0.16, 0.4, 0, 0, Math.PI / 2);
      add(THREE, g, new THREE.CylinderGeometry(0.05, 0.05, 0.12, 10), m.dark, 0.22, 0.28, 0);
      g.userData.kind = 'hydrazine-bottle';
    } else if (cat === 'tank' && id === 'medium') {
      add(THREE, g, new THREE.SphereGeometry(0.28, 20, 16), m.slate, 0, 0.36, 0);
      add(THREE, g, new THREE.TorusGeometry(0.12, 0.025, 8, 18), m.steel, 0, 0.36, 0.2, Math.PI / 2);
      add(THREE, g, new THREE.CylinderGeometry(0.03, 0.03, 0.34, 8), m.cyan, 0.22, 0.5, 0, 0, 0, Math.PI / 3);
      g.userData.kind = 'xenon-sphere';
    } else if (cat === 'tank') {
      add(THREE, g, new THREE.CylinderGeometry(0.16, 0.16, 0.95, 18), m.frost, 0, 0.28, 0, Math.PI / 2);
      add(THREE, g, new THREE.SphereGeometry(0.16, 16, 12), m.frost, 0, 0.28, 0.48);
      add(THREE, g, new THREE.SphereGeometry(0.16, 16, 12), m.frost, 0, 0.28, -0.48);
      add(THREE, g, new THREE.TorusGeometry(0.17, 0.02, 8, 20), m.amber, 0, 0.28, 0.1, Math.PI / 2);
      g.userData.kind = 'core-stage';
    } else if (cat === 'power' && id === 'solar-battery') {
      [-0.15, 0.15].forEach(z => {
        const wing = add(THREE, g, new THREE.BoxGeometry(0.95, 0.03, 0.22), m.solar, 0, 0.42, z);
        wing.rotation.z = z > 0 ? -0.5 : 0.5;
      });
      add(THREE, g, new THREE.CylinderGeometry(0.08, 0.08, 0.22, 14), m.steel, 0, 0.2, 0);
      add(THREE, g, new THREE.SphereGeometry(0.08, 12, 10), m.steel, 0, 0.32, 0);
      g.userData.kind = 'dawn-solar';
    } else if (cat === 'power') {
      add(THREE, g, new THREE.CylinderGeometry(0.1, 0.1, 0.62, 16), m.steel, 0, 0.4, 0);
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4;
        add(THREE, g, new THREE.BoxGeometry(0.26, 0.5, 0.025), m.dark, Math.cos(a) * 0.2, 0.4, Math.sin(a) * 0.2, 0, -a);
      }
      add(THREE, g, new THREE.SphereGeometry(0.07, 12, 10), m.hot, 0, 0.78, 0);
      g.userData.kind = 'mhw-rtg';
    } else if (cat === 'instrument' && id === 'camera') {
      add(THREE, g, new THREE.BoxGeometry(0.36, 0.26, 0.28), m.slate, 0, 0.24, 0);
      add(THREE, g, new THREE.CylinderGeometry(0.09, 0.12, 0.32, 16), m.dark, 0, 0.24, 0.28, Math.PI / 2);
      add(THREE, g, new THREE.TorusGeometry(0.1, 0.02, 8, 16), m.amber, 0.22, 0.24, 0.05, 0, Math.PI / 2);
      add(THREE, g, new THREE.CircleGeometry(0.07, 14), m.cyan, 0, 0.24, 0.45);
      g.userData.kind = 'framing-camera';
    } else if (cat === 'instrument' && id === 'spectrometer') {
      add(THREE, g, new THREE.BoxGeometry(0.72, 0.08, 0.16), m.slate, 0, 0.12, 0);
      add(THREE, g, new THREE.CylinderGeometry(0.04, 0.14, 0.28, 3), m.cream, 0.05, 0.28, 0, Math.PI / 2);
      add(THREE, g, new THREE.BoxGeometry(0.04, 0.16, 0.12), m.dark, -0.32, 0.22, 0);
      g.userData.kind = 'vir';
    } else if (cat === 'instrument') {
      add(THREE, g, new THREE.CylinderGeometry(0.025, 0.025, 0.9, 8), m.steel, 0, 0.2, 0, 0, 0, Math.PI / 2);
      add(THREE, g, new THREE.CylinderGeometry(0.07, 0.07, 0.12, 12), m.amber, 0.4, 0.2, 0, 0, 0, Math.PI / 2);
      add(THREE, g, new THREE.CylinderGeometry(0.05, 0.05, 0.1, 12), m.cyan, -0.28, 0.2, 0.08, 0, 0, Math.PI / 2);
      g.userData.kind = 'mag-boom';
    } else if (cat === 'recorder' && id === 'small') {
      add(THREE, g, new THREE.BoxGeometry(0.42, 0.1, 0.3), m.dark, 0, 0.12, 0);
      add(THREE, g, new THREE.TorusGeometry(0.07, 0.02, 8, 16), m.cyan, -0.08, 0.18, 0.02, Math.PI / 2);
      add(THREE, g, new THREE.CylinderGeometry(0.03, 0.03, 0.04, 10), m.steel, 0.1, 0.18, 0);
      g.userData.kind = 'reel-deck';
    } else if (cat === 'recorder') {
      add(THREE, g, new THREE.BoxGeometry(0.48, 0.7, 0.26), m.slate, 0, 0.4, 0);
      for (let r = 0; r < 4; r++) add(THREE, g, new THREE.BoxGeometry(0.36, 0.08, 0.04), m.dark, 0, 0.16 + r * 0.16, 0.14);
      g.userData.kind = 'drive-rack';
    } else if (cat === 'booster' && id === 'light') slsStack(THREE, g, m, 'icps');
    else if (cat === 'booster' && id === 'medium') slsStack(THREE, g, m, 'eus');
    else if (cat === 'booster') slsStack(THREE, g, m, 'fairing');
    else if (cat === 'objective' && id === 'rings') {
      add(THREE, g, new THREE.SphereGeometry(0.22, 18, 14), m.cyan, 0, 0.35, 0);
      add(THREE, g, new THREE.TorusGeometry(0.4, 0.03, 8, 28), m.cream, 0, 0.35, 0, Math.PI / 2.6);
      g.userData.kind = 'uranus-rings';
    } else if (cat === 'objective' && id === 'atmosphere') {
      add(THREE, g, new THREE.SphereGeometry(0.28, 18, 14), m.cyan, 0, 0.35, 0);
      add(THREE, g, new THREE.TorusGeometry(0.3, 0.025, 6, 24), m.cream, 0, 0.42, 0, Math.PI / 2);
      add(THREE, g, new THREE.TorusGeometry(0.3, 0.02, 6, 24), m.amber, 0, 0.28, 0, Math.PI / 2);
      g.userData.kind = 'uranus-air';
    } else if (cat === 'objective' && id === 'moons') {
      add(THREE, g, new THREE.SphereGeometry(0.2, 16, 12), m.cyan, 0, 0.35, 0);
      add(THREE, g, new THREE.SphereGeometry(0.07, 12, 10), m.cream, 0.38, 0.4, 0);
      add(THREE, g, new THREE.SphereGeometry(0.05, 12, 10), m.amber, -0.28, 0.28, 0.12);
      g.userData.kind = 'uranus-moons';
    } else if (cat === 'objective') {
      add(THREE, g, new THREE.SphereGeometry(0.2, 16, 12), m.cyan, 0, 0.35, 0);
      add(THREE, g, new THREE.TorusGeometry(0.42, 0.015, 6, 28), m.amber, 0, 0.35, 0, 0.4, 0.6);
      g.userData.kind = 'uranus-mag';
    } else if (cat === 'orbit' && id === 'polar') {
      add(THREE, g, new THREE.SphereGeometry(0.16, 14, 12), m.cyan, 0, 0.3, 0);
      add(THREE, g, new THREE.TorusGeometry(0.36, 0.02, 6, 28), m.amber, 0, 0.3, 0, 0, 0);
      g.userData.kind = 'path-polar';
    } else if (cat === 'orbit' && id === 'wide') {
      add(THREE, g, new THREE.SphereGeometry(0.14, 14, 12), m.cyan, 0, 0.3, 0);
      const ring = add(THREE, g, new THREE.TorusGeometry(0.46, 0.018, 6, 32), m.cream, 0, 0.3, 0, Math.PI / 2);
      ring.scale.x = 1.35;
      g.userData.kind = 'path-wide';
    } else if (cat === 'orbit') {
      add(THREE, g, new THREE.SphereGeometry(0.16, 14, 12), m.cyan, 0, 0.3, 0);
      add(THREE, g, new THREE.TorusGeometry(0.32, 0.028, 6, 24), m.amber, 0, 0.3, 0, Math.PI / 2.4);
      g.userData.kind = 'path-rings';
    } else if (cat === 'route') {
      const n = id === 'fast' ? 5 : id === 'balanced' ? 8 : 12;
      const span = id === 'fast' ? 0.7 : id === 'balanced' ? 1.0 : 1.35;
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        add(THREE, g, new THREE.SphereGeometry(0.045, 8, 6), i === n - 1 ? m.hot : m.cyan, -span / 2 + t * span, 0.15 + Math.sin(t * Math.PI) * (id === 'fast' ? 0.45 : 0.22), 0);
      }
      g.userData.kind = id === 'fast' ? 'route-fast' : id === 'balanced' ? 'route-mid' : 'route-thrifty';
    } else if (cat === 'shield' && id === 'advanced') {
      add(THREE, g, new THREE.BoxGeometry(0.7, 0.08, 0.45), m.steel, 0, 0.2, 0);
      add(THREE, g, new THREE.BoxGeometry(0.5, 0.08, 0.32), m.cyan, 0, 0.32, 0.04);
      add(THREE, g, new THREE.SphereGeometry(0.18, 14, 10), m.glass, 0, 0.48, 0);
      g.userData.kind = 'spaced-shield';
    } else if (cat === 'shield') {
      add(THREE, g, new THREE.BoxGeometry(0.62, 0.1, 0.4), m.steel, 0, 0.22, 0);
      g.userData.kind = 'single-plate';
    } else if (cat === 'antenna' && id === 'high-gain') {
      add(THREE, g, new THREE.CylinderGeometry(0.03, 0.03, 0.45, 8), m.steel, 0, 0.25, 0);
      add(THREE, g, new THREE.SphereGeometry(0.28, 16, 12, 0, Math.PI * 2, 0, 1.1), m.cream, 0, 0.55, 0, -0.6);
      add(THREE, g, new THREE.CylinderGeometry(0.03, 0.05, 0.12, 8), m.amber, 0, 0.48, 0.12);
      g.userData.kind = 'dawn-hga';
    } else if (cat === 'antenna') {
      add(THREE, g, new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8), m.steel, 0, 0.32, 0);
      add(THREE, g, new THREE.BoxGeometry(0.4, 0.03, 0.03), m.cyan, 0, 0.5, 0);
      add(THREE, g, new THREE.BoxGeometry(0.03, 0.03, 0.28), m.cyan, 0, 0.38, 0);
      g.userData.kind = 'dipole';
    } else if (cat === 'cabin' && id === 'comfort') {
      add(THREE, g, new THREE.BoxGeometry(0.7, 0.28, 0.4), m.cream, 0, 0.2, 0);
      add(THREE, g, new THREE.BoxGeometry(0.22, 0.16, 0.08), m.glass, -0.16, 0.38, 0.16);
      add(THREE, g, new THREE.BoxGeometry(0.22, 0.16, 0.08), m.glass, 0.16, 0.38, 0.16);
      g.userData.kind = 'cabin-wide';
    } else if (cat === 'cabin') {
      add(THREE, g, new THREE.CylinderGeometry(0.16, 0.16, 0.36, 16), m.cream, 0, 0.24, 0);
      add(THREE, g, new THREE.SphereGeometry(0.16, 14, 10), m.slate, 0, 0.42, 0);
      add(THREE, g, new THREE.CircleGeometry(0.05, 12), m.glass, 0, 0.24, 0.17);
      g.userData.kind = 'cabin-pod';
    } else if (cat === 'backup' && id === 'redundant') {
      add(THREE, g, new THREE.BoxGeometry(0.22, 0.22, 0.22), m.slate, -0.2, 0.14, 0);
      add(THREE, g, new THREE.BoxGeometry(0.22, 0.22, 0.22), m.slate, 0.2, 0.14, 0);
      add(THREE, g, new THREE.CylinderGeometry(0.03, 0.03, 0.28, 8), m.amber, 0, 0.2, 0, 0, 0, Math.PI / 2);
      g.userData.kind = 'oru-pair';
    } else if (cat === 'backup') {
      add(THREE, g, new THREE.BoxGeometry(0.28, 0.24, 0.24), m.slate, 0, 0.16, 0);
      g.userData.kind = 'single-box';
    } else {
      add(THREE, g, new THREE.BoxGeometry(0.3, 0.3, 0.3), m.steel, 0, 0.2, 0);
      g.userData.kind = 'gap-box';
    }
    return g;
  }
  function dressing(THREE, kind) {
    const m = M(THREE);
    const g = new THREE.Group();
    if (kind === 'engine') {
      [[-0.35, -0.2], [0.35, -0.2], [-0.35, 0.2], [0.35, 0.2]].forEach(p => add(THREE, g, new THREE.CylinderGeometry(0.045, 0.055, 0.95, 8), m.slate, p[0], 0.48, p[1]));
      add(THREE, g, new THREE.BoxGeometry(0.95, 0.07, 0.58), m.dark, 0, 0.96, 0);
      add(THREE, g, new THREE.CylinderGeometry(0.08, 0.08, 0.22, 10), m.hot, 0, 1.08, 0);
    } else if (kind === 'fuel') {
      [-0.28, 0.28].forEach(x => add(THREE, g, new THREE.CylinderGeometry(0.14, 0.14, 0.72, 12), m.tank, x, 0.42, -0.05));
      add(THREE, g, new THREE.CylinderGeometry(0.045, 0.045, 0.7, 8), m.steel, 0, 0.7, -0.05, 0, 0, Math.PI / 2);
      add(THREE, g, new THREE.TorusGeometry(0.1, 0.03, 6, 12), m.amber, 0.5, 0.45, 0);
    } else if (kind === 'power') {
      add(THREE, g, new THREE.BoxGeometry(0.72, 0.85, 0.12), m.dark, 0, 0.5, -0.15);
      [-0.22, 0, 0.22].forEach(x => add(THREE, g, new THREE.BoxGeometry(0.16, 0.42, 0.08), m.amber, x, 0.38, -0.06));
    } else if (kind === 'challenge') {
      add(THREE, g, new THREE.BoxGeometry(0.9, 0.55, 0.08), m.slate, 0.15, 0.55, -0.2);
    } else if (kind === 'launch') {
      // A small rocket standing beside its service tower.
      add(THREE, g, new THREE.BoxGeometry(0.12, 1.2, 0.12), m.slate, -0.3, 0.6, -0.15);
      [0.35, 0.75].forEach(y => add(THREE, g, new THREE.BoxGeometry(0.3, 0.05, 0.08), m.dark, -0.15, y, -0.15));
      add(THREE, g, new THREE.CylinderGeometry(0.11, 0.11, 0.7, 12), m.cream, 0.05, 0.45, -0.15);
      add(THREE, g, new THREE.ConeGeometry(0.11, 0.26, 12), m.hot, 0.05, 0.93, -0.15);
      [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach(a => add(THREE, g, new THREE.BoxGeometry(0.02, 0.16, 0.12), m.amber, 0.05 + Math.cos(a) * 0.12, 0.16, -0.15 + Math.sin(a) * 0.12, 0, -a, 0));
    } else if (kind === 'tool') {
      add(THREE, g, new THREE.BoxGeometry(0.85, 0.5, 0.06), m.dark, -0.2, 0.55, -0.2);
    } else if (kind === 'memory') {
      add(THREE, g, new THREE.BoxGeometry(0.7, 0.08, 0.35), m.slate, 0, 0.45, -0.1);
      add(THREE, g, new THREE.BoxGeometry(0.7, 0.08, 0.35), m.slate, 0, 0.7, -0.1);
    } else if (kind === 'parts') {
      add(THREE, g, new THREE.BoxGeometry(0.35, 0.28, 0.35), m.slate, -0.35, 0.16, -0.1);
      add(THREE, g, new THREE.BoxGeometry(0.28, 0.2, 0.28), m.dark, -0.15, 0.4, -0.05);
    } else if (kind === 'archive') {
      add(THREE, g, new THREE.CylinderGeometry(0.08, 0.1, 0.7, 8), m.slate, 0.9, 0.4, 0);
      add(THREE, g, new THREE.CylinderGeometry(0.16, 0.18, 0.35, 12), m.cream, 0.9, 0.85, 0, Math.PI / 2.4);
      add(THREE, g, new THREE.BoxGeometry(0.45, 0.7, 0.2), m.dark, -0.9, 0.45, 0);
    }
    return g;
  }
  root.MarketMeshes = { preview, dressing };
})(window);
