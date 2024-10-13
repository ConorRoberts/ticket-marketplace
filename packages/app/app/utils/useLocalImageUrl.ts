import { useEffect, useState } from "react";

export const useLocalImageUrl = (file: File | null) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      return;
    }

    const u = URL.createObjectURL(file);
    setUrl(u);

    return () => {
      URL.revokeObjectURL(u);
    };
  }, [file]);

  return url;
};
