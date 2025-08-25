"use strict";
const form = document.getElementById('lookupForm');
const input = document.getElementById('charInput');
const errorEl = document.getElementById('error');
const results = document.getElementById('results');
const formsEl = document.getElementById('forms');
const compEl = document.getElementById('composition');
const variantsEl = document.getElementById('variants');
function item(key, value) {
    const v = Array.isArray(value) ? value.join(', ') : value;
    return `<li><strong>${key}:</strong> ${v}</li>`;
}
function renderResults(d) {
    formsEl.innerHTML = '';
    compEl.innerHTML = '';
    variantsEl.innerHTML = '';
    formsEl.insertAdjacentHTML('beforeend', item('Japanese', `${d.japanese.char} (${d.japanese.same_as_input ? 'same' : 'diff'})`));
    formsEl.insertAdjacentHTML('beforeend', item('Simplified', `${d.simplified.char} (${d.simplified.same_as_input ? 'same' : 'diff'})`));
    formsEl.insertAdjacentHTML('beforeend', item('Traditional', `${d.traditional.char} (${d.traditional.same_as_input ? 'same' : 'diff'})`));
    compEl.insertAdjacentHTML('beforeend', item('Decomposition', d.composition.decomposition || []));
    compEl.insertAdjacentHTML('beforeend', item('JP supercompositions', d.composition.jp_supercompositions || []));
    compEl.insertAdjacentHTML('beforeend', item('ZH supercompositions', d.composition.zh_supercompositions || []));
    compEl.insertAdjacentHTML('beforeend', item('Merged supercompositions', d.composition.merged_supercompositions || []));
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
    if (!ch)
        return;
    try {
        const res = await fetch(`/api/lookup?char=${encodeURIComponent(ch)}`);
        if (!res.ok)
            throw new Error(`API error: ${res.status}`);
        const data = (await res.json());
        renderResults(data);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : 'Unexpected error';
        errorEl.textContent = msg;
        errorEl.style.display = 'block';
    }
});
// Simple HTML includes: fetch and inject content for elements with [data-include]
async function applyIncludes() {
    const nodes = Array.from(document.querySelectorAll('[data-include]'));
    await Promise.all(nodes.map(async (el) => {
        const src = el.getAttribute('data-include');
        if (!src)
            return;
        try {
            const res = await fetch(src);
            if (!res.ok)
                throw new Error(`Include error: ${res.status}`);
            el.outerHTML = await res.text();
        }
        catch (e) {
            // If include fails, hide the placeholder to avoid empty blocks
            el.remove();
        }
    }));
    initNavbarBurger();
}
// Run includes as soon as possible
applyIncludes().catch(() => {
    /* noop */
});
function initNavbarBurger() {
    const burgers = Array.from(document.querySelectorAll('.navbar-burger'));
    burgers.forEach((burger) => {
        const targetId = burger.getAttribute('data-target');
        if (!targetId)
            return;
        const target = document.getElementById(targetId);
        if (!target)
            return;
        burger.addEventListener('click', () => {
            burger.classList.toggle('is-active');
            target.classList.toggle('is-active');
        });
    });
}
