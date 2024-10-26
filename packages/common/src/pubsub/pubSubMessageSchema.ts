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
] as const;

const pubSubMessageInputSchema = v.variant(
  "type",
  messageTypes.map((e) => v.omit(e, ["publisherId"])),
);
export type PubSubMessageInput = v.InferOutput<typeof pubSubMessageInputSchema>;

export type PubSubMessageOutput = v.InferOutput<typeof pubSubMessageOutputSchema>;
export const pubSubMessageOutputSchema = v.variant("type", messageTypes);
