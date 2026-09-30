import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

test('Three.js 3D WebGL Library Integration Suite', async (t) => {
  await t.test('verifies core Three.js exports and revision', () => {
    assert.ok(THREE.REVISION, 'Three.js revision exists');
    assert.equal(typeof THREE.Scene, 'function');
    assert.equal(typeof THREE.PerspectiveCamera, 'function');
    assert.equal(typeof THREE.Mesh, 'function');
    assert.equal(typeof THREE.IcosahedronGeometry, 'function');
    assert.equal(typeof THREE.TorusGeometry, 'function');
    assert.equal(typeof THREE.MeshStandardMaterial, 'function');
    assert.equal(typeof THREE.CanvasTexture, 'function');
    assert.equal(THREE.SRGBColorSpace, 'srgb');
  });

  await t.test('verifies OrbitControls addon class constructor', () => {
    assert.equal(typeof OrbitControls, 'function');
  });

  await t.test('calculates 3D spatial stage plane dimensions from canvas aspect ratio', () => {
    const calculatePlane = (width, height, baseHeight = 2.4) => {
      const aspect = width / (height || 1);
      return {
        height: baseHeight,
        width: baseHeight * aspect
      };
    };

    // Square 1:1 image
    const square = calculatePlane(1000, 1000);
    assert.equal(square.height, 2.4);
    assert.equal(square.width, 2.4);

    // Landscape 16:9 image
    const landscape = calculatePlane(1920, 1080);
    assert.equal(landscape.height, 2.4);
    assert.ok(Math.abs(landscape.width - 4.266) < 0.01);

    // Portrait 9:16 image
    const portrait = calculatePlane(1080, 1920);
    assert.equal(portrait.height, 2.4);
    assert.ok(Math.abs(portrait.width - 1.35) < 0.01);
  });

  await t.test('derives 3D directional spotlight coordinates from 2D shadow offsets', () => {
    const deriveLightPosition = (offsetX = 0, offsetY = 20) => {
      return {
        x: offsetX * 0.05 + 2,
        y: 5,
        z: offsetY * 0.03 + 3
      };
    };

    const defaultPos = deriveLightPosition(0, 20);
    assert.equal(defaultPos.x, 2);
    assert.equal(defaultPos.y, 5);
    assert.equal(defaultPos.z, 3.6);

    const angledPos = deriveLightPosition(40, -10);
    assert.equal(angledPos.x, 4);
    assert.equal(angledPos.y, 5);
    assert.equal(angledPos.z, 2.7);
  });

  await t.test('verifies geometry and material disposal lifecycle contracts', () => {
    const geo = new THREE.IcosahedronGeometry(1, 0);
    const mat = new THREE.MeshStandardMaterial({ color: 0x3b82f6 });

    let geoDisposed = false;
    let matDisposed = false;

    geo.addEventListener('dispose', () => {
      geoDisposed = true;
    });

    mat.addEventListener('dispose', () => {
      matDisposed = true;
    });

    geo.dispose();
    mat.dispose();

    assert.equal(geoDisposed, true);
    assert.equal(matDisposed, true);
  });
});
