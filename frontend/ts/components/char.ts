/**
 * Render a clickable character as a Bulma tag, square via `.tag-char`.
 * Example classes: `tag is-light is-large tag-char`.
 */
export function charChipHTML(ch: string): string {
  return `
    <a class="char-chip" data-char="${ch}" href="/char/${encodeURIComponent(ch)}" title="${ch}">
      <span class="tag is-light is-medium tag-char">${ch}</span>
    </a>
  `;
}
