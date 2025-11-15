# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies (including dev dependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY tsconfig.json ./
COPY src/ ./src/
COPY bin/ ./bin/

# Build TypeScript
RUN pnpm run build

# Runtime stage
FROM node:20-alpine AS runtime

WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod && pnpm store prune

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/bin ./bin

# Make binary executable
RUN chmod +x ./bin/loveops-world-model

# Create directory for database
RUN mkdir -p /data

# Expose ports (P2P and HTTP)
EXPOSE 7000 8080

# Set environment variables with defaults
ENV RHIZOME_DB_PATH=/data/loveops.db
ENV RHIZOME_NODE_ID=loveops-node-1
ENV RHIZOME_P2P_PORT=7000
ENV RHIZOME_HTTP_PORT=8080

# Volume for database persistence
VOLUME ["/data"]

# Default command: run node
CMD ["node", "dist/node/cli.js", "run-node"]

