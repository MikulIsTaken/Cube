import * as THREE from 'three';
import { AppState } from '../state/AppState.js';

// --- MOUSE DRAG INTERACTION (Single Mode Only) ---
export function bindMouseInteraction() {
    let isDraggingCube = false;
    let dragPlane = new THREE.Plane();
    let startIntersection3D = new THREE.Vector3();
    let hitNormalLocal = new THREE.Vector3();
    let hitCubiePos = new THREE.Vector3();
    let hoveredMesh = null;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const DRAG_THRESHOLD = 0.3;

    window.addEventListener('pointermove', (e) => {
        if (AppState.mode !== 'single') return;
        const mainInst = AppState.instances[0];
        if (!mainInst) return;

        const container = document.getElementById('viewports-container');
        const rect = container.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        if (isDraggingCube) return;

        if (mainInst.isAnimating) {
            if (hoveredMesh) {
                hoveredMesh.material.emissive.setHex(0x000000);
                hoveredMesh = null;
                document.body.style.cursor = 'default';
            }
            return;
        }

        raycaster.setFromCamera(mouse, mainInst.camera);
        const hits = raycaster.intersectObjects(mainInst.cubeGroup.children, true);

        if (hoveredMesh) {
            hoveredMesh.material.emissive.setHex(0x000000);
            hoveredMesh = null;
            document.body.style.cursor = 'default';
        }

        if (hits.length > 0) {
            hoveredMesh = hits[0].object;
            hoveredMesh.material.emissive.setHex(0x333333);
            document.body.style.cursor = 'grab';
        }
    });

    window.addEventListener('pointerdown', (e) => {
        if (AppState.mode !== 'single') return;
        const mainInst = AppState.instances[0];
        if (!mainInst || mainInst.isAnimating) return;

        if (!e.target.classList.contains('viewport-zone') && e.target.tagName !== 'CANVAS') return;

        const container = document.getElementById('viewports-container');
        const rect = container.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, mainInst.camera);
        const hits = raycaster.intersectObjects(mainInst.cubeGroup.children, true);

        if (hits.length > 0) {
            let hit = hits[0];
            hitNormalLocal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld).round();

            hitCubiePos.copy(hit.object.parent.position);

            dragPlane.setFromNormalAndCoplanarPoint(hitNormalLocal, hit.point);
            startIntersection3D.copy(hit.point);

            // Allow manual drag override to break the UI's paused state instantly
            mainInst.moveQueue = [];
            mainInst.isPaused = false;
            const btnPause = document.getElementById('btn-pause');
            if (btnPause) {
                btnPause.innerText = "Pause";
                btnPause.className = "bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors w-24";
            }

            isDraggingCube = true;
            mainInst.controls.enabled = false;
            document.body.style.cursor = 'grabbing';
        }
    });

    window.addEventListener('pointerup', (e) => {
        if (AppState.mode !== 'single' || !isDraggingCube) return;
        const mainInst = AppState.instances[0];

        const container = document.getElementById('viewports-container');
        const rect = container.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        isDraggingCube = false;
        mainInst.controls.enabled = true;
        document.body.style.cursor = 'default';

        if (mainInst.isAnimating) return;

        raycaster.setFromCamera(mouse, mainInst.camera);
        let endIntersection3D = new THREE.Vector3();
        let result = raycaster.ray.intersectPlane(dragPlane, endIntersection3D);

        if (result) {
            let drag3D = new THREE.Vector3().subVectors(endIntersection3D, startIntersection3D);

            if (drag3D.length() > DRAG_THRESHOLD) {

                let rotAxis = new THREE.Vector3().crossVectors(hitNormalLocal, drag3D);

                let absX = Math.abs(rotAxis.x);
                let absY = Math.abs(rotAxis.y);
                let absZ = Math.abs(rotAxis.z);

                let axis = 'x';
                let val = rotAxis.x;
                if (absY > absX && absY > absZ) { axis = 'y'; val = rotAxis.y; }
                if (absZ > absX && absZ > absY) { axis = 'z'; val = rotAxis.z; }

                let dir = Math.sign(val);
                let index = Math.round(hitCubiePos[axis] * 2) / 2;

                executeMoveFromAxis(mainInst, axis, dir, index);
            }
        }
    });
}

function executeMoveFromAxis(mainInst, axis, dir, index) {
    const offset = (AppState.order - 1) / 2;
    let moveStr = null;

    // Mapping explicitly supports index `0` mapping nicely to M, E, S notations
    let faceMap = {
        'y': [{ f: 'U', dir: -1, idx: offset }, { f: 'D', dir: 1, idx: -offset }, { f: 'E', dir: 1, idx: 0 }],
        'x': [{ f: 'R', dir: -1, idx: offset }, { f: 'L', dir: 1, idx: -offset }, { f: 'M', dir: 1, idx: 0 }],
        'z': [{ f: 'F', dir: -1, idx: offset }, { f: 'B', dir: 1, idx: -offset }, { f: 'S', dir: -1, idx: 0 }]
    };

    let candidates = faceMap[axis] || [];
    let bestMatch = null;
    for (let c of candidates) {
        if (Math.abs(c.idx - index) < 0.1) {
            bestMatch = c;
            break;
        }
    }

    if (bestMatch) {
        let isInverse = bestMatch.dir !== dir;
        moveStr = bestMatch.f + (isInverse ? "'" : "");
    } else {
        // Safeguard notation for any 4x4 inner layers outside standard naming bounds 
        moveStr = `SLICE_${axis}_${index}_${dir}`;
    }

    mainInst.queueMove(moveStr);
}
