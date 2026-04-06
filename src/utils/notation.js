export const invertNotation = m => {
    if (m.startsWith('SLICE_')) {
        let p = m.split('_'); return `SLICE_${p[1]}_${p[2]}_${parseInt(p[3]) * -1}`;
    }
    if (m.includes("2")) return m; // Preserve double moves intact
    return m.includes("'") ? m.replace("'", "") : m + "'";
};
