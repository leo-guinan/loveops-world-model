/**
 * Queue job structure for VibeQueue file-based queues
 */
export interface QueueJob {
  id: string;
  payload: any;
  attempts: number;
  createdAt: string;
  scheduledFor?: string;
}

/**
 * Queue configuration from VQ_QUEUE_CONFIG environment variable
 */
export interface QueueConfig {
  name: string;
  path: string;
  processor: "world-model" | "views" | "both";
  workers?: number;
  batchSize?: number;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

/**
 * Parsed queue configuration
 */
export interface ParsedQueueConfig {
  queues: QueueConfig[];
  basePath: string;
}

