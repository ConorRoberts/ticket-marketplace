import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Hono } from "hono";

const app = new Hono().basePath("/api");

app.get("/health", (c) => {
  return c.json({ message: "Success" });
});

const handler = async (args: LoaderFunctionArgs | ActionFunctionArgs) => {
  return app.fetch(args.request, {});
};

export { handler as action, handler as loader };

