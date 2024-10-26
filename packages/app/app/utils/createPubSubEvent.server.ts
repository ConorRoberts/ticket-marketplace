import type { PubSubMessageInput } from "common/pubsub";
import { env } from "./env.server";

export const createPubSubEvent = async (args: { room: string; event: PubSubMessageInput }) => {
  await fetch(`${env.server.PUBLIC_PARTYKIT_URL}/parties/main/${args.room}`, {
    method: "POST",
    body: JSON.stringify(args.event),
  });
};
