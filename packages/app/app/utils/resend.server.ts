import { Resend } from "resend";
import { env } from "~/utils/env.server";

export const resend = new Resend(env.server.RESEND_API_KEY);
