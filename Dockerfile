# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies (including dev dependencies for build)
# Using npm install since package-lock.json may not exist
RUN npm install

# Copy source code
COPY tsconfig.json ./
COPY src/ ./src/
COPY bin/ ./bin/

# Build TypeScript
RUN npm run build

# Runtime stage
FROM node:20-alpine AS runtime

WORKDIR /app

# Copy package files
COPY package.json ./

# Install production dependencies only
# Using npm install since package-lock.json may not exist
RUN npm install --omit=dev && npm cache clean --force

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

