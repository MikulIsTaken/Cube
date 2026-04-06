import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { AppState } from '../state/AppState.js';
import { COLORS } from '../constants/colors.js';
import { checkAllCompareSolved } from '../actions/compareActions.js';

const gsap = window.gsap;

// --- CUBE CONTROLLER ---
export class CubeController {
    constructor(id, viewportContainer, isMain = false) {
        this.id = id;
        this.container = viewportContainer;
        this.isMain = isMain;
        this.methodId = 'manual';

        this.cubeGroup = new THREE.Group();
        this.groupOffset = new THREE.Vector3(id * 20, 0, 0);
        this.cubeGroup.position.copy(this.groupOffset);
        AppState.scene.add(this.cubeGroup);

        this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        this.camera.position.set(this.groupOffset.x + 5, 5, 7);

        this.controls = new OrbitControls(this.camera, viewportContainer);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.target.copy(this.groupOffset);

        this.cubies = [];
        this.moveQueue = [];

        // SINGLE SOURCE OF TRUTH: 
        // All visible permutations of the cube are flawlessly tracked here.
        this.executedHistory = [];

        this.isAnimating = false;
        this.isPaused = false;

        this.stats = { moves: 0, startTime: 0, elapsedTime: 0, status: 'idle' };
        this.timerInterval = null;
        this.hideUiTimeout = null;

        this.controls.addEventListener('change', () => this.handleControlSync());

        this.ui = {};
        if (!isMain) this.setupCompareUI();
    }

    setupCompareUI() {
        const overlay = document.createElement('div');
        overlay.className = "absolute top-4 right-4 left-4 z-10 pointer-events-none";
        overlay.innerHTML = `
            <div class="glass-panel backdrop-blur-md bg-slate-900/80 border-t-4 border-t-blue-500 shadow-xl p-3">
                <div class="flex justify-between items-center mb-2 gap-2">
                    <h3 class="font-bold text-sm md:text-base text-white method-title uppercase tracking-widest truncate">Method</h3>
                    <span class="status-badge px-1.5 py-0.5 rounded bg-gray-700 text-[9px] font-bold text-white uppercase whitespace-nowrap tracking-wider">Ready</span>
                </div>
                <div class="flex justify-between border-b border-gray-700 pb-2 mb-2">
                    <div>
                        <div class="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Moves</div>
                        <div class="font-mono text-base md:text-lg font-bold text-white moves-text">0</div>
                    </div>
                    <div class="text-right">
                        <div class="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Time</div>
                        <div class="font-mono text-base md:text-lg font-bold text-blue-400 time-text">0.00s</div>
                    </div>
                </div>
                <div>
                    <div class="text-[9px] text-gray-400 uppercase tracking-widest mb-0.5 font-bold">Current Phase</div>
                    <div class="text-xs md:text-sm font-bold text-emerald-400 phase-text truncate">Awaiting Start</div>
                </div>
            </div>
        `;
        this.container.appendChild(overlay);

        this.ui = {
            title: overlay.querySelector('.method-title'),
            status: overlay.querySelector('.status-badge'),
            moves: overlay.querySelector('.moves-text'),
            time: overlay.querySelector('.time-text'),
            phase: overlay.querySelector('.phase-text')
        };
    }

    handleControlSync() {
        if (AppState.mode === 'compare' && document.getElementById('sync-rotations-cb').checked && !AppState.isSyncing) {
            AppState.isSyncing = true;
            AppState.instances.forEach(other => {
                if (other !== this) {
                    const offset = new THREE.Vector3().subVectors(this.camera.position, this.controls.target);
                    other.camera.position.copy(other.controls.target).add(offset);
                    other.camera.quaternion.copy(this.camera.quaternion);
                    other.controls.update();
                }
            });
            AppState.isSyncing = false;
        }
    }

