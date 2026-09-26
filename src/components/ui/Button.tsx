import type { ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

/** Compact, borderless button shared by the header and toolbar. */
export function Button({ className = '', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md px-2 text-sm text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500 disabled:opacity-40 dark:text-zinc-300 dark:hover:bg-zinc-800 ${className}`}
      {...props}
    />
  );
}
