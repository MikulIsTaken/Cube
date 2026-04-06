import { invertNotation } from './notation.js';

export function generateSmartSolveSequence(methodId, scrambleHistory) {

    // HISTORY OPTIMIZER: Cancels out redundant manual moves (like dragging U then U') 
    // before creating the algorithmic solve path. This makes manual manipulation look professional to solve.
    let optimizedScramble = [];
    for (let m of scrambleHistory) {
        if (optimizedScramble.length > 0 && optimizedScramble[optimizedScramble.length - 1] === invertNotation(m)) {
            optimizedScramble.pop();
        } else {
            optimizedScramble.push(m);
        }
    }

    let baseSolve = optimizedScramble.slice().reverse().map(invertNotation);

    let modifiedSolve = [];
    const paddings = ['U U\'', 'R R\'', 'F F\'', 'D D\''];
    baseSolve.forEach(m => {
        modifiedSolve.push(m);
        if (Math.random() < (methodId === 'cfop' ? 0.05 : 0.15)) {
            modifiedSolve.push(...paddings[Math.floor(Math.random() * paddings.length)].split(" "));
        }
    });

    if (modifiedSolve.length === 0) modifiedSolve.push("U", "U'");

    const phaseDef = {
        'lbl': ["Cross", "F2L Corners", "Mid Edges", "OLL", "PLL"],
        'cfop': ["Cross", "F2L Pairs", "OLL", "PLL"],
        'roux': ["First Block", "Second Block", "CMLL", "LSE"],
        'zz': ["EOLine", "Zz F2L", "LL Alg"],
        'petrus': ["2x2x2 Block", "2x2x3 Block", "Edge Orient", "Finish F2L", "Last Layer"]
    };

    const phases = phaseDef[methodId] || ["Solving Phase"];
    let chunked = [];
    let chunkSize = Math.max(1, Math.ceil(modifiedSolve.length / phases.length));

    for (let i = 0; i < phases.length; i++) {
        let chunkMoves = modifiedSolve.slice(i * chunkSize, (i + 1) * chunkSize);
        if (chunkMoves.length > 0) chunked.push({ phase: phases[i], seq: chunkMoves.join(" ") });
    }
    return chunked;
}
