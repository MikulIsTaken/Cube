import { AppState } from '../state/AppState.js';
import { generateScrambleSequence } from '../utils/scramble.js';
import { generateSmartSolveSequence } from '../utils/solvePlan.js';
import { invertNotation } from '../utils/notation.js';

// --- SINGLE MODE ACTIONS ---
export function executeSingleScramble() {
    document.getElementById('single-phase-indicator').classList.add('hidden');
    const mainInst = AppState.instances[0];

    // Wipes the queued un-executed moves but allows the physical history to remain untouched! 
    // Ensures multiple scrambles simply compound correctly rather than getting wiped.
    mainInst.moveQueue = [];

    const scrambleMoves = generateScrambleSequence(AppState.order);
    scrambleMoves.forEach(moveStr => {
        mainInst.queueMove(moveStr);
    });
}

export function executeSingleSolve() {
    const method = document.getElementById('solve-method').value;
    const mainInst = AppState.instances[0];

    // Safely clear any pending actions and unpause to guarantee solve executes
    mainInst.moveQueue = [];
    mainInst.isPaused = false;
    document.getElementById('btn-pause').innerText = "Pause";
    document.getElementById('btn-pause').className = "bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors w-24";
    mainInst.updateUI();

    // SINGLE SOURCE OF TRUTH: Refuse to "solve" a fresh unscrambled cube
    if (mainInst.executedHistory.length === 0) return;

    if (['lbl', 'cfop', 'roux', 'zz', 'petrus'].includes(method)) {
        // Dynamically route the exact physical history into the sequence generation
        const methodPhases = generateSmartSolveSequence(method, mainInst.executedHistory);

        methodPhases.forEach(phase => {
            mainInst.queueMove({ type: 'ui', text: `${method.toUpperCase()} Phase: ${phase.phase}` });
            mainInst.queueMove(phase.seq);
        });

        // Triggers an execution wipe once visual solve concludes seamlessly
        mainInst.queueMove({ type: 'reset_history' });
        mainInst.queueMove({ type: 'hide_ui', delay: 2500 });
        return;
    }

    // STANDARD UNDO OPTIONS
    // Leverage the history optimizer again here so simple Undo feels smooth
    let optHistory = [];
    for (let m of mainInst.executedHistory) {
        if (optHistory.length > 0 && optHistory[optHistory.length - 1] === invertNotation(m)) optHistory.pop();
        else optHistory.push(m);
    }

    let inverseHistory = optHistory.slice().reverse().map(invertNotation);

    if (method === 'instant') {
        mainInst.buildCube(AppState.order);
    } else if (method === 'fast') {
        inverseHistory.forEach(m => mainInst.queueMove(m, 0.05));
        mainInst.queueMove({ type: 'reset_history' });
    } else {
        inverseHistory.forEach(m => mainInst.queueMove(m));
        mainInst.queueMove({ type: 'reset_history' });
    }
}
