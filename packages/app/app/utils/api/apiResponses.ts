import type { Context } from "hono";
import type { StatusCode } from "hono/utils/http-status";

export interface SuccessResponse<Data> {
  success: true;
  data: Data;
}

export interface ErrorResponse {
  success: false;
  data: {
    message: string;
  };
}

export const success =
  (c: Context) =>
  <T>(data: T, status?: StatusCode) => {
    return c.json(
      {
        success: true as const,
        data,
      },
      status,
    );
  };
export type SuccessResponseFunction = typeof success;

export const error = (c: Context) => (message: string, status?: StatusCode) => {
  return c.json(
    {
      success: false as const,
      data: {
        message,
      },
    },
    status,
  );
};

export type ErrorResponseFunction = typeof error;
