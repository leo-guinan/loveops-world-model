import { viewRegistry } from "../views";
import { WorldView } from "../types/core";

/**
 * Register all views with Rhizome's view system.
 * This is a placeholder - adapt to actual Rhizome view registration API.
 */
export async function registerViews(node: any): Promise<void> {
  // TODO: Replace with actual Rhizome view registration
  // Example:
  // for (const [name, viewFn] of Object.entries(viewRegistry)) {
  //   await node.registerView(name, viewFn);
  // }
  
  const viewNames = Object.keys(viewRegistry);
  console.log(`Registered ${viewNames.length} views: ${viewNames.join(", ")}`);
  
  // Placeholder: store views in node for later use
  if (!node._loveopsViews) {
    node._loveopsViews = {};
  }
  
  for (const [name, viewFn] of Object.entries(viewRegistry)) {
    node._loveopsViews[name] = viewFn;
  }
}

/**
 * Get a registered view by name.
 */
export function getView(name: string): WorldView<any> | undefined {
  return viewRegistry[name as keyof typeof viewRegistry];
}

