import { useMutation } from "@tanstack/react-query";
import type { ChangeEvent } from "react";
import { isNonNullish } from "remeda";
import { toast } from "sonner";
import { useApi } from "./api/apiClient";

export const useUploadFiles = () => {
  const api = useApi();

  return useMutation({
    mutationFn: async (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;

      if (!files) {
        toast.error("No files selected");
        throw new Error();
      }

      const upload = async () => {
        return await Promise.all(
          [...Array.from({ length: files.length })]
            .map((_, i) => files[i])
            .filter(isNonNullish)
            .map(async (f) => {
              const response = await api.uploadImage.$post({ form: { file: f } });
              const uploadResult = await response.json();

              if (!uploadResult.success) {
                throw new Error();
              }

              return uploadResult.data;
            }),
        );
      };

      const uploadPromise = upload();

      toast.promise(uploadPromise, {
        loading: "Uploading",
        error: "Upload error",
        success: "Upload success",
      });

      return await uploadPromise;
    },
  });
};
