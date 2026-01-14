# Neo Sentinel 🛡️

> Event-Driven, Polyglot Microservices Architecture for Planetary Defense

## Overview

Neo Sentinel is a distributed microservices architecture designed to safeguard Earth from incoming asteroids. The system ingests telemetry data from simulated asteroid detection arrays, processes it in real-time to identify collision hazards, and distributes critical alerts to a web-based dashboard.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Angular 21, TypeScript |
| **Load Balancer** | Nginx |
| **API Gateway** | Spring Cloud Gateway (WebFlux) |
| **Backend Services** | Java 25, Spring Boot 4 |
| **FaaS** | Python 3.11, Flask |
| **Message Streaming** | Apache Kafka |
| **Message Broker** | RabbitMQ |
| **Database** | PostgreSQL 15 |
| **Caching** | Redis |
| **Containerization** | Docker, Docker Compose |
| **Security** | API Key Authentication |

## Architecture

![C4 Architecture Diagram](c4_diagram.png)

### Microservices

| Service | Port | Description |
|---------|------|-------------|
| **Frontend** | 4200 | Angular dashboard for monitoring asteroid alerts |
| **Nginx Load Balancer** | 8080 | Distributes traffic across API Gateway instances |
| **API Gateway (x2)** | internal | Secured entry point, routes requests to backend services |
| **Telemetry Ingest** | 8081 | Receives asteroid data and publishes to Kafka |
| **Hazard Analyzer** | 8082 | Consumes Kafka events, analyzes threats, publishes to RabbitMQ |
| **Mission Control** | 8083 | Persists alerts to PostgreSQL, serves data via REST + SSE |
| **Impact Function** | 5001 | Python FaaS that calculates impact energy in kilotons |

### Infrastructure

| Service | Port | Purpose |
|---------|------|---------|
| PostgreSQL | 5432 | Persistent storage for alerts |
| Redis | 6379 | Caching layer for alert queries |
| Kafka | 9092 | Event streaming for telemetry data |
| RabbitMQ | 5672, 15672 | Message broker for hazard alerts |

### Load Balancing

The system uses **Nginx** as a reverse proxy and load balancer in front of two API Gateway instances:

```
                         ┌─────────────────┐
                    ┌───▶│  api-gateway-1  │
┌──────────────┐    │    └─────────────────┘
│  Nginx (LB)  │────┤    
│  Port: 8080  │    │    ┌─────────────────┐
└──────────────┘    └───▶│  api-gateway-2  │
                         └─────────────────┘
```

| Feature | Configuration |
|---------|---------------|
| **Algorithm** | `least_conn` - routes to the gateway with fewest active connections |
| **SSE Support** | Buffering disabled, 24-hour timeouts for long-lived connections |
| **Security Headers** | `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection` |
| **Compression** | Gzip enabled for JSON, CSS, JavaScript, event streams |
| **Health Endpoint** | `/health` returns load balancer status |

> **Note:** Spring Boot services take 30-60 seconds to fully initialize. During startup, you may see 502 errors until all API Gateway instances are ready.

## System Logic and Data Flow

```
┌─────────────┐    Kafka     ┌─────────────────┐   RabbitMQ   ┌─────────────────┐
│  Telemetry  │ ──────────▶  │  Hazard         │ ──────────▶  │  Mission        │
│  Ingest     │              │  Analyzer       │              │  Control        │
└─────────────┘              └─────────────────┘              └────────┬────────┘
                                                                       │
                                                              PostgreSQL + Redis
                                                                       │
┌─────────────┐              ┌─────────────────┐              ┌────────▼────────┐
│  Frontend   │ ◀──────────  │  API Gateway    │ ◀──────────  │  REST API       │
│  Dashboard  │              │                 │              └─────────────────┘
└─────────────┘              └────────┬────────┘
                                      │
                             ┌────────▼────────┐
                             │  Impact Function│
                             │  (Python FaaS)  │
                             └─────────────────┘
```

1. **Ingestion**: `TelemetryProducer` generates asteroid data and pushes it to the Kafka stream
2. **Analysis**: `HazardService` subscribes to the stream and flags asteroids with collision warnings
3. **Persistence**: `MissionCommander` listens to RabbitMQ, converts messages to Alert entities, saves to PostgreSQL
4. **Retrieval**: Alerts are served to the dashboard via the `API Gateway`
5. **Caching**: Redis caches frequently accessed alert data
6. **Impact Calculation**: Python FaaS calculates kinetic energy impact in kilotons of TNT

## Quick Start

### Prerequisites

- Docker & Docker Compose

### Run with Docker (Recommended)

```bash
git clone https://github.com/Lys4nder/neo-sentinel.git
cd neo-sentinel

docker compose up -d --build

docker compose logs -f
```

### Access the Application

| Service | URL |
|---------|-----|
| Frontend Dashboard | http://localhost:4200 |
| API Gateway | http://localhost:8080 |
| RabbitMQ Management | http://localhost:15672 (admin/admin) |

### Run Locally (Development)

**Backend Services:**
```bash
cd neo-backend

# Start infrastructure only
docker compose up postgres redis rabbitmq kafka -d

# Run Java services with Maven (in separate terminals)
cd telemetry-ingest && mvn spring-boot:run
cd hazard-analyzer && mvn spring-boot:run
cd mission-control && mvn spring-boot:run
cd api-gateway && mvn spring-boot:run

# Run Python FaaS
cd impact-function && python main.py
```

**Frontend:**
```bash
cd neo-frontend
npm install
npm start
```

## API Endpoints

### Authentication

All API endpoints (except SSE stream) require an API key:

```bash
# Header format
X-API-Key: neo-sentinel-secret-key
```

Default API key: `neo-sentinel-secret-key` (configurable via `API_KEY` environment variable)

### Mission Control
```bash
# Get all alerts (requires API key)
curl http://localhost:8080/api/mission/alerts \
  -H "X-API-Key: neo-sentinel-secret-key"

# Subscribe to real-time alerts via SSE (no auth required)
curl http://localhost:8080/api/mission/alerts/stream


```bash
curl -X POST http://localhost:8080/api/impact/calculate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: neo-sentinel-secret-key" \
  -d '{"velocityKmS":15.5,"diameterM":370}'
```
```

## Project Structure

```
neo-sentinel/
├── docker-compose.yml          # Full stack orchestration
├── nginx/
│   └── nginx.conf              # Load balancer configuration
├── neo-backend/
│   ├── api-gateway/            # Spring Cloud Gateway + Security
│   ├── telemetry-ingest/       # Kafka producer service
│   ├── hazard-analyzer/        # Kafka consumer + RabbitMQ publisher
│   ├── mission-control/        # REST API + SSE + PostgreSQL + Redis
│   └── impact-function/        # Python Flask FaaS
└── neo-frontend/               # Angular 21 dashboard
```