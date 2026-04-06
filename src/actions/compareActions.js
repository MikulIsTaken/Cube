import { AppState } from '../state/AppState.js';
import { generateScrambleSequence } from '../utils/scramble.js';
import { generateSmartSolveSequence } from '../utils/solvePlan.js';

// --- COMPARE SPECIFIC ACTIONS ---
export function scrambleAllCompare() {
    if (AppState.instances.length === 0) return;

    AppState.globalScramble = generateScrambleSequence(AppState.order);

    AppState.instances.forEach(inst => {
        inst.buildCube(AppState.order);
        inst.applyInstantly(AppState.globalScramble.join(" "));

        inst.ui.phase.innerText = `Scrambled (${AppState.globalScramble.length} moves)`;
        inst.ui.status.innerText = "Ready";
        inst.ui.status.className = "status-badge px-1.5 py-0.5 rounded bg-gray-700 text-[9px] font-bold text-white uppercase tracking-wider";
        inst.stats.moves = 0;
        inst.stats.elapsedTime = 0;
        inst.ui.moves.innerText = "0";
        inst.ui.time.innerText = "0.00s";
    });

    document.getElementById('btn-compare-solve').disabled = false;
    document.getElementById('btn-compare-solve').classList.remove('opacity-50', 'cursor-not-allowed');
    document.getElementById('compare-results-banner').classList.add('hidden');
}

export function solveAllCompare() {
    if (AppState.instances.length === 0 || AppState.globalScramble.length === 0) return;

    document.getElementById('btn-compare-solve').disabled = true;
    document.getElementById('btn-compare-solve').classList.add('opacity-50', 'cursor-not-allowed');
    document.getElementById('compare-results-banner').classList.add('hidden');

    AppState.instances.forEach(inst => {
        const solvePlan = generateSmartSolveSequence(inst.methodId, AppState.globalScramble);

        inst.moveQueue = [];
        inst.stats.moves = 0;

        solvePlan.forEach(phase => {
            inst.queueMove({ type: 'ui', text: phase.phase });
            inst.queueMove(phase.seq, false, AppState.animDuration * (0.8 + Math.random() * 0.4));
        });

        inst.startTimer();
        inst.processQueue();
    });
}

export function checkAllCompareSolved() {
    if (AppState.mode !== 'compare') return;
    const allSolved = AppState.instances.every(inst => inst.stats.status === 'solved');

    if (allSolved) {
        const byTime = [...AppState.instances].sort((a, b) => a.stats.elapsedTime - b.stats.elapsedTime);
        const byMoves = [...AppState.instances].sort((a, b) => a.stats.moves - b.stats.moves);

        document.getElementById('res-fastest').innerText = `${byTime[0].ui.title.innerText} (${byTime[0].stats.elapsedTime.toFixed(2)}s)`;
        document.getElementById('res-fewest').innerText = `${byMoves[0].ui.title.innerText} (${byMoves[0].stats.moves} moves)`;

        byTime[0].ui.time.classList.add('text-yellow-400');
        byMoves[0].ui.moves.classList.add('text-yellow-400');

        document.getElementById('compare-results-banner').classList.remove('hidden');
        document.getElementById('btn-compare-solve').disabled = false;
        document.getElementById('btn-compare-solve').classList.remove('opacity-50', 'cursor-not-allowed');
    }
}
