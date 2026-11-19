const N = 21

/** Decorative QR-like pattern, deterministic for a given seed. */
function cells(seed: string) {
  let h = 0
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const out: [number, number][] = []
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const corner = [
        [0, 0],
        [N - 7, 0],
        [0, N - 7],
      ].find(([ox, oy]) => x >= ox - 1 && x <= ox + 7 && y >= oy - 1 && y <= oy + 7)
      if (corner) {
        const dx = x - corner[0]
        const dy = y - corner[1]
        const inside = dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6
        if (inside && (dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4))) {
          out.push([x, y])
        }
        continue
      }
      h = (h * 1664525 + 1013904223) >>> 0
      if (h >>> 28 > 7) out.push([x, y])
    }
  }
  return out
}

export default function QrCode({ seed, size = 96 }: { seed: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox={`-1.5 -1.5 ${N + 3} ${N + 3}`} className="rounded-lg bg-white" role="img" aria-label="QR code du billet">
      {cells(seed).map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1.02" height="1.02" fill="#1f1b4d" />
      ))}
    </svg>
  )
}
