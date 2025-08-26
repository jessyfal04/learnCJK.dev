// Lightweight in-file router using History API
type RouteHandler = (ch: string) => void;
let __routerHandler: RouteHandler | null = null;
function startRouter(h: RouteHandler): void {
  __routerHandler = h;
  window.addEventListener('popstate', () => {
    const state = history.state as { char?: string } | null;
    if (state && state.char) {
      __routerHandler?.(state.char);
      return;
    }
    const m = location.pathname.match(/^\/char\/(.+)$/);
    if (m) {
      try {
        const ch = decodeURIComponent(m[1]);
        __routerHandler?.(ch);
      } catch {
        /* ignore */
      }
    }
  });
  const m = location.pathname.match(/^\/char\/(.+)$/);
  if (m) {
    try {
      const ch = decodeURIComponent(m[1]);
      history.replaceState({ char: ch }, '', location.pathname + location.search);
      __routerHandler?.(ch);
    } catch {
      /* ignore */
    }
  }
}
function navigateToChar(ch: string, replace = false): void {
  if (!__routerHandler) {
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
  __routerHandler(ch);
}

const form = document.getElementById('lookupForm') as HTMLFormElement;
const input = document.getElementById('charInput') as HTMLInputElement;
const errorEl = document.getElementById('error') as HTMLElement;
const results = document.getElementById('results') as HTMLElement;
const formsEl = document.getElementById('forms') as HTMLElement;
const compEl = document.getElementById('composition') as HTMLElement;
const variantsEl = document.getElementById('variants') as HTMLElement;
const unihanEl = document.getElementById('unihan') as HTMLElement;
const cjklearnEl = document.getElementById('cjklearn') as HTMLElement;
const summaryChar = document.getElementById('summaryChar') as HTMLElement | null;
const summaryLang = document.getElementById('summaryLang') as HTMLElement | null;
const lookupBtn = document.getElementById('lookupBtn') as HTMLButtonElement | null;

type FormInfo = { char: string; same_as_input: boolean };
type Composition = {
  decomposition: string[];
  jp_supercompositions: string[];
  zh_supercompositions: string[];
  merged_supercompositions: string[];
};
type CJKLearn = { [k: string]: string | null } | null;
type LookupResponse = {
  char: string;
  detected_input_lang: 'sc' | 'tc' | 'jp' | string;
  japanese: FormInfo;
  simplified: FormInfo;
  traditional: FormInfo;
  composition: Composition;
  variants: string[];
  md?: string | null;
  unihan_definition?: string | null;
  cjk_learn?: CJKLearn;
};

function item(key: string, value: string | string[]): string {
  const v = Array.isArray(value) ? (value.length ? value.join(', ') : '—') : value || '—';
  return `<li><strong>${key}:</strong> ${v}</li>`;
}

function renderCjkLearn(obj: CJKLearn | undefined | null): string {
  if (!obj) return '—';
  // show key: value per line
  return Object.entries(obj)
    .map(([k, v]) => `${k}: ${v ?? '—'}`)
    .join('\n');
}

function renderResults(d: LookupResponse): void {
  formsEl.innerHTML = '';
  compEl.innerHTML = '';
  variantsEl.innerHTML = '';
  if (unihanEl) unihanEl.textContent = '—';
  if (cjklearnEl) cjklearnEl.textContent = '—';
  if (summaryChar) summaryChar.textContent = d.char || '—';
  if (summaryLang) summaryLang.textContent = d.detected_input_lang || '—';

  formsEl.insertAdjacentHTML(
    'beforeend',
    item('Japanese', `${d.japanese.char} (${d.japanese.same_as_input ? 'same' : 'diff'})`)
  );
  formsEl.insertAdjacentHTML(
    'beforeend',
    item('Simplified', `${d.simplified.char} (${d.simplified.same_as_input ? 'same' : 'diff'})`)
  );
  formsEl.insertAdjacentHTML(
    'beforeend',
    item('Traditional', `${d.traditional.char} (${d.traditional.same_as_input ? 'same' : 'diff'})`)
  );

  compEl.insertAdjacentHTML('beforeend', item('Decomposition', d.composition.decomposition || []));
  compEl.insertAdjacentHTML(
    'beforeend',
    item('JP supercompositions', d.composition.jp_supercompositions || [])
  );
  compEl.insertAdjacentHTML(
    'beforeend',
    item('ZH supercompositions', d.composition.zh_supercompositions || [])
  );
  compEl.insertAdjacentHTML(
    'beforeend',
    item('Merged supercompositions', d.composition.merged_supercompositions || [])
  );

  (d.variants || []).forEach((v) => {
    variantsEl.insertAdjacentHTML('beforeend', `<li>${v}</li>`);
  });

  if (unihanEl) unihanEl.textContent = d.unihan_definition || '—';
  if (cjklearnEl) cjklearnEl.textContent = renderCjkLearn(d.cjk_learn);

  results.style.display = 'block';
}

async function doLookup(ch: string, _pushHistory = false): Promise<void> {
  if (!ch) return;
  errorEl.style.display = 'none';
  results.style.display = 'none';
  if (lookupBtn) lookupBtn.classList.add('is-loading');
  try {
    const res = await fetch(`/api/lookup?char=${encodeURIComponent(ch)}`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = (await res.json()) as LookupResponse;
    renderResults(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unexpected error';
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
  }
  finally {
    if (lookupBtn) lookupBtn.classList.remove('is-loading');
  }
}

// replace the submit handler to use router navigation
form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const ch = input.value.trim();
  if (!ch) return;
  input.value = ch;
  // navigate updates history and triggers the router handler which performs lookup
  navigateToChar(ch);
});

// start router: handler receives the char and triggers lookup (without pushing history again)
startRouter((ch: string) => {
  input.value = ch;
  void doLookup(ch, false);
});

// Simple HTML includes: fetch and inject content for elements with [data-include]
async function applyIncludes(): Promise<void> {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-include]'));
  await Promise.all(
    nodes.map(async (el) => {
      const src = el.getAttribute('data-include');
      if (!src) return;
      try {
        const res = await fetch(src);
        if (!res.ok) throw new Error(`Include error: ${res.status}`);
        el.outerHTML = await res.text();
      } catch (e) {
        // If include fails, hide the placeholder to avoid empty blocks
        el.remove();
      }
    })
  );
  initNavbarBurger();
}

// Run includes as soon as possible
applyIncludes().catch(() => {
  /* noop */
});

function initNavbarBurger(): void {
  const burgers = Array.from(document.querySelectorAll<HTMLElement>('.navbar-burger'));
  burgers.forEach((burger) => {
    const targetId = burger.getAttribute('data-target');
    if (!targetId) return;
    const target = document.getElementById(targetId);
    if (!target) return;
    burger.addEventListener('click', () => {
      burger.classList.toggle('is-active');
      target.classList.toggle('is-active');
    });
  });
}
