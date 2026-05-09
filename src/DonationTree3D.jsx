import React from 'react';
import * as THREE from 'three';

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function DonationTree3D({ amount, target, campaignName }) {
  const mountRef = React.useRef(null);
  const progressRef = React.useRef(0);

  React.useEffect(() => {
    progressRef.current = clamp(amount / target, 0, 1);
  }, [amount, target]);

  React.useEffect(() => {
    if (!mountRef.current) return undefined;

    const mount = mountRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fbf7);
    scene.fog = new THREE.Fog(0xf8fbf7, 8, 18);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 2.2, 8.2);
    camera.lookAt(0, 1.95, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const treeGroup = new THREE.Group();
    scene.add(treeGroup);

    scene.add(new THREE.HemisphereLight(0xe8fff1, 0x2e261f, 2.1));

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(4, 7, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xb8ffd7, 1.4);
    rimLight.position.set(-5, 4, -4);
    scene.add(rimLight);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(3.9, 80),
      new THREE.MeshStandardMaterial({ color: 0xe4efe2, roughness: 0.95 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    treeGroup.add(ground);

    const glow = new THREE.Mesh(
      new THREE.RingGeometry(0.75, 1.55, 96),
      new THREE.MeshBasicMaterial({
        color: 0x4fca75,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide
      })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.012;
    treeGroup.add(glow);

    const trunkHeight = 4.4;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.66, trunkHeight, 22),
      new THREE.MeshStandardMaterial({
        color: 0x3b2a22,
        roughness: 0.9,
        metalness: 0.02
      })
    );
    trunk.position.y = trunkHeight / 2;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    const rootMaterial = new THREE.MeshStandardMaterial({ color: 0x2b211c, roughness: 0.92 });
    for (let i = 0; i < 7; i += 1) {
      const angle = (i / 7) * Math.PI * 2;
      const root = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 1.05, 5, 10), rootMaterial);
      root.position.set(Math.cos(angle) * 0.62, 0.11, Math.sin(angle) * 0.62);
      root.rotation.z = Math.PI / 2;
      root.rotation.y = -angle;
      root.castShadow = true;
      treeGroup.add(root);
    }

    const canopyMaterial = new THREE.MeshStandardMaterial({
      color: 0x142317,
      roughness: 0.82,
      metalness: 0
    });
    const canopy = new THREE.Group();
    [
      [-0.9, 4.9, 0, 1.05],
      [0, 5.25, 0.15, 1.22],
      [0.9, 4.9, -0.05, 1.05],
      [-0.35, 4.55, 0.35, 0.92],
      [0.45, 4.55, 0.35, 0.92]
    ].forEach(([x, y, z, scale]) => {
      const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(scale, 2), canopyMaterial);
      leaf.position.set(x, y, z);
      leaf.castShadow = true;
      canopy.add(leaf);
    });
    treeGroup.add(canopy);

    const blackVineMaterial = new THREE.MeshStandardMaterial({
      color: 0x080808,
      roughness: 0.58,
      metalness: 0.04
    });
    const colorVineMaterial = new THREE.MeshStandardMaterial({
      color: 0x27b763,
      emissive: 0x0d391f,
      emissiveIntensity: 0.35,
      roughness: 0.46
    });

    const vineLayer = new THREE.Group();
    const coloredVines = new THREE.Group();
    treeGroup.add(vineLayer);
    vineLayer.add(coloredVines);

    function makeVinePoints(offset, radius, turns, height) {
      return Array.from({ length: 180 }, (_, index) => {
        const t = index / 179;
        const angle = offset + t * turns * Math.PI * 2;
        const taper = 1 - t * 0.28;
        return new THREE.Vector3(
          Math.cos(angle) * radius * taper,
          0.17 + t * height,
          Math.sin(angle) * radius * taper
        );
      });
    }

    const vinePointSets = [
      makeVinePoints(0.2, 0.7, 2.42, 4.58),
      makeVinePoints(2.45, 0.63, 2.15, 4.35),
      makeVinePoints(4.2, 0.55, 1.78, 3.95)
    ];

    vinePointSets.forEach((points, index) => {
      const curve = new THREE.CatmullRomCurve3(points);
      const vine = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 150, index === 0 ? 0.052 : 0.043, 12, false),
        blackVineMaterial
      );
      vine.castShadow = true;
      vineLayer.add(vine);
    });

    const disposeObject = (object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    };

    const clearColoredVines = () => {
      coloredVines.children.forEach(disposeObject);
      coloredVines.clear();
    };

    const updateColoredVines = (progress) => {
      const topY = 0.17 + progress * 4.58;
      clearColoredVines();

      vinePointSets.forEach((points, index) => {
        const activePoints = points.filter((point) => point.y <= topY);
        if (activePoints.length < 4) return;

        const finalPoint = points.find((point) => point.y > topY);
        if (finalPoint) {
          const lastPoint = activePoints[activePoints.length - 1];
          activePoints.push(lastPoint.clone().lerp(finalPoint, 0.35));
        }

        const curve = new THREE.CatmullRomCurve3(activePoints);
        const mesh = new THREE.Mesh(
          new THREE.TubeGeometry(curve, 130, index === 0 ? 0.062 : 0.052, 12, false),
          colorVineMaterial
        );
        mesh.castShadow = true;
        coloredVines.add(mesh);
      });
    };

    const resize = () => {
      const rect = mount.getBoundingClientRect();
      const width = Math.max(rect.width, 320);
      const height = Math.max(rect.height, 420);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    resize();
    updateColoredVines(progressRef.current);
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    let frameId = 0;
    let lastRenderedProgress = progressRef.current;
    const start = performance.now();
    const animate = (now) => {
      const progress = progressRef.current;
      if (Math.abs(progress - lastRenderedProgress) > 0.002) {
        updateColoredVines(progress);
        lastRenderedProgress = progress;
      }

      const color = new THREE.Color().setHSL(
        0.31 + progress * 0.08,
        0.5 + progress * 0.22,
        0.12 + progress * 0.28
      );
      canopyMaterial.color.lerp(color, 0.06);
      colorVineMaterial.color.setHSL(0.32 + progress * 0.08, 0.7, 0.28 + progress * 0.2);
      colorVineMaterial.emissiveIntensity = 0.15 + progress * 0.75;
      glow.material.opacity = 0.06 + progress * 0.28;
      glow.scale.setScalar(0.85 + progress * 0.45);

      treeGroup.rotation.y = Math.sin((now - start) * 0.00035) * 0.12;
      canopy.rotation.y += 0.0012;
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      mount.removeChild(renderer.domElement);
      scene.traverse(disposeObject);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="tree-shell" aria-label={`${campaignName} donation tree`}>
      <div ref={mountRef} className="tree-canvas" />
    </div>
  );
}
