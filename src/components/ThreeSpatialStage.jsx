import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Rotate3D, Layers, ZoomIn, Sun, Eye, X } from 'lucide-react';

export default function ThreeSpatialStage({
  mainCanvas,
  bgCanvas,
  shadow = { enabled: false, offsetX: 0, offsetY: 20, opacity: 0.5, color: '#000000' },
  onClose
}) {
  const mountRef = useRef(null);
  const animFrameRef = useRef(null);
  const [depthExplode, setDepthExplode] = useState(0.85);
  const [autoRotate, setAutoRotate] = useState(true);
  const controlsRef = useRef(null);
  const fgMeshRef = useRef(null);
  const bgMeshRef = useRef(null);
  const shadowMeshRef = useRef(null);
  const dirLightRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container || !mainCanvas) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
    } catch (e) {
      console.warn('ThreeSpatialStage WebGL init failed:', e);
      return;
    }

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.5, 4.2);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 12;
    controls.minDistance = 1.5;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.2;
    controlsRef.current = controls;

    // Studio Ambient & Directional Spotlights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(
      (shadow.offsetX || 0) * 0.05 + 2,
      5,
      (shadow.offsetY || 20) * 0.03 + 3
    );
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 25;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    const fillLight = new THREE.PointLight(0x38bdf8, 15, 10);
    fillLight.position.set(-3, -1, 2);
    scene.add(fillLight);

    // Calculate aspect ratio from main canvas
    const canvasAspect = mainCanvas.width / (mainCanvas.height || 1);
    const planeHeight = 2.4;
    const planeWidth = planeHeight * canvasAspect;

    // 1. Studio Floor Grid
    const floorGeo = new THREE.PlaneGeometry(12, 12);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.4,
      metalness: 0.2
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -planeHeight / 2 - 0.2;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    const grid = new THREE.GridHelper(12, 16, 0x3b82f6, 0x1e293b);
    grid.position.y = floorMesh.position.y + 0.01;
    grid.material.opacity = 0.4;
    grid.material.transparent = true;
    scene.add(grid);

    // 2. Background Texture & Plane
    let bgTexture = null;
    let bgMesh = null;
    if (bgCanvas) {
      bgTexture = new THREE.CanvasTexture(bgCanvas);
      bgTexture.colorSpace = THREE.SRGBColorSpace;
      const bgGeo = new THREE.PlaneGeometry(planeWidth * 1.15, planeHeight * 1.15);
      const bgMat = new THREE.MeshStandardMaterial({
        map: bgTexture,
        roughness: 0.8,
        metalness: 0.1,
        side: THREE.DoubleSide
      });
      bgMesh = new THREE.Mesh(bgGeo, bgMat);
      bgMesh.position.z = -depthExplode;
      scene.add(bgMesh);
      bgMeshRef.current = bgMesh;
    }

    // 3. Foreground Cutout Texture & Elevated Plane
    const fgTexture = new THREE.CanvasTexture(mainCanvas);
    fgTexture.colorSpace = THREE.SRGBColorSpace;
    const fgGeo = new THREE.PlaneGeometry(planeWidth, planeHeight);
    const fgMat = new THREE.MeshStandardMaterial({
      map: fgTexture,
      transparent: true,
      alphaTest: 0.01,
      roughness: 0.35,
      metalness: 0.05,
      side: THREE.DoubleSide
    });
    const fgMesh = new THREE.Mesh(fgGeo, fgMat);
    fgMesh.castShadow = true;
    fgMesh.position.z = 0.1;
    scene.add(fgMesh);
    fgMeshRef.current = fgMesh;

    // 4. Photorealistic Ground Contact Shadow Disc
    const shadowGeo = new THREE.PlaneGeometry(planeWidth * 0.9, 0.7);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(shadow.color || 0x000000),
      transparent: true,
      opacity: shadow.enabled ? Math.min(0.85, (shadow.opacity || 0.5) * 1.2) : 0.3,
      depthWrite: false
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(0, floorMesh.position.y + 0.02, 0.15);
    scene.add(shadowMesh);
    shadowMeshRef.current = shadowMesh;

    // 5. Ambient Floating Studio Dust Particles
    const dustCount = 180;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount * 3; i += 3) {
      dustPos[i] = (Math.random() - 0.5) * 6;
      dustPos[i + 1] = (Math.random() - 0.5) * 4;
      dustPos[i + 2] = (Math.random() - 0.5) * 5;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0x60a5fa,
      size: 0.03,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending
    });
    const dustParticles = new THREE.Points(dustGeo, dustMat);
    scene.add(dustParticles);

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

      controls.update();

      // Floating dust shimmer
      dustParticles.rotation.y += delta * 0.03;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      resizeObserver.disconnect();
      controls.dispose();

      [floorGeo, fgGeo, shadowGeo, dustGeo].forEach((g) => g.dispose());
      [floorMat, fgMat, shadowMat, dustMat, grid.material].forEach((m) => m.dispose());
      if (bgTexture) bgTexture.dispose();
      fgTexture.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [mainCanvas, bgCanvas]);

  // Update depth separation in real time
  useEffect(() => {
    if (bgMeshRef.current) {
      bgMeshRef.current.position.z = -depthExplode;
    }
  }, [depthExplode]);

  // Update autoRotate in controls
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // Update directional light from shadow settings
  useEffect(() => {
    if (dirLightRef.current) {
      dirLightRef.current.position.set(
        (shadow.offsetX || 0) * 0.05 + 2,
        5,
        (shadow.offsetY || 20) * 0.03 + 3
      );
    }
    if (shadowMeshRef.current) {
      shadowMeshRef.current.material.opacity = shadow.enabled
        ? Math.min(0.85, (shadow.opacity || 0.5) * 1.2)
        : 0.3;
      if (shadow.color) {
        shadowMeshRef.current.material.color.set(shadow.color);
      }
    }
  }, [shadow]);

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div className="relative w-full h-full min-h-[450px] bg-studio-950 overflow-hidden flex flex-col select-none">
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full flex-1 cursor-grab active:cursor-grabbing" />

      {/* Floating 3D Spatial HUD Toolbar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-30">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-studio-900/90 backdrop-blur-xl border border-studio-borderHighlight text-white shadow-studio pointer-events-auto">
          <Rotate3D className="w-4 h-4 text-brand-400" />
          <span className="text-xs font-bold font-display">Three.js 3D Spatial Stage</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-mono font-bold border border-brand-500/30">
            WEBGL 3D
          </span>
        </div>

        <button
          onClick={onClose}
          aria-label="Exit 3D view"
          className="p-2 rounded-2xl bg-studio-900/90 hover:bg-studio-800 backdrop-blur-xl border border-studio-borderHighlight text-slate-300 hover:text-white transition shadow-studio pointer-events-auto"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom Floating Spatial Controls Pedestal */}
      <div className="absolute bottom-5 inset-x-0 flex justify-center pointer-events-none z-30">
        <div className="pointer-events-auto flex items-center gap-4 px-5 py-2.5 rounded-2xl pedestal-3d bg-studio-900/95 backdrop-blur-2xl border border-studio-borderHighlight text-white text-xs">
          {/* Depth Explode Separation Slider */}
          <div className="flex items-center gap-2.5 pr-3 border-r border-studio-border">
            <Layers className="w-4 h-4 text-brand-400" />
            <span className="font-semibold text-slate-300">Spatial Depth:</span>
            <input
              type="range"
              min="0"
              max="2.5"
              step="0.05"
              value={depthExplode}
              onChange={(e) => setDepthExplode(parseFloat(e.target.value))}
              className="w-24 cursor-pointer"
            />
            <span className="font-mono text-brand-300 font-bold w-10 text-right">
              {depthExplode.toFixed(2)}m
            </span>
          </div>

          {/* Auto Rotate Toggle */}
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              autoRotate
                ? 'bg-brand-500 text-white shadow-glow'
                : 'bg-studio-800 text-slate-300 hover:text-white'
            }`}
          >
            <Rotate3D className="w-3.5 h-3.5" />
            <span>{autoRotate ? 'Orbiting' : 'Paused'}</span>
          </button>

          {/* Reset Camera View */}
          <button
            onClick={handleResetCamera}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl btn-3d-secondary text-xs font-semibold text-slate-200 transition"
          >
            <Eye className="w-3.5 h-3.5 text-brand-400" />
            <span>Reset View</span>
          </button>
        </div>
      </div>
    </div>
  );
}
