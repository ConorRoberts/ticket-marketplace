import { type ClerkClient, createClerkClient, verifyToken } from "@clerk/backend";
import { createPubSubMessage, parsePubSubMessage, pubSubMessageOutputSchema } from "common/pubsub";
import type * as Party from "partykit/server";
import * as v from "valibot";

const envSchema = v.object({ CLERK_SECRET_KEY: v.string(), CLERK_PUBLISHABLE_KEY: v.string() });

export default class Server implements Party.Server {
  private env: v.InferOutput<typeof envSchema>;
  private _clerk: ClerkClient;

  constructor(readonly room: Party.Room) {
    const parsedEnv = v.safeParse(envSchema, room.env);

    if (!parsedEnv.success) {
      for (const e of parsedEnv.issues) {
        console.error(`${e.path?.map((e) => e.key).join(".")}: ${e.message}`);
      }

      throw new Error("Invalid environment variables");
    }

    this.env = parsedEnv.output;

    this._clerk = createClerkClient({
      secretKey: this.env.CLERK_SECRET_KEY,
      publishableKey: this.env.CLERK_PUBLISHABLE_KEY,
    });
  }

  async onConnect(conn: Party.Connection, _ctx: Party.ConnectionContext) {
    if (!conn.url) {
      return;
    }

    const url = new URL(conn.url);

    const token = url.searchParams.get("token");

    if (token) {
      const _verifiedToken = await verifyToken(token, { secretKey: this.env.CLERK_SECRET_KEY });
    }
  }

  onMessage(message: string, sender: Party.Connection) {
    this.room.broadcast(`${sender.id}: ${message}`, [sender.id]);
  }

  async onRequest(req: Party.Request): Promise<Response> {
    const token = req.headers.get("Authorization");

    if (token) {
      const _verifiedToken = await verifyToken(token, { secretKey: this.env.CLERK_SECRET_KEY });
    }

    const json = await req.text();
    const parsed = parsePubSubMessage(json);
    const event = v.safeParse(pubSubMessageOutputSchema, parsed);

    if (!event.success) {
      console.error(event);
      return new Response("Invalid message");
    }

    const except: string[] = [event.output.publisherId];

    const data = event.output;

    if (data.type === "chatMessage") {
      this.room.broadcast(createPubSubMessage(data), except);
    }

    return new Response("Success");
  }
}

Server satisfies Party.Worker;
