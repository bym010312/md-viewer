import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import css from 'highlight.js/lib/languages/css';
import go from 'highlight.js/lib/languages/go';
import java from 'highlight.js/lib/languages/java';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import markdown from 'highlight.js/lib/languages/markdown';
import python from 'highlight.js/lib/languages/python';
import rust from 'highlight.js/lib/languages/rust';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';
import MarkdownIt, { type StateCore } from 'markdown-it';

// Register only common languages to keep the bundle small.
// Aliases (ts, js, sh, html, yml, ...) come from each language definition.
const LANGUAGES = { bash, c, cpp, css, go, java, javascript, json, markdown, python, rust, sql, typescript, xml, yaml };
for (const [name, definition] of Object.entries(LANGUAGES)) {
  hljs.registerLanguage(name, definition);
}

function highlightCode(code: string, language: string): string {
  if (!language || !hljs.getLanguage(language)) {
    // Empty string tells markdown-it to escape the code itself.
    return '';
  }
  try {
    return hljs.highlight(code, { language, ignoreIllegals: true }).value;
  } catch {
    return '';
  }
}

const TASK_MARKER = /^\[([ xX])\]\s+/;

/**
 * Minimal GitHub-style task list support: turns list items starting with
 * `[ ]` or `[x]` into disabled checkboxes. Written inline instead of adding a
 * dependency because the only maintained plugins are much larger than this.
 */
function taskListRule(state: StateCore): void {
  const tokens = state.tokens;

  for (let index = 2; index < tokens.length; index++) {
    const inlineToken = tokens[index];
    if (
      inlineToken.type !== 'inline' ||
      tokens[index - 1].type !== 'paragraph_open' ||
      tokens[index - 2].type !== 'list_item_open'
    ) {
      continue;
    }

    const match = TASK_MARKER.exec(inlineToken.content);
    const firstChild = inlineToken.children?.[0];
    if (!match || !firstChild || firstChild.type !== 'text') continue;

    const isChecked = match[1].toLowerCase() === 'x';
    firstChild.content = firstChild.content.replace(TASK_MARKER, '');
    inlineToken.content = inlineToken.content.replace(TASK_MARKER, '');

    const checkbox = new state.Token('html_inline', '', 0);
    checkbox.content = `<input type="checkbox" class="task-list-item-checkbox" disabled${isChecked ? ' checked' : ''}> `;
    inlineToken.children?.unshift(checkbox);

    tokens[index - 2].attrJoin('class', 'task-list-item');
  }
}

const markdownRenderer = new MarkdownIt({
  // Raw HTML in the source is escaped, never rendered.
  html: false,
  linkify: true,
  typographer: false,
  highlight: highlightCode,
});
markdownRenderer.core.ruler.after('inline', 'task_list', taskListRule);

// Open external links in a new tab without giving the new page access to `window.opener`.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName !== 'A') return;
  const href = node.getAttribute('href') ?? '';
  if (/^https?:\/\//i.test(href)) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

/**
 * Renders untrusted Markdown to sanitized HTML.
 * markdown-it already escapes raw HTML and rejects `javascript:` style links;
 * DOMPurify is a second, independent layer so a parser bug can't become XSS.
 */
export function renderMarkdown(markdownContent: string): string {
  const unsafeHtml = markdownRenderer.render(markdownContent);
  return DOMPurify.sanitize(unsafeHtml, { USE_PROFILES: { html: true } });
}
