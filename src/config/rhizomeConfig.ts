import { env } from "./env";

export type RhizomeConfig = {
  dbPath: string;
  nodeId: string;
  p2p: {
    port: number;
    seeds: string[];
  };
  http: {
    port: number;
  };
};

export function buildRhizomeConfig(overrides?: Partial<RhizomeConfig>): RhizomeConfig {
  return {
    dbPath: overrides?.dbPath ?? env.RHIZOME_DB_PATH,
    nodeId: overrides?.nodeId ?? env.RHIZOME_NODE_ID,
    p2p: {
      port: overrides?.p2p?.port ?? env.RHIZOME_P2P_PORT,
      seeds: overrides?.p2p?.seeds ?? env.RHIZOME_P2P_SEEDS,
    },
    http: {
      port: overrides?.http?.port ?? env.RHIZOME_HTTP_PORT,
    },
  };
}

