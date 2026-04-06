export function generateScrambleSequence(order) {
    const sequence = [];
    const length = order === 2 ? 10 : order === 3 ? 20 : 40; // Lengthened scramble for 4x4+ 
    const axes = ['x', 'y', 'z'];

    // Map the valid physical slice indices to turn
    const offset = (order - 1) / 2;
    const indices = [];
    for (let i = -offset; i <= offset; i++) indices.push(i);

    let lastAxis = '';
    for (let i = 0; i < length; i++) {
        let axis;
        do { axis = axes[Math.floor(Math.random() * axes.length)]; } while (axis === lastAxis);
        lastAxis = axis;

        let idx = indices[Math.floor(Math.random() * indices.length)];
        let dirs = [-1, 1];
        let dir = dirs[Math.floor(Math.random() * dirs.length)];
        let isDouble = Math.random() > 0.7; // 30% chance for a double 180° move

        let moveStr = null;

        // Map logical indices to standard faces where applicable
        if (axis === 'y' && Math.abs(idx - offset) < 0.1) moveStr = 'U' + (dir === 1 ? "'" : "");
        else if (axis === 'y' && Math.abs(idx - (-offset)) < 0.1) moveStr = 'D' + (dir === -1 ? "'" : "");
        else if (axis === 'x' && Math.abs(idx - offset) < 0.1) moveStr = 'R' + (dir === 1 ? "'" : "");
        else if (axis === 'x' && Math.abs(idx - (-offset)) < 0.1) moveStr = 'L' + (dir === -1 ? "'" : "");
        else if (axis === 'z' && Math.abs(idx - offset) < 0.1) moveStr = 'F' + (dir === 1 ? "'" : "");
        else if (axis === 'z' && Math.abs(idx - (-offset)) < 0.1) moveStr = 'B' + (dir === -1 ? "'" : "");
        else if (Math.abs(idx - 0) < 0.1) {
            if (axis === 'x') moveStr = 'M' + (dir === -1 ? "'" : "");
            else if (axis === 'y') moveStr = 'E' + (dir === -1 ? "'" : "");
            else if (axis === 'z') moveStr = 'S' + (dir === 1 ? "'" : "");
        }

        if (moveStr) {
            if (isDouble) moveStr = moveStr[0] + "2";
            sequence.push(moveStr);
        } else {
            // Fallback to the dynamic SLICE_ notation for internal 4x4/NxN pieces
            let s = `SLICE_${axis}_${idx}_${dir}`;
            sequence.push(s);
            // Standard inner slice notation natively handles atomic 90deg queueing, so fire twice for 180deg
            if (isDouble) sequence.push(s);
        }
    }
    return sequence;
}
