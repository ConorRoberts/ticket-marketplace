import { useUser } from "@clerk/remix";
import type { MetaFunction } from "@remix-run/node";
import { Button } from "~/components/ui/button";
import { createMetadata } from "~/utils/createMetadata";
// import { useCredentials } from "~/utils/useCredentials";
import { usePublisher } from "~/utils/usePublisher";
import { useSubscription } from "~/utils/useSubscription";

export const meta: MetaFunction = () => {
  return createMetadata({ title: "Route" });
};

const Route = () => {
  const { user } = useUser();
  const publish = usePublisher({ topic: user?.id });
  // const { data: credentials } = useCredentials();

  // console.log(credentials);

  useSubscription({
    topic: user?.id,
    onMessage: (message) => {
      console.log(message);
    },
  });

  return (
    <div>
      <Button
        onClick={() => {
          publish({ type: "placeholder", data: {} });
        }}
      >
        Publish
      </Button>
    </div>
  );
};

export default Route;
