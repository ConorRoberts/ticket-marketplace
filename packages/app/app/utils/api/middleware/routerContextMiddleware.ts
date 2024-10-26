import type { MiddlewareHandler } from "hono";
import { type ErrorResponseFunction, type SuccessResponseFunction, error, success } from "../apiResponses";

export interface RouterContext {
  success: ReturnType<SuccessResponseFunction>;
  error: ReturnType<ErrorResponseFunction>;
}

export const routerContextMiddleware: MiddlewareHandler = async (c, next) => {
  c.set("success", success(c));
  c.set("error", error(c));

  await next();
};
