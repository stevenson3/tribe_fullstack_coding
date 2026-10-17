import { useCallback, useEffect, useState } from "react";
import { ui } from "../config";

export type AsyncState<T> =
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "error"; error: Error };

/** Resolves once `ui.minLoadingMs` has passed since `startedAt` (immediately if it already has) */
export function waitForMinimumLoading(startedAt: number): Promise<void> {
  const remaining = ui.minLoadingMs - (Date.now() - startedAt);
  return remaining > 0 ? new Promise((resolve) => setTimeout(resolve, remaining)) : Promise.resolve();
}

/**
 * Run `fetcher` whenever `deps` change (or `reload` is called). The loading
 * state is held for a minimum time, for both success and failure, so the UI
 * transitions smoothly instead of flashing.
 */
export function useAsyncData<T>(fetcher: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<AsyncState<T>>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();
    setState({ status: "loading" });

    fetcher()
      .then(
        (data): AsyncState<T> => ({ status: "ready", data }),
        (error): AsyncState<T> => ({ status: "error", error: error as Error }),
      )
      .then(async (next) => {
        await waitForMinimumLoading(startedAt);
        if (!cancelled) setState(next);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  const reload = useCallback(() => setAttempt((a) => a + 1), []);
  return { state, reload };
}
