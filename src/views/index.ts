import { UserProfileStateView } from "./profile/UserProfileStateView";
import { InteractionHistoryView } from "./interaction/InteractionHistoryView";
import { EmotionalLoadView } from "./emotional/EmotionalLoadView";
import { TrustSafetyView } from "./safety/TrustSafetyView";
import { MatchCompatibilityView } from "./compatibility/MatchCompatibilityView";

export const viewRegistry = {
  UserProfileStateView,
  InteractionHistoryView,
  EmotionalLoadView,
  TrustSafetyView,
  MatchCompatibilityView,
};

export type ViewName = keyof typeof viewRegistry;

