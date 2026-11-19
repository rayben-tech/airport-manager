"""Shortest walking route over map_nodes / map_edges (Dijkstra with heapq, no extra dependency)."""

import heapq
import math
from dataclasses import dataclass

METERS_PER_UNIT = 0.4  # 1 map unit = 0.4 m
WALK_SPEED = 1.3  # m/s


@dataclass(frozen=True)
class Node:
    id: int
    x: int
    y: int
    floor_level: int
    kind: str


def shortest_path(nodes: dict[int, Node], edges: list[tuple[int, int, float]], start: int, goal: int) -> tuple[list[int], float] | None:
    """Return (node ids from start to goal, total weight in map units), or None when unreachable."""
    graph: dict[int, list[tuple[int, float]]] = {n: [] for n in nodes}
    for a, b, w in edges:
        if a in graph and b in graph:
            graph[a].append((b, w))
            graph[b].append((a, w))

    dist = {start: 0.0}
    prev: dict[int, int] = {}
    heap = [(0.0, start)]
    done: set[int] = set()
    while heap:
        d, node = heapq.heappop(heap)
        if node in done:
            continue
        if node == goal:
            break
        done.add(node)
        for nxt, w in graph.get(node, []):
            nd = d + w
            if nd < dist.get(nxt, math.inf):
                dist[nxt] = nd
                prev[nxt] = node
                heapq.heappush(heap, (nd, nxt))
    if goal not in dist:
        return None
    path = [goal]
    while path[-1] != start:
        path.append(prev[path[-1]])
    path.reverse()
    return path, dist[goal]


def walking_time(distance_units: float) -> tuple[int, int]:
    """(meters, minutes) for a distance in map units; at least 1 minute."""
    meters = distance_units * METERS_PER_UNIT
    return round(meters), max(1, round(meters / WALK_SPEED / 60))


def level_change_note(path: list[int], nodes: dict[int, Node]) -> str | None:
    """French instruction when the route changes level (elevator or stairs)."""
    for a, b in zip(path, path[1:]):
        na, nb = nodes[a], nodes[b]
        if na.floor_level != nb.floor_level:
            target = nodes[path[-1]].floor_level
            means = "l'ascenseur" if na.kind == "elevator" else "les escaliers"
            return f"Prenez {means} jusqu'au niveau {target}."
    return None
