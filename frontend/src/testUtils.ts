type Route = { status: number; body: unknown } | Array<{ status: number; body: unknown }>;

/**
 * Mock global fetch by exact URL. An array route returns its entries in order
 * (the last one repeats), which lets a test walk a record from pending to success.
 */
export function mockFetch(routes: Record<string, Route>) {
  const calls: Record<string, number> = {};
  const fn = jest.fn(async (url: string) => {
    const route = routes[url];
    if (!route) throw new Error(`Unmocked fetch: ${url}`);
    const i = calls[url] ?? 0;
    calls[url] = i + 1;
    const { status, body } = Array.isArray(route) ? route[Math.min(i, route.length - 1)] : route;
    return { ok: status >= 200 && status < 300, status, json: async () => body };
  });
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}
