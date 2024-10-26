import { getAuth } from "@clerk/remix/ssr.server";
import { vValidator } from "@hono/valibot-validator";
import { createId } from "@paralleldrive/cuid2";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Hono } from "hono";
import * as v from "valibot";
import type { RouterContext } from "~/utils/api/middleware/routerContextMiddleware";
import { env } from "~/utils/env.server";
import { images } from "../images";
import { devRouter } from "./devRouter";
import { webhooksRouter } from "./webhooksRouter";

export const apiRouter = (args: LoaderFunctionArgs | ActionFunctionArgs) => {
  const router = new Hono<{ Variables: RouterContext }>()
    .basePath("/api")
    .get("/health", (c) => {
      return c.var.success({ message: "Success" });
    })

    .post("uploadImage", vValidator("form", v.object({ file: v.blob() })), async (c) => {
      const { userId } = await getAuth(args);

      if (!userId) {
        return c.var.error("Unauthorized", 401);
      }

      const form = await c.req.formData();

      const file = form.get("file");

      if (!file) {
        return c.var.error("Missing 'file' field");
      }

      if (!(file instanceof Blob)) {
        return c.var.error("File is not Blob");
      }

      const imageId = createId();

      await images.upload(file, { apiKey: env.server.CLOUDFLARE_IMAGES_API_KEY, id: imageId });

      return c.var.success({ imageId });
    })
    .route("/", webhooksRouter);

  if (env.server.NODE_ENV === "development") {
    router.route("/", devRouter(args));
  }

  return router;
};

export type Api = ReturnType<typeof apiRouter>;
