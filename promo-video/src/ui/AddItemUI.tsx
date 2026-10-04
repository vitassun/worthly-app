import React from "react";
import { layout, palette } from "../design/tokens";
import { fontFamily } from "../design/typography";
import { DateChip, NavAction, NavBar, StatusBar, Switch } from "../components/Chrome";
import { Chevron } from "../components/WorthlyCard";
import {
  Chip,
  DisplayTitle,
  Field,
  Metric,
  Overline,
  PrimaryButton,
  SectionTitle,
  Slider,
  Text,
} from "../components/WorthlyCard";
import type { PurchaseReason } from "../data/demo";

/**
 * `AddItemView` reconstructed field-for-field. Everything here maps to a real
 * control in `Worthly/Features/AddItem/AddItemView.swift`, at the same type
 * sizes, paddings and radii, so the film can animate a real capture.
 */

export const ADD_CATEGORIES = ["服饰", "数码", "美妆", "娱乐", "旅行", "家居", "学习", "其他"];

export const ADD_REASONS: PurchaseReason[] = [
  "need",
  "experience",
  "reward",
  "trend",
  "mood",
  "discount",
  "appearance",
  "other",
];

export const REASON_DISPLAY: Record<PurchaseReason, string> = {
  need: "需要",
  experience: "提升体验",
  reward: "奖励自己",
  trend: "被种草",
  mood: "情绪",
  discount: "折扣",
  appearance: "好看",
  other: "其他",
};

export const USAGE_OPTIONS = ["每天", "每周", "偶尔", "不知道"];

export interface AddFormState {
  name: string;
  caret: boolean;
  category: string;
  /** 0→1 flash on the category row when the value is chosen. */
  categoryPulse: number;
  reason: PurchaseReason;
  /** Per-chip press pulse, keyed by reason. */
  reasonPulse: Partial<Record<PurchaseReason, number>>;
  desire: number;
  usageIndex: number;
  sourceNote: string;
  originalPrice: string;
  alreadyBought: boolean;
  paidPrice: string;
  purchaseDate: string;
  savePressed: number;
}

const FieldLabel: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <div
    style={{
      fontFamily: fontFamily.sans,
      fontSize: 17,
      color: palette.ink,
      ...style,
    }}
  >
    {children}
  </div>
);

export const AddItemUI: React.FC<{
  state: AddFormState;
  scrollY: number;
  navHairline: boolean;
  canSave: boolean;
}> = ({ state, scrollY, navHairline, canSave }) => (
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
    <NavBar title="记下一件" leading={<NavAction label="取消" />} showHairline={navHairline} />

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
          padding: `0 ${layout.pagePadding}px 36px`,
        }}
      >
        {/* intro */}
        <div style={{ paddingTop: 18 }}>
          <Overline>BEFORE</Overline>
          <DisplayTitle style={{ marginTop: 8 }}>先记下现在的感觉。</DisplayTitle>
          <Text size={17} color={palette.muted} style={{ marginTop: 8 }}>
            不用写得很完整，20 秒内完成就够了。
          </Text>
        </div>

        <div style={{ height: 28 }} />

        {/* item section */}
        <Field
          text={state.name}
          placeholder="想买什么？"
          caret={state.caret}
          fontSize={20}
          padding="18px"
        />

        <div style={{ height: 14 }} />

        <div>
          <SectionTitle>它属于哪一类？</SectionTitle>
          <div style={{ height: 8 }} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 10px",
              marginLeft: -10,
              borderRadius: 10,
              background: `rgba(205, 111, 71, ${state.categoryPulse * 0.16})`,
              transition: "none",
            }}
          >
            <span
              style={{
                fontFamily: fontFamily.sans,
                fontSize: 17,
                fontWeight: 600,
                color: palette.ink,
              }}
            >
              {state.category}
            </span>
            <Chevron />
          </div>
        </div>

        <div style={{ height: 14 }} />

        <Field
          text={state.sourceNote}
          placeholder="来自哪里 / 备注（可选）"
          fontSize={17}
          fontWeight={400}
          padding="5px 10px"
          radius={8}
          bordered
        />

        <div style={{ height: 28 }} />

        {/* motivation section */}
        <SectionTitle>为什么想买？</SectionTitle>

        <div style={{ height: 16 }} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
          }}
        >
          {ADD_REASONS.map((reason) => (
            <Chip
              key={reason}
              label={REASON_DISPLAY[reason]}
              selected={state.reason === reason}
              minHeight={44}
              fontSize={15}
              style={{
                transform: `scale(${1 - (state.reasonPulse[reason] ?? 0) * 0.03})`,
              }}
            />
          ))}
        </div>

        <div style={{ height: 16 }} />

        <div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
            }}
          >
            <FieldLabel>现在有多想要？</FieldLabel>
            <Metric size={15} color={palette.orange}>
              {state.desire}/10
            </Metric>
          </div>
          <div style={{ height: 8 }} />
          <Slider value={state.desire} />
        </div>

        <div style={{ height: 16 }} />

        <div>
          <FieldLabel>预计多久用一次？</FieldLabel>
          <div style={{ height: 8 }} />
          <div style={{display:"flex",alignItems:"center",gap:6,minHeight:34}}><Text size={17} weight={600}>{USAGE_OPTIONS[state.usageIndex]}</Text><Chevron /></div>
        </div>

        <div style={{ height: 28 }} />

        {/* price section */}
        <SectionTitle>价格</SectionTitle>

        <div style={{ height: 14 }} />

        <Field
          text={state.originalPrice}
          placeholder="原价（可选）"
          fontSize={17}
          fontWeight={400}
          padding="5px 10px"
          radius={8}
          bordered
        />

        <div style={{ height: 14 }} />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            minHeight: 32,
          }}
        >
          <FieldLabel>已经买了</FieldLabel>
          <Switch on={state.alreadyBought} />
        </div>

        {state.alreadyBought ? (
          <>
            <div style={{ height: 14 }} />
            <Field
              text={state.paidPrice}
              placeholder="最终到手价（可选）"
              fontSize={17}
              fontWeight={400}
              padding="5px 10px"
              radius={8}
              bordered
            />
            <div style={{ height: 14 }} />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                minHeight: 34,
              }}
            >
              <FieldLabel>购买日期</FieldLabel>
              <DateChip label={state.purchaseDate} />
            </div>
          </>
        ) : null}

        <div style={{ height: 28 }} />

        <PrimaryButton
          label="保存"
          pressed={state.savePressed}
          style={{ opacity: canSave ? 1 : 0.45 }}
        />
      </div>
    </div>
  </div>
);

/**
 * Scroll distance of the reconstructed Add form, in device points. Measured from
 * the layout above: the form is 988.6pt tall with 已经买了 off, and the viewport
 * below the navigation bar is 755pt.
 */
export const ADD_FORM_MAX_SCROLL = 234;

/** Same measurement with 已经买了 on (原价 + 到手价 + 购买日期 are present). */
export const ADD_FORM_MAX_SCROLL_BOUGHT = 329;
