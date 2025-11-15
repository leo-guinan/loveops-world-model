import { FactEvent, WorldViewParams, WorldView } from "../../types/core";
import { DatingFactEvent, DatingEventType } from "../../types/datingEvents";
import { MatchCompatibilityState } from "../../types/states";

export const MatchCompatibilityView: WorldView<MatchCompatibilityState> = (
  events: FactEvent[],
  params?: WorldViewParams
): MatchCompatibilityState => {
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
  const perspective = params?.perspective;

  // Extract userA and userB from perspective or infer from events
  let userA = "";
  let userB = "";

  if (perspective) {
    const match = perspective.match(/^match:([^:]+):([^:]+)$/);
    if (match) {
      userA = match[1];
      userB = match[2];
    }
  }

  const relevant = datingEvents.filter((e) => {
    const eventTime = new Date(e.timestamp);
    if (eventTime > asOf) return false;

    // Filter to events involving both users
    if (userA && userB) {
      return (
        (e.actorId === userA && e.targetId === userB) ||
        (e.actorId === userB && e.targetId === userA) ||
        (e.payload?.userA === userA && e.payload?.userB === userB) ||
        (e.payload?.userA === userB && e.payload?.userB === userA)
      );
    }

    return e.domain === "match" || e.domain === "message" || e.domain === "feedback";
  });

  // If users not specified, try to infer from match events
  if (!userA || !userB) {
    const matchEvent = relevant.find((e) => e.type === DatingEventType.MATCH_CREATED);
    if (matchEvent) {
      userA = matchEvent.payload?.userA || matchEvent.actorId || "";
      userB = matchEvent.payload?.userB || matchEvent.targetId || "";
    }
  }

  const state: MatchCompatibilityState = {
    userA: userA || "unknown",
    userB: userB || "unknown",
    compatibilityScore: 0.5,
    axes: {
      valuesAlignment: 0.5,
      lifestyleOverlap: 0.5,
      communicationStyleFit: 0.5,
      riskOfTimeViolence: 0.5,
    },
    explanation: [],
  };

  if (!userA || !userB || userA === "unknown" || userB === "unknown") {
    state.explanation.push("Cannot compute compatibility: users not identified");
    return state;
  }

  // Collect profile data for both users
  const userAProfile: { intent?: string; boundaries: string[]; preferences: { tags: string[] } } = {
    boundaries: [],
    preferences: { tags: [] },
  };
  const userBProfile: { intent?: string; boundaries: string[]; preferences: { tags: string[] } } = {
    boundaries: [],
    preferences: { tags: [] },
  };

  // Collect interaction data
  const messages: Array<{ senderId: string; timestamp: Date; latency?: number }> = [];
  const feedback: Array<{ raterId: string; vibeScore: number; feltSafe: boolean; feltHeard: number }> = [];
  let lastMessageTime: Date | null = null;

  for (const e of relevant) {
    // Extract profile data
    if (e.actorId === userA && e.type === DatingEventType.INTENT_DECLARED) {
      userAProfile.intent = e.payload?.intent;
    }
    if (e.actorId === userB && e.type === DatingEventType.INTENT_DECLARED) {
      userBProfile.intent = e.payload?.intent;
    }
    if (e.actorId === userA && e.type === DatingEventType.BOUNDARY_DECLARED) {
      userAProfile.boundaries = [...userAProfile.boundaries, ...(e.payload?.tags || [])];
    }
    if (e.actorId === userB && e.type === DatingEventType.BOUNDARY_DECLARED) {
      userBProfile.boundaries = [...userBProfile.boundaries, ...(e.payload?.tags || [])];
    }

    // Extract interaction data
    if (e.type === DatingEventType.MESSAGE_SENT) {
      const senderId = e.payload?.senderId;
      const recipientId = e.payload?.recipientId;
      if ((senderId === userA && recipientId === userB) || (senderId === userB && recipientId === userA)) {
        const msgTime = new Date(e.timestamp);
        messages.push({
          senderId,
          timestamp: msgTime,
        });
        if (lastMessageTime) {
          const latency = (msgTime.getTime() - lastMessageTime.getTime()) / 1000;
          messages[messages.length - 1].latency = latency;
        }
        lastMessageTime = msgTime;
      }
    }

    if (e.type === DatingEventType.POST_INTERACTION_FEEDBACK) {
      const matchId = e.payload?.matchId;
      if (matchId) {
        feedback.push({
          raterId: e.payload?.raterId,
          vibeScore: e.payload?.vibeScore || 3,
          feltSafe: e.payload?.feltSafe ?? true,
          feltHeard: e.payload?.feltHeard || 3,
        });
      }
    }
  }

  // Calculate compatibility axes

  // Values alignment: based on intent match and boundary overlap
  if (userAProfile.intent && userBProfile.intent) {
    if (userAProfile.intent === userBProfile.intent) {
      state.axes.valuesAlignment = 0.9;
      state.explanation.push("Both users share the same dating intent");
    } else {
      state.axes.valuesAlignment = 0.5;
      state.explanation.push("Users have different dating intents");
    }
  }

  const boundaryOverlap = userAProfile.boundaries.filter((b) =>
    userBProfile.boundaries.includes(b)
  ).length;
  const totalBoundaries = new Set([...userAProfile.boundaries, ...userBProfile.boundaries]).size;
  if (totalBoundaries > 0) {
    const boundaryScore = boundaryOverlap / totalBoundaries;
    state.axes.valuesAlignment = (state.axes.valuesAlignment + boundaryScore) / 2;
  }

  // Lifestyle overlap: based on preference tags (simplified)
  const tagOverlap = userAProfile.preferences.tags.filter((t) =>
    userBProfile.preferences.tags.includes(t)
  ).length;
  const totalTags = new Set([...userAProfile.preferences.tags, ...userBProfile.preferences.tags]).size;
  if (totalTags > 0) {
    state.axes.lifestyleOverlap = tagOverlap / totalTags;
  }

  // Communication style fit: based on message patterns and feedback
  if (messages.length > 0) {
    const avgLatency = messages
      .filter((m) => m.latency !== undefined)
      .reduce((sum, m) => sum + (m.latency || 0), 0) / messages.filter((m) => m.latency !== undefined).length;

    // Lower latency = better communication fit
    const latencyScore = Math.max(0, 1 - avgLatency / (24 * 60 * 60)); // Normalize to 24h
    state.axes.communicationStyleFit = latencyScore;
  }

  if (feedback.length > 0) {
    const avgVibe = feedback.reduce((sum, f) => sum + f.vibeScore, 0) / feedback.length;
    const avgFeltHeard = feedback.reduce((sum, f) => sum + f.feltHeard, 0) / feedback.length;
    const communicationScore = (avgVibe / 5 + avgFeltHeard / 5) / 2;
    state.axes.communicationStyleFit = (state.axes.communicationStyleFit + communicationScore) / 2;
  }

  // Risk of time violence: inverse of compatibility indicators
  const riskFactors: number[] = [];
  if (state.axes.valuesAlignment < 0.5) riskFactors.push(0.3);
  if (state.axes.communicationStyleFit < 0.3) riskFactors.push(0.4);
  if (feedback.some((f) => !f.feltSafe)) riskFactors.push(0.5);
  if (messages.length === 0) riskFactors.push(0.2); // No interaction = unknown risk

  state.axes.riskOfTimeViolence = Math.min(1, riskFactors.reduce((sum, r) => sum + r, 0.2));

  // Overall compatibility score: weighted average
  state.compatibilityScore =
    state.axes.valuesAlignment * 0.3 +
    state.axes.lifestyleOverlap * 0.2 +
    state.axes.communicationStyleFit * 0.3 +
    (1 - state.axes.riskOfTimeViolence) * 0.2;

  // Generate explanation
  if (state.compatibilityScore > 0.7) {
    state.explanation.push("High compatibility detected");
  } else if (state.compatibilityScore < 0.4) {
    state.explanation.push("Low compatibility - significant differences detected");
  } else {
    state.explanation.push("Moderate compatibility - some alignment present");
  }

  return state;
};

