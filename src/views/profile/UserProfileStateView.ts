import { FactEvent, WorldViewParams, WorldView } from "../../types/core";
import { DatingFactEvent, DatingEventType } from "../../types/datingEvents";
import { UserProfileState } from "../../types/states";

export const UserProfileStateView: WorldView<UserProfileState> = (
  events: FactEvent[],
  params?: WorldViewParams
): UserProfileState => {
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
      e.domain === "profile" &&
      new Date(e.timestamp) <= asOf
  );

  const state: UserProfileState = {
    userId: "", // we'll infer from actorId/targetId
    core: {},
    intent: undefined,
    boundaries: [],
    preferences: {
      tags: [],
    },
    profileCompletenessScore: 0,
    lastUpdated: undefined,
  };

  for (const e of relevant) {
    if (!state.userId) {
      state.userId = e.actorId ?? e.targetId ?? "unknown";
    }

    switch (e.type) {
      case DatingEventType.PROFILE_CREATED:
        state.lastUpdated = e.timestamp;
        break;

      case DatingEventType.PROFILE_FIELD_UPDATED: {
        const { field, newValue } = e.payload;
        if (field === "bio") {
          // could track or ignore in this view
        } else if (field === "age") {
          state.core.age = newValue;
        } else if (field === "location") {
          state.core.location = newValue;
        } else if (field === "name") {
          state.core.name = newValue;
        } else if (field === "preferences") {
          state.preferences = { ...state.preferences, ...newValue };
        }
        state.lastUpdated = e.timestamp;
        break;
      }

      case DatingEventType.INTENT_DECLARED:
        state.intent = e.payload.intent;
        state.lastUpdated = e.timestamp;
        break;

      case DatingEventType.BOUNDARY_DECLARED:
        state.boundaries = Array.from(
          new Set([...state.boundaries, ...e.payload.tags])
        );
        state.lastUpdated = e.timestamp;
        break;
    }
  }

  // naive completeness heuristic
  let score = 0;
  if (state.core.age) score += 0.2;
  if (state.core.location) score += 0.2;
  if (state.intent) score += 0.2;
  if (state.boundaries.length) score += 0.2;
  if (state.preferences.tags.length) score += 0.2;
  state.profileCompletenessScore = score;

  return state;
};

