import React from "react";
import { layout, palette } from "../design/tokens";
import { fontFamily, type } from "../design/typography";
import { NavBar, NavAction, StatusBar } from "../components/Chrome";
import {
  Card,
  Chip,
  DisplayTitle,
  Metric,
  Overline,
  PrimaryButton,
  SectionTitle,
  Slider,
  Text,
} from "../components/WorthlyCard";
import type { DemoItem } from "../data/demo";

/**
 * `CheckInView` reconstructed — the 7 / 30 / 90 day review, and the free-form
 * 随时回访 variant (stage = null).
 */

export const CHECKIN_USAGE = ["几乎每天", "每周几次", "大约每周", "很少", "几乎没用"];

export const CheckInUI: React.FC<{
  item: DemoItem;
  stage: 7 | 30 | 90 | null;
  score: number;
  usageIndex: number;
  note: string;
  noteCaret?: boolean;
  savePressed?: number;
  scrollY?: number;
  editing?: boolean;
}> = ({ item, stage, score, usageIndex, note, noteCaret, savePressed = 0, scrollY = 0, editing = false }) => (
  <div
    style={{
      position: "relative",
      width: 393,
      height: 852,
      background: palette.cream,
      overflow: "hidden",
    }}
  >
    <StatusBar />
    <NavBar title={editing ? "编辑回访" : stage === null ? "随时回访" : `${stage} 天回访`}
      leading={editing ? <NavAction label="返回" /> : undefined} />

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
          padding: `24px ${layout.pagePadding}px 40px`,
          display: "flex",
          flexDirection: "column",
          gap: 28,
        }}
      >
        {/* header */}
        <div>
          <Overline>{stage === null ? "ANYTIME · 随时回访" : `${stage} DAYS LATER`}</Overline>
          <DisplayTitle style={{ marginTop: 9, lineHeight: 1.32 }}>
            {editing ? "修正这次回访。" : "现在还觉得\n它值吗？"}
          </DisplayTitle>
          <Text size={type.headline} color={palette.muted} style={{ marginTop: 9 }}>
            {item.name}
          </Text>
          <Text size={type.body} color={palette.muted} style={{ marginTop: 9 }}>
            {editing ? "更正当时的记录，保留原来的回访日期和阶段。新的感受可以另记一条随时回访。" : "不要回忆购买时有多兴奋，只记录现在。"}
          </Text>
          {editing ? <Overline color={palette.muted} style={{ marginTop: 10 }}>2026年4月7日 22:40</Overline> : null}
        </div>

        {/* score */}
        <Card style={{ padding: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
            }}
          >
            <SectionTitle>现在满意吗？</SectionTitle>
            <Metric size={type.title3} color={palette.orange}>
              {score}/10
            </Metric>
          </div>
          <div style={{ height: 14 }} />
          <Slider value={score} />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 10,
              fontFamily: fontFamily.sans,
              fontSize: type.caption,
              color: palette.muted,
            }}
          >
            <span>后悔</span>
            <span>很值</span>
          </div>
        </Card>

        {/* usage */}
        <div>
          <SectionTitle>最近真的在用吗？</SectionTitle>
          <div style={{ height: 14 }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {CHECKIN_USAGE.map((label, index) => (
              <Chip
                key={label}
                label={label}
                variant="circle"
                selected={index === usageIndex}
                minHeight={44}
                fontSize={type.subheadline}
                style={{ padding: "8px 6px", gap: 6 }}
              />
            ))}
          </div>
        </div>

        {/* note */}
        <div>
          <Text size={type.headline} weight={600}>
            一句话就够了（可选）
          </Text>
          <div
            style={{
              marginTop: 10,
              padding: 16,
              background: palette.surface,
              borderRadius: layout.cardRadius,
              minHeight: 84,
              fontFamily: fontFamily.sans,
              fontSize: type.body,
              lineHeight: 1.42,
              color: note.length === 0 ? palette.muted : palette.ink,
            }}
          >
            <span style={{ whiteSpace: "pre-wrap" }}>
              {note.length === 0 ? "例如：音质很好，但其实没怎么带出门。" : note}
            </span>
            {noteCaret ? (
              <span
                style={{
                  display: "inline-block",
                  width: 2,
                  height: "1.05em",
                  marginLeft: 1,
                  background: palette.ink,
                  transform: "translateY(0.12em)",
                }}
              />
            ) : null}
          </div>
        </div>

        <PrimaryButton label={editing ? "保存修改" : "记下现在的感觉"} pressed={savePressed} />
        {editing ? <Text size={17} color={palette.orange} align="center">删除这次回访</Text> : null}
      </div>
    </div>
  </div>
);
