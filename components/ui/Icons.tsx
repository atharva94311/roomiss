import type { ReactNode } from "react";

export const Icon = ({
  d,
  size = 20,
  stroke = "currentColor",
  sw = 1.6,
  fill = "none",
}: {
  d: ReactNode;
  size?: number;
  stroke?: string;
  sw?: number;
  fill?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill={fill}
    stroke={stroke}
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {d}
  </svg>
);

export const I = {
  search: (
    <Icon
      d={
        <>
          <circle cx="9" cy="9" r="6" />
          <path d="m14 14 4 4" />
        </>
      }
    />
  ),
  filter: <Icon d={<path d="M3 5h14M5 10h10M8 15h4" />} />,
  bell: (
    <Icon
      d={
        <>
          <path d="M5 16h10v-1l-1.5-1.5V9a3.5 3.5 0 0 0-7 0v4.5L5 15zM8 17a2 2 0 0 0 4 0" />
        </>
      }
    />
  ),
  chat: <Icon d={<path d="M3 14V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8l-4 3v-4z" />} />,
  user: (
    <Icon
      d={
        <>
          <circle cx="10" cy="7" r="3.2" />
          <path d="M3.5 17a6.5 6.5 0 0 1 13 0" />
        </>
      }
    />
  ),
  heart: <Icon d={<path d="M10 17S3 13 3 8a4 4 0 0 1 7-2.6A4 4 0 0 1 17 8c0 5-7 9-7 9z" />} />,
  check: <Icon d={<path d="m4 10 4 4 8-9" />} sw={2} />,
  x: <Icon d={<path d="m5 5 10 10M15 5 5 15" />} sw={1.8} />,
  arrow: <Icon d={<path d="M5 10h10m-4-4 4 4-4 4" />} />,
  back: <Icon d={<path d="M15 10H5m4-4-4 4 4 4" />} />,
  chev: <Icon d={<path d="m7 5 5 5-5 5" />} />,
  plus: <Icon d={<path d="M10 4v12M4 10h12" />} sw={1.8} />,
  send: (
    <Icon
      d={
        <>
          <path d="M3 10 17 3l-3 14-3.5-5z M10.5 12 17 3" />
        </>
      }
    />
  ),
  doc: (
    <Icon
      d={
        <>
          <path d="M5 3h7l4 4v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
          <path d="M12 3v4h4" />
        </>
      }
    />
  ),
  sleep: <Icon d={<path d="M14 11a4 4 0 1 1-5-5 5 5 0 0 0 5 5z" />} />,
  clean: (
    <Icon
      d={
        <>
          <path d="M5 17h10" />
          <path d="m7 17 1-7h4l1 7" />
          <path d="M9 10V5h2v5" />
        </>
      }
    />
  ),
  food: (
    <Icon
      d={
        <>
          <path d="M5 3v6c0 1 1 2 2 2v6" />
          <path d="M9 3v8M7 3v4" />
          <path d="M14 3c-2 0-3 2-3 5s1 5 3 5v4" />
        </>
      }
    />
  ),
  music: (
    <Icon
      d={
        <>
          <circle cx="6" cy="15" r="2" />
          <circle cx="14" cy="13" r="2" />
          <path d="M8 15V5l8-2v10" />
        </>
      }
    />
  ),
  flag: (
    <Icon
      d={
        <>
          <path d="M5 17V4M5 4h9l-2 3 2 3H5" />
        </>
      }
    />
  ),
  shield: <Icon d={<path d="M10 3 4 5v5c0 4 6 7 6 7s6-3 6-7V5l-6-2z" />} />,
  attach: <Icon d={<path d="M8 14V6.5a2.5 2.5 0 0 1 5 0V14a4 4 0 0 1-8 0V8" />} />,
  camera: (
    <Icon
      d={
        <>
          <rect x="3" y="6" width="14" height="11" rx="2" />
          <circle cx="10" cy="11.5" r="3" />
          <path d="M7 6V4h6v2" />
        </>
      }
    />
  ),
  lock: (
    <Icon
      d={
        <>
          <rect x="4" y="9" width="12" height="9" rx="2" />
          <path d="M7 9V7a3 3 0 0 1 6 0v2" />
        </>
      }
    />
  ),
  warn: (
    <Icon
      d={
        <>
          <path d="M10 3 2 17h16L10 3z" />
          <path d="M10 8v4" />
          <circle cx="10" cy="14.5" r="0.6" fill="currentColor" />
        </>
      }
    />
  ),
  info: (
    <Icon
      d={
        <>
          <circle cx="10" cy="10" r="7" />
          <path d="M10 9v5" />
          <circle cx="10" cy="6.5" r="0.6" fill="currentColor" />
        </>
      }
    />
  ),
  settings: (
    <Icon
      d={
        <>
          <circle cx="10" cy="10" r="2.5" />
          <path d="M16 10c0 .4 0 .8-.1 1.2l1.5 1-1.5 2.6-1.7-.5a5 5 0 0 1-2 1.2l-.4 1.7H8.2l-.4-1.7a5 5 0 0 1-2-1.2l-1.7.5L2.6 12.2l1.5-1A5 5 0 0 1 4 10c0-.4 0-.8.1-1.2L2.6 7.8 4 5.2l1.7.5a5 5 0 0 1 2-1.2l.4-1.7h3.6l.4 1.7a5 5 0 0 1 2 1.2l1.7-.5L17.4 7.8l-1.5 1c.1.4.1.8.1 1.2z" />
        </>
      }
    />
  ),
};
