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
    risk_score = 0


    # CO gas risk
    if data["co"] > 40:
        risk_score += 2

    elif data["co"] > 30:
        risk_score += 1


    # Temperature risk
    if data["temperature"] > 33:
        risk_score += 2

    elif data["temperature"] > 30:
        risk_score += 1


    # Smoke density risk
    if data["smoke_density"] > 20:
        risk_score += 2

    elif data["smoke_density"] > 10:
        risk_score += 1


    # Air flow / ventilation risk
    if data["air_flow"] < 1.5:
        risk_score += 2

    elif data["air_flow"] < 2.0:
        risk_score += 1


    # Overall risk
    if risk_score >= 3:
        risk = "DANGER"

    elif risk_score >= 1:
        risk = "WARNING"

    else:
        risk = "SAFE"


    data["risk"] = risk
    data["risk_score"] = risk_score


    # Store latest reading for each node
    latest_readings[data["node_id"]] = data


    return {
        "message": "Sensor data received",
        "data": data,
        "risk": risk,
        "risk_score": risk_score
    }


@app.get("/sensor-data")
def get_sensor_data():

    return latest_readings