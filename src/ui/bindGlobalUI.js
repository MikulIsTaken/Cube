import { AppState } from '../state/AppState.js';
import { setupSingleMode } from '../modes/singleMode.js';
import { setupCompareMode, createCompareView } from '../modes/compareMode.js';
import { executeSingleScramble, executeSingleSolve } from '../actions/singleActions.js';
import { scrambleAllCompare, solveAllCompare } from '../actions/compareActions.js';

// --- GLOBAL EVENT BINDING ---
export function bindGlobalUI() {
    document.getElementById('tab-single').addEventListener('click', setupSingleMode);
    document.getElementById('tab-compare').addEventListener('click', setupCompareMode);

    document.getElementById('btn-scramble').addEventListener('click', executeSingleScramble);
    document.getElementById('btn-solve').addEventListener('click', executeSingleSolve);

    document.getElementById('btn-pause').addEventListener('click', (e) => {
        const inst = AppState.instances[0];
        inst.isPaused = !inst.isPaused;
        e.target.innerText = inst.isPaused ? "Resume" : "Pause";
        e.target.className = inst.isPaused ? "bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded w-24 shadow-[0_0_15px_rgba(202,138,4,0.4)]" : "bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded w-24";
        if (!inst.isPaused && !inst.isAnimating) inst.processQueue();
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
        AppState.globalScramble = [];
        document.getElementById('btn-pause').innerText = "Pause";
        document.getElementById('btn-pause').className = "bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded w-24";
        AppState.instances[0].buildCube(AppState.order);
    });

    document.getElementById('speed-slider').addEventListener('input', (e) => {
        AppState.animDuration = parseFloat(e.target.value);
        document.getElementById('speed-val').innerText = AppState.animDuration.toFixed(1) + 's';
    });

    document.getElementById('cube-order').addEventListener('change', (e) => {
        AppState.order = parseInt(e.target.value);
        AppState.instances[0].buildCube(AppState.order);
    });

    document.getElementById('btn-create-compare').addEventListener('click', createCompareView);
    document.getElementById('btn-compare-scramble').addEventListener('click', scrambleAllCompare);
    document.getElementById('btn-compare-solve').addEventListener('click', solveAllCompare);
    document.getElementById('btn-compare-reset').addEventListener('click', createCompareView);
}
