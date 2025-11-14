export type UserProfileState = {
  userId: string;
  core: {
    name?: string;
    age?: number;
    location?: string;
  };
  intent?: "long_term" | "casual" | "friendship" | "exploring";
  boundaries: string[];
  preferences: {
    distanceMiles?: number;
    ageRange?: [number, number];
    tags: string[];
  };
  lastUpdated?: string;
  profileCompletenessScore: number; // 0–1
};

export type InteractionHistoryState = {
  userId: string;
  matchesCount: number;
  messagesSent: number;
  messagesReceived: number;
  avgReplyLatencySec: number | null;
  datesCompleted: number;
  ghostedRatio: number; // 0–1
};

export type EmotionalLoadState = {
  userId: string;
  burnoutLevel: number; // 0–1
  averageVibePast30d: number | null;
  averageSafetyPast30d: number | null;
  varianceOfExperiences: number | null;
  recommendedPaceAdjustment:
    | "slow_down"
    | "keep"
    | "invite_reflection"
    | "opt_in_experiments";
};

export type TrustSafetyState = {
  userId: string;
  trustScore: number; // 0–1
  reliabilityScore: number; // 0–1
  flags: string[];
};

export type MatchCompatibilityState = {
  userA: string;
  userB: string;
  compatibilityScore: number; // 0–1
  axes: {
    valuesAlignment: number;
    lifestyleOverlap: number;
    communicationStyleFit: number;
    riskOfTimeViolence: number; // 0–1, 1 = high risk
  };
  explanation: string[];
};

