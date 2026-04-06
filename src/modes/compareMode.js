import { AppState } from '../state/AppState.js';
import { CubeController } from '../controllers/CubeController.js';
import { onWindowResize } from '../utils/resize.js';

export function setupCompareMode() {
    AppState.mode = 'compare';
    document.getElementById('ui-single').classList.add('hidden');
    document.getElementById('ui-compare').classList.remove('hidden');
    document.getElementById('tab-compare').className = "px-4 py-1.5 rounded-full bg-purple-600 text-white font-bold text-sm transition-colors shadow-md";
    document.getElementById('tab-single').className = "px-4 py-1.5 rounded-full bg-transparent hover:bg-white/10 text-gray-300 font-bold text-sm transition-colors";

    document.getElementById('compare-results-banner').classList.add('hidden');
    const btns = ['btn-compare-solve', 'btn-compare-reset', 'btn-compare-scramble'];
    btns.forEach(id => {
        document.getElementById(id).disabled = true;
        document.getElementById(id).classList.add('opacity-50', 'cursor-not-allowed');
    });

    // Capture exact scramble mapping upon entering mode
    if (AppState.instances.length > 0 && AppState.instances[0].executedHistory.length > 0) {
        AppState.globalScramble = [...AppState.instances[0].executedHistory];
    } else {
        AppState.globalScramble = [];
    }

    const container = document.getElementById('viewports-container');
    container.innerHTML = '';

    AppState.instances.forEach(inst => AppState.scene.remove(inst.cubeGroup));
    AppState.instances = [];
}

export function createCompareView() {
    const selectedBoxes = document.querySelectorAll('.compare-method-cb:checked');
    if (selectedBoxes.length < 2 || selectedBoxes.length > 3) {
        alert("Please select 2 or 3 methods to compare.");
        return;
    }

    document.getElementById('compare-results-banner').classList.add('hidden');
    const container = document.getElementById('viewports-container');
    container.innerHTML = '';

    AppState.instances.forEach(inst => AppState.scene.remove(inst.cubeGroup));
    AppState.instances = [];

    container.style.left = "360px";
    container.style.width = "calc(100vw - 360px)";

    Array.from(selectedBoxes).forEach((cb, idx) => {
        const vpDiv = document.createElement('div');
        vpDiv.className = "viewport-zone";
        container.appendChild(vpDiv);

        const inst = new CubeController(idx + 1, vpDiv, false);
        inst.buildCube(AppState.order);
        inst.setMethod(cb.value);

        if (AppState.globalScramble.length > 0) {
            inst.applyInstantly(AppState.globalScramble.join(" "));
            inst.ui.phase.innerText = `Scrambled (${AppState.globalScramble.length} moves)`;
        } else {
            inst.ui.phase.innerText = "Warning: Unscrambled";
        }
        AppState.instances.push(inst);
    });

    ['btn-compare-scramble', 'btn-compare-reset'].forEach(id => {
        document.getElementById(id).disabled = false;
        document.getElementById(id).classList.remove('opacity-50', 'cursor-not-allowed');
    });

    if (AppState.globalScramble.length > 0) {
        document.getElementById('btn-compare-solve').disabled = false;
        document.getElementById('btn-compare-solve').classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
        document.getElementById('btn-compare-solve').disabled = true;
        document.getElementById('btn-compare-solve').classList.add('opacity-50', 'cursor-not-allowed');
    }

    requestAnimationFrame(() => onWindowResize());
}
