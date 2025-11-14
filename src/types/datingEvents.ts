import { randomUUID } from "crypto";
import { FactEvent } from "./core";

// Narrow domains
export type DatingDomain =
  | "profile"
  | "match"
  | "message"
  | "feedback"
  | "safety"
  | "system";

export enum DatingEventType {
  PROFILE_CREATED = "PROFILE_CREATED",
  PROFILE_FIELD_UPDATED = "PROFILE_FIELD_UPDATED",
  INTENT_DECLARED = "INTENT_DECLARED",
  BOUNDARY_DECLARED = "BOUNDARY_DECLARED",

  PROFILE_VIEWED = "PROFILE_VIEWED",
  LIKE_SUBMITTED = "LIKE_SUBMITTED",
  PASS_SUBMITTED = "PASS_SUBMITTED",
  MATCH_CREATED = "MATCH_CREATED",
  MATCH_ARCHIVED = "MATCH_ARCHIVED",

  MESSAGE_SENT = "MESSAGE_SENT",
  DATE_PLANNED = "DATE_PLANNED",
  DATE_CONFIRMED = "DATE_CONFIRMED",
  DATE_COMPLETED = "DATE_COMPLETED",

  POST_INTERACTION_FEEDBACK = "POST_INTERACTION_FEEDBACK",
  BURNOUT_STATE_REPORTED = "BURNOUT_STATE_REPORTED",
  DELIGHT_MOMENT = "DELIGHT_MOMENT",

  BLOCK_SUBMITTED = "BLOCK_SUBMITTED",
  REPORT_SUBMITTED = "REPORT_SUBMITTED",
  MODERATION_ACTION_TAKEN = "MODERATION_ACTION_TAKEN",
}

// Example payload types
export type ProfileFieldUpdatedPayload = {
  field: "bio" | "photos" | "preferences" | "intent" | string;
  oldValue?: any;
  newValue: any;
};

export type PostInteractionFeedbackPayload = {
  matchId: string;
  raterId: string;
  vibeScore: number; // 1-5
  feltSafe: boolean;
  feltHeard: number; // 1-5
  desireToSeeAgain: number; // 1-5
  notes?: string;
};

export type IntentDeclaredPayload = {
  intent: "long_term" | "casual" | "friendship" | "exploring";
};

export type BoundaryDeclaredPayload = {
  tags: string[];
};

export type LikeSubmittedPayload = {
  likerId: string;
  likedId: string;
};

export type MatchCreatedPayload = {
  matchId: string;
  userA: string;
  userB: string;
};

export type MessageSentPayload = {
  matchId: string;
  senderId: string;
  recipientId: string;
  content: string;
  messageType?: "text" | "media" | "system";
};

export type DatePlannedPayload = {
  matchId: string;
  plannedDate: string; // ISO
  location?: string;
};

export type BurnoutStateReportedPayload = {
  userId: string;
  burnoutLevel: number; // 0-1
  reason?: string;
};

export type BlockSubmittedPayload = {
  blockerId: string;
  blockedId: string;
  reason?: string;
};

// A helper union for type-safe payloads if you want it
export type DatingEventPayload =
  | ProfileFieldUpdatedPayload
  | PostInteractionFeedbackPayload
  | IntentDeclaredPayload
  | BoundaryDeclaredPayload
  | LikeSubmittedPayload
  | MatchCreatedPayload
  | MessageSentPayload
  | DatePlannedPayload
  | BurnoutStateReportedPayload
  | BlockSubmittedPayload;

// Typed event helper
export type DatingFactEvent = FactEvent & {
  domain: DatingDomain;
  type: DatingEventType;
};

export function createDatingEvent<TPayload>(
  params: Omit<DatingFactEvent, "id" | "timestamp" | "payload"> & {
    payload: TPayload;
  }
): DatingFactEvent {
  return {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    ...params,
  };
}

