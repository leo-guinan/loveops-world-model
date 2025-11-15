import { FactEvent, WorldViewParams, WorldView } from "../../types/core";
import { DatingFactEvent, DatingEventType } from "../../types/datingEvents";
import { TrustSafetyState } from "../../types/states";

export const TrustSafetyView: WorldView<TrustSafetyState> = (
  events: FactEvent[],
  params?: WorldViewParams
): TrustSafetyState => {
  // Filter and cast to DatingFactEvent
  const datingEvents = events.filter(
    (e): e is DatingFactEvent =>
      e.domain === "profile" ||
      e.domain === "match" ||
      e.domain === "message" ||
      e.domain === "feedback" ||
      e.domain === "safety" ||
      e.domain === "system"
  );
  const asOf = params?.asOf ? new Date(params.asOf) : new Date();

  const relevant = datingEvents.filter(
    (e) =>
      (e.domain === "safety" || e.domain === "match" || e.domain === "feedback") &&
      new Date(e.timestamp) <= asOf
  );

  const state: TrustSafetyState = {
    userId: "",
    trustScore: 1.0, // Start high, degrade with issues
    reliabilityScore: 1.0,
    flags: [],
  };

  const reports: Array<{ type: string; timestamp: Date }> = [];
  const blocks: Array<{ timestamp: Date }> = [];
  const moderationActions: Array<{ severity: string; timestamp: Date }> = [];
  const feedback: Array<{ feltSafe: boolean; feltHeard: number }> = [];
  const matchCompletions = new Set<string>();
  const dateConfirmations = new Set<string>();

  for (const e of relevant) {
    if (!state.userId && (e.actorId || e.targetId)) {
      state.userId = e.actorId || e.targetId || "";
    }

    switch (e.type) {
      case DatingEventType.REPORT_SUBMITTED: {
        const targetId = e.targetId || e.payload?.reportedId;
        if (targetId === state.userId) {
          reports.push({
            type: e.payload?.reason || "unknown",
            timestamp: new Date(e.timestamp),
          });
          state.flags.push(`reported:${e.payload?.reason || "unknown"}`);
        }
        break;
      }

      case DatingEventType.BLOCK_SUBMITTED: {
        const blockedId = e.targetId || e.payload?.blockedId;
        if (blockedId === state.userId) {
          blocks.push({
            timestamp: new Date(e.timestamp),
          });
          state.flags.push("blocked");
        }
        break;
      }

      case DatingEventType.MODERATION_ACTION_TAKEN: {
        const targetId = e.targetId || e.payload?.targetId;
        if (targetId === state.userId) {
          moderationActions.push({
            severity: e.payload?.severity || "warning",
            timestamp: new Date(e.timestamp),
          });
          state.flags.push(`moderation:${e.payload?.severity || "warning"}`);
        }
        break;
      }

      case DatingEventType.POST_INTERACTION_FEEDBACK: {
        const raterId = e.payload?.raterId;
        if (raterId !== state.userId && e.actorId === state.userId) {
          // Feedback about this user from others
          feedback.push({
            feltSafe: e.payload?.feltSafe ?? true,
            feltHeard: e.payload?.feltHeard ?? 3,
          });
        }
        break;
      }

      case DatingEventType.DATE_CONFIRMED: {
        const matchId = e.payload?.matchId;
        if (matchId) {
          dateConfirmations.add(matchId);
        }
        break;
      }

      case DatingEventType.DATE_COMPLETED: {
        const matchId = e.payload?.matchId;
        if (matchId) {
          matchCompletions.add(matchId);
        }
        break;
      }
    }
  }

  // Calculate trust score (degrade with reports/blocks/moderation)
  let trustPenalty = 0;
  trustPenalty += reports.length * 0.15;
  trustPenalty += blocks.length * 0.2;
  trustPenalty += moderationActions.reduce((sum, action) => {
    const severityPenalty: Record<string, number> = {
      warning: 0.1,
      suspension: 0.3,
      ban: 1.0,
    };
    return sum + (severityPenalty[action.severity] || 0.1);
  }, 0);

  state.trustScore = Math.max(0, 1.0 - trustPenalty);

  // Calculate reliability score (based on follow-through)
  const totalDatesPlanned = dateConfirmations.size;
  const datesCompleted = matchCompletions.size;
  
  if (totalDatesPlanned > 0) {
    state.reliabilityScore = datesCompleted / totalDatesPlanned;
  } else {
    // No dates planned yet, use feedback as proxy
    if (feedback.length > 0) {
      const avgFeltHeard = feedback.reduce((sum, f) => sum + f.feltHeard, 0) / feedback.length;
      state.reliabilityScore = avgFeltHeard / 5; // Normalize to 0-1
    }
  }

  // Remove duplicate flags
  state.flags = Array.from(new Set(state.flags));

  return state;
};

