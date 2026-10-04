import React from "react";
import { device, layout, palette, veil } from "../design/tokens";
import { fontFamily, type } from "../design/typography";
import { NavBar, StatusBar, TabBar, type TabId } from "../components/Chrome";
import { Card, DisplayTitle, Metric, Overline, SectionTitle, Text } from "../components/WorthlyCard";
import type { InsightCardModel, InsightSnapshot } from "../data/insightEngine";

/**
 * `InsightsView` reconstructed. Insights are computed at runtime by the real
 * engine rules (see `src/data/insightEngine.ts`); nothing on this screen is
 * authored copy.
 */

export const InsightCardBlock: React.FC<{
  card: InsightCardModel;
  /** Used by the film to let the headline land before the numbers do. */
  metricsOpacity?: number;
  style?: React.CSSProperties;
}> = ({ card, metricsOpacity = 1, style }) => {
  const primary = card.isEmphasis ? palette.cream : palette.ink;
  const secondary = card.isEmphasis ? `rgba(239, 234, 224, 0.72)` : palette.muted;
  const hasMetrics =
    card.leftLabel !== undefined &&
    card.leftValue !== undefined &&
    card.rightLabel !== undefined &&
    card.rightValue !== undefined;

  return (
    <div
      style={{
        padding: 20,
        background: card.isEmphasis ? palette.emphasis : palette.surface,
        borderRadius: layout.cardRadius,
        ...style,
      }}
    >
      <Overline color={card.isEmphasis ? palette.orange : palette.muted}>{card.overline}</Overline>
      <SectionTitle color={primary} style={{ marginTop: 16 }}>
        {card.headline}
      </SectionTitle>

      {hasMetrics ? (
        <div style={{ display: "flex", gap: 18, marginTop: 16, opacity: metricsOpacity }}>
          {[
            { label: card.leftLabel!, value: card.leftValue! },
            { label: card.rightLabel!, value: card.rightValue! },
          ].map((metric) => (
            <div key={metric.label} style={{ flex: 1 }}>
              <Metric size={type.title2} color={primary}>
                {metric.value}
              </Metric>
              <Text size={type.caption} color={secondary} style={{ marginTop: 5 }}>
                {metric.label}
              </Text>
            </div>
          ))}
        </div>
      ) : null}

      <Text size={type.subheadline} color={secondary} style={{ marginTop: 16 }}>
        {card.detail}
      </Text>
    </div>
  );
};

export const InsightsUI: React.FC<{
  snapshot: InsightSnapshot;
  scrollY: number;
  tabBar?: TabId | null;
}> = ({ snapshot, scrollY, tabBar = "insights" }) => (
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
    <NavBar title="洞察" />

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
          gap: 30,
        }}
      >
        <div>
          <Overline>YOUR WORTH MEMORY</Overline>
          <DisplayTitle style={{ marginTop: 10, lineHeight: 1.32 }}>
            {"你真正觉得\n值得的是什么？"}
          </DisplayTitle>
        </div>

        {snapshot.averageSatisfaction !== undefined ? (
          <Card style={{ padding: 20 }}>
            <Overline color={palette.muted}>CURRENT SNAPSHOT</Overline>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 10,
                marginTop: 14,
              }}
            >
              <div
                style={{
                  fontFamily: fontFamily.serif,
                  fontSize: type.largeTitle,
                  fontWeight: 700,
                  color: palette.ink,
                  lineHeight: 1.2,
                }}
              >
                {snapshot.averageSatisfaction.toFixed(1)}
              </div>
              <Metric size={type.title3} weight={600} color={palette.muted}>
                / 10
              </Metric>
            </div>
            <Text size={type.subheadline} color={palette.muted} style={{ marginTop: 14 }}>
              {`来自 ${snapshot.evaluatedCount} 件已经完成至少一次回访的购买。它不是消费成绩，只是你目前留下来的真实满意度快照。`}
            </Text>
          </Card>
        ) : null}

        {snapshot.cards.map((card) => (
          <InsightCardBlock key={card.id} card={card} />
        ))}

        <Card style={{ padding: 20 }}>
          <Overline color={palette.muted}>DATA CONFIDENCE</Overline>
          <SectionTitle style={{ marginTop: 14 }}>让结论慢一点出现。</SectionTitle>
          <div style={{ display: "flex", gap: 24, marginTop: 14 }}>
            {[
              { label: "已回访购买", value: `${snapshot.evaluatedCount}` },
              { label: "30+ 天样本", value: `${snapshot.matureCount}` },
            ].map((metric) => (
              <div key={metric.label} style={{ flex: 1 }}>
                <Metric size={type.title2} color={palette.ink}>
                  {metric.value}
                </Metric>
                <Text size={type.caption} color={palette.muted} style={{ marginTop: 4 }}>
                  {metric.label}
                </Text>
              </div>
            ))}
          </div>
          <Text size={type.subheadline} color={palette.muted} style={{ marginTop: 14 }}>
            折扣、类别和长期最值/最不值只使用 30 / 90 天回访，并设置最低样本门槛，避免把偶然的一次体验当成你的消费规律。
          </Text>
        </Card>
      </div>
    </div>

    {tabBar ? <TabBar active={tabBar} /> : null}
  </div>
);

/** The DATA CONFIDENCE card on its own, for the closing editorial beat. */
export const DataConfidenceCard: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div style={{ padding: 20, background: palette.surface, borderRadius: layout.cardRadius, ...style }}>
    <Overline color={palette.muted}>DATA CONFIDENCE</Overline>
    <SectionTitle style={{ marginTop: 14 }}>让结论慢一点出现。</SectionTitle>
    <div style={{ height: 14 }} />
    <div style={{ height: 1, background: veil.hairline }} />
  </div>
);
