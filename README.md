# loveops-world-model

Canonical event log and world views for conscious dating.

## Overview

This package defines:
- **FactEvent** schema and event taxonomy for dating domain
- Pure world view functions (profile, interaction history, emotional load, trust/safety, compatibility)
- Rhizome node launcher with collections, indexes, views, and networking

## Installation

```bash
npm install loveops-world-model
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

## Architecture

- **Events**: Immutable fact log (`DatingFactEvent`)
- **Views**: Pure functions that derive state from events
- **Node**: Rhizome instance with collections, indexes, and networking

## License

MIT

