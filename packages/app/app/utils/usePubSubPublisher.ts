import { type PubSubMessageInput, createPubSubMessage } from "common/pubsub";
import usePartySocket from "partysocket/react";
import { useCallback } from "react";
import { useRootSelector } from "~/state/store";
import { useEnv } from "./useEnv";

export const usePubSubPublisher = (room: string) => {
  const env = useEnv();
  const socket = usePartySocket({ host: env.PUBLIC_PARTYKIT_URL, room });
  const publisherId = useRootSelector((state) => state.pubsub.publisherId);

  const publish = useCallback(
    (message: PubSubMessageInput) => {
      socket.send(createPubSubMessage({ ...message, publisherId }));
    },
    [socket, publisherId],
  );

  return publish;
};
