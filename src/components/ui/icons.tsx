import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const BoldIcon = () => (
  <Icon>
    <path d="M6 4h7a4 4 0 0 1 0 8H6zM6 12h8a4 4 0 0 1 0 8H6z" />
  </Icon>
);

export const ItalicIcon = () => (
  <Icon>
    <path d="M19 4h-9M14 20H5M15 4 9 20" />
  </Icon>
);

export const StrikethroughIcon = () => (
  <Icon>
    <path d="M16 4H9a3 3 0 0 0-2.83 4M14 12a4 4 0 0 1 0 8H6M4 12h16" />
  </Icon>
);

export const QuoteIcon = () => (
  <Icon>
    <path d="M6 7h4v4c0 3-1.5 5-4 6M14 7h4v4c0 3-1.5 5-4 6" />
  </Icon>
);

export const InlineCodeIcon = () => (
  <Icon>
    <path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />
  </Icon>
);

export const CodeBlockIcon = () => (
  <Icon>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="m10 9-3 3 3 3M14 9l3 3-3 3" />
  </Icon>
);

export const LinkIcon = () => (
  <Icon>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </Icon>
);

export const ImageIcon = () => (
  <Icon>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-5-5L5 21" />
  </Icon>
);

export const UnorderedListIcon = () => (
  <Icon>
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
  </Icon>
);

export const OrderedListIcon = () => (
  <Icon>
    <path d="M10 6h11M10 12h11M10 18h11M4 4h1v5M4 9h2M6 19H4c0-1.5 2-2 2-3.5 0-.8-.9-1.5-2-1" />
  </Icon>
);

export const TaskListIcon = () => (
  <Icon>
    <path d="m3 7 2 2 4-4M3 17l2 2 4-4M13 7h8M13 17h8" />
  </Icon>
);

export const TableIcon = () => (
  <Icon>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M3 15h18M12 3v18" />
  </Icon>
);

export const HorizontalRuleIcon = () => (
  <Icon>
    <path d="M3 12h18" />
  </Icon>
);

export const ImportIcon = () => (
  <Icon>
    <path d="M12 15V3M8 7l4-4 4 4M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
  </Icon>
);

export const ExportIcon = () => (
  <Icon>
    <path d="M12 3v12M8 11l4 4 4-4M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
  </Icon>
);

export const CloseIcon = () => (
  <Icon>
    <path d="M18 6 6 18M6 6l12 12" />
  </Icon>
);

export const ChevronDownIcon = () => (
  <Icon width="12" height="12">
    <path d="m6 9 6 6 6-6" />
  </Icon>
);
