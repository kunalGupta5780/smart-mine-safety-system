from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# Serve the dashboard
app.mount(
    "/dashboard",
    StaticFiles(directory="frontend", html=True),
    name="dashboard"
)

latest_readings = {}


@app.get("/")
def home():
    return {
        "message": "Smart Mine Safety System backend is running!"
    }


@app.post("/sensor-data")
def receive_sensor_data(data: dict):

    # Risk detection
    if data["gas"] > 40 or data["temperature"] > 33:
        risk = "DANGER"
    elif data["gas"] > 30 or data["temperature"] > 30:
        risk = "WARNING"
    else:
        risk = "SAFE"

    data["risk"] = risk

    # Store latest reading for each node
    latest_readings[data["node_id"]] = data

    return {
        "message": "Sensor data received",
        "data": data,
        "risk": risk
    }


@app.get("/sensor-data")
def get_sensor_data():
    return latest_readings