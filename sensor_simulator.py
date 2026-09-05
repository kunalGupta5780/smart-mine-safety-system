import random
import time
import requests


# Simulated mine tunnels
nodes = [
    {
        "node_id": "MINE_TUNNEL_01",
        "location": "Mine Tunnel 01",
        "co": 8,
        "temperature": 27,
        "humidity": 55,
        "smoke_density": 2,
        "air_flow": 3.0
    },
    {
        "node_id": "MINE_TUNNEL_02",
        "location": "Mine Tunnel 02",
        "co": 12,
        "temperature": 25,
        "humidity": 60,
        "smoke_density": 3,
        "air_flow": 2.8
    },
    {
        "node_id": "MINE_TUNNEL_03",
        "location": "Mine Tunnel 03",
        "co": 5,
        "temperature": 23,
        "humidity": 50,
        "smoke_density": 1,
        "air_flow": 3.2
    },
    {
        "node_id": "MINE_TUNNEL_04",
        "location": "Mine Tunnel 04",
        "co": 10,
        "temperature": 26,
        "humidity": 58,
        "smoke_density": 2,
        "air_flow": 2.9
    }
]


while True:

    print("\n--- Sending sensor data ---")

    for node in nodes:

        # Gradually change sensor values
        node["co"] += random.randint(-2, 2)
        node["temperature"] += random.randint(-1, 1)
        node["humidity"] += random.randint(-2, 2)
        node["smoke_density"] += random.randint(-1, 1)
        node["air_flow"] += random.uniform(-0.2, 0.2)

        # Keep values inside simulated ranges
        node["co"] = max(0, min(50, node["co"]))
        node["temperature"] = max(20, min(40, node["temperature"]))
        node["humidity"] = max(20, min(90, node["humidity"]))
        node["smoke_density"] = max(0, min(30, node["smoke_density"]))
        node["air_flow"] = max(0.5, min(5.0, node["air_flow"]))

        # Prepare sensor reading
        reading = {
            "node_id": node["node_id"],
            "location": node["location"],
            "co": node["co"],
            "temperature": node["temperature"],
            "humidity": node["humidity"],
            "smoke_density": node["smoke_density"],
            "air_flow": round(node["air_flow"], 1)
        }

        try:

            # Send data to FastAPI backend
            response = requests.post(
                "http://127.0.0.1:8000/sensor-data",
                json=reading
            )

            print(
                node["node_id"],
                "| CO Gas:", node["co"], "ppm",
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