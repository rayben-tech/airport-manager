import math

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select

from ..deps import DbSession
from ..models import Location, MapEdge, MapNode
from ..navigation import Node, level_change_note, shortest_path, walking_time
from ..schemas import RouteOut, RoutePoint

router = APIRouter(prefix="/navigation", tags=["Navigation"])

DEFAULT_START_LABEL = "Vous êtes ici"


@router.get("/route", response_model=RouteOut, summary="Itinéraire à pied vers un lieu (Dijkstra)")
def route(
    db: DbSession,
    to_location_id: int = Query(alias="toLocationId"),
    from_node_id: int | None = Query(None, alias="fromNodeId", description="Par défaut : le point « Vous êtes ici »"),
) -> RouteOut:
    target = db.get(Location, to_location_id)
    if target is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Lieu de destination introuvable.")

    nodes = {n.id: Node(n.id, n.x, n.y, n.floor_level, n.kind) for n in db.scalars(select(MapNode)).all()}
    edges = [(e.node_a_id, e.node_b_id, float(e.weight)) for e in db.scalars(select(MapEdge)).all()]

    if from_node_id is None:
        start = db.scalar(select(MapNode.id).where(MapNode.label == DEFAULT_START_LABEL).order_by(MapNode.floor_level.desc()).limit(1))
        if start is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Point de départ « Vous êtes ici » introuvable dans le plan.")
    elif from_node_id not in nodes:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Point de départ introuvable.")
    else:
        start = from_node_id

    goal = target.node_id
    if goal is None or goal not in nodes:  # fallback: closest node on the same level
        same_level = [n for n in nodes.values() if n.floor_level == target.floor_level]
        if not same_level:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Ce lieu n'est relié à aucun couloir du plan.")
        goal = min(same_level, key=lambda n: math.dist((n.x, n.y), (target.x, target.y))).id

    found = shortest_path(nodes, edges, start, goal)
    if found is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Aucun itinéraire trouvé vers ce lieu.")
    path, units = found
    last = nodes[path[-1]]
    units += math.dist((last.x, last.y), (target.x, target.y))  # last few steps from the corridor to the place
    meters, minutes = walking_time(units)
    points = [RoutePoint(x=nodes[i].x, y=nodes[i].y, floor_level=nodes[i].floor_level) for i in path]
    points.append(RoutePoint(x=target.x, y=target.y, floor_level=target.floor_level))
    note = level_change_note(path, nodes)
    return RouteOut(from_node_id=start, to_location_id=target.id, points=points, distance_meters=meters, minutes=minutes,
                    changes_level=note is not None, note=note)
