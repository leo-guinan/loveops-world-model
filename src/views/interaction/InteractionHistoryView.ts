import { FactEvent, WorldViewParams, WorldView } from "../../types/core";
import { DatingFactEvent, DatingEventType } from "../../types/datingEvents";
import { InteractionHistoryState } from "../../types/states";

export const InteractionHistoryView: WorldView<InteractionHistoryState> = (
  events: FactEvent[],
  params?: WorldViewParams
): InteractionHistoryState => {
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
  const horizon = params?.horizon ? parseHorizon(params.horizon) : null;

  const relevant = datingEvents.filter((e) => {
    const eventTime = new Date(e.timestamp);
    if (eventTime > asOf) return false;
    if (horizon && eventTime < horizon) return false;
    return (
      e.domain === "match" ||
      e.domain === "message" ||
      e.type === DatingEventType.DATE_COMPLETED
    );
  });

  const state: InteractionHistoryState = {
    userId: "",
    matchesCount: 0,
    messagesSent: 0,
    messagesReceived: 0,
    avgReplyLatencySec: null,
    datesCompleted: 0,
    ghostedRatio: 0,
  };

  const matchIds = new Set<string>();
  const messageTimestamps: { [matchId: string]: { sent: Date[]; received: Date[] } } = {};
  let totalReplyLatency = 0;
  let replyCount = 0;

  for (const e of relevant) {
    if (!state.userId && (e.actorId || e.targetId)) {
      state.userId = e.actorId || e.targetId || "";
    }

    switch (e.type) {
      case DatingEventType.MATCH_CREATED: {
        const matchId = e.payload.matchId || e.id;
        matchIds.add(matchId);
        break;
      }

      case DatingEventType.MESSAGE_SENT: {
        const matchId = e.payload.matchId;
        const senderId = e.payload.senderId;
        const eventTime = new Date(e.timestamp);

        if (!messageTimestamps[matchId]) {
          messageTimestamps[matchId] = { sent: [], received: [] };
        }

        if (senderId === state.userId) {
          state.messagesSent++;
          messageTimestamps[matchId].sent.push(eventTime);
        } else {
          state.messagesReceived++;
          messageTimestamps[matchId].received.push(eventTime);

          // Calculate reply latency: time between received message and next sent message
          const sentAfter = messageTimestamps[matchId].sent
            .filter((t) => t > eventTime)
            .sort((a, b) => a.getTime() - b.getTime())[0];

          if (sentAfter) {
            const latency = (sentAfter.getTime() - eventTime.getTime()) / 1000;
            totalReplyLatency += latency;
            replyCount++;
          }
        }
        break;
      }

      case DatingEventType.DATE_COMPLETED:
        state.datesCompleted++;
        break;
    }
  }

  state.matchesCount = matchIds.size;

  if (replyCount > 0) {
    state.avgReplyLatencySec = totalReplyLatency / replyCount;
  }

  // Ghosted ratio: matches with messages but no recent activity
  const activeMatches = Object.keys(messageTimestamps).length;
  const ghostedMatches = Array.from(matchIds).filter((matchId) => {
    const msgs = messageTimestamps[matchId];
    if (!msgs) return false;
    const lastActivity = Math.max(
      ...msgs.sent.map((t) => t.getTime()),
      ...msgs.received.map((t) => t.getTime())
    );
    const daysSinceActivity = (asOf.getTime() - lastActivity) / (1000 * 60 * 60 * 24);
    return daysSinceActivity > 7; // 7 days = ghosted
  }).length;

  if (activeMatches > 0) {
    state.ghostedRatio = ghostedMatches / activeMatches;
  }

  return state;
};

function parseHorizon(horizon: string): Date | null {
  const match = horizon.match(/^(\d+)([dwmy])$/);
  if (!match) return null;

  const amount = parseInt(match[1], 10);
  const unit = match[2];
  const now = new Date();

  switch (unit) {
    case "d":
      return new Date(now.getTime() - amount * 24 * 60 * 60 * 1000);
    case "w":
      return new Date(now.getTime() - amount * 7 * 24 * 60 * 60 * 1000);
    case "m":
      return new Date(now.getTime() - amount * 30 * 24 * 60 * 60 * 1000);
    case "y":
      return new Date(now.getTime() - amount * 365 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
}

