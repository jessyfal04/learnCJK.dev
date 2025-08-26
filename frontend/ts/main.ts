// No client-side router; rely on full page loads

const form = document.getElementById('lookupForm') as HTMLFormElement;
const input = document.getElementById('charInput') as HTMLInputElement;
const errorEl = document.getElementById('error') as HTMLElement;
const results = document.getElementById('results') as HTMLElement;
const formsEl = document.getElementById('forms') as HTMLElement;
const renderCharEl = document.getElementById('renderChar') as HTMLElement | null;
const decompEl = document.getElementById('decomposition') as HTMLElement;
const supercompEl = document.getElementById('supercompositions') as HTMLElement;
const variantsEl = document.getElementById('variants') as HTMLElement;
const unihanEl = document.getElementById('unihan') as HTMLElement;
const cjkLearnEl = document.getElementById('cjkLearn') as HTMLElement | null;
let lastLookup: LookupResponse | null = null;
let showAllRegions = false;
const summaryChar = null;
const summaryLang = null;
const lookupBtn = document.getElementById('lookupBtn') as HTMLButtonElement | null;

// Lists page elements (if present)
const listsForm = document.getElementById('listsForm') as HTMLFormElement | null;
const listTypeSel = document.getElementById('listType') as HTMLSelectElement | null;
const listFieldSel = document.getElementById('listField') as HTMLSelectElement | null;
const listResults = document.getElementById('listResults') as HTMLElement | null;

