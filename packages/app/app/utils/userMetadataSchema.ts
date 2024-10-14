import * as v from "valibot";

export const userPublicMetadataSchema = v.fallback(v.object({ isAdmin: v.fallback(v.boolean(), false) }), {
  isAdmin: false,
});

export type UserPublicMetadata = v.InferOutput<typeof userPublicMetadataSchema>;

export const userPrivateMetadataSchema = v.object({ awsRoleArn: v.string() });

export type UserPrivateMetadata = v.InferOutput<typeof userPrivateMetadataSchema>;
