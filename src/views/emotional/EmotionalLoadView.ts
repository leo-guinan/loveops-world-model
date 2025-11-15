import { FactEvent, WorldViewParams, WorldView } from "../../types/core";
import { DatingFactEvent, DatingEventType } from "../../types/datingEvents";
import { EmotionalLoadState } from "../../types/states";

export const EmotionalLoadView: WorldView<EmotionalLoadState> = (
  events: FactEvent[],
  params?: WorldViewParams
): EmotionalLoadState => {
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
  const horizon30d = new Date(asOf.getTime() - 30 * 24 * 60 * 60 * 1000);

  const relevant = datingEvents.filter((e) => {
    const eventTime = new Date(e.timestamp);
    return eventTime <= asOf;
  });

  const state: EmotionalLoadState = {
    userId: "",
    burnoutLevel: 0,
    averageVibePast30d: null,
    averageSafetyPast30d: null,
    varianceOfExperiences: null,
    recommendedPaceAdjustment: "keep",
  };

  const feedback30d: number[] = [];
  const safety30d: number[] = [];
  let latestBurnout: number | null = null;

  for (const e of relevant) {
    if (!state.userId && (e.actorId || e.targetId)) {
      state.userId = e.actorId || e.targetId || "";
    }

    switch (e.type) {
      case DatingEventType.BURNOUT_STATE_REPORTED: {
        const eventTime = new Date(e.timestamp);
        if (eventTime <= asOf) {
          latestBurnout = e.payload.burnoutLevel;
        }
        break;
      }

      case DatingEventType.POST_INTERACTION_FEEDBACK: {
        const eventTime = new Date(e.timestamp);
        if (eventTime >= horizon30d && eventTime <= asOf) {
          const payload = e.payload;
          if (payload.vibeScore) {
            feedback30d.push(payload.vibeScore);
          }
          if (payload.feltSafe !== undefined) {
            safety30d.push(payload.feltSafe ? 5 : 1); // Convert boolean to scale
          } else if (payload.feltSafe === undefined && payload.feltHeard) {
            // Use feltHeard as proxy for safety if feltSafe not provided
            safety30d.push(payload.feltHeard);
          }
        }
        break;
      }
    }
  }

  // Set burnout level (use latest reported, or infer from feedback)
  if (latestBurnout !== null) {
    state.burnoutLevel = latestBurnout;
  } else if (feedback30d.length > 0) {
    // Infer burnout from low average vibe
    const avgVibe = feedback30d.reduce((a, b) => a + b, 0) / feedback30d.length;
    state.burnoutLevel = Math.max(0, 1 - (avgVibe / 5)); // Invert: low vibe = high burnout
  }

  // Calculate averages
  if (feedback30d.length > 0) {
    state.averageVibePast30d =
      feedback30d.reduce((a, b) => a + b, 0) / feedback30d.length;
  }

  if (safety30d.length > 0) {
    state.averageSafetyPast30d =
      safety30d.reduce((a, b) => a + b, 0) / safety30d.length;
  }

  // Calculate variance
  if (feedback30d.length > 1) {
    const mean = state.averageVibePast30d!;
    const variance =
      feedback30d.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      feedback30d.length;
    state.varianceOfExperiences = variance;
  }

  // Recommend pace adjustment
  if (state.burnoutLevel > 0.7) {
    state.recommendedPaceAdjustment = "slow_down";
  } else if (state.burnoutLevel > 0.5) {
    state.recommendedPaceAdjustment = "invite_reflection";
  } else if (
    state.averageVibePast30d !== null &&
    state.averageVibePast30d > 4 &&
    state.varianceOfExperiences !== null &&
    state.varianceOfExperiences < 0.5
  ) {
    state.recommendedPaceAdjustment = "opt_in_experiments";
  } else {
    state.recommendedPaceAdjustment = "keep";
  }

  return state;
};

