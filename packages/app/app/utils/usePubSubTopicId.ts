import { useUser } from "@clerk/remix";
import { useMemo } from "react";
import { useEnv } from "./useEnv";

export const usePubSubTopicId = (name?: string) => {
  const env = useEnv();
  const { user } = useUser();

  const value = useMemo(() => {
    const topic = name ?? "general";

    return `arn:aws:iot:${env.PUBLIC_AWS_REGION}:${env.PUBLIC_AWS_ACCOUNT_ID}:topic/${user?.id}/${topic}`;
  }, [env.PUBLIC_AWS_ACCOUNT_ID, env.PUBLIC_AWS_REGION, name, user?.id]);

  return value;
};
