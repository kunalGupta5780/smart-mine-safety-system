import random
import time
import requests


nodes = [
    {
        "node_id": "MINE_TUNNEL_01",
        "location": "Mine Tunnel 01",
        "mode": "SAFE",
        "co": 8,
        "temperature": 27,
        "humidity": 55,
        "smoke_density": 2,
        "air_flow": 3.0
    },
    {
        "node_id": "MINE_TUNNEL_02",
        "location": "Mine Tunnel 02",
        "mode": "WARNING",
        "co": 33,
        "temperature": 28,
        "humidity": 60,
        "smoke_density": 6,
        "air_flow": 2.3
    },
    {
        "node_id": "MINE_TUNNEL_03",
        "location": "Mine Tunnel 03",
        "mode": "DANGER",
        "co": 44,
        "temperature": 36,
        "humidity": 65,
        "smoke_density": 24,
        "air_flow": 1.2
    },
    {
        "node_id": "MINE_TUNNEL_04",
        "location": "Mine Tunnel 04",
        "mode": "RANDOM",
        "co": 10,
        "temperature": 26,
        "humidity": 58,
        "smoke_density": 3,
        "air_flow": 2.8
    }
]


while True:

    print("\n--- Sending sensor data ---")

    for node in nodes:

        # ---------------------------------
        # CONTROLLED SAFE TUNNEL
        # ---------------------------------

        if node["mode"] == "SAFE":

            node["co"] += random.randint(-1, 1)
            node["temperature"] += random.randint(-1, 1)
            node["humidity"] += random.randint(-2, 2)
            node["smoke_density"] += random.randint(-1, 1)
            node["air_flow"] += random.uniform(-0.15, 0.15)

            node["co"] = max(5, min(15, node["co"]))
            node["temperature"] = max(24, min(29, node["temperature"]))
            node["humidity"] = max(45, min(65, node["humidity"]))
            node["smoke_density"] = max(0, min(5, node["smoke_density"]))
            node["air_flow"] = max(2.5, min(3.5, node["air_flow"]))

        # ---------------------------------
        # CONTROLLED WARNING TUNNEL
        # ---------------------------------

        elif node["mode"] == "WARNING":

            node["co"] += random.randint(-1, 1)
            node["temperature"] += random.randint(-1, 1)
            node["humidity"] += random.randint(-2, 2)
            node["smoke_density"] += random.randint(-1, 1)
            node["air_flow"] += random.uniform(-0.1, 0.1)

            # Only CO should normally trigger
            # the warning score.

            node["co"] = max(31, min(35, node["co"]))
            node["temperature"] = max(26, min(29, node["temperature"]))
            node["humidity"] = max(50, min(70, node["humidity"]))
            node["smoke_density"] = max(2, min(8, node["smoke_density"]))
            node["air_flow"] = max(2.1, min(2.5, node["air_flow"]))

        # ---------------------------------
        # CONTROLLED DANGER TUNNEL
        # ---------------------------------

        elif node["mode"] == "DANGER":

            node["co"] += random.randint(-1, 1)
            node["temperature"] += random.randint(-1, 1)
            node["humidity"] += random.randint(-2, 2)
            node["smoke_density"] += random.randint(-1, 1)
            node["air_flow"] += random.uniform(-0.1, 0.1)

            node["co"] = max(42, min(48, node["co"]))
            node["temperature"] = max(34, min(38, node["temperature"]))
            node["humidity"] = max(55, min(75, node["humidity"]))
            node["smoke_density"] = max(22, min(28, node["smoke_density"]))
            node["air_flow"] = max(1.0, min(1.4, node["air_flow"]))

        # ---------------------------------
        # RANDOM TUNNEL
        # ---------------------------------

        else:

            node["co"] += random.randint(-2, 2)
            node["temperature"] += random.randint(-1, 1)
            node["humidity"] += random.randint(-2, 2)
            node["smoke_density"] += random.randint(-1, 1)
            node["air_flow"] += random.uniform(-0.2, 0.2)

            node["co"] = max(0, min(50, node["co"]))
            node["temperature"] = max(20, min(40, node["temperature"]))
            node["humidity"] = max(20, min(90, node["humidity"]))
            node["smoke_density"] = max(0, min(30, node["smoke_density"]))
            node["air_flow"] = max(0.5, min(5.0, node["air_flow"]))

        # ---------------------------------
        # CREATE SENSOR READING
        # ---------------------------------

        reading = {
            "node_id": node["node_id"],
            "location": node["location"],
            "co": node["co"],
            "temperature": node["temperature"],
            "humidity": node["humidity"],
            "smoke_density": node["smoke_density"],
            "air_flow": round(node["air_flow"], 1)
        }

        # ---------------------------------
        # SEND TO BACKEND
        # ---------------------------------

        try:

            response = requests.post(
                "http://127.0.0.1:8000/sensor-data",
                json=reading
            )

            print(
                node["node_id"],
                "| CO:", node["co"], "ppm",
                "| Temp:", node["temperature"], "°C",
                "| Humidity:", node["humidity"], "%",
                "| Smoke:", node["smoke_density"],
                "| Air Flow:", round(node["air_flow"], 1), "m/s"
            )

            print("Backend:", response.json())

        except requests.exceptions.RequestException:

            print(
                node["node_id"],
                "→ Backend connection failed"
            )

    time.sleep(1)