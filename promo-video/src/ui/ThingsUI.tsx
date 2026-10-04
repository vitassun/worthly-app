import React from "react";
import { device, layout, palette, veil } from "../design/tokens";
import { fontFamily, type } from "../design/typography";
import { SearchIcon, SlidersIcon, SortIcon } from "../components/Icons";
import { NavBar, NavAction, StatusBar, TabBar, type TabId } from "../components/Chrome";
import { Card, DisplayTitle, Metric, Text } from "../components/WorthlyCard";
import { REASON_LABELS, STATE_LABELS, formatCurrency, type DemoItem } from "../data/demo";

/**
 * `ThingsView` reconstructed — the full consumption-memory library.
 */

const FilterChip: React.FC<{ label: string; icon?: React.ReactNode; active?: boolean }> = ({
  label,
  icon,
  active,
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "7px 12px",
      borderRadius: layout.chipRadius,
      background: active ? palette.ink : palette.surface,
      color: active ? palette.cream : palette.ink,
      border: `1px solid ${active ? palette.orange : veil.cardBorder}`,
      fontFamily: fontFamily.sans,
      fontSize: type.footnote,
      fontWeight: 500,
      whiteSpace: "nowrap",
    }}
  >
    {icon}
    <span>{label}</span>
  </div>
);

export const ThingsUI: React.FC<{
  items: DemoItem[];
  scrollY: number;
  resultCount: number;
  selectedState?: string;
  searchText?: string;
  tabBar?: TabId | null;
  /** 0→1, used to spotlight a single row during the zoom-out. */
  focusIndex?: number;
  focusAmount?: number;
  /**
   * Film-only: one 0→1 entrance progress per row. The library arrives a row at
   * a time instead of fading up as a block, which is what makes the list read as
   * accumulated history rather than as a screenshot.
   */
  rowProgress?: number[];
}> = ({
  items,
  scrollY,
  resultCount,
  selectedState = "全部",
  searchText = "",
  tabBar = "things",
  focusIndex = -1,
  focusAmount = 0,
  rowProgress,
}) => (
  <div
    style={{
      position: "relative",
      width: device.width,
      height: device.height,
      background: palette.cream,
      overflow: "hidden",
    }}
  >
    <StatusBar />
    <NavBar title="记录" trailing={<NavAction label="＋" />} />

    <div
      style={{
        position: "absolute",
        top: 97,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          transform: `translateY(${-scrollY}px)`,
          padding: `24px ${layout.pagePadding}px ${tabBar ? 107 : 24}px`,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div>
          <DisplayTitle style={{ marginTop: 10 }}>你的消费记忆</DisplayTitle>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 12px",
            borderRadius: 10,
            background: palette.surface,
            color: palette.muted,
            fontFamily: fontFamily.sans,
            fontSize: type.body,
          }}
        >
          <SearchIcon size={16} color={palette.muted} />
          <span>{searchText || "搜索名称、分类或备注"}</span>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {["全部", "考虑中", "已购买", "没买"].map(label => <FilterChip key={label} label={label} active={selectedState === label} />)}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <FilterChip label="全部分类" icon={<SlidersIcon size={14} color={palette.ink} />} />
          <FilterChip label="最近记录" icon={<SortIcon size={14} color={palette.ink} />} />
        </div>

        <Text size={type.footnote} color={palette.muted}>
          {`${resultCount} 件记录`}
        </Text>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((item, index) => {
            const focus = index === focusIndex ? focusAmount : 0;
            const reveal = rowProgress ? (rowProgress[index] ?? 1) : 1;
            return (
              <Card
                key={item.id}
                style={{
                  padding: 20,
                  opacity: (focusIndex >= 0 && index !== focusIndex ? 1 - focus * 0.55 : 1) * reveal,
                  transform: `translateY(${(1 - reveal) * 10}px) scale(${1 + focus * 0.02})`,
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                  <div style={{ flex: 1 }}>
                    <Text size={type.headline} weight={600}>
                      {item.name}
                    </Text>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        marginTop: 7,
                        fontFamily: fontFamily.sans,
                        fontSize: type.caption,
                        color: palette.muted,
                      }}
                    >
                      <span>{STATE_LABELS[item.state]}</span>
                      <span>·</span>
                      <span>{REASON_LABELS[item.reason]}</span>
                    </div>
                  </div>
                  {item.paidPrice !== undefined || item.originalPrice !== undefined ? <Metric size={type.subheadline} weight={600}>
                    {formatCurrency(item.paidPrice ?? item.originalPrice!)}
                  </Metric> : null}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>

    {tabBar ? <TabBar active={tabBar} /> : null}
  </div>
);
