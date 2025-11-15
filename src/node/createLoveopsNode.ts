import { buildRhizomeConfig, RhizomeConfig } from "../config/rhizomeConfig";
import { env } from "../config/env";
import { initStorage } from "./initStorage";
import { registerViews } from "./registerViews";
import { startNetworking } from "./startNetworking";
import { WorldModelQueueProcessor } from "../queue/processor";
import { parseQueueConfig } from "../queue/config";

export type LoveopsNodeConfig = {
  dbPath?: string;
  nodeId?: string;
  p2pPort?: number;
  httpPort?: number;
  seeds?: string[];
};

export type LoveopsNode = {
  config: RhizomeConfig;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  queryView: (viewName: string, params?: any) => Promise<any>;
  appendEvent: (event: any) => Promise<void>;
  _loveopsViews?: Record<string, any>;
  _networkingStarted?: boolean;
  _p2pPort?: number;
  _p2pSeeds?: string[];
  _queueProcessor?: WorldModelQueueProcessor;
};

/**
 * Create and configure a LoveOps Rhizome node.
 * 
 * This function:
 * 1. Builds configuration from env + overrides
 * 2. Initializes storage (creates collections & indexes)
 * 3. Registers all world views
 * 4. Sets up networking (but doesn't start it)
 * 
 * Call node.start() to begin networking.
 */
export async function createLoveopsNode(
  config: LoveopsNodeConfig = {}
): Promise<LoveopsNode> {
  // Build config with overrides, letting buildRhizomeConfig handle defaults
  const overrides: Partial<RhizomeConfig> = {};
  if (config.dbPath) overrides.dbPath = config.dbPath;
  if (config.nodeId) overrides.nodeId = config.nodeId;
  if (config.p2pPort !== undefined || config.seeds !== undefined) {
    overrides.p2p = {
      port: config.p2pPort ?? env.RHIZOME_P2P_PORT,
      seeds: config.seeds ?? env.RHIZOME_P2P_SEEDS,
    };
  }
  if (config.httpPort !== undefined) {
    overrides.http = {
      port: config.httpPort,
    };
  }
  const rhizomeConfig = buildRhizomeConfig(overrides);

  // Initialize storage
  await initStorage(rhizomeConfig);

  // TODO: Replace with actual Rhizome Node creation
  // Example:
  // const rhizomeNode = await RhizomeNode.create({
  //   dbPath: rhizomeConfig.dbPath,
  //   nodeId: rhizomeConfig.nodeId,
  //   p2p: {
  //     port: rhizomeConfig.p2p.port,
  //     seeds: rhizomeConfig.p2p.seeds,
  //   },
  //   http: {
  //     port: rhizomeConfig.http.port,
  //   },
  // });

  // Create placeholder node object
  const node: LoveopsNode = {
    config: rhizomeConfig,
    start: async () => {
      // Register views
      await registerViews(node);
      
      // Start networking
      await startNetworking(node, rhizomeConfig);
      
      // Start queue processing if VQ_QUEUE_CONFIG is set
      if (process.env.VQ_QUEUE_CONFIG || process.env.VQ_BASE_PATH) {
        try {
          const queueConfig = parseQueueConfig();
          const queueProcessor = new WorldModelQueueProcessor(node, queueConfig);
          queueProcessor.start();
          node._queueProcessor = queueProcessor;
          console.log(`Queue processor started for ${queueConfig.queues.length} queues`);
        } catch (error) {
          console.error("Failed to start queue processor:", error);
        }
      }
      
      // TODO: Start HTTP server if needed
      // await node.startHTTP();
      
      console.log(`LoveOps node started: ${rhizomeConfig.nodeId}`);
      console.log(`  DB: ${rhizomeConfig.dbPath}`);
      console.log(`  P2P: port ${rhizomeConfig.p2p.port}`);
      console.log(`  HTTP: port ${rhizomeConfig.http.port}`);
    },
    stop: async () => {
      // Stop queue processor
      if (node._queueProcessor) {
        node._queueProcessor.stop();
      }
      
      // TODO: Implement graceful shutdown
      console.log(`LoveOps node stopped: ${rhizomeConfig.nodeId}`);
    },
    queryView: async (viewName: string, params?: any) => {
      // TODO: Replace with actual Rhizome view query
      // Example:
      // const events = await node.getEvents(params);
      // const viewFn = node._loveopsViews[viewName];
      // return viewFn(events, params);
      
      const viewFn = node._loveopsViews?.[viewName];
      if (!viewFn) {
        throw new Error(`View not found: ${viewName}`);
      }
      
      // Placeholder: return empty state
      return viewFn([], params);
    },
    appendEvent: async (event: any) => {
      // TODO: Replace with actual Rhizome event append
      // Example:
      // await node.appendEvent(event);
      
      console.log(`Event appended: ${event.type} (${event.id})`);
    },
  };

  // Register views immediately (before start)
  await registerViews(node);

  return node;
}

