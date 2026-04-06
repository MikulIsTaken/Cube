import { AppState } from '../state/AppState.js';

export function onWindowResize() {
    AppState.renderer.setSize(window.innerWidth, window.innerHeight);
    AppState.instances.forEach(inst => inst.resize());
}
