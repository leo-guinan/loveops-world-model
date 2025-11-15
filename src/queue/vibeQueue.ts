import * as fs from "fs";
import * as path from "path";
import { QueueJob, QueueConfig } from "./types";

/**
 * VibeQueue file-based queue operations
 */
export class VibeQueue {
  private basePath: string;
  private queuePath: string;

  constructor(basePath: string, queueName: string) {
    this.basePath = basePath;
    this.queuePath = path.join(basePath, queueName);
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    const dirs = ["ready", "in_progress", "scheduled", "done", "dead"];
    for (const dir of dirs) {
      const dirPath = path.join(this.queuePath, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    }
  }

  /**
   * Enqueue a job to the ready directory
   */
  async enqueue(payload: any, scheduledFor?: Date): Promise<string> {
    const job: QueueJob = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      payload,
      attempts: 0,
      createdAt: new Date().toISOString(),
      scheduledFor: scheduledFor?.toISOString(),
    };

    const targetDir = scheduledFor ? "scheduled" : "ready";
    const filePath = path.join(this.queuePath, targetDir, `${job.id}.json`);

    fs.writeFileSync(filePath, JSON.stringify(job, null, 2), "utf-8");
    return job.id;
  }

  /**
   * Get next job from ready directory
   */
  async dequeue(): Promise<QueueJob | null> {
    const readyDir = path.join(this.queuePath, "ready");
    const files = fs.readdirSync(readyDir).filter((f) => f.endsWith(".json"));

    if (files.length === 0) {
      return null;
    }

    const filePath = path.join(readyDir, files[0]);
    const content = fs.readFileSync(filePath, "utf-8");
    const job: QueueJob = JSON.parse(content);

    // Move to in_progress
    const inProgressPath = path.join(this.queuePath, "in_progress", `${job.id}.json`);
    fs.renameSync(filePath, inProgressPath);

    return job;
  }

  /**
   * Mark job as complete (move to done)
   */
  async complete(jobId: string): Promise<void> {
    const inProgressPath = path.join(this.queuePath, "in_progress", `${jobId}.json`);
    const donePath = path.join(this.queuePath, "done", `${jobId}.json`);

    if (fs.existsSync(inProgressPath)) {
      fs.renameSync(inProgressPath, donePath);
    }
  }

  /**
   * Mark job as failed (move to dead or retry)
   */
  async fail(jobId: string, job: QueueJob, config: QueueConfig): Promise<void> {
    const inProgressPath = path.join(this.queuePath, "in_progress", `${jobId}.json`);

    job.attempts += 1;

    const maxRetries = config.retries ?? 3;
    if (job.attempts >= maxRetries) {
      // Move to dead
      const deadPath = path.join(this.queuePath, "dead", `${jobId}.json`);
      fs.renameSync(inProgressPath, deadPath);
    } else {
      // Retry: move back to ready after delay
      const retryDelay = (config.retryDelay ?? 1000) * job.attempts;
      const retryTime = new Date(Date.now() + retryDelay);
      job.scheduledFor = retryTime.toISOString();

      const scheduledPath = path.join(this.queuePath, "scheduled", `${jobId}.json`);
      fs.writeFileSync(scheduledPath, JSON.stringify(job, null, 2), "utf-8");
      fs.unlinkSync(inProgressPath);
    }
  }

  /**
   * Process scheduled jobs that are ready
   */
  async processScheduled(): Promise<void> {
    const scheduledDir = path.join(this.queuePath, "scheduled");
    if (!fs.existsSync(scheduledDir)) return;

    const files = fs.readdirSync(scheduledDir).filter((f) => f.endsWith(".json"));
    const now = new Date();

    for (const file of files) {
      const filePath = path.join(scheduledDir, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const job: QueueJob = JSON.parse(content);

      if (job.scheduledFor && new Date(job.scheduledFor) <= now) {
        // Move to ready
        const readyPath = path.join(this.queuePath, "ready", file);
        fs.renameSync(filePath, readyPath);
      }
    }
  }
}

