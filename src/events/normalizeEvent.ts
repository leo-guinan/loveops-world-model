import { randomUUID } from "crypto";
import { FactEvent } from "../types/core";
import { DatingFactEvent, DatingDomain, DatingEventType } from "../types/datingEvents";

/**
 * Enriches/normalizes raw events before storage.
 * Adds defaults, validates structure, enriches metadata.
 */
export function normalizeEvent(event: Partial<FactEvent>): FactEvent {
  const now = new Date().toISOString();
  
  return {
    id: event.id || randomUUID(),
    timestamp: event.timestamp || now,
    source: event.source || "system:unknown",
    actorId: event.actorId,
    targetId: event.targetId,
    domain: event.domain || "system",
    type: event.type || "UNKNOWN",
    payload: event.payload || {},
    confidence: event.confidence ?? 1.0,
    meta: {
      ...event.meta,
      normalizedAt: now,
    },
  };
}

/**
 * Normalizes a dating-specific event with domain validation.
 */
export function normalizeDatingEvent(
  event: Partial<DatingFactEvent>
): DatingFactEvent {
  const normalized = normalizeEvent(event);
  
  // Ensure domain is valid DatingDomain
  const validDomains: DatingDomain[] = [
    "profile",
    "match",
    "message",
    "feedback",
    "safety",
    "system",
  ];
  
  if (!validDomains.includes(normalized.domain as DatingDomain)) {
    throw new Error(`Invalid dating domain: ${normalized.domain}`);
  }

  return normalized as DatingFactEvent;
}

