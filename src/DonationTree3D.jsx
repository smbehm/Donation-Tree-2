import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const VINE_MIN_Y = 0;
const VINE_MAX_Y = 4.65;

const VERT_SHADER = `
  varying float vLocalY;

  void main() {
    vLocalY = position.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG_SHADER = `
  varying float vLocalY;
  uniform float uFillLevel;
  uniform float uMinY;
  uniform float uMaxY;

  void main() {
    float range = uMaxY - uMinY;
    float fillNorm = clamp((uFillLevel - uMinY) / range, 0.0, 1.0);
    float height = clamp((vLocalY - uMinY) / range, 0.0, 1.0);

    vec3 emptyColor = vec3(0.055, 0.038, 0.022);
    vec3 deepGreen = vec3(0.04, 0.30, 0.09);
    vec3 emerald = vec3(0.12, 0.74, 0.28);
    vec3 brightTip = vec3(0.55, 1.0, 0.35);

    float localT = (fillNorm > 0.001) ? clamp(height / fillNorm, 0.0, 1.0) : 0.0;
    vec3 filledColor = mix(deepGreen, mix(emerald, brightTip, localT * localT), localT);

    float edgeDist = abs(vLocalY - uFillLevel);
    float glow = exp(-edgeDist * edgeDist * 20.0);
    filledColor += vec3(0.55, 1.0, 0.12) * glow * 2.4;

    float blend = smoothstep(uFillLevel + 0.12, uFillLevel - 0.12, vLocalY);
    gl_FragColor = vec4(mix(emptyColor, filledColor, blend), 1.0);
  }
