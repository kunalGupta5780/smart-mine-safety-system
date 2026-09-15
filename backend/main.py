from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from sklearn.ensemble import IsolationForest
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

app = FastAPI()


# Serve the dashboard
app.mount(
    "/dashboard",
    StaticFiles(directory="frontend", html=True),
    name="dashboard"
)


latest_readings = {}

ai_history = []

ai_model = make_pipeline(
    StandardScaler(),
    IsolationForest(
        n_estimators=100,
        contamination=0.05,
        random_state=42
    )
)

AI_MIN_SAMPLES = 100


@app.get("/")
def home():
    return {
        "message": "Smart Mine Safety System backend is running!"
    }

def analyze_ai_anomaly(data, risk):
    features = [[
        data["co"],
        data["temperature"],
        data["humidity"],
        data["smoke_density"],
        data["air_flow"]
    ]]

    # Learn only from readings that the existing safety rules
    # consider safe. This prevents obvious danger states from
    # becoming part of the normal baseline.
    if risk == "SAFE":
        ai_history.append(features[0])

    if len(ai_history) < AI_MIN_SAMPLES:
        return {
            "status": "LEARNING",
            "score": None,
            "message": f"Learning normal conditions ({len(ai_history)}/{AI_MIN_SAMPLES})"
        }

    ai_model.fit(ai_history)

    prediction = ai_model.predict(features)[0]
    score = ai_model.decision_function(features)[0]

    if prediction == -1:
        return {
            "status": "ANOMALY",
            "score": round(float(score), 4),
            "message": "Unusual sensor pattern detected"
        }

    return {
        "status": "NORMAL",
        "score": round(float(score), 4),
        "message": "Sensor pattern is within the learned baseline"
    }

@app.post("/sensor-data")
def receive_sensor_data(data: dict):

    # Risk detection
    risk_score = 0
    risk_reasons = []


    # CO gas risk
    if data["co"] > 40:
        risk_score += 2
        risk_reasons.append("High CO Gas")

    elif data["co"] > 30:
        risk_score += 1
        risk_reasons.append("Elevated CO Gas")


    # Temperature risk
    if data["temperature"] > 33:
        risk_score += 2
        risk_reasons.append("High Temperature")

    elif data["temperature"] > 30:
        risk_score += 1
        risk_reasons.append("Elevated Temperature")


    # Smoke density risk
    if data["smoke_density"] > 20:
        risk_score += 2
        risk_reasons.append("High Smoke Density")

    elif data["smoke_density"] > 10:
        risk_score += 1
        risk_reasons.append("Elevated Smoke Density")


    # Air flow / ventilation risk
    if data["air_flow"] < 1.5:
        risk_score += 2
        risk_reasons.append("Low Air Flow")

    elif data["air_flow"] < 2.0:
        risk_score += 1
        risk_reasons.append("Reduced Air Flow")


    # Overall risk
    if risk_score >= 3:
        risk = "DANGER"

    elif risk_score >= 1:
        risk = "WARNING"

    else:
        risk = "SAFE"


    # If no risk factors were detected
    if not risk_reasons:
        risk_reasons.append("No abnormal conditions detected")

    ai_result = analyze_ai_anomaly(data, risk)


    data["risk"] = risk
    data["risk_score"] = risk_score
    data["risk_reasons"] = risk_reasons
    data["ai_status"] = ai_result["status"]
    data["ai_anomaly_score"] = ai_result["score"]
    data["ai_message"] = ai_result["message"]


    # Store latest reading for each node
    latest_readings[data["node_id"]] = data


    return {
        "message": "Sensor data received",
        "data": data,
        "risk": risk,
        "risk_score": risk_score,
        "risk_reasons": risk_reasons
    }


@app.get("/sensor-data")
def get_sensor_data():

    return latest_readings

# =========================================================
# ROVER DATA
# =========================================================

latest_rover_data = {}


@app.post("/rover-data")
def receive_rover_data(data: dict):

    latest_rover_data.update(data)

    return {
        "message": "Rover data received",
        "data": latest_rover_data
    }


@app.get("/rover-data")
def get_rover_data():

    return latest_rover_data