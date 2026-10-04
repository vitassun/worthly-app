import React from "react";
import { device, layout, palette, veil } from "../design/tokens";
import { fontFamily, type } from "../design/typography";
import { EllipsisIcon } from "../components/Icons";
import { NavAction, NavBar, StatusBar, TabBar, type TabId } from "../components/Chrome";
import { ArrowRightIcon } from "../components/Icons";
import { Card, DisplayTitle, Divider, EmphasisCard, Metric, Overline, SectionTitle, Text } from "../components/WorthlyCard";
import {
  REASON_LABELS,
  STATE_LABELS,
  USAGE_LABELS,
  formatCurrency,
  formatDate,
  formatPercent,
  type DemoCheckIn,
  type DemoItem,
  type ItemState,
} from "../data/demo";

/**
 * `ItemDetailView` reconstructed. The screen is Worthly's spine: BEFORE →
 * PURCHASE → AFTER, with the AFTER card carrying the check-in memory.
 */

export interface NextStageInfo {
  stage: 7 | 30 | 90;
  dueDateLabel: string;
  overdue: boolean;
}

const checkInRow = (checkIn: DemoCheckIn, dim: number) => (
  <div style={{ opacity: dim }}>
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div>
        <Overline color={veil.onEmphasisOverline}>
          {checkIn.stageDays === 0 ? "随时回访" : `${checkIn.stageDays} DAYS`}
        </Overline>
        <Text size={type.subheadline} color={veil.onEmphasisSoft} style={{ marginTop: 4 }}>
          {USAGE_LABELS[checkIn.usageFrequency]}
        </Text>
      </div>
      <Metric size={type.title3} color={palette.cream}>
        {checkIn.satisfactionScore}/10
      </Metric>
    </div>
    {checkIn.note ? (
      <Text
        size={type.footnote}
        color={veil.onEmphasisSoft}
        style={{ marginTop: 8 }}
      >
        {checkIn.note}
      </Text>
    ) : null}
  </div>
);

