export interface Point {
  x: number
  y: number
}
export interface Node extends Point {
  id: string
}

const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)

export function nearestNode<N extends Node>(nodes: N[], p: Point): N {
  return nodes.reduce((best, n) => (dist(n, p) < dist(best, p) ? n : best), nodes[0])
}

/** Dijkstra on an undirected graph weighted by euclidean length. Returns the node path, or null. */
export function shortestPath<N extends Node>(nodes: N[], edges: [string, string][], from: string, to: string): N[] | null {
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const adj = new Map<string, { id: string; w: number }[]>()
  for (const [a, b] of edges) {
    const na = byId.get(a)
    const nb = byId.get(b)
    if (!na || !nb) continue
    const w = dist(na, nb)
    adj.set(a, [...(adj.get(a) ?? []), { id: b, w }])
    adj.set(b, [...(adj.get(b) ?? []), { id: a, w }])
  }

  const best = new Map<string, number>([[from, 0]])
  const prev = new Map<string, string>()
  const open = new Set<string>([from])
  while (open.size) {
    let cur = ''
    for (const id of open) if (!cur || (best.get(id) ?? Infinity) < (best.get(cur) ?? Infinity)) cur = id
    open.delete(cur)
    if (cur === to) break
    for (const { id, w } of adj.get(cur) ?? []) {
      const d = (best.get(cur) ?? Infinity) + w
      if (d < (best.get(id) ?? Infinity)) {
        best.set(id, d)
        prev.set(id, cur)
        open.add(id)
      }
    }
  }
  if (!best.has(to)) return null

  const path: N[] = []
  for (let id: string | undefined = to; id; id = prev.get(id)) {
    const n = byId.get(id)
    if (n) path.unshift(n)
    if (id === from) break
  }
  return path
}

export function pathLength(points: Point[]): number {
  return points.slice(1).reduce((sum, p, i) => sum + dist(points[i], p), 0)
}
