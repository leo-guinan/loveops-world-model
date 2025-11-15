#!/usr/bin/env node

import { createLoveopsNode } from "./createLoveopsNode";

async function main() {
  const command = process.argv[2];

  if (!command || command === "run-node") {
    const node = await createLoveopsNode();
    
    // Set up signal handlers before starting
    const shutdown = async (signal: string) => {
      console.log(`\nReceived ${signal}, shutting down gracefully...`);
      await node.stop();
      process.exit(0);
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    
    // Start the node
    console.log("LoveOps Rhizome node starting...");
    await node.start();
    
    // Keep process alive - use setInterval to keep event loop running
    // This ensures queue processors and other async operations continue
    const keepAlive = setInterval(() => {
      // Just keep the event loop alive
    }, 1000);
    
    // Clear interval on shutdown
    process.on("exit", () => {
      clearInterval(keepAlive);
    });
    
    // Keep the process running
    console.log("Node is running. Press Ctrl+C to stop.");
    
    // Wait indefinitely (process will be killed by signal handlers)
    await new Promise(() => {});
  }

  if (command === "init-node") {
    const node = await createLoveopsNode();
    console.log("Initialized LoveOps world model node at", node.config.dbPath);
    process.exit(0);
  }

  console.error(`Unknown command: ${command}`);
  console.error("Available commands:");
  console.error("  init-node  - Initialize a new node");
  console.error("  run-node   - Start and run a node (default)");
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