export const ItemDetailUI: React.FC<{
  item: DemoItem;
  /** Overrides the item's own lifecycle so a scene can play a transition. */
  state?: ItemState;
  checkIns: DemoCheckIn[];
  nextStage?: NextStageInfo | null;
  allStagesComplete?: boolean;
  /** The most recently added reflection, emphasised for one beat. */
  newestIndex?: number;
  scrollY: number;
  tabBar?: TabId | null;
  navHairline?: boolean;
  /** 0→1 press feedback on the 买了 button. */
  buyPressed?: number;
}> = ({
  item,
  state = item.state,
  checkIns,
  nextStage = null,
  allStagesComplete = false,
  newestIndex = -1,
  scrollY,
  tabBar = null,
  navHairline = false,
  buyPressed = 0,
}) => {
  const hasTabBar = tabBar !== null;
  const viewportTop = 97;
  const bottomInset = (hasTabBar ? 83 : 0) + 24;

  const discount =
    item.originalPrice !== undefined &&
    item.paidPrice !== undefined &&
    item.paidPrice <= item.originalPrice &&
    item.originalPrice > 0
      ? (item.originalPrice - item.paidPrice) / item.originalPrice
      : undefined;

  const cardStyle: React.CSSProperties = { padding: 20 };

  return (
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
      <NavBar
        title={item.name}
        trailing={
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <NavAction label="编辑" />
            <EllipsisIcon size={20} color={palette.ink} />
          </div>
        }
        showHairline={navHairline}
      />

      <div
        style={{
          position: "absolute",
          top: viewportTop,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            transform: `translateY(${-scrollY}px)`,
            padding: `24px ${layout.pagePadding}px ${bottomInset}px`,
            display: "flex",
            flexDirection: "column",
            gap: 30,
          }}
        >
          {/* header */}
          <div>
            <Overline>{STATE_LABELS[state]}</Overline>
            <DisplayTitle style={{ marginTop: 10 }}>{item.name}</DisplayTitle>
            <Text size={type.body} color={palette.muted} style={{ marginTop: 10 }}>
              {`${item.category} · ${REASON_LABELS[item.reason]}`}
            </Text>
          </div>

          {/* BEFORE */}
          <Card style={cardStyle}>
            <Overline color={palette.muted}>BEFORE</Overline>
            <SectionTitle style={{ marginTop: 12 }}>
              {`当时有多想要：${item.desireScore}/10`}
            </SectionTitle>
            <Text size={type.body} color={palette.muted} style={{ marginTop: 12 }}>
              {`预计使用：${item.expectedUsage === "daily" ? "每天" : item.expectedUsage === "weekly" ? "每周" : item.expectedUsage === "occasionally" ? "偶尔" : "不知道"}`}
            </Text>
            {item.originalPrice !== undefined ? (
              <div
                style={{
                  marginTop: 12,
                  fontFamily: fontFamily.mono,
                  fontSize: type.body,
                  color: palette.muted,
                }}
              >
                {`原价  ${formatCurrency(item.originalPrice)}`}
              </div>
            ) : null}
            {item.sourceNote ? (
              <Text size={type.body} color={palette.muted} style={{ marginTop: 12 }}>
                {item.sourceNote}
              </Text>
            ) : null}
          </Card>

          {/* PURCHASE */}
          <Card style={cardStyle}>
            <Overline color={palette.muted}>PURCHASE</Overline>
            {state === "bought" ? (
              <>
                <div style={{ marginTop: 12 }}>
                  {item.paidPrice !== undefined ? (
                    <>
                      <div
                        style={{
                          fontFamily: fontFamily.serif,
                          fontSize: type.largeTitle,
                          fontWeight: 700,
                          color: palette.ink,
                          lineHeight: 1.2,
                        }}
                      >
                        {formatCurrency(item.paidPrice)}
                      </div>
                      <Text size={type.body} color={palette.muted} style={{ marginTop: 12 }}>
                        最终到手价
                      </Text>
                    </>
                  ) : (
                    <SectionTitle>已购买</SectionTitle>
                  )}
                </div>
                {discount !== undefined && item.originalPrice !== undefined && item.paidPrice !== undefined ? (
                  <Overline style={{ marginTop: 12 }}>
                    {`-${formatPercent(discount)} · SAVED ${formatCurrency(item.originalPrice - item.paidPrice)}`}
                  </Overline>
                ) : null}
                {item.purchaseDate ? (
                  <div
                    style={{
                      marginTop: 12,
                      fontFamily: fontFamily.sans,
                      fontSize: type.caption,
                      color: palette.muted,
                    }}
                  >
                    {formatDate(item.purchaseDate)}
                  </div>
                ) : null}
              </>
            ) : state === "passed" ? (
              <>
                <SectionTitle style={{ marginTop: 12 }}>最后没有买。</SectionTitle>
                <Text size={type.body} color={palette.muted} style={{ marginTop: 12 }}>
                  这个决定也会留在你的消费记忆里。
                </Text>
              </>
            ) : (
              <SectionTitle style={{ marginTop: 12 }}>还没有做决定。</SectionTitle>
            )}
          </Card>

          {/* DECIDE — only while considering */}
          {state === "considering" ? (
            <div>
              <Overline>DECIDE</Overline>
              <SectionTitle style={{ marginTop: 12 }}>后来呢？</SectionTitle>
              <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 50,
                    padding: "0 18px",
                    background: palette.ink,
                    color: palette.cream,
                    borderRadius: layout.cardRadius,
                    fontFamily: fontFamily.sans,
                    fontSize: type.headline,
                    fontWeight: 600,
                    opacity: 1 - buyPressed * 0.22,
                    transform: `scale(${1 - buyPressed * 0.012})`,
                  }}
                >
                  买了
                </div>
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 50,
                    padding: "0 18px",
                    background: palette.surface,
                    color: palette.ink,
                    border: `1px solid ${veil.cardBorder}`,
                    borderRadius: layout.cardRadius,
                    fontFamily: fontFamily.sans,
                    fontSize: type.headline,
                    fontWeight: 600,
                  }}
                >
                  没买
                </div>
              </div>
            </div>
          ) : null}

          {/* AFTER */}
          {state === "bought" ? (
            <EmphasisCard style={{ padding: 22 }}>
              <Overline color={veil.onEmphasisSoft}>AFTER</Overline>

              <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 18 }}>
                {checkIns.length === 0 ? (
                  <SectionTitle color={palette.cream}>真正的“值”，要过一阵子再问。</SectionTitle>
                ) : (
                  <>
                    <SectionTitle color={palette.cream}>期待正在变成真实体验。</SectionTitle>
                    {checkIns.map((checkIn, index) => (
                      <React.Fragment key={checkIn.id}>
                        {checkInRow(checkIn, index === newestIndex ? 1 : index === checkIns.length - 1 ? 1 : 0.62)}
                      </React.Fragment>
                    ))}
                  </>
                )}

                {nextStage ? (
                  <>
                    <Divider color={veil.onEmphasisHairline} />
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <Overline color={palette.cream}>{`${nextStage.stage} DAYS LATER`}</Overline>
                        <Text size={type.headline} color={palette.cream} style={{ marginTop: 4 }}>
                          {nextStage.overdue ? "现在回来看看" : "现在回来看看"}
                        </Text>
                      </div>
                      <ArrowRightIcon size={17} color={palette.cream} />
                    </div>
                  </>
                ) : allStagesComplete ? (
                  <>
                    <Divider color={veil.onEmphasisHairline} />
                    <Text size={type.headline} color={palette.cream}>
                      7 / 30 / 90 天回访已完成。
                    </Text>
                  </>
                ) : null}

                <Divider color={veil.onEmphasisHairline} />

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <Overline color={palette.cream}>ANYTIME</Overline>
                    <Text size={type.headline} color={palette.cream} style={{ marginTop: 4 }}>
                      记录现在的感觉
                    </Text>
                  </div>
                  <ArrowRightIcon size={17} color={palette.cream} />
                </div>
              </div>
            </EmphasisCard>
          ) : state === "passed" ? (
            <EmphasisCard style={{ padding: 22 }}>
              <Overline color={veil.onEmphasisSoft}>AFTER</Overline>
              <SectionTitle color={palette.cream} style={{ marginTop: 14 }}>
                不买，也是一条完整的消费记忆。
              </SectionTitle>
              <Text
                size={type.body}
                color={veil.onEmphasisSoft}
                style={{ marginTop: 14 }}
              >
                Worthly 会保留这次没买的决定；目前的满意度洞察只使用真正买下并完成回访的记录。
              </Text>
            </EmphasisCard>
          ) : (
            <Card style={cardStyle}>
              <Overline color={palette.muted}>AFTER</Overline>
              <Text size={type.body} color={palette.muted} style={{ marginTop: 14 }}>
                做出购买决定后，这里会开始记录结果。
              </Text>
            </Card>
          )}
        </div>
      </div>

      {hasTabBar ? <TabBar active={tabBar as TabId} /> : null}
    </div>
  );
};

/**
 * Scroll offsets (device points) that bring each section to the top of the
 * viewport. Measured from the reconstructed layout so scenes can park the
 * phone on the beat they are talking about.
 */
export const DETAIL_OFFSETS = {
  header: 0,
  before: 140,
  purchase: 370,
  decide: 600,
  after: 610,
  max: 480,
} as const;
