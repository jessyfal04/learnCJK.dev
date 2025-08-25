const form = document.getElementById('lookupForm') as HTMLFormElement;
const input = document.getElementById('charInput') as HTMLInputElement;
const errorEl = document.getElementById('error') as HTMLElement;
const results = document.getElementById('results') as HTMLElement;
const formsEl = document.getElementById('forms') as HTMLElement;
const compEl = document.getElementById('composition') as HTMLElement;
const variantsEl = document.getElementById('variants') as HTMLElement;

type FormInfo = { char: string; same_as_input: boolean };
type Composition = {
  decomposition: string[];
  jp_supercompositions: string[];
  zh_supercompositions: string[];
  merged_supercompositions: string[];
};
type LookupResponse = {
  char: string;
  detected_input_lang: 'sc' | 'tc' | 'jp' | string;
  japanese: FormInfo;
  simplified: FormInfo;
  traditional: FormInfo;
  composition: Composition;
  variants: string[];
  md?: string | null;
};

function item(key: string, value: string | string[]): string {
  const v = Array.isArray(value) ? value.join(', ') : value;
  return `<li><strong>${key}:</strong> ${v}</li>`;
}

function renderResults(d: LookupResponse): void {
  formsEl.innerHTML = '';
  compEl.innerHTML = '';
  variantsEl.innerHTML = '';

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

  results.style.display = 'block';
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.style.display = 'none';
  results.style.display = 'none';
  const ch = input.value.trim();
  if (!ch) return;
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
