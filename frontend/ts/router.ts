export type RouteHandler = (ch: string) => void;

let handler: RouteHandler | null = null;

export function startRouter(h: RouteHandler): void {
  handler = h;

  // Handle back/forward navigation
  window.addEventListener('popstate', () => {
    const state = history.state as { char?: string } | null;
    if (state && state.char) {
      handler?.(state.char);
      return;
    }

    const m = location.pathname.match(/^\/char\/(.+)$/);
    if (m) {
      try {
        const ch = decodeURIComponent(m[1]);
        handler?.(ch);
      } catch (_e) {
        // ignore
      }
    }
  });

  // Initial load: if URL is /char/:ch, notify handler
  const m = location.pathname.match(/^\/char\/(.+)$/);
  if (m) {
    try {
      const ch = decodeURIComponent(m[1]);
      // ensure state is present for future popstate
      history.replaceState({ char: ch }, '', location.pathname + location.search);
      handler?.(ch);
    } catch (_e) {
      // ignore
    }
  }
}

export function navigateToChar(ch: string, replace = false): void {
  if (!handler) {
    // no-op if router not initialised yet
    if (replace) {
      history.replaceState({ char: ch }, '', `/char/${encodeURIComponent(ch)}`);
    } else {
      history.pushState({ char: ch }, '', `/char/${encodeURIComponent(ch)}`);
    }
    return;
  }

  if (replace) {
    history.replaceState({ char: ch }, '', `/char/${encodeURIComponent(ch)}`);
  } else {
    history.pushState({ char: ch }, '', `/char/${encodeURIComponent(ch)}`);
  }

  handler(ch);
}

export function getCharFromPath(): string | null {
  const m = location.pathname.match(/^\/char\/(.+)$/);
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]);
  } catch (_e) {
    return null;
  }
}
