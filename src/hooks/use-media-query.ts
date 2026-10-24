import { useCallback, useMemo, useSyncExternalStore } from "react";

import { DESKTOP_MEDIA_QUERY } from "@/utils/breakpoints";

export function useMediaQuery(query: string, serverFallback = false): boolean {
  const mediaQuery = useMemo(
    () => (typeof window === "undefined" ? null : window.matchMedia(query)),
    [query],
  );

  const subscribe = useCallback(
    (onChange: () => void) => {
      mediaQuery?.addEventListener("change", onChange);
      return () => mediaQuery?.removeEventListener("change", onChange);
    },
    [mediaQuery],
  );
  const getSnapshot = useCallback(
    () => mediaQuery?.matches ?? serverFallback,
    [mediaQuery, serverFallback],
  );
  const getServerSnapshot = useCallback(() => serverFallback, [serverFallback]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useIsDesktop(): boolean {
  return useMediaQuery(DESKTOP_MEDIA_QUERY);
}
