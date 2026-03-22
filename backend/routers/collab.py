import time
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from loguru import logger

router = APIRouter()

# room_id -> {host_ws, guests: [], state: {}}
rooms: dict[str, dict[str, Any]] = {}


def _make_room(room_id: str, host_id: str) -> dict:
    return {
        "room_id": room_id,
        "host_id": host_id,
        "connections": {},  # client_id -> ws
        "names": {},  # client_id -> display name
        "state": {
            "track": None,
            "is_playing": False,
            "position_ms": 0,
            "updated_at": time.time(),
        },
        "chat": [],
        "created_at": time.time(),
    }


async def _broadcast(room: dict, message: dict, exclude: str | None = None):
    dead = []
    for client_id, ws in room["connections"].items():
        if client_id == exclude:
            continue
        try:
            await ws.send_json(message)
        except Exception:
            dead.append(client_id)
    for client_id in dead:
        room["connections"].pop(client_id, None)
        room["names"].pop(client_id, None)


@router.websocket("/ws/{room_id}/{client_id}")
async def collab_ws(
    websocket: WebSocket,
    room_id: str,
    client_id: str,
    name: str = "Guest",
):
    await websocket.accept()
    logger.info(f"WS connected: room={room_id} client={client_id} name={name}")

    # Create or join room
    if room_id not in rooms:
        rooms[room_id] = _make_room(room_id, client_id)
        logger.info(f"Room created: {room_id} by {client_id}")
        is_host = True
    else:
        is_host = rooms[room_id]["host_id"] == client_id

    room = rooms[room_id]
    room["connections"][client_id] = websocket
    room["names"][client_id] = name

    # Send welcome + current state
    await websocket.send_json(
        {
            "type": "welcome",
            "room_id": room_id,
            "client_id": client_id,
            "is_host": is_host,
            "state": room["state"],
            "members": list(room["names"].values()),
            "chat": room["chat"][-20:],
        }
    )

    # Notify others
    await _broadcast(
        room,
        {
            "type": "member_joined",
            "client_id": client_id,
            "name": name,
            "members": list(room["names"].values()),
            "member_count": len(room["connections"]),
        },
        exclude=client_id,
    )

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type == "play_track":
                if client_id == room["host_id"]:
                    room["state"].update(
                        {
                            "track": data.get("track"),
                            "is_playing": True,
                            "position_ms": 0,
                            "updated_at": time.time(),
                        }
                    )
                    await _broadcast(
                        room,
                        {
                            "type": "play_track",
                            "track": data.get("track"),
                            "position_ms": 0,
                            "timestamp": time.time(),
                        },
                    )
                    logger.info(f"Room {room_id}: playing {data.get('track', {}).get('title')}")

            elif msg_type == "sync":
                # Host sends position periodically
                if client_id == room["host_id"]:
                    room["state"].update(
                        {
                            "is_playing": data.get("is_playing", True),
                            "position_ms": data.get("position_ms", 0),
                            "updated_at": time.time(),
                        }
                    )
                    await _broadcast(
                        room,
                        {
                            "type": "sync",
                            "is_playing": data.get("is_playing"),
                            "position_ms": data.get("position_ms"),
                            "timestamp": time.time(),
                        },
                        exclude=client_id,
                    )

            elif msg_type == "pause":
                if client_id == room["host_id"]:
                    room["state"]["is_playing"] = False
                    await _broadcast(
                        room,
                        {
                            "type": "pause",
                            "position_ms": data.get("position_ms", 0),
                        },
                    )

            elif msg_type == "resume":
                if client_id == room["host_id"]:
                    room["state"]["is_playing"] = True
                    await _broadcast(
                        room,
                        {
                            "type": "resume",
                            "position_ms": data.get("position_ms", 0),
                            "timestamp": time.time(),
                        },
                    )

            elif msg_type == "chat":
                msg = {
                    "type": "chat",
                    "client_id": client_id,
                    "name": room["names"].get(client_id, "Guest"),
                    "text": str(data.get("text", ""))[:200],
                    "timestamp": time.time(),
                }
                room["chat"].append(msg)
                room["chat"] = room["chat"][-50:]  # keep last 50
                await _broadcast(room, msg)

            elif msg_type == "request_sync":
                # Guest requests current state
                await websocket.send_json(
                    {
                        "type": "sync",
                        "is_playing": room["state"]["is_playing"],
                        "position_ms": room["state"]["position_ms"],
                        "timestamp": time.time(),
                        "track": room["state"]["track"],
                    }
                )

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.warning(f"WS error room={room_id} client={client_id}: {e}")
    finally:
        room["connections"].pop(client_id, None)
        room["names"].pop(client_id, None)

        if client_id == room["host_id"] and room["connections"]:
            # Transfer host to first remaining guest
            new_host = next(iter(room["connections"]))
            room["host_id"] = new_host
            await _broadcast(
                room,
                {
                    "type": "host_changed",
                    "new_host_id": new_host,
                    "name": room["names"].get(new_host, "Guest"),
                },
            )
        elif not room["connections"]:
            rooms.pop(room_id, None)
            logger.info(f"Room {room_id} closed")

        await _broadcast(
            room,
            {
                "type": "member_left",
                "client_id": client_id,
                "name": name,
                "members": list(room["names"].values()),
                "member_count": len(room["connections"]),
            },
        )
        logger.info(f"WS disconnected: room={room_id} client={client_id}")


@router.get("/rooms/{room_id}")
async def get_room_info(room_id: str) -> dict:
    if room_id not in rooms:
        return {"exists": False}
    room = rooms[room_id]
    return {
        "exists": True,
        "room_id": room_id,
        "member_count": len(room["connections"]),
        "members": list(room["names"].values()),
        "is_playing": room["state"]["is_playing"],
        "track": room["state"]["track"],
    }
