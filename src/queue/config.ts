import { ParsedQueueConfig, QueueConfig } from "./types";

/**
 * Parse VQ_QUEUE_CONFIG environment variable
 * Format: JSON string with queue configurations
 */
export function parseQueueConfig(): ParsedQueueConfig {
  const configStr = process.env.VQ_QUEUE_CONFIG;
  const basePath = process.env.VQ_BASE_PATH || "/var/queues";

  if (!configStr) {
    // Default configuration for world-model service
    return {
      basePath,
      queues: [
        {
          name: "loveops-events-ingest",
          path: `${basePath}/loveops-events-ingest`,
          processor: "world-model",
          workers: 2,
          batchSize: 10,
          timeout: 30000,
          retries: 3,
          retryDelay: 1000,
        },
        {
          name: "loveops-metrics",
          path: `${basePath}/loveops-metrics`,
          processor: "both",
          workers: 1,
          batchSize: 50,
          timeout: 10000,
          retries: 1,
          retryDelay: 500,
        },
      ],
    };
  }

  try {
    const parsed = JSON.parse(configStr);
    return {
      basePath: parsed.basePath || basePath,
      queues: parsed.queues || [],
    };
  } catch (error) {
    console.error("Failed to parse VQ_QUEUE_CONFIG:", error);
    throw new Error("Invalid VQ_QUEUE_CONFIG format");
  }
}

