import random
import time
from datetime import datetime

nodes = [
    {
        "node_id": "NODE_01",
        "location": "Tunnel 1",
        "gas": 30,
        "temperature": 28,
        "humidity": 65
    },
    {
        "node_id": "NODE_02",
        "location": "Tunnel 2",
        "gas": 35,
        "temperature": 29,
        "humidity": 70
    },
    {
        "node_id": "NODE_03",
        "location": "Tunnel 3",
        "gas": 25,
        "temperature": 27,
        "humidity": 60
    }
]

while True:
    for node in nodes:

        # Gradually change sensor values
        node["gas"] += random.randint(-3, 3)
        node["temperature"] += random.randint(-1, 1)
        node["humidity"] += random.randint(-2, 2)

        # Keep values within reasonable ranges
        node["gas"] = max(10, min(60, node["gas"]))
        node["temperature"] = max(20, min(40, node["temperature"]))
        node["humidity"] = max(40, min(90, node["humidity"]))

        reading = {
            "node_id": node["node_id"],
            "gas": node["gas"],
            "temperature": node["temperature"],
            "humidity": node["humidity"],
            "location": node["location"],
            "timestamp": datetime.now().isoformat()
        }

        # Risk detection
        if reading["gas"] > 40 or reading["temperature"] > 33:
            risk = "DANGER"
        elif reading["gas"] > 30 or reading["temperature"] > 30:
            risk = "WARNING"
        else:
            risk = "SAFE"

        reading["risk"] = risk

        print(reading)

    print("-" * 80)
    time.sleep(1)