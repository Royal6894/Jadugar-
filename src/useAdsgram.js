import { useCallback, useEffect, useRef } from "react";

export function useAdsgram({ blockId, onReward, onError }) {
  const controllerRef = useRef(null);

  useEffect(() => {
    if (!blockId) return;

    if (!window.Adsgram) {
      onError?.({
        error: true,
        description: "AdsGram SDK not loaded"
      });
      return;
    }

    controllerRef.current = window.Adsgram.init({ blockId });

    return () => {
      controllerRef.current = null;
    };
  }, [blockId, onError]);

  return useCallback(async () => {
    if (!controllerRef.current) {
      onError?.({
        error: true,
        description: "AdsGram controller is not ready"
      });
      return;
    }

    try {
      await controllerRef.current.show();

      // Important:
      // Do not directly credit LEAF here.
      // AdsGram Reward URL is responsible for the server-side credit.
      onReward?.();
    } catch (error) {
      onError?.(error);
    }
  }, [onReward, onError]);
}
