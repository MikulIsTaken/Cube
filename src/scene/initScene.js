import * as THREE from 'three';
import { AppState } from '../state/AppState.js';
import { setupSingleMode } from '../modes/singleMode.js';
import { onWindowResize } from '../utils/resize.js';
import { bindGlobalUI } from '../ui/bindGlobalUI.js';
import { bindMouseInteraction } from '../interactions/mouseInteraction.js';

// --- CORE LOGIC & INITIALIZATION ---
export function init() {
    AppState.scene.background = new THREE.Color(0x050505);
    AppState.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    AppState.renderer.setSize(window.innerWidth, window.innerHeight);
    AppState.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    AppState.renderer.shadowMap.enabled = true;
    AppState.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('canvas-container').appendChild(AppState.renderer.domElement);

    AppState.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(10, 20, 10); dirLight.castShadow = true;
    AppState.scene.add(dirLight);
    const backLight = new THREE.PointLight(0x4466ff, 1.5, 50);
    backLight.position.set(-10, -10, -10);
    AppState.scene.add(backLight);

    const starGeo = new THREE.BufferGeometry();
    const starPos = [];
    for (let i = 0; i < 2000; i++) starPos.push((Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200);
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0.8 }));
    AppState.scene.add(stars);

    setupSingleMode();
    window.addEventListener('resize', onWindowResize);
    bindGlobalUI();
    bindMouseInteraction();

    AppState.renderer.setAnimationLoop(() => {
        stars.rotation.y += 0.0002;

        AppState.renderer.setScissorTest(true);
        AppState.instances.forEach(inst => {
            inst.controls.update();

            const rect = inst.container.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;

            const aspect = rect.width / rect.height;
            if (Math.abs(inst.camera.aspect - aspect) > 0.001) {
                inst.resize();
            }

            const width = rect.width;
            const height = rect.height;
            const left = rect.left;
            const bottom = AppState.renderer.domElement.clientHeight - rect.bottom;

            AppState.renderer.setViewport(left, bottom, width, height);
            AppState.renderer.setScissor(left, bottom, width, height);
            AppState.renderer.render(AppState.scene, inst.camera);
        });
        AppState.renderer.setScissorTest(false);
    });
}
