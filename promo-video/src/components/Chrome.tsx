import React from "react";
import { device, palette, veil } from "../design/tokens";
import { fontFamily, type } from "../design/typography";
import {
  ChartTabIcon,
  GridTabIcon,
  PersonTabIcon,
  StackTabIcon,
} from "./Icons";

/**
 * iOS chrome, reconstructed at logical size: status bar, inline navigation bar
 * and tab bar. It exists so the screens read as a real device without any
 * decorative device artwork.
 */

const Signal: React.FC<{ color: string }> = ({ color }) => (
  <svg width="17" height="11" viewBox="0 0 17 11" fill="none">
    {[0, 1, 2, 3].map((index) => (
      <rect
        key={index}
        x={index * 4.4}
        y={8.6 - (index + 1) * 2.15}
        width="3.1"
        height={(index + 1) * 2.15}
        rx="0.9"
        fill={color}
      />
    ))}
  </svg>
);

const Wifi: React.FC<{ color: string }> = ({ color }) => (
  <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
    <g stroke={color} strokeWidth="1.55" strokeLinecap="round">
      <path d="M1.4 4.05A9.9 9.9 0 0 1 14.6 4.05" />
      <path d="M3.9 6.65a6.3 6.3 0 0 1 8.2 0" />
    </g>
    <circle cx="8" cy="9.35" r="1.15" fill={color} />
  </svg>
);

const Battery: React.FC<{ color: string }> = ({ color }) => (
  <svg width="26" height="13" viewBox="0 0 26 13" fill="none">
    <rect x="0.6" y="0.6" width="21.8" height="11.8" rx="3.6" stroke={color} strokeOpacity="0.36" strokeWidth="1.1" />
    <rect x="2.4" y="2.4" width="18.2" height="8.2" rx="2.2" fill={color} />
    <path d="M24.2 4.4v4.2a2.4 2.4 0 0 0 0-4.2Z" fill={color} fillOpacity="0.4" />
  </svg>
);

export const StatusBar: React.FC<{ time?: string; color?: string }> = ({
  time = "9:41",
  color = palette.ink,
}) => (
  <div
    style={{
      height: 53,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 30px 0 34px",
      flexShrink: 0,
    }}
  >
    <div
      style={{
        fontFamily: fontFamily.sans,
        fontSize: 16,
        fontWeight: 600,
        color,
        letterSpacing: "0.005em",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {time}
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 5.5 }}>
      <Signal color={color} />
      <Wifi color={color} />
      <Battery color={color} />
    </div>
  </div>
);

export const NavBar: React.FC<{
  title?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  showHairline?: boolean;
}> = ({ title, leading, trailing, showHairline }) => (
  <div
    style={{
      position: "relative",
      height: 44,
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 16px",
      borderBottom: showHairline ? `1px solid ${veil.hairline}` : "1px solid transparent",
    }}
  >
    <div style={{ minWidth: 60 }}>{leading}</div>
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        textAlign: "center",
        fontFamily: fontFamily.sans,
        fontSize: 17,
        fontWeight: 600,
        color: palette.ink,
        pointerEvents: "none",
      }}
    >
      {title}
    </div>
    <div style={{ minWidth: 60, display: "flex", justifyContent: "flex-end" }}>{trailing}</div>
  </div>
);

export const NavAction: React.FC<{ label: string; color?: string }> = ({
  label,
  color = palette.muted,
}) => (
  <span
    style={{
      fontFamily: fontFamily.sans,
      fontSize: 17,
      color,
      whiteSpace: "nowrap",
    }}
  >
    {label}
  </span>
);

export type TabId = "home" | "things" | "insights" | "me";

const TABS: Array<{ id: TabId; label: string; Icon: React.FC<{ color?: string }> }> = [
  { id: "home", label: "首页", Icon: GridTabIcon },
  { id: "things", label: "记录", Icon: StackTabIcon },
  { id: "insights", label: "洞察", Icon: ChartTabIcon },
  { id: "me", label: "我的", Icon: PersonTabIcon },
];

export const TabBar: React.FC<{ active: TabId }> = ({ active }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      background: palette.cream,
      borderTop: `1px solid ${veil.hairline}`,
      paddingBottom: device.safeBottom,
      flexShrink: 0,
    }}
  >
    <div style={{ display: "flex", height: 49 }}>
      {TABS.map(({ id, label, Icon }) => {
        const selected = id === active;
        const color = selected ? palette.orange : palette.muted;
        return (
          <div
            key={id}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2.5,
            }}
          >
            <Icon color={color} />
            <span
              style={{
                fontFamily: fontFamily.sans,
                fontSize: type.caption2 - 1,
                fontWeight: 500,
                color,
                letterSpacing: "0.01em",
              }}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  </div>
);

/** SwiftUI Toggle, drawn with palette surfaces only. */
export const Switch: React.FC<{ on: boolean; width?: number }> = ({ on, width = 51 }) => {
  const height = (width / 51) * 31;
  const knob = height - 4;
  return (
    <div
      style={{
        width,
        height,
        borderRadius: height / 2,
        background: on ? palette.orange : veil.controlTrack,
        display: "flex",
        alignItems: "center",
        padding: 2,
        justifyContent: on ? "flex-end" : "flex-start",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: knob,
          height: knob,
          borderRadius: knob / 2,
          background: palette.cream,
          border: `1px solid ${veil.hairline}`,
        }}
      />
    </div>
  );
};

/** The compact iOS date picker value chip. */
export const DateChip: React.FC<{ label: string }> = ({ label }) => (
  <div
    style={{
      padding: "5px 9px",
      borderRadius: 6,
      background: veil.controlFill,
      fontFamily: fontFamily.sans,
      fontSize: 16,
      color: palette.ink,
      whiteSpace: "nowrap",
    }}
  >
    {label}
  </div>
);