type FormInfo = { char: string; same_as_input: boolean };
type Composition = {
  decomposition: string[];
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

import { charChipHTML } from './components/char.js';

function item(key: string, value: string | string[]): string {
  const v = Array.isArray(value) ? (value.length ? value.join(', ') : '—') : value || '—';
  return `<li><strong>${key}:</strong> ${v}</li>`;
}

function renderResults(d: LookupResponse): void {
  lastLookup = d;
  formsEl.innerHTML = '';
  variantsEl.innerHTML = '';
  if (unihanEl) unihanEl.textContent = '—';

  renderCjkLearn(d);

  // Rendering tile: char + Unihan
  if (renderCharEl) renderCharEl.innerHTML = d.char ? charChipHTML(d.char) : '—';
  if (unihanEl) unihanEl.textContent = d.unihan_definition || '—';

  // Forms and variants tile
  const forms: string[] = [];
  if (!d.japanese.same_as_input) forms.push(item('Japanese', charChipHTML(d.japanese.char)));
  if (!d.simplified.same_as_input) forms.push(item('Simplified', charChipHTML(d.simplified.char)));
  if (!d.traditional.same_as_input) forms.push(item('Traditional', charChipHTML(d.traditional.char)));
  formsEl.innerHTML = forms.length ? forms.join('') : '<li>—</li>';

  const vs = (d.variants || []).map((v) => `<li>${charChipHTML(v)}</li>`);
  variantsEl.innerHTML = vs.length ? vs.join('') : '<li>—</li>';

  // Composition tile
  decompEl.innerHTML = (d.composition.decomposition || [])
    .map((c) => `<li>${charChipHTML(c)}</li>`)
    .join('') || '<li>—</li>';
  supercompEl.innerHTML = (d.composition.merged_supercompositions || [])
    .map((c) => `<li>${charChipHTML(c)}</li>`)
    .join('') || '<li>—</li>';

  results.style.display = 'block';
}

// Build a 5-cell region table showing the char in KR/TC/HK/JP/SC styles.
function regionTableHTML(
  d: LookupResponse,
  idx: { hanja?: string; rtk?: string; rth?: string; rsh?: string },
  options?: { showAll?: boolean }
): string {
  const chJP = d.japanese?.char || d.char;
  const chTC = d.traditional?.char || d.char;
  const chHK = chTC;
  const chSC = d.simplified?.char || d.char;
  const chKR = chTC;

  const cells = [
    { cls: 'kr', label: 'KR', index: idx.hanja, ch: chKR },
    { cls: 'tc', label: 'TC', index: idx.rth, ch: chTC },
    { cls: 'hk', label: 'HK', index: idx.rth, ch: chHK },
    { cls: 'jp', label: 'JP', index: idx.rtk, ch: chJP },
    { cls: 'sc', label: 'SC', index: idx.rsh, ch: chSC },
  ];
  const showAll = !!options?.showAll;
  const filtered = showAll ? cells : cells.filter((c) => !!c.index);
  const useCells = filtered.length > 0 ? filtered : cells; // ensure not empty
  const tds = useCells
    .map((c) => `
      <td class="${c.cls}">
        <span class="char">${c.ch}</span><br>
        <span class="label">${c.label}${c.index ? ` - ${c.index}` : ''}</span>
      </td>
    `)
    .join('\n');
  return `<table class="chars"><tr>${tds}</tr></table>`;
}

function renderCjkLearn(d: LookupResponse): void {
  if (!cjkLearnEl) return;
  const cl = (d.cjk_learn || null) as any;
  if (cl) {
    const kwRTK = (cl.keyword_rtk as string | null | undefined) || null;
    const kwRTH = (cl.keyword_rth as string | null | undefined) || null;
    const kwRSH = (cl.keyword_rsh as string | null | undefined) || null;
    const idxHanja = cl.index_hanja as string | null | undefined;
    const idxRTK = cl.index_rtk as string | null | undefined;
    const idxRTH = cl.index_rth as string | null | undefined;
    const idxRSH = cl.index_rsh as string | null | undefined;
    const keywordBits: string[] = [];
    if (kwRTH) keywordBits.push(`<span class="tc">${kwRTH}</span>`);
    if (kwRTK) keywordBits.push(`<span class="jp">${kwRTK}</span>`);
    if (kwRSH) keywordBits.push(`<span class="sc">${kwRSH}</span>`);

    // Join keywords with a middle dot separator
    const keywordsJoined = keywordBits.length ? `<span class=\"keywords-line\">${keywordBits.join(' \u00B7 ')}</span>` : '';

    const toggleLabel = showAllRegions ? 'Show indexed only' : 'Show all regions';
    const toggleBtn = `<div class="cjk-controls"><button class="button is-small toggle-regions" type="button">${toggleLabel}</button></div>`;

    const defBlock = `
      <p class="definition">
        ${keywordsJoined}
        ${d.unihan_definition ? `<br><span class=\"label\">${d.unihan_definition}</span>` : ''}
      </p>
      ${toggleBtn}
    `;

    const table = regionTableHTML(
      d,
      { hanja: idxHanja ?? undefined, rtk: idxRTK ?? undefined, rth: idxRTH ?? undefined, rsh: idxRSH ?? undefined },
      { showAll: showAllRegions }
    );

    cjkLearnEl.classList.remove('not-cjk');
    cjkLearnEl.innerHTML = defBlock + table;
    cjkLearnEl.style.display = 'block';
  } else {
    // Fallback: show centered, black, Noto Sans when no CJK learn
    const defBlock = d.unihan_definition
      ? `<p class="definition"><span class="label">${d.unihan_definition}</span></p>`
      : '';
    cjkLearnEl.classList.add('not-cjk');
    // Render all region cells without indices
    const table = regionTableHTML(d, {}, { showAll: true });
    cjkLearnEl.innerHTML = defBlock + table;
    cjkLearnEl.style.display = 'block';
  }
}

async function doLookup(ch: string, _pushHistory = false): Promise<void> {
  if (!ch) return;
  errorEl.style.display = 'none';
  results.style.display = 'none';
  // Show skeleton while loading
  if (cjkLearnEl) {
    cjkLearnEl.classList.remove('not-cjk');
    cjkLearnEl.innerHTML = `
      <div class="skeleton-block"></div>
      <div class="skeleton-lines"></div>
      <div><button class="button is-skeleton" type="button" disabled>Loading</button></div>`;
    cjkLearnEl.style.display = 'block';
  }
  if (lookupBtn) lookupBtn.classList.add('is-loading');
  try {
    const res = await fetch(`/api/char?char=${encodeURIComponent(ch)}`);
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

async function fetchList(typ: string, field: 'chars' | 'fields'): Promise<unknown> {
  const res = await fetch(`/api/lists?type=${encodeURIComponent(typ)}&field=${encodeURIComponent(field)}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

function renderList(type: string, field: 'chars' | 'fields', data: any): void {
  if (!listResults) return;
  listResults.innerHTML = '';
  if (field === 'chars' && Array.isArray(data)) {
    const chips = data.map((ch: string) => charChipHTML(ch)).join(' ');
    listResults.innerHTML = `<div class="box">${chips || '—'}</div>`;
    return;
  }
  if (field === 'fields' && data && typeof data === 'object') {
    // Render a simple table; columns depend on type
    const entries = Object.entries(data) as [string, any][];
    const cols = type === 'hanja' ? ['char', 'index', 'ko_sound', 'ko_meaning'] : ['char', 'index', 'keyword'];
    let html = '<div class="table-container"><table class="table is-fullwidth is-striped is-hoverable"><thead><tr>' +
      cols.map(c => `<th>${c}</th>`).join('') + '</tr></thead><tbody>';
    for (const [ch, fields] of entries) {
      const row = cols.map((c) => {
        if (c === 'char') return `<td>${charChipHTML(ch)}</td>`;
        const v = fields?.[c];
        return `<td>${v != null ? String(v) : '—'}</td>`;
      }).join('');
      html += `<tr>${row}</tr>`;
    }
    html += '</tbody></table></div>';
    listResults.innerHTML = html;
    return;
  }
  listResults.textContent = 'No data';
}

// Replace the submit handler to use server navigation
form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const ch = input.value.trim();
  if (!ch) return;
  input.value = ch;
  // Navigate to dedicated char page; server serves char.html
  window.location.href = `/char/${encodeURIComponent(ch)}`;
});

// On initial load, if URL is /char/:ch, perform lookup once
(() => {
  const m = location.pathname.match(/^\/char\/(.+)$/);
  if (m) {
    try {
      const ch = decodeURIComponent(m[1]);
      if (input) input.value = ch;
      void doLookup(ch, false);
    } catch {
      /* ignore */
    }
  }
})();

// Lists page handling
listsForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const typ = (listTypeSel?.value || 'rtk').toLowerCase();
  const fld = (listFieldSel?.value === 'fields' ? 'fields' : 'chars') as 'chars' | 'fields';
  try {
    const data = await fetchList(typ, fld);
    renderList(typ, fld, data);
  } catch (err) {
    if (listResults) listResults.textContent = err instanceof Error ? err.message : 'Error';
  }
});

// If lists page is open, load a default on first paint
if (listsForm && listTypeSel && listFieldSel) {
  void (async () => {
    try {
      const data = await fetchList(listTypeSel.value, (listFieldSel.value === 'fields' ? 'fields' : 'chars') as any);
      renderList(listTypeSel.value, (listFieldSel.value === 'fields' ? 'fields' : 'chars') as any, data);
    } catch {
      /* ignore */
    }
  })();
}

// Delegate click on any element with data-char to navigate using SPA router
document.addEventListener('click', (ev) => {
  const target = ev.target as HTMLElement | null;
  if (!target) return;
  // Toggle between indexed-only and show-all region cells
  const toggle = target.closest('.toggle-regions') as HTMLButtonElement | null;
  if (toggle) {
    ev.preventDefault();
    showAllRegions = !showAllRegions;
    if (lastLookup) renderCjkLearn(lastLookup);
    return;
  }
  // Do not intercept <a data-char>; let the browser navigate
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