`;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function roughenGeometry(geometry, amount, taper = 0.6) {
  const position = geometry.attributes.position;

  for (let index = 0; index < position.count; index += 1) {
    const t = (position.getY(index) + 2.325) / 4.65;
    const n = amount * (1 - t * taper);
    position.setX(index, position.getX(index) + (Math.random() - 0.5) * n * 2);
    position.setZ(index, position.getZ(index) + (Math.random() - 0.5) * n * 2);
  }

  geometry.computeVertexNormals();
}

export function DonationTree3D({ amount, target, campaignName }) {
  const mountRef = useRef(null);
  const vineUniformsRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!vineUniformsRef.current) return;
    const progress = clamp(amount / target, 0, 1);
    vineUniformsRef.current.uFillLevel.value = VINE_MIN_Y + progress * (VINE_MAX_Y - VINE_MIN_Y);
  }, [amount, target]);

  useEffect(() => {
    if (!mountRef.current) return undefined;

    const mount = mountRef.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x122a18);
    scene.fog = new THREE.FogExp2(0x122a18, 0.038);

    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
    camera.position.set(0, 2.5, 11);
    camera.lookAt(0, 2.5, 0);

    scene.add(new THREE.AmbientLight(0x2a5a32, 3.2));

    const sun = new THREE.DirectionalLight(0xffe8a0, 4.8);
    sun.position.set(4, 8, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    scene.add(sun);

    const fillLight = new THREE.PointLight(0x66ffaa, 3.2, 24);
    fillLight.position.set(-3, 4, 3);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0x3a6a50, 2.2, 18);
    rimLight.position.set(2, 2, -4);
    scene.add(rimLight);

    const treeGroup = new THREE.Group();
    scene.add(treeGroup);

    const barkMaterial = new THREE.MeshStandardMaterial({ color: 0x271203, roughness: 0.97 });
    const randomBetween = (min, max) => min + Math.random() * (max - min);

    const trunkGeometry = new THREE.CylinderGeometry(0.11, 0.24, 4.65, 14, 7);
    roughenGeometry(trunkGeometry, 0.038);
    const trunk = new THREE.Mesh(trunkGeometry, barkMaterial);
    trunk.position.y = 2.325;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    treeGroup.add(trunk);

    const addBranch = (length, topRadius, bottomRadius, y, rotationZ, rotationY) => {
      const branch = new THREE.Mesh(
        new THREE.CylinderGeometry(topRadius, bottomRadius, length, 7),
        barkMaterial
      );
      branch.position.set(Math.sin(rotationY) * 0.09, y, Math.cos(rotationY) * 0.09);
      branch.rotation.z = rotationZ;
      branch.rotation.y = rotationY;
      branch.castShadow = true;
      treeGroup.add(branch);
    };

    addBranch(1.1, 0.019, 0.052, 2.6, 0.45, 0.2);
    addBranch(0.95, 0.017, 0.046, 2.9, -0.4, 2.4);
    addBranch(0.85, 0.015, 0.04, 3.3, 0.37, 4.5);
    addBranch(0.75, 0.013, 0.035, 3.6, -0.31, 1.2);
    addBranch(0.62, 0.011, 0.029, 3.9, 0.27, 3.7);
    addBranch(0.5, 0.009, 0.023, 4.2, -0.21, 5.5);

    const leafColors = [0x0f2f0c, 0x133812, 0x0c270a, 0x183e11, 0x0a2008];
    [
      [0, 4.4, 0, 1],
      [0.75, 4.1, 0.3, 0.74],
      [-0.6, 4.2, -0.4, 0.7],
      [0.4, 4.75, -0.5, 0.64],
      [-0.5, 4.5, 0.5, 0.6],
      [0, 5.1, 0, 0.54],
      [0.3, 3.9, 0.65, 0.5],
      [-0.3, 4, -0.62, 0.46]
    ].forEach(([x, y, z, radius], index) => {
      const geometry = new THREE.SphereGeometry(radius, 7, 5);
      const position = geometry.attributes.position;

      for (let vertex = 0; vertex < position.count; vertex += 1) {
        position.setX(vertex, position.getX(vertex) + randomBetween(-0.13, 0.13));
        position.setY(vertex, position.getY(vertex) + randomBetween(-0.13, 0.13));
        position.setZ(vertex, position.getZ(vertex) + randomBetween(-0.13, 0.13));
      }

      geometry.computeVertexNormals();
      const leaves = new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({
          color: leafColors[index % leafColors.length],
          roughness: 1,
          transparent: true,
          opacity: 0.87
        })
      );
      leaves.position.set(x, y, z);
      treeGroup.add(leaves);
    });

    const ground = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3, 0.06, 32),
      new THREE.MeshStandardMaterial({ color: 0x050d03, roughness: 1 })
    );
    ground.position.y = -0.03;
    ground.receiveShadow = true;
    treeGroup.add(ground);

    for (let index = 0; index < 6; index += 1) {
      const angle = (index / 6) * Math.PI * 2 + randomBetween(-0.25, 0.25);
      const points = [];

      for (let point = 0; point <= 18; point += 1) {
        const t = point / 18;
        points.push(
          new THREE.Vector3(
            Math.cos(angle) * (0.21 + t * randomBetween(0.55, 0.9)),
            Math.sin(t * Math.PI) * 0.13 * (1 - t * 0.55),
            Math.sin(angle) * (0.21 + t * randomBetween(0.55, 0.9))
          )
        );
      }

      const root = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 18, 0.022, 5, false),
        barkMaterial
      );
      root.castShadow = true;
      treeGroup.add(root);
    }

    const vineUniforms = {
      uFillLevel: { value: VINE_MIN_Y + clamp(amount / target, 0, 1) * (VINE_MAX_Y - VINE_MIN_Y) },
      uMinY: { value: VINE_MIN_Y },
      uMaxY: { value: VINE_MAX_Y }
    };
    vineUniformsRef.current = vineUniforms;

    const vineMaterial = new THREE.ShaderMaterial({
      vertexShader: VERT_SHADER,
      fragmentShader: FRAG_SHADER,
      uniforms: vineUniforms
    });

    [
      { start: 0, turns: 2.5, offset: 0.015 },
      { start: Math.PI * 0.5, turns: 2.8, offset: 0.018 },
      { start: Math.PI * 1.15, turns: 2.3, offset: 0.014 },
      { start: Math.PI * 1.72, turns: 3, offset: 0.017 }
    ].forEach(({ start, turns, offset }) => {
      const points = [];

      for (let index = 0; index <= 110; index += 1) {
        const t = index / 110;
        const y = VINE_MIN_Y + t * (VINE_MAX_Y - VINE_MIN_Y);
        const angle = start + t * turns * Math.PI * 2;
        const trunkRadius = 0.24 - t * 0.13;
        const radius = trunkRadius + offset;
        const wave = Math.sin(t * 22) * 0.005;
        points.push(
          new THREE.Vector3(
            Math.cos(angle) * (radius + wave),
            y,
            Math.sin(angle) * (radius + wave)
          )
        );
      }

      const vine = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 160, 0.0065, 5, false),
        vineMaterial
      );
      treeGroup.add(vine);
    });

    const particleCount = 150;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount);
    const particlePhases = new Float32Array(particleCount);

    for (let index = 0; index < particleCount; index += 1) {
      particlePositions[index * 3] = randomBetween(-6, 6);
      particlePositions[index * 3 + 1] = randomBetween(0, 7);
      particlePositions[index * 3 + 2] = randomBetween(-6, 6);
      particleSpeeds[index] = randomBetween(0.3, 1);
      particlePhases[index] = randomBetween(0, Math.PI * 2);
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x99ffaa,
      size: 0.05,
      transparent: true,
      opacity: 0.65
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    const applyViewportSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      if (width < 1 || height < 1) return;

      const isMobile = width < 768;
      const aspect = width / height;

      camera.aspect = aspect;
      if (isMobile) {
        camera.position.set(0.1, 2.55, 12.5);
        camera.lookAt(0.15, 2.85, 0);
      } else {
        camera.position.set(0, 2.5, 11);
        camera.lookAt(0, 2.5, 0);
      }
      camera.updateProjectionMatrix();

      renderer.setSize(width, height, false);
      renderer.domElement.style.width = '100vw';
      renderer.domElement.style.height = '100vh';
      renderer.domElement.style.display = 'block';
    };

    applyViewportSize();
    const observer = new ResizeObserver(applyViewportSize);
    observer.observe(document.documentElement);
    observer.observe(mount);
    window.addEventListener('resize', applyViewportSize);
    window.addEventListener('orientationchange', applyViewportSize);

    let tick = 0;
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      tick += 0.007;

      treeGroup.rotation.y = tick * 0.22;

      const particlePosition = particleGeometry.attributes.position;
      for (let index = 0; index < particleCount; index += 1) {
        particlePosition.setY(
          index,
          particlePosition.getY(index) + Math.sin(tick * particleSpeeds[index] + particlePhases[index]) * 0.003
        );
        particlePosition.setX(
          index,
          particlePosition.getX(index) + Math.cos(tick * particleSpeeds[index] * 0.4 + particlePhases[index]) * 0.002
        );
        if (particlePosition.getY(index) > 7) particlePosition.setY(index, 0);
      }
      particlePosition.needsUpdate = true;

      fillLight.intensity = 3.2 + Math.sin(tick * 1.4) * 0.13;
      particleMaterial.opacity = 0.5 + Math.sin(tick * 1.8) * 0.18;

      renderer.render(scene, camera);
    };
    animate();

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

    return () => {
      window.removeEventListener('resize', applyViewportSize);
      window.removeEventListener('orientationchange', applyViewportSize);
      observer.disconnect();
      cancelAnimationFrame(rafRef.current);
      scene.traverse(disposeObject);
      renderer.dispose();
      vineUniformsRef.current = null;
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="tree-shell" aria-label={`${campaignName} donation tree`}>
      <div ref={mountRef} className="tree-canvas" />
    </div>
  );
}
