import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeHeroScene({ className = '' }) {
  const mountRef = useRef(null);
  const animFrameRef = useRef(null);
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const mouseTargetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check for prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Verify WebGL availability
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
    } catch (e) {
      console.warn('WebGL initialization failed:', e);
      return;
    }

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020617, 0.065);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x38bdf8, 0.8);
    scene.add(ambientLight);

    const keyLight = new THREE.PointLight(0x00f2fe, 35, 20);
    keyLight.position.set(4, 4, 5);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0xa855f7, 30, 20);
    rimLight.position.set(-4, -3, 3);
    scene.add(rimLight);

    const frontLight = new THREE.DirectionalLight(0xffffff, 1.2);
    frontLight.position.set(0, 2, 6);
    scene.add(frontLight);

    // Root 3D Pivot Group
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // 1. Central Faceted Crystal
    const crystalGeo = new THREE.IcosahedronGeometry(1.3, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0f172a,
      roughness: 0.12,
      metalness: 0.9,
      flatShading: true
    });
    const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
    coreGroup.add(crystalMesh);

    // 2. Holographic Outer Cage
    const cageGeo = new THREE.IcosahedronGeometry(1.7, 1);
    const cageMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
      roughness: 0.2,
      metalness: 0.8
    });
    const cageMesh = new THREE.Mesh(cageGeo, cageMat);
    coreGroup.add(cageMesh);

    // 3. Gyroscopic Orbital Torus Ring A
    const ringGeoA = new THREE.TorusGeometry(2.2, 0.035, 16, 100);
    const ringMatA = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8
    });
    const ringMeshA = new THREE.Mesh(ringGeoA, ringMatA);
    ringMeshA.rotation.x = Math.PI / 3;
    coreGroup.add(ringMeshA);

    // 4. Gyroscopic Orbital Torus Ring B
    const ringGeoB = new THREE.TorusGeometry(2.55, 0.025, 16, 100);
    const ringMatB = new THREE.MeshStandardMaterial({
      color: 0xc084fc,
      emissive: 0x9333ea,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.8
    });
    const ringMeshB = new THREE.Mesh(ringGeoB, ringMatB);
    ringMeshB.rotation.y = Math.PI / 4;
    ringMeshB.rotation.x = -Math.PI / 5;
    coreGroup.add(ringMeshB);

    // 5. Starfield / Neural Particles
    const particleCount = 700;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      const radius = 3.5 + Math.random() * 4.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      particlePos[i] = radius * Math.sin(phi) * Math.cos(theta);
      particlePos[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePos[i + 2] = radius * Math.cos(phi);
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.045,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // 6. Perspective Grid Floor
    const gridHelper = new THREE.GridHelper(16, 20, 0x0284c7, 0x1e293b);
    gridHelper.position.y = -2.6;
    gridHelper.material.opacity = 0.35;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // Mouse Tracking & Drag Rotation
    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      mouseTargetRef.current = {
        x: (clientX / rect.width) * 2 - 1,
        y: -(clientY / rect.height) * 2 + 1
      };

      if (isDraggingRef.current) {
        const deltaX = e.clientX - previousMousePositionRef.current.x;
        const deltaY = e.clientY - previousMousePositionRef.current.y;
        coreGroup.rotation.y += deltaX * 0.01;
        coreGroup.rotation.x += deltaY * 0.01;
      }
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseDown = (e) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousemove', handleMouseMove);
    domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    // Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      if (!prefersReducedMotion) {
        if (!isDraggingRef.current) {
          coreGroup.rotation.y += delta * 0.35;
          coreGroup.rotation.x += delta * 0.15;
        }

        cageMesh.rotation.y -= delta * 0.2;
        cageMesh.rotation.z += delta * 0.15;

        ringMeshA.rotation.z += delta * 0.45;
        ringMeshB.rotation.z -= delta * 0.35;

        particleSystem.rotation.y += delta * 0.08;

        // Smooth camera parallax damping
        camera.position.x += (mouseTargetRef.current.x * 1.2 - camera.position.x) * 0.05;
        camera.position.y += (mouseTargetRef.current.y * 0.8 - camera.position.y) * 0.05;
        camera.lookAt(0, 0, 0);

        // Gentle light pulsation
        keyLight.position.x = Math.sin(elapsed * 0.8) * 5;
        keyLight.position.z = Math.cos(elapsed * 0.8) * 5;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Comprehensive Resource Disposal Cleanup
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }

      domElement.removeEventListener('mousemove', handleMouseMove);
      domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      resizeObserver.disconnect();

      // Dispose Geometries & Materials
      [crystalGeo, cageGeo, ringGeoA, ringGeoB, particleGeo].forEach((g) => g.dispose());
      [crystalMat, cageMat, ringMatA, ringMatB, particleMat, gridHelper.material].forEach((m) => m.dispose());

      renderer.dispose();
      if (domElement.parentNode) {
        domElement.parentNode.removeChild(domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-full min-h-[300px] select-none cursor-grab active:cursor-grabbing overflow-hidden ${className}`}
      title="Interactive 3D Neural Core — Drag with mouse to rotate"
    />
  );
}
