import { useDeferredValue, useMemo, type Ref } from 'react';
import { renderMarkdown } from '../../lib/markdown';

interface MarkdownPreviewProps {
  markdown: string;
  /** The scrolling container, used for editor ↔ preview scroll sync. */
  ref?: Ref<HTMLDivElement>;
}

export function MarkdownPreview({ markdown, ref }: MarkdownPreviewProps) {
  // Deferring lets React keep typing responsive on large documents,
  // rendering the preview as soon as the main thread is free.
  const deferredMarkdown = useDeferredValue(markdown);
  const sanitizedHtml = useMemo(() => renderMarkdown(deferredMarkdown), [deferredMarkdown]);

  return (
    <div ref={ref} className="h-full overflow-y-auto">
      <article
        className="markdown-preview prose prose-zinc mx-auto max-w-3xl px-6 py-5 dark:prose-invert prose-pre:bg-zinc-100 prose-pre:text-zinc-800 dark:prose-pre:bg-zinc-900 dark:prose-pre:text-zinc-200"
        // Safe: renderMarkdown sanitizes its output with DOMPurify.
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    </div>
  );
}
