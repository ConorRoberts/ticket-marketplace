import { useAuth } from "@clerk/remix";
import { useIsomorphicLayoutEffect } from "framer-motion";
import { useEffect, useRef } from "react";
import { WebSocket } from "ws";

export const useWebSocket = (fn: (data: string) => void) => {
  const savedFn = useRef(fn);
  const ws = useRef<WebSocket | null>(null);
  const { getToken } = useAuth();
  const savedGetToken = useRef(getToken);

  useIsomorphicLayoutEffect(() => {
    savedFn.current = fn;
  }, [fn]);

  useIsomorphicLayoutEffect(() => {
    savedGetToken.current = getToken;
  }, [getToken]);

  useEffect(() => {
    (async () => {
      if (!ws.current) {
        const token = await savedGetToken.current();

        if (!token) {
          console.error("Error getting bearer token");
          return;
        }

        const client = new WebSocket("ws://www.example.com/ws", {
          headers: {
            authorization: `Bearer ${token}`,
          },
        });

        client.on("error", console.error);

        client.on("message", (data) => {
          if (savedFn.current) {
            try {
              savedFn.current(data.toString());
            } catch (e) {
              console.error(e);
            }
          }
        });

        ws.current = client;
      }
    })();

    return () => {
      if (ws.current) {
        ws.current.terminate();
      }
    };
  }, []);
};
