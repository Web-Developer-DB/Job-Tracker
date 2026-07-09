import type { ReactElement, SVGProps } from 'react';
import { cn } from './cn';

export type IconName =
  | 'archive'
  | 'bell'
  | 'briefcase'
  | 'calendar'
  | 'chart'
  | 'check'
  | 'chevronDown'
  | 'clipboard'
  | 'download'
  | 'edit'
  | 'filter'
  | 'home'
  | 'list'
  | 'mapPin'
  | 'menu'
  | 'message'
  | 'moon'
  | 'more'
  | 'plus'
  | 'print'
  | 'search'
  | 'sun'
  | 'target'
  | 'trash'
  | 'upload'
  | 'user';

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  title?: string;
}

const paths: Record<IconName, ReactElement> = {
  archive: (
    <>
      <path d="M3 6.5h18" />
      <path d="M5 6.5v12A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-12" />
      <path d="M8 3.5h8l1.5 3h-11L8 3.5Z" />
      <path d="M9.5 11h5" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
      <path d="M10 21h4" />
    </>
  ),
  briefcase: (
    <>
      <path d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1" />
      <path d="M4.5 7h15A1.5 1.5 0 0 1 21 8.5v9A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5v-9A1.5 1.5 0 0 1 4.5 7Z" />
      <path d="M3 12h18" />
      <path d="M10 12v1.5h4V12" />
    </>
  ),
  calendar: (
    <>
      <path d="M7 3v3" />
      <path d="M17 3v3" />
      <path d="M4.5 5h15A1.5 1.5 0 0 1 21 6.5v12A2.5 2.5 0 0 1 18.5 21h-13A2.5 2.5 0 0 1 3 18.5v-12A1.5 1.5 0 0 1 4.5 5Z" />
      <path d="M3 10h18" />
    </>
  ),
  chart: (
    <>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="m7 15 4-4 3 3 5-7" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  clipboard: (
    <>
      <path d="M9 4h6l1 2h2a2 2 0 0 1 2 2v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V8a2 2 0 0 1 2-2h2l1-2Z" />
      <path d="M9 6h6" />
      <path d="M8 12h8" />
      <path d="M8 16h5" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v11" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 20h14" />
    </>
  ),
  edit: (
    <>
      <path d="M4 20h4l11-11a2.8 2.8 0 0 0-4-4L4 16v4Z" />
      <path d="m14 6 4 4" />
    </>
  ),
  filter: (
    <>
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </>
  ),
  home: (
    <>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </>
  ),
  list: (
    <>
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3.5 6h.01" />
      <path d="M3.5 12h.01" />
      <path d="M3.5 18h.01" />
    </>
  ),
  mapPin: (
    <>
      <path d="M19 10c0 5-7 11-7 11s-7-6-7-11a7 7 0 1 1 14 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </>
  ),
  message: (
    <>
      <path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-5 4v-4H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
      <path d="M8 10h8" />
      <path d="M8 14h5" />
    </>
  ),
  moon: <path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 7 7 0 1 0 20 15.5Z" />,
  more: (
    <>
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  print: (
    <>
      <path d="M7 8V4h10v4" />
      <path d="M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
      <path d="M7 14h10v7H7z" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M4.93 4.93 6.34 6.34" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m4.93 19.07 1.41-1.41" />
      <path d="m17.66 6.34 1.41-1.41" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1.5" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7l1 14h10l1-14" />
      <path d="M9 7V4h6v3" />
    </>
  ),
  upload: (
    <>
      <path d="M12 21V10" />
      <path d="m7 14 5-5 5 5" />
      <path d="M5 4h14" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  )
};

export const Icon = ({ name, title, className, ...props }: IconProps) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      className={cn('h-4 w-4 shrink-0', className)}
      {...props}
    >
      {title && <title>{title}</title>}
      {paths[name]}
    </svg>
  );
};
