#!/usr/bin/env node

import { createLoveopsNode } from "./createLoveopsNode";

async function main() {
  const command = process.argv[2];

  if (!command || command === "run-node") {
    const node = await createLoveopsNode();
    console.log("LoveOps Rhizome node running...");
    await node.start();
    
    // Keep process alive
    process.on("SIGINT", async () => {
      console.log("\nShutting down...");
      await node.stop();
      process.exit(0);
    });
    
    return;
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

