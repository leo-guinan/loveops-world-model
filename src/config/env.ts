export const env = {
  RHIZOME_DB_PATH: process.env.RHIZOME_DB_PATH ?? "./loveops.db",
  RHIZOME_NODE_ID: process.env.RHIZOME_NODE_ID ?? "loveops-node-1",
  RHIZOME_P2P_PORT: parseInt(process.env.RHIZOME_P2P_PORT ?? "7000", 10),
  RHIZOME_HTTP_PORT: parseInt(process.env.RHIZOME_HTTP_PORT ?? "8080", 10),
  RHIZOME_P2P_SEEDS: process.env.RHIZOME_P2P_SEEDS
    ? process.env.RHIZOME_P2P_SEEDS.split(",").map((s) => s.trim())
    : [],
  // Queue configuration
  VQ_QUEUE_CONFIG: process.env.VQ_QUEUE_CONFIG,
  VQ_BASE_PATH: process.env.VQ_BASE_PATH ?? "/var/queues",
  METRICS_PATH: process.env.METRICS_PATH ?? "./metrics/last_deploy",
};

