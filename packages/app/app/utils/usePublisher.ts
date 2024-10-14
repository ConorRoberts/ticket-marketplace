import { useMutation } from "@tanstack/react-query";
import { mqtt } from "aws-iot-device-sdk-v2";
import { useMemo } from "react";
import type { PubSubMessageInput } from "~/utils/pubSubMessageSchema";
import { createPubSubConnection } from "./createPubSubConnection";
import { useCredentials } from "./useCredentials";
import { useEnv } from "./useEnv";
import { usePubSubTopicId } from "./usePubSubTopicId";
import { usePublisherId } from "./usePublisherId";

export const usePublisher = (args: { topic?: string }) => {
  const { data: credentials } = useCredentials();
  const publisherId = usePublisherId();
  const env = useEnv();
  const topic = usePubSubTopicId(args.topic);

  const client = useMemo(() => {
    if (!credentials) {
      return;
    }

    return createPubSubConnection({ credentials, endpoint: env.PUBLIC_IOT_ENDPOINT, region: env.PUBLIC_AWS_REGION });
  }, [credentials, env.PUBLIC_IOT_ENDPOINT, env.PUBLIC_AWS_REGION]);

  const { mutate } = useMutation({
    mutationFn: async (message: PubSubMessageInput) => {
      if (!client) {
        console.error("Pubsub client is not setup yet");
        return null;
      }

      await client.publish(topic, JSON.stringify({ ...message, publisherId }), mqtt.QoS.AtLeastOnce);

      return null;
    },
  });

  return mutate;
};
