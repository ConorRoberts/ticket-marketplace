import superjson from "superjson";
import * as v from "valibot";

const defineMessage = <Name extends string, Data extends v.GenericSchema>(args: {
  name: Name;
  data: Data;
}) => {
  return v.object({
    type: v.literal(args.name),
    // The unique session ID of the message publisher
    publisherId: v.string(),
    data: args.data,
  });
};

const messageTypes = [
  defineMessage({ name: "ticketPurchase", data: v.object({ transactionId: v.string() }) }),
  defineMessage({
    name: "chatMessage",
    data: v.object({
      id: v.string(),
      message: v.string(),
      listingId: v.string(),
      transactionId: v.string(),
      userId: v.nullable(v.string()),
      createdAt: v.date(),
      updatedAt: v.date(),
    }),
  }),
] as const;

const pubSubMessageInputSchema = v.variant(
  "type",
  messageTypes.map((e) => v.omit(e, ["publisherId"])),
);

export type PubSubMessageInput = v.InferOutput<typeof pubSubMessageInputSchema>;

export type PubSubMessageOutput = v.InferOutput<typeof pubSubMessageOutputSchema>;
export const pubSubMessageOutputSchema = v.variant("type", messageTypes);

export const parsePubSubMessage = (message: string) => {
  const parsed = superjson.parse(message);
  const valid = v.parse(pubSubMessageOutputSchema, parsed);

  return valid;
};

export const createPubSubMessage = (message: PubSubMessageOutput) => {
  const stringified = superjson.stringify(message);

  return stringified;
};
