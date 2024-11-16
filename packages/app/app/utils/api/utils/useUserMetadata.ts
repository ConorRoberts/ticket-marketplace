import { useUser } from "@clerk/remix";
import { useMemo } from "react";
import * as v from "valibot";
import { userPublicMetadataSchema } from "~/utils/userMetadataSchema";

export const useUserMetadata = () => {
  const { user } = useUser();

  const data = useMemo(() => {
    if (!user) {
      return null;
    }

    return { public: v.parse(userPublicMetadataSchema, user.publicMetadata) };
  }, [user]);

  return data;
};
