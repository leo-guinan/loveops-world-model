export const env = {
  RHIZOME_DB_PATH: process.env.RHIZOME_DB_PATH ?? "./loveops.db",
  RHIZOME_NODE_ID: process.env.RHIZOME_NODE_ID ?? "loveops-node-1",
  RHIZOME_P2P_PORT: parseInt(process.env.RHIZOME_P2P_PORT ?? "7000", 10),
  RHIZOME_HTTP_PORT: parseInt(process.env.RHIZOME_HTTP_PORT ?? "8080", 10),
  RHIZOME_P2P_SEEDS: process.env.RHIZOME_P2P_SEEDS
    ? process.env.RHIZOME_P2P_SEEDS.split(",").map((s) => s.trim())
    : [],
};

