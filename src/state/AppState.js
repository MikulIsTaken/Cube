import * as THREE from 'three';

export const AppState = {
    mode: 'single',
    order: 3,
    globalScramble: [],
    instances: [],
    animDuration: 0.4,
    isSyncing: false,
    scene: new THREE.Scene(),
    renderer: null
};
