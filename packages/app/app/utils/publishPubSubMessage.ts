import { type PubSubMessageInput, createPubSubMessage } from "common/pubsub";
import { env } from "./env.server";

export const publishPubSubMessage = async (args: { room: string; event: PubSubMessageInput }) => {
  await fetch(`${env.server.PUBLIC_PARTYKIT_URL}/parties/main/${args.room}`, {
    method: "POST",
    body: createPubSubMessage({ ...args.event, publisherId: "server" }),
  });
};
