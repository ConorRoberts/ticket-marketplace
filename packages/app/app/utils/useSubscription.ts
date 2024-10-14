import { mqtt } from "aws-iot-device-sdk-v2";
import { useIsomorphicLayoutEffect } from "framer-motion";
import { useEffect, useRef } from "react";
import * as v from "valibot";
import { type PubSubMessageOutput, pubSubMessageOutputSchema } from "~/utils/pubSubMessageSchema";
import { createPubSubConnection } from "./createPubSubConnection";
import { useCredentials } from "./useCredentials";
import { useEnv } from "./useEnv";
import { usePubSubTopicId } from "./usePubSubTopicId";
import { usePublisherId } from "./usePublisherId";

export const useSubscription = (args: {
  topic?: string;
  onMessage: (message: PubSubMessageOutput) => void | Promise<void>;
}) => {
  const publisherId = usePublisherId();
  const { data: credentials } = useCredentials();
  const env = useEnv();
  const savedOnMessage = useRef(args.onMessage);
  const topic = usePubSubTopicId(args.topic);

  useIsomorphicLayoutEffect(() => {
    savedOnMessage.current = args.onMessage;
  }, [args.onMessage]);

  useEffect(() => {
    if (!credentials) {
      return;
    }

    let isSubscribed = false;
    let isConnected = false;

    if (!credentials) {
      return;
    }

    const newConnection = createPubSubConnection({
      credentials,
      endpoint: env.PUBLIC_IOT_ENDPOINT,
      region: env.PUBLIC_AWS_REGION,
    });

    const subscribe = async () => {
      try {
        await newConnection.connect();
        isConnected = true;

        await newConnection.subscribe(topic, mqtt.QoS.AtLeastOnce, async (_topic, payload) => {
          const decoder = new TextDecoder("utf8");
          const message = decoder.decode(new Uint8Array(payload));

          const parsedData = v.safeParse(pubSubMessageOutputSchema, JSON.parse(message));

          console.log(message);
          if (parsedData.success) {
            if (parsedData.output.publisherId === publisherId) {
              // return;
            }

            await savedOnMessage.current(parsedData.output);
          } else {
            console.error(parsedData.issues);
          }
        });
        isSubscribed = true;
      } catch (_e) {}
    };

    subscribe();

    return () => {
      try {
        (async () => {
          if (isSubscribed) {
            await newConnection.unsubscribe(topic);
          }
          if (isConnected) {
            await newConnection.disconnect();
          }
        })();
      } catch (_e) {}
    };
  }, [publisherId, topic, credentials, env.PUBLIC_IOT_ENDPOINT, env.PUBLIC_AWS_REGION]);
};
