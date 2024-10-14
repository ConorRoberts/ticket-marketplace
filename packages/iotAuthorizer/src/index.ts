import type { IoTCustomAuthorizerHandler } from "aws-lambda";
import * as jose from "jose";
import * as v from "valibot";

const envSchema = v.object({});

const _env = v.parse(envSchema, process.env);

const jwks = jose.createRemoteJWKSet(new URL(""));

const _validateToken = async (token: string) => {
  try {
    const { payload } = await jose.jwtVerify(token, jwks);

    return payload;
  } catch (_e) {
    return false;
  }
};

interface _JwtPayload {
  sub: string;
  iss: string;
  client_id: string;
  origin_jti: string;
  event_id: string;
  token_use: string;
  scope: string;
  auth_time: number;
  exp: number;
  iat: number;
  jti: string;
  username: string;
}

export const handler: IoTCustomAuthorizerHandler = async (event) => {
  console.log(JSON.stringify(event, null, 2));
  const token = event.token;

  if (!token) {
    throw new Error("Missing token");
  }

  return {
    isAuthenticated: false,
    disconnectAfterInSeconds: 0,
    policyDocuments: [{ Statement: [{ Action: "", Effect: "Allow", Principal: "" }], Version: "" }],
    refreshAfterInSeconds: 0,
    principalId: "",
  };
};
