import { useState } from "react";
import { fetchScreenshot } from "./fetch-screenshot";

export const useScreenshot = () => {
  const [src, setSrc] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );

  const fetch = async ({
    timeout,
    targetUrl,
    imageType,
  }: {
    imageType: string;
    timeout?: number;
    targetUrl: string;
  }) => {
    setState("loading");

    try {
      const { src } = await fetchScreenshot({
        imageType,
        targetUrl,
        timeout,
      });
      setSrc(src ?? null);
      setState(src ? "success" : "error");
    } catch (_error) {
      setState("error");
    }
  };

  return {
    src,
    state,
    fetch,
  };
};
