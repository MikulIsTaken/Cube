import { AppState } from '../state/AppState.js';
import { CubeController } from '../controllers/CubeController.js';
import { onWindowResize } from '../utils/resize.js';

export function setupSingleMode() {
    AppState.mode = 'single';
    document.getElementById('ui-single').classList.remove('hidden');
    document.getElementById('ui-compare').classList.add('hidden');
    document.getElementById('tab-single').className = "px-4 py-1.5 rounded-full bg-blue-600 text-white font-bold text-sm transition-colors shadow-md";
    document.getElementById('tab-compare').className = "px-4 py-1.5 rounded-full bg-transparent hover:bg-white/10 text-gray-300 font-bold text-sm transition-colors";

    const container = document.getElementById('viewports-container');
    container.style.left = "0";
    container.style.width = "100vw";
    container.innerHTML = `<div class="viewport-zone" id="vp-main"></div>`;

    AppState.instances.forEach(inst => AppState.scene.remove(inst.cubeGroup));
    AppState.instances = [];

    const mainInst = new CubeController(0, document.getElementById('vp-main'), true);
    mainInst.buildCube(AppState.order);
    AppState.instances.push(mainInst);

    setTimeout(() => onWindowResize(), 10);
}
