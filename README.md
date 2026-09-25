# Smart Mine Safety System

An underground mine safety and monitoring prototype developed for
Smart India Hackathon 2026.

## Overview

The Smart Mine Safety System is designed to monitor underground mine
conditions, identify abnormal environmental conditions, and provide
operators with a centralized control-room dashboard.

The prototype includes simulated sensor nodes, a FastAPI backend,
real-time monitoring, risk classification, and a 3D autonomous rescue
rover simulation for post-collapse inspection.

## Key Features

- 🌡️ Real-time environmental sensor monitoring
- ⚠️ Risk classification based on sensor conditions
- 📊 Live control-room dashboard
- 🤖 3D autonomous rescue rover simulation
- 🪨 Post-collapse inspection simulation
- 🌡️ Simulated thermal inspection mode
- 📡 Backend API for sensor and rover telemetry
- 🧪 Controlled and randomized sensor-data simulation

## Tech Stack

- Python
- FastAPI
- HTML / CSS / JavaScript
- Three.js
- REST APIs
- Git / GitHub

## System Architecture

Sensor Simulator
        ↓
FastAPI Backend
        ↓
Risk Analysis
        ↓
Control Room Dashboard
        ↓
Rover Telemetry / 3D Simulation

## Project Structure

```text
smart-mine-safety-system/
├── backend/
│   └── main.py
├── frontend/
│   ├── index.html
│   └── rover.js
├── sensor_simulator.py
├── .gitignore
└── README.md