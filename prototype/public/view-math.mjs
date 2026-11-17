export const BOARD = Object.freeze({ columns: 6, rows: 5, cellWidth: 100, cellHeight: 97, gap: 5, width: 625, height: 505 });
export const cellCenter = position => ({ x: (position % 6) * 105 + 50, y: Math.floor(position / 6) * 102 + 48.5 });

export function bookRules(book, current) {
  return book ? book.rules ?? { bloodThreshold: 3, offeringThreshold: 3, interventionTiming: 'immediate' } : current;
}

export function bloodGeometry(count) {
  return { angles: Array.from({ length: count }, (_, i) => -Math.PI * .75 + i * Math.PI * .5 / (count - 1)), half: count === 3 ? .37 : .17 };
}

// Non-paying purchase ceremony only; never passed to the outcome engine.
export function purchaseEntryBoard(mode, quietBoard) {
  const positions = { lesser:[7,16,25], blood:[7,10,19,22], greater:[6,10,14,19,23], god:[14] }[mode];
  if (!positions) return null;
  return quietBoard.map((row,r)=>row.map((cell,c)=>({ ...cell, symbol:positions.includes(r*6+c)?'S':cell.symbol, marked:false })));
}

// One display mapping is shared by the accelerated and basic renderers.
export function symbolArt(art, symbol) {
  for (const kind of ['ranks', 'symbols', 'scatter']) {
    const sheet = art?.[kind];
    if (!sheet) continue;
    const index = sheet.cells ? sheet.cells[symbol] : sheet.order?.indexOf(symbol);
    if (!Number.isInteger(index) || index < 0) continue;
    const columns = sheet.columns || 1, rows = sheet.rows || 1;
    if (index >= columns * rows) continue;
    const width = sheet.width / columns, height = sheet.height / rows;
    return { kind, sheet, index, frame: { x: index % columns * width, y: Math.floor(index / columns) * height, width, height } };
  }
  return null;
}

// Match only recorded survivors. No symbols, marks or wins are generated here.
export function planTumble(previous, next, clearPositions) {
  const clear = new Set(clearPositions);
  const moves = [];
  for (let col = 0; col < 6; col++) {
    const survivors = Array.from({ length: 5 }, (_, row) => row * 6 + col).filter(position => !clear.has(position));
    const gap = 5 - survivors.length;
    for (let row = 0; row < 5; row++) {
      const to = row * 6 + col;
      const from = row < gap ? null : survivors[row - gap];
      if (from !== null) {
        const a = previous[Math.floor(from / 6)][col], b = next[row][col];
        if (a.symbol !== b.symbol || a.marked !== b.marked) throw new Error('Recorded tumble survivor mismatch.');
      }
      moves.push({ from, to, entering: from === null, distance: from === null ? gap : row - Math.floor(from / 6) });
    }
  }
  return moves;
}
