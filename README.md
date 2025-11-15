# loveops-world-model

Canonical event log and world views for conscious dating.

## Overview

This package defines:
- **FactEvent** schema and event taxonomy for dating domain
- Pure world view functions (profile, interaction history, emotional load, trust/safety, compatibility)
- Rhizome node launcher with collections, indexes, views, and networking
- **In-process queue processing** for VibeQueue file-based message queues
- Integration with `loveops-policies` library for event processing logic

## Installation

Install from npm:

```bash
npm install loveops-world-model
# or
pnpm add loveops-world-model
# or
yarn add loveops-world-model
```

Or use directly with npx:

```bash
npx loveops-world-model init-node
```

## Quick Start

Initialize a node:
```bash
npx loveops-world-model init-node
```

Run a node:
```bash
npx loveops-world-model run-node
```

## Usage

```typescript
import {
  createLoveopsNode,
  UserProfileState,
  MatchCompatibilityState,
  DatingFactEvent,
  DatingEventType,
  createDatingEvent,
} from "loveops-world-model";

// Create and start a node
const node = await createLoveopsNode({
  dbPath: "./my-loveops.db",
  nodeId: "my-node",
});

// Create events
const event = createDatingEvent({
  domain: "profile",
  type: DatingEventType.PROFILE_CREATED,
  source: "user:123",
  actorId: "user:123",
  payload: { name: "Alice" },
});

// Query views
const profile = await node.queryView("UserProfileStateView", {
  userId: "user:123",
});
```

## Docker

### Build

```bash
docker build -t loveops-world-model .
```

### Run

```bash
docker run -d \
  --name loveops-node \
  -p 7000:7000 \
  -p 8080:8080 \
  -v loveops-data:/data \
  -e RHIZOME_NODE_ID=my-node \
  loveops-world-model
```

### Docker Compose

```bash
# Start node
docker-compose up -d

# View logs
docker-compose logs -f

# Stop node
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

The database is persisted in a Docker volume (`loveops-data`) mounted at `/data`.

### Environment Variables

- `RHIZOME_DB_PATH`: Path to Rhizome database (default: `./loveops.db`)
- `RHIZOME_NODE_ID`: Node identifier (default: `loveops-node-1`)
- `RHIZOME_P2P_PORT`: P2P networking port (default: `7000`)
- `RHIZOME_HTTP_PORT`: HTTP API port (default: `8080`)
- `VQ_QUEUE_CONFIG`: JSON string with queue configuration (optional)
- `VQ_BASE_PATH`: Base path for VibeQueue directories (default: `/var/queues`)
- `METRICS_PATH`: Path for metrics output (default: `./metrics/last_deploy`)

## Architecture

### Core Components

- **Events**: Immutable fact log (`DatingFactEvent`)
- **Views**: Pure functions that derive state from events
- **Node**: Rhizome instance with collections, indexes, and networking
- **Queue Processing**: In-process VibeQueue file-based message processing
- **Policy Library**: Uses `loveops-policies` as embedded dependency

### Queue Processing

The world-model service processes queues **in-process**:

- **`loveops-events-ingest`**: Ingests events from the queue and appends them to Rhizome
- **`loveops-metrics`**: Collects metrics and writes to JSON files

Queue configuration is provided via `VQ_QUEUE_CONFIG` environment variable:

```json
{
  "basePath": "/var/queues",
  "queues": [
    {
      "name": "loveops-events-ingest",
      "path": "/var/queues/loveops-events-ingest",
      "processor": "world-model",
      "workers": 2,
      "batchSize": 10,
      "timeout": 30000,
      "retries": 3,
      "retryDelay": 1000
    },
    {
      "name": "loveops-metrics",
      "path": "/var/queues/loveops-metrics",
      "processor": "both",
      "workers": 1,
      "batchSize": 50
    }
  ]
}
```

### Data Flow

**Event Ingestion:**
```
Views Service → Enqueue job → loveops-events-ingest/ready/
  ↓
World Model Service (in-process queue processor)
  ↓
Append to Rhizome event log
```

**Metrics Collection:**
```
All Services → Enqueue metric job → loveops-metrics/ready/
  ↓
World Model Service (in-process queue processor)
  ↓
Write to metrics/last_deploy/queues.json
```

### Policy Library Integration

The `loveops-policies` library is embedded as a dependency and provides:
- Event processing logic
- Event validation and normalization helpers
- Policy-driven event transformation

This allows the world-model service to process events using policy logic without requiring a separate policy service.

## License

MIT

