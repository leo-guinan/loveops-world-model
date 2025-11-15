import * as fs from "fs";
import * as path from "path";
import { VibeQueue } from "./vibeQueue";
import { QueueConfig, ParsedQueueConfig, QueueJob } from "./types";
import { LoveopsNode } from "../node/createLoveopsNode";
import { DatingFactEvent, DatingEventType } from "../types/datingEvents";
import { normalizeDatingEvent } from "../events/normalizeEvent";

/**
 * Base queue processor for LoveOps services
 */
export abstract class QueueProcessor {
  protected node: LoveopsNode;
  private queues: Map<string, VibeQueue> = new Map();
  private config: ParsedQueueConfig;
  private running: boolean = false;
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(node: LoveopsNode, config: ParsedQueueConfig) {
    this.node = node;
    this.config = config;

    // Initialize queues for world-model processor
    for (const queueConfig of config.queues) {
      if (queueConfig.processor === "world-model" || queueConfig.processor === "both") {
        const queue = new VibeQueue(config.basePath, queueConfig.name);
        this.queues.set(queueConfig.name, queue);
      }
    }
  }

  /**
   * Start processing all configured queues
   */
  start(): void {
    if (this.running) {
      console.warn("Queue processor is already running");
      return;
    }

    this.running = true;
    console.log(`Starting queue processor for ${this.queues.size} queues`);

    for (const [queueName, queue] of this.queues.entries()) {
      const queueConfig = this.config.queues.find((q) => q.name === queueName);
      if (!queueConfig) continue;

      const workers = queueConfig.workers ?? 1;
      const pollInterval = 1000; // Poll every second

      // Start worker loops
      for (let i = 0; i < workers; i++) {
        const interval = setInterval(async () => {
          await this.processQueue(queueName, queue, queueConfig);
        }, pollInterval);
        this.intervals.set(`${queueName}-${i}`, interval);
      }

      // Process scheduled jobs periodically
      const scheduledInterval = setInterval(async () => {
        await queue.processScheduled();
      }, 5000); // Check scheduled jobs every 5 seconds
      this.intervals.set(`${queueName}-scheduled`, scheduledInterval);
    }
  }

  /**
   * Stop processing queues
   */
  stop(): void {
    this.running = false;
    for (const interval of this.intervals.values()) {
      clearInterval(interval);
    }
    this.intervals.clear();
    console.log("Queue processor stopped");
  }

  /**
   * Process a single queue
   */
  private async processQueue(
    queueName: string,
    queue: VibeQueue,
    config: QueueConfig
  ): Promise<void> {
    try {
      const job = await queue.dequeue();
      if (!job) return;

      const batchSize = config.batchSize ?? 1;
      const jobs: QueueJob[] = [job];

      // Try to get more jobs for batching
      for (let i = 1; i < batchSize; i++) {
        const nextJob = await queue.dequeue();
        if (!nextJob) break;
        jobs.push(nextJob);
      }

      // Process batch
      for (const jobToProcess of jobs) {
        try {
          const success = await this.processJob(queueName, jobToProcess);
          if (success) {
            await queue.complete(jobToProcess.id);
          } else {
            await queue.fail(jobToProcess.id, jobToProcess, config);
          }
        } catch (error) {
          console.error(`Error processing job ${jobToProcess.id}:`, error);
          await queue.fail(jobToProcess.id, jobToProcess, config);
        }
      }
    } catch (error) {
      console.error(`Error processing queue ${queueName}:`, error);
    }
  }

  /**
   * Process a single job - implemented by subclasses
   */
  protected abstract processJob(queueName: string, job: QueueJob): Promise<boolean>;
}

/**
 * World Model queue processor
 * Processes: loveops-events-ingest, loveops-metrics
 */
export class WorldModelQueueProcessor extends QueueProcessor {
  protected async processJob(queueName: string, job: QueueJob): Promise<boolean> {
    switch (queueName) {
      case "loveops-events-ingest":
        return await this.handleEventIngest(job.payload);

      case "loveops-metrics":
        return await this.handleMetrics(job.payload);

      default:
        console.warn(`Unknown queue: ${queueName}`);
        return false;
    }
  }

  /**
   * Handle event ingestion job
   */
  private async handleEventIngest(payload: any): Promise<boolean> {
    try {
      let event: DatingFactEvent;

      // Handle different payload types
      if (payload.type === "document_upload") {
        // Transform document upload payload into a proper event
        event = normalizeDatingEvent({
          id: payload.userId ? `doc-upload-${payload.userId}-${Date.now()}` : undefined,
          timestamp: new Date().toISOString(),
          source: "views:document_upload",
          actorId: payload.userId,
          domain: "profile", // Document uploads are profile-related
          type: DatingEventType.PROFILE_CREATED, // Or create a new DOCUMENT_UPLOADED type
          payload: {
            document: {
              filename: payload.file?.filename,
              mimetype: payload.file?.mimetype,
              size: payload.file?.size,
              data: payload.file?.data, // Base64 encoded
            },
            uploadType: "date_me_doc"
          },
          confidence: 1.0
        });
      } else if (payload.event) {
        // Already a properly formatted event
        event = normalizeDatingEvent(payload.event);
      } else {
        // Try to normalize as-is (might be a partial event)
        event = normalizeDatingEvent(payload);
      }

      // Append to Rhizome event log
      await this.node.appendEvent(event);

      console.log(`✅ Ingested event: ${event.type} for actor ${event.actorId}`);
      return true;
    } catch (error) {
      console.error("Error ingesting event:", error);
      console.error("Payload that failed:", JSON.stringify(payload, null, 2));
      return false;
    }
  }

  /**
   * Handle metrics job
   */
  private async handleMetrics(payload: any): Promise<boolean> {
    try {
      // Write metrics to JSON file
      const metricsPath = process.env.METRICS_PATH || "./metrics/last_deploy";

      const queuesFile = path.join(metricsPath, "queues.json");
      const servicesFile = path.join(metricsPath, "services.json");

      // Ensure directory exists
      if (!fs.existsSync(metricsPath)) {
        fs.mkdirSync(metricsPath, { recursive: true });
      }

      // Append metrics (simplified - in production, merge with existing metrics)
      if (payload.type === "queue") {
        const existing = fs.existsSync(queuesFile)
          ? JSON.parse(fs.readFileSync(queuesFile, "utf-8"))
          : [];
        existing.push({ ...payload, timestamp: new Date().toISOString() });
        fs.writeFileSync(queuesFile, JSON.stringify(existing, null, 2));
      } else if (payload.type === "service") {
        const existing = fs.existsSync(servicesFile)
          ? JSON.parse(fs.readFileSync(servicesFile, "utf-8"))
          : [];
        existing.push({ ...payload, timestamp: new Date().toISOString() });
        fs.writeFileSync(servicesFile, JSON.stringify(existing, null, 2));
      }

      return true;
    } catch (error) {
      console.error("Error writing metrics:", error);
      return false;
    }
  }
}

