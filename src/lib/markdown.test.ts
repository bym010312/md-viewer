import { describe, expect, it } from 'vitest';
import { renderMarkdown } from './markdown';

describe('renderMarkdown', () => {
  it('renders common GitHub-flavored Markdown', () => {
    const html = renderMarkdown(
      ['# Title', '', '**bold** *italic* ~~strike~~ `code`', '', '| a | b |', '| - | - |', '| 1 | 2 |'].join('\n'),
    );
    expect(html).toMatch(/<h1[^>]*>Title<\/h1>/);
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
    expect(html).toContain('<s>strike</s>');
    expect(html).toContain('<code>code</code>');
    expect(html).toMatch(/<table[^>]*>/);
  });

  it('tags blocks with their 1-based source line for scroll sync', () => {
    const container = document.createElement('div');
    container.innerHTML = renderMarkdown('# Title\n\nParagraph\n\n```js\nlet a;\n```\n\n- item\n\n---\n\n| a |\n| - |\n| 1 |');
    const lineOf = (selector: string) => container.querySelector<HTMLElement>(selector)?.dataset.sourceLine;

    expect(lineOf('h1')).toBe('1');
    expect(lineOf('p')).toBe('3');
    expect(lineOf('pre code')).toBe('5');
    expect(lineOf('li')).toBe('9');
    expect(lineOf('hr')).toBe('11');
    expect(lineOf('tbody tr')).toBe('15');
  });

  it('renders task list items as disabled checkboxes', () => {
    const html = renderMarkdown('- [x] done\n- [ ] todo');
    const container = document.createElement('div');
    container.innerHTML = html;
    const checkboxes = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[0].checked).toBe(true);
    expect(checkboxes[1].checked).toBe(false);
    expect(checkboxes[0].disabled).toBe(true);
    expect(container.textContent).toContain('done');
    expect(container.textContent).not.toContain('[x]');
  });

  it('highlights fenced code blocks for known languages', () => {
    const html = renderMarkdown("```ts\nconst greeting = 'hi';\n```");
    expect(html).toContain('class="language-ts"');
    expect(html).toContain('hljs-keyword');
  });

  it('escapes script tags instead of rendering them', () => {
    const html = renderMarkdown('<script>alert("XSS")</script>');
    expect(html).not.toContain('<script');
    expect(html).toContain('&lt;script&gt;');
  });

  it('does not render inline event handlers from raw HTML', () => {
    const container = document.createElement('div');
    container.innerHTML = renderMarkdown('<img src="x" onerror="alert(1)">');
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('[onerror]')).toBeNull();
  });

  it('blocks javascript: and data: URLs in links', () => {
    const container = document.createElement('div');
    container.innerHTML = renderMarkdown('[a](javascript:alert(1)) [b](JAVASCRIPT:alert(1)) [c](data:text/html,<script>)');
    const hrefs = Array.from(container.querySelectorAll('a')).map((link) => link.getAttribute('href') ?? '');
    expect(hrefs.some((href) => /^(javascript|data):/i.test(href))).toBe(false);
  });

  it('opens external links in a new tab with noopener', () => {
    const container = document.createElement('div');
    container.innerHTML = renderMarkdown('[site](https://example.com)');
    const link = container.querySelector('a');
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('handles an empty document', () => {
    expect(renderMarkdown('')).toBe('');
  });
});
