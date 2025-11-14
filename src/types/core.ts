export type FactEvent = {
  id: string;
  timestamp: string; // ISO
  source: string; // "user:<id>", "system:matchmaker", etc.
  actorId?: string;
  targetId?: string;
  domain: string; // "profile" | "match" | "message" | ...
  type: string; // specific event type
  payload: any;
  confidence?: number; // 0–1
  meta?: Record<string, any>;
};

export type WorldViewParams = {
  asOf?: string; // default: now
  horizon?: string; // e.g. "30d"
  perspective?: string; // e.g. "user_self", "matchmaker_v1"
};

export type WorldView<State> = (
  events: FactEvent[],
  params?: WorldViewParams
) => State;

