import React from "react";
import { device, layout, palette } from "../design/tokens";
import { fontFamily, type } from "../design/typography";
import { ArrowUpRightIcon, PlusIcon } from "../components/Icons";
import { NavBar, StatusBar, TabBar, type TabId } from "../components/Chrome";
import {
  Card,
  DisplayTitle,
  Metric,
  Overline,
  PrimaryButton,
  SectionTitle,
  Text,
} from "../components/WorthlyCard";
import { REASON_LABELS, STATE_LABELS, formatCurrency, type DemoItem } from "../data/demo";

/**
 * `HomeView` reconstructed. The front door: capture, the decision revisit, the
 * insight teaser, then what is still being considered and recently bought.
 */

const ItemRow: React.FC<{ item: DemoItem }> = ({ item }) => (
  <Card style={{ padding: 20 }}>
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
      {item.paidPrice !== undefined || item.originalPrice !== undefined ? (
        <Metric size={type.subheadline} weight={600}>
          {formatCurrency(item.paidPrice ?? item.originalPrice ?? 0)}
        </Metric>
      ) : null}
    </div>
  </Card>
);

export const DecisionReviewCard: React.FC<{
  item: DemoItem;
  /**
   * Film-only: the day badge counts up to its final value instead of appearing
   * complete. Three and up, so the label reads "n DAYS" at every step.
   */
  dayCount?: number;
  style?: React.CSSProperties;
}> = ({ item, dayCount = 7, style }) => (
  <Card style={{ padding: 20, ...style }}>
    <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
      <div style={{ flex: 1 }}>
        <Overline>{`DECISION · ${dayCount} DAYS`}</Overline>
        <Text size={type.headline} weight={600} style={{ marginTop: 7 }}>
          {item.name}
        </Text>
        <Text size={type.subheadline} color={palette.muted} style={{ marginTop: 7 }}>
          买了，还是先放下？
        </Text>
      </div>
      <ArrowUpRightIcon size={15} color={palette.ink} />
    </div>
  </Card>
);

export const DueCheckInCard: React.FC<{ item: DemoItem; stage: 7 | 30 | 90 }> = ({
  item,
  stage,
}) => (
  <Card style={{ padding: 20 }}>
    <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
      <div style={{ flex: 1 }}>
        <Overline>{`${stage} DAYS LATER`}</Overline>
        <Text size={type.headline} weight={600} style={{ marginTop: 7 }}>
          {item.name}
        </Text>
        <Text size={type.subheadline} color={palette.muted} style={{ marginTop: 7 }}>
          现在还觉得它值吗？
        </Text>
      </div>
      <ArrowUpRightIcon size={15} color={palette.ink} />
    </div>
  </Card>
);

export const HomeUI: React.FC<{
  dateLabel: string;
  considering: DemoItem[];
  bought: DemoItem[];
  decisionRevisits: DemoItem[];
  dueReviews: Array<{ item: DemoItem; stage: 7 | 30 | 90 }>;
  primaryInsightHeadline?: string;
  scrollY: number;
  tabBar?: TabId | null;
}> = ({
  dateLabel,
  considering,
  bought,
  decisionRevisits,
  dueReviews,
  primaryInsightHeadline,
  scrollY,
  tabBar = "home",
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
    <NavBar />

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
          <div
            style={{
              fontFamily: fontFamily.mono,
              fontSize: type.caption,
              fontWeight: 700,
              color: palette.muted,
              letterSpacing: "0.02em",
            }}
          >
            {dateLabel}
          </div>
          <DisplayTitle style={{ marginTop: 10, lineHeight: 1.32 }}>
            {"最近有什么\n让你觉得「值得」？"}
          </DisplayTitle>
        </div>

        <PrimaryButton label="记下一件" icon={<PlusIcon size={17} color={palette.cream} />} />

        {dueReviews.length > 0 ? (
          <div>
            <SectionTitle>该回来看看了</SectionTitle>
            <Text size={type.subheadline} color={palette.muted} style={{ marginTop: 5 }}>
              不是催你记账，是看看当时的期待有没有留下来。
            </Text>
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
              {dueReviews.slice(0, 3).map((entry) => (
                <DueCheckInCard key={entry.item.id} item={entry.item} stage={entry.stage} />
              ))}
            </div>
          </div>
        ) : null}

        {decisionRevisits.length > 0 ? (
          <div>
            <SectionTitle>还想买吗？</SectionTitle>
            <Text size={type.subheadline} color={palette.muted} style={{ marginTop: 5 }}>
              放了一段时间了，回来看看当初的想要还在不在。
            </Text>
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
              {decisionRevisits.slice(0, 3).map((item) => (
                <DecisionReviewCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        ) : null}

        {primaryInsightHeadline ? (
          <Card background={palette.emphasis} style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{ flex: 1 }}>
                <Overline>YOUR FIRST PATTERN</Overline>
                <SectionTitle color={palette.cream} style={{ marginTop: 7 }}>
                  {primaryInsightHeadline}
                </SectionTitle>
                <Text
                  size={type.subheadline}
                  color={`rgba(239, 234, 224, 0.7)`}
                  style={{ marginTop: 7 }}
                >
                  查看你的消费洞察
                </Text>
              </div>
              <ArrowUpRightIcon size={15} color={palette.cream} />
            </div>
          </Card>
        ) : null}

        {considering.length > 0 ? (
          <div>
            <SectionTitle>还在考虑</SectionTitle>
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
              {considering.slice(0, 3).map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
            </div>
          </div>
        ) : null}

        {bought.length > 0 ? (
          <div>
            <SectionTitle>最近买了</SectionTitle>
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
              {bought.slice(0, 3).map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>

    {tabBar ? <TabBar active={tabBar} /> : null}
  </div>
);