    buildCube(order) {
        while (this.cubeGroup.children.length > 0) {
            this.cubeGroup.remove(this.cubeGroup.children[0]);
        }
        this.cubies = [];
        this.moveQueue = [];
        this.executedHistory = [];
        this.stats = { moves: 0, startTime: 0, elapsedTime: 0, status: 'idle' };
        this.updateUI();
        clearInterval(this.timerInterval);

        const offset = (order - 1) / 2;
        const spacing = 1.0, cubieSize = 0.94, stickerSize = 0.84, stickerThickness = 0.02;

        const coreMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7, metalness: 0.2 });
        const stickerMats = {};
        for (const [key, color] of Object.entries(COLORS)) {
            stickerMats[key] = new THREE.MeshPhysicalMaterial({ color: color, roughness: 0.1, metalness: 0.1 });
        }

        for (let x = 0; x < order; x++) {
            for (let y = 0; y < order; y++) {
                for (let z = 0; z < order; z++) {
                    const px = x - offset, py = y - offset, pz = z - offset;
                    const cubie = new THREE.Group();
                    cubie.position.set(px * spacing, py * spacing, pz * spacing);

                    const coreMesh = new THREE.Mesh(new THREE.BoxGeometry(cubieSize, cubieSize, cubieSize), coreMat.clone());
                    coreMesh.castShadow = true; coreMesh.receiveShadow = true;
                    cubie.add(coreMesh);

                    const p = cubieSize / 2;
                    const addSticker = (mat, pos, rot) => {
                        const mesh = new THREE.Mesh(new THREE.BoxGeometry(stickerSize, stickerSize, stickerThickness), mat.clone());
                        mesh.position.set(...pos); mesh.rotation.set(...rot);
                        cubie.add(mesh);
                    };

                    if (y === order - 1) addSticker(stickerMats.U, [0, p, 0], [Math.PI / 2, 0, 0]);
                    if (y === 0) addSticker(stickerMats.D, [0, -p, 0], [Math.PI / 2, 0, 0]);
                    if (z === order - 1) addSticker(stickerMats.F, [0, 0, p], [0, 0, 0]);
                    if (z === 0) addSticker(stickerMats.B, [0, 0, -p], [0, 0, 0]);
                    if (x === order - 1) addSticker(stickerMats.R, [p, 0, 0], [0, Math.PI / 2, 0]);
                    if (x === 0) addSticker(stickerMats.L, [-p, 0, 0], [0, Math.PI / 2, 0]);

                    this.cubeGroup.add(cubie);
                    this.cubies.push(cubie);
                }
            }
        }
    }

    // Universal parser handling M, E, S and dynamic non-standard SLICE notation
    parseNotation(notation) {
        if (notation.startsWith('SLICE_')) {
            let parts = notation.split('_');
            return [{ axis: parts[1], index: parseFloat(parts[2]), dir: parseInt(parts[3]), notation: notation }];
        }

        let face = notation[0];
        let isInverse = notation.includes("'");
        let isDouble = notation.includes("2");
        const offset = (AppState.order - 1) / 2;

        let moveDef = {
            'U': { axis: 'y', index: offset, dir: -1 },
            'D': { axis: 'y', index: -offset, dir: 1 },
            'R': { axis: 'x', index: offset, dir: -1 },
            'L': { axis: 'x', index: -offset, dir: 1 },
            'F': { axis: 'z', index: offset, dir: -1 },
            'B': { axis: 'z', index: -offset, dir: 1 },
            'M': { axis: 'x', index: 0, dir: 1 },
            'E': { axis: 'y', index: 0, dir: 1 },
            'S': { axis: 'z', index: 0, dir: -1 }
        }[face];

        if (!moveDef) return null;

        let finalDir = moveDef.dir * (isInverse ? -1 : 1);

        // Store double moves explicitly as two separate atomic pushes for perfect history tracking
        let atomicNot = face + (isInverse ? "'" : "");
        let moves = [{ axis: moveDef.axis, index: moveDef.index, dir: finalDir, notation: atomicNot }];
        if (isDouble) {
            moves.push({ axis: moveDef.axis, index: moveDef.index, dir: finalDir, notation: atomicNot });
        }
        return moves;
    }

    queueMove(moveData, overrideSpeed = null) {
        if (typeof moveData === 'string') {
            moveData.split(" ").forEach(m => {
                if (!m) return;
                let parsed = this.parseNotation(m);
                if (parsed) {
                    parsed.forEach(pMove => {
                        if (overrideSpeed) pMove.overrideSpeed = overrideSpeed;
                        this.moveQueue.push(pMove);
                    });
                }
            });
        } else {
            if (overrideSpeed) moveData.overrideSpeed = overrideSpeed;
            this.moveQueue.push(moveData);
        }
        this.updateUI();
        if (!this.isAnimating && !this.isPaused) this.processQueue();
    }

    applyInstantly(notationStr) {
        if (!notationStr) return;
        notationStr.split(" ").forEach(notation => {
            if (!notation) return;
            let parsed = this.parseNotation(notation);
            if (!parsed) return;
            parsed.forEach(move => {
                let targetCubies = this.cubies.filter(c => Math.abs(c.position[move.axis] - move.index) < 0.1);
                let pivot = new THREE.Object3D();
                this.cubeGroup.add(pivot);
                targetCubies.forEach(c => pivot.attach(c));

                pivot.rotation[move.axis] += (move.dir * Math.PI / 2);
                pivot.updateMatrixWorld();

                targetCubies.forEach(c => {
                    this.cubeGroup.attach(c);
                    c.position.set(Math.round(c.position.x * 2) / 2, Math.round(c.position.y * 2) / 2, Math.round(c.position.z * 2) / 2);
                    const snap = (v) => Math.round(v / (Math.PI / 2)) * (Math.PI / 2);
                    c.rotation.set(snap(c.rotation.x), snap(c.rotation.y), snap(c.rotation.z));
                });
                this.cubeGroup.remove(pivot);

                // Push exact physical updates to the source of truth
                if (move.notation) this.executedHistory.push(move.notation);
            });
        });
    }

    processQueue() {
        if (this.isAnimating || this.isPaused || this.moveQueue.length === 0) {
            if (this.moveQueue.length === 0 && this.stats.status === 'solving') this.stopTimer();
            return;
        }

        const move = this.moveQueue.shift();

        if (move.type === 'ui') {
            if (this.hideUiTimeout) { clearTimeout(this.hideUiTimeout); this.hideUiTimeout = null; }
            if (this.isMain) {
                document.getElementById('single-phase-text').innerText = move.text;
                document.getElementById('single-phase-indicator').classList.remove('hidden');
            } else {
                this.ui.phase.innerText = move.text;
            }
            this.updateUI();
            this.processQueue();
            return;
        }

        if (move.type === 'reset_history') {
            this.executedHistory = [];
            this.processQueue();
            return;
        }

        if (move.type === 'hide_ui') {
            if (this.isMain) {
                if (this.hideUiTimeout) clearTimeout(this.hideUiTimeout);
                this.hideUiTimeout = setTimeout(() => {
                    const el = document.getElementById('single-phase-indicator');
                    if (el) el.classList.add('hidden');
                }, move.delay || 0);
            }
            this.processQueue();
            return;
        }

        this.isAnimating = true;
        this.stats.moves++;

        if (this.isMain) document.getElementById('single-current-move').innerText = move.notation || "-";
        this.updateUI();

        let targetCubies = this.cubies.filter(c => Math.abs(c.position[move.axis] - move.index) < 0.1);
        let pivot = new THREE.Object3D();
        this.cubeGroup.add(pivot);
        targetCubies.forEach(c => pivot.attach(c));

        let targetRot = pivot.rotation[move.axis] + (move.dir * Math.PI / 2);

        gsap.to(pivot.rotation, {
            [move.axis]: targetRot,
            duration: move.overrideSpeed || AppState.animDuration,
            ease: "power2.inOut",
            onComplete: () => {
                pivot.updateMatrixWorld();
                targetCubies.forEach(c => {
                    this.cubeGroup.attach(c);
                    c.position.set(Math.round(c.position.x * 2) / 2, Math.round(c.position.y * 2) / 2, Math.round(c.position.z * 2) / 2);
                    const snap = (v) => Math.round(v / (Math.PI / 2)) * (Math.PI / 2);
                    c.rotation.set(snap(c.rotation.x), snap(c.rotation.y), snap(c.rotation.z));
                });
                this.cubeGroup.remove(pivot);

                // Every successful visual physical rotation lands directly in the source of truth history.
                if (move.notation) this.executedHistory.push(move.notation);

                this.isAnimating = false;
                this.processQueue();
            }
        });
    }

    setMethod(methodId) {
        this.methodId = methodId;
        if (!this.isMain) {
            const titles = { 'cfop': 'CFOP', 'roux': 'Roux', 'lbl': 'Beginner', 'zz': 'ZZ', 'petrus': 'Petrus' };
            this.ui.title.innerText = titles[methodId] || methodId;
            this.ui.title.className = `font-bold text-sm md:text-base uppercase tracking-widest truncate ${methodId === 'cfop' ? 'text-purple-400' : methodId === 'roux' ? 'text-blue-400' : methodId === 'lbl' ? 'text-emerald-400' : methodId === 'zz' ? 'text-pink-400' : 'text-orange-400'
                }`;
        }
    }

    startTimer() {
        this.stats.startTime = performance.now();
        this.stats.status = 'solving';
        this.stats.moves = 0;
        if (!this.isMain) {
            this.ui.status.innerText = 'Solving';
            this.ui.status.className = "status-badge px-1.5 py-0.5 rounded bg-blue-600 text-[9px] font-bold text-white uppercase tracking-wider";
        }

        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.stats.elapsedTime = (performance.now() - this.stats.startTime) / 1000;
            if (!this.isMain) this.ui.time.innerText = this.stats.elapsedTime.toFixed(2) + 's';
        }, 50);
    }

    stopTimer() {
        this.stats.status = 'solved';
        clearInterval(this.timerInterval);
        if (!this.isMain) {
            this.ui.status.innerText = 'Solved';
            this.ui.status.className = "status-badge px-1.5 py-0.5 rounded bg-emerald-600 text-[9px] font-bold text-white uppercase tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.5)]";
            this.ui.phase.innerText = "Completed!";
            checkAllCompareSolved();
        }
    }

    updateUI() {
        if (this.isMain) {
            document.getElementById('single-queue-count').innerText = this.moveQueue.filter(m => m.type !== 'ui' && m.type !== 'reset_history').length;
        } else {
            this.ui.moves.innerText = this.stats.moves;
        }
    }

    resize() {
        if (!this.container || this.container.clientHeight === 0) return;
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.aspect = aspect;

        if (aspect < 1) {
            this.camera.zoom = aspect * 1.3;
        } else {
            this.camera.zoom = 1;
        }
        this.camera.updateProjectionMatrix();
    }
}
