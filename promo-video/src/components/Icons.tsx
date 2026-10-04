import React from "react";
import { palette } from "../design/tokens";

/**
 * The small set of line icons the reconstructed screens need, drawn as plain
 * SVG so the film has no icon-font or symbol dependency. Geometry follows the
 * SF Symbols the app uses, at the same optical weight.
 */
type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
};

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  xmlns: "http://www.w3.org/2000/svg",
});

export const PlusIcon: React.FC<IconProps> = ({ size = 17, color, strokeWidth = 2.1, style }) => (
  <svg {...base(size)} style={style}>
    <path
      d="M12 5.2v13.6M5.2 12h13.6"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </svg>
);

export const ArrowUpRightIcon: React.FC<IconProps> = ({
  size = 15,
  color,
  strokeWidth = 2,
  style,
}) => (
  <svg {...base(size)} style={style}>
    <path
      d="M7 17 17 7M8.6 7H17v8.4"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ArrowRightIcon: React.FC<IconProps> = ({
  size = 15,
  color,
  strokeWidth = 2,
  style,
}) => (
  <svg {...base(size)} style={style}>
    <path
      d="M4.5 12h15M13.5 6l6 6-6 6"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const CheckIcon: React.FC<IconProps> = ({ size = 12, color, strokeWidth = 2.6, style }) => (
  <svg {...base(size)} style={style}>
    <path
      d="M5 12.5 10 17.5 19 7"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const CircleIcon: React.FC<IconProps> = ({ size = 17, color, strokeWidth = 1.7, style }) => (
  <svg {...base(size)} style={style}>
    <circle cx="12" cy="12" r="8.2" stroke={color} strokeWidth={strokeWidth} />
  </svg>
);

export const CheckCircleFilledIcon: React.FC<IconProps> = ({ size = 17, color, style }) => (
  <svg {...base(size)} style={style}>
    <circle cx="12" cy="12" r="9" fill={color} />
    <path
      d="M7.9 12.4 10.7 15.2 16.2 9.4"
      stroke={palette.cream}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

export const CircleDashedIcon: React.FC<IconProps> = ({
  size = 24,
  color,
  strokeWidth = 1.6,
  style,
}) => (
  <svg {...base(size)} style={style}>
    <g stroke={color} strokeWidth={strokeWidth} strokeLinecap="round">
      <path d="M12 3.6a8.4 8.4 0 0 1 4.2 1.13" />
      <path d="M18.9 7.6A8.4 8.4 0 0 1 20.4 12" />
      <path d="M20.4 12a8.4 8.4 0 0 1-1.5 4.8" />
      <path d="M18.9 16.4A8.4 8.4 0 0 1 12 20.4" />
      <path d="M12 20.4a8.4 8.4 0 0 1-4.8-1.5" />
      <path d="M7.2 18.9A8.4 8.4 0 0 1 3.6 12" />
      <path d="M3.6 12a8.4 8.4 0 0 1 1.6-5" />
      <path d="M5.2 7A8.4 8.4 0 0 1 12 3.6" />
    </g>
  </svg>
);

export const SlidersIcon: React.FC<IconProps> = ({
  size = 15,
  color,
  strokeWidth = 1.9,
  style,
}) => (
  <svg {...base(size)} style={style}>
    <g stroke={color} strokeWidth={strokeWidth} strokeLinecap="round">
      <path d="M3.5 7.5h11M18 7.5h2.5M3.5 16.5h4M11 16.5h9.5" />
      <circle cx="16" cy="7.5" r="2.1" />
      <circle cx="9" cy="16.5" r="2.1" />
    </g>
  </svg>
);

export const SortIcon: React.FC<IconProps> = ({ size = 15, color, strokeWidth = 1.9, style }) => (
  <svg {...base(size)} style={style}>
    <g stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 4.5v15M8 19.5 4.6 16M8 19.5 11.4 16" />
      <path d="M16 19.5v-15M16 4.5 12.6 8M16 4.5 19.4 8" />
    </g>
  </svg>
);

export const EllipsisIcon: React.FC<IconProps> = ({ size = 20, color, style }) => (
  <svg {...base(size)} style={style}>
    <g fill={color}>
      <circle cx="5.6" cy="12" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="18.4" cy="12" r="1.7" />
    </g>
  </svg>
);

export const SearchIcon: React.FC<IconProps> = ({ size = 16, color, strokeWidth = 2, style }) => (
  <svg {...base(size)} style={style}>
    <g stroke={color} strokeWidth={strokeWidth} strokeLinecap="round">
      <circle cx="10.8" cy="10.8" r="6.3" />
      <path d="m15.6 15.6 4 4" />
    </g>
  </svg>
);

/* Tab bar glyphs --------------------------------------------------------- */

export const GridTabIcon: React.FC<IconProps> = ({ size = 25, color, strokeWidth = 1.6 }) => (
  <svg {...base(size)}>
    <g stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round">
      <rect x="3.6" y="3.6" width="7.2" height="7.2" rx="2.2" />
      <rect x="13.2" y="3.6" width="7.2" height="7.2" rx="2.2" />
      <rect x="3.6" y="13.2" width="7.2" height="7.2" rx="2.2" />
      <rect x="13.2" y="13.2" width="7.2" height="7.2" rx="2.2" />
    </g>
  </svg>
);

export const StackTabIcon: React.FC<IconProps> = ({ size = 25, color, strokeWidth = 1.6 }) => (
  <svg {...base(size)}>
    <g stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round">
      <rect x="4.2" y="3.8" width="15.6" height="7" rx="2" />
      <rect x="4.2" y="13.2" width="15.6" height="7" rx="2" />
    </g>
  </svg>
);

export const ChartTabIcon: React.FC<IconProps> = ({ size = 25, color, strokeWidth = 1.6 }) => (
  <svg {...base(size)}>
    <g stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.8 16.6 9 11.2l3.8 3.4L20.2 7" />
      <path d="M15.4 7h4.8v4.6" />
    </g>
  </svg>
);

export const PersonTabIcon: React.FC<IconProps> = ({ size = 25, color, strokeWidth = 1.6 }) => (
  <svg {...base(size)}>
    <g stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8.2" r="3.9" />
      <path d="M4.9 20.2a7.1 7.1 0 0 1 14.2 0" />
    </g>
  </svg>
);
