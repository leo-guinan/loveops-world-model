import { z } from "zod";
import { FactEvent } from "../types/core";
import { DatingFactEvent, DatingDomain, DatingEventType } from "../types/datingEvents";

const FactEventSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  source: z.string().min(1),
  actorId: z.string().optional(),
  targetId: z.string().optional(),
  domain: z.string().min(1),
  type: z.string().min(1),
  payload: z.any(),
  confidence: z.number().min(0).max(1).optional(),
  meta: z.record(z.any()).optional(),
});

const DatingDomainSchema = z.enum([
  "profile",
  "match",
  "message",
  "feedback",
  "safety",
  "system",
]);

const DatingEventTypeSchema = z.nativeEnum(DatingEventType);

export function validateFactEvent(event: unknown): FactEvent {
  const result = FactEventSchema.safeParse(event);
  if (!result.success) {
    throw new Error(`Invalid FactEvent: ${result.error.message}`);
  }
  return result.data as FactEvent;
}

export function validateDatingEvent(event: unknown): DatingFactEvent {
  const baseEvent = validateFactEvent(event);
  
  const domainResult = DatingDomainSchema.safeParse(baseEvent.domain);
  if (!domainResult.success) {
    throw new Error(`Invalid DatingDomain: ${baseEvent.domain}`);
  }

  const typeResult = DatingEventTypeSchema.safeParse(baseEvent.type);
  if (!typeResult.success) {
    throw new Error(`Invalid DatingEventType: ${baseEvent.type}`);
  }

  return baseEvent as DatingFactEvent;
}

