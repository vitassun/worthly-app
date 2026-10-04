import React from "react";
import { useCurrentFrame } from "remotion";
import { palette } from "../design/tokens";
import { progress } from "../design/motion";
import { BodyCopy, MaskLine, Mono, SceneFade, SerifDisplay, Slug } from "../components/Stage";
import { PhoneFrame } from "../components/WorthlyCard";
import { AddItemUI, ADD_FORM_MAX_SCROLL_BOUGHT } from "../ui/AddItemUI";
import { ItemDetailUI } from "../ui/ItemDetailUI";
import { SettingsUI } from "../ui/SettingsUI";
import { ReviewQueueUI } from "../ui/ReviewQueueUI";
import { CheckInUI } from "../ui/CheckInUI";
import { DEMO_ITEMS, HERO_ITEM } from "../data/demo";
import { cardById, insightSnapshot } from "../data/insightEngine";
import { sceneById } from "../timeline";

const Copy: React.FC<{ lines: [string, string]; body: string; frame: number }> = ({ lines, body, frame }) => (
  <div style={{ position: "absolute", left: 150, top: 310, width: 1020 }}>
    {lines.map((line, i) => <MaskLine key={line} p={progress(frame, 5 + i * 7, 18)} style={{ height: 112 }}>
      <SerifDisplay size={82} lineHeight={1.28}>{line}</SerifDisplay>
    </MaskLine>)}
    <div style={{ height: 34 }} />
    <MaskLine p={progress(frame, 24, 18)} style={{ height: 170 }}><BodyCopy size={30}>{body}</BodyCopy></MaskLine>
  </div>
);
const box = { left: 1521 - 415 * 1.16 / 2, top: 540 - 874 * 1.16 / 2 };

export const ReviewQueueScene: React.FC = () => {
  const frame = useCurrentFrame();
  return <SceneFade frame={frame} duration={sceneById("queue").durationInFrames}>
    <Slug label="v0.2.0 · 完整回访队列" opacity={progress(frame, 2, 12)} />
    <Copy frame={frame} lines={["该回来看的，", "一眼就能找到。"]}
      body={"首页集中显示到期回访。\n打开完整列表，逐件记下真实体验。\n待决定的想要，也有完整列表。"} />
    <PhoneFrame scale={1.16} style={{ ...box, opacity: progress(frame, 1, 15) }}><ReviewQueueUI /></PhoneFrame>
  </SceneFade>;
};

export const CorrectionScene: React.FC = () => {
  const frame = useCurrentFrame();
  return <SceneFade frame={frame} duration={sceneById("correction").durationInFrames}>
    <Slug label="v0.2.0 · 回访更正" opacity={progress(frame, 2, 12)} />
    <Copy frame={frame} lines={["记录可以更正，", "体验随时补充。"]}
      body={"点开已有回访，修改评分和备注。\n需要删除时，先确认再删除。\n新的感受，可以另记一条随时回访。"} />
    <PhoneFrame scale={1.16} style={{ ...box, opacity: progress(frame, 1, 15) }}>
      <CheckInUI item={HERO_ITEM} stage={30} editing score={7} usageIndex={1}
        note="音质很好，但出门带得比想象中少。" scrollY={130 * progress(frame, 33, 20)} />
    </PhoneFrame>
  </SceneFade>;
};

export const PastPurchaseScene: React.FC = () => {
  const frame = useCurrentFrame();
  return <SceneFade frame={frame} duration={sceneById("past").durationInFrames}>
    <Slug label="PURCHASE · 补录购买" opacity={progress(frame, 2, 12)} />
    <Copy frame={frame} lines={["已经买过的东西，", "也能从今天记起。"]}
      body={"直接选择「已经买了」。\n补上到手价和过去的购买日期。"} />
    <PhoneFrame scale={1.16} style={{ ...box, opacity: progress(frame, 1, 15) }}>
      <AddItemUI state={{ name: HERO_ITEM.name, caret: false, category: HERO_ITEM.category,
        categoryPulse: 0, reason: HERO_ITEM.reason, reasonPulse: {}, desire: HERO_ITEM.desireScore,
        usageIndex: 0, sourceNote: HERO_ITEM.sourceNote ?? "", originalPrice: "3999", alreadyBought: true,
        paidPrice: "3299", purchaseDate: "2026年3月8日", savePressed: 0 }}
        scrollY={ADD_FORM_MAX_SCROLL_BOUGHT} navHairline canSave />
    </PhoneFrame>
  </SceneFade>;
};

const snapshot = insightSnapshot(DEMO_ITEMS);
const patternRows = [
  { id: "discount-pattern", label: "折扣与满意度", context: "折扣大一些，后来就更满意吗？" },
  { id: "category-pattern", label: "类别偏好", context: "哪些类别，更常让你觉得值得？" },
  { id: "long-term-extremes", label: "长期购买记忆", context: "回看 30 天以后，哪些还喜欢？" },
];
export const PatternsScene: React.FC = () => {
  const frame = useCurrentFrame();
  return <SceneFade frame={frame} duration={sceneById("patterns").durationInFrames}>
    <Slug label="INSIGHTS · 你的记录里的规律" opacity={progress(frame, 2, 12)} />
    <div style={{ position: "absolute", left: 150, top: 180 }}>
      <MaskLine p={progress(frame, 5, 20)} style={{ height: 100 }}>
        <SerifDisplay size={72}>从一次喜欢，到自己的偏好。</SerifDisplay>
      </MaskLine>
      <BodyCopy size={27} style={{ marginTop: 14 }}>由你的阶段回访计算 · 以下为示例记录 · 描述关联，不推断原因</BodyCopy>
    </div>
    {patternRows.map((row, i) => {
      const card = cardById(snapshot, row.id);
      if (!card) return null;
      const p = progress(frame, 22 + i * 18, 20);
      return <div key={row.id} style={{ position: "absolute", left: 150, top: 370 + i * 195, width: 1620,
        height: 170, padding: "28px 34px", boxSizing: "border-box", borderRadius: 18,
        background: palette.surface, opacity: p, transform: `translateY(${(1 - p) * 12}px)`,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32 }}>
        <div style={{ width: 650 }}><SerifDisplay size={38}>{row.label}</SerifDisplay>
          <BodyCopy size={25} style={{ marginTop: 12 }}>{row.context}</BodyCopy></div>
        <div style={{ width: 760, display: "flex", gap: 44 }}>
          {[{ value: card.leftValue, label: row.id === "category-pattern" ? `${card.headline.match(/「(.+?)」/)?.[1]} · ${card.leftLabel}` : card.leftLabel }, { value: card.rightValue, label: card.rightLabel }].map(m =>
            <div key={m.label} style={{ flex: 1 }}><SerifDisplay size={48} color={palette.orange}>{m.value}</SerifDisplay>
              <BodyCopy size={22} style={{ marginTop: 10 }}>{m.label}</BodyCopy></div>)}
        </div>
      </div>;
    })}
  </SceneFade>;
};

export const PrivacyScene: React.FC = () => {
  const frame = useCurrentFrame();
  return <SceneFade frame={frame} duration={sceneById("privacy").durationInFrames}>
    <Slug label="LOCAL FIRST · 记录属于你" opacity={progress(frame, 2, 12)} />
    <Copy frame={frame} lines={["你的消费记忆，", "留在你的设备上。"]}
      body={"无需账号，Worthly 不上传消费数据。\n可导出 JSON，也可删除自己的记录。\n7 / 30 / 90 天通知提醒，由你选择开启。"} />
    <PhoneFrame scale={1.16} style={{ ...box, opacity: progress(frame, 1, 15) }}><SettingsUI /></PhoneFrame>
  </SceneFade>;
};

export const AppearanceScene: React.FC = () => {
  const frame = useCurrentFrame();
  const darkP = progress(frame, 42, 12);
  const dark = frame >= 48;
  return <SceneFade frame={frame} duration={sceneById("appearance").durationInFrames}>
    <Slug label="NATIVE iOS · 日与夜" opacity={progress(frame, 2, 12)} />
    <Copy frame={frame} lines={["白天，或夜里。", "都能安静地回看。"]}
      body={"跟随 iPhone 系统的深浅外观。\n同一段记忆，清晰地留在时间线里。"} />
    <PhoneFrame scale={1.16} appearance="light"
      style={{ ...box, opacity: progress(frame, 1, 15) * (1 - darkP) }}>
      <ItemDetailUI item={HERO_ITEM} checkIns={HERO_ITEM.checkIns} scrollY={0} allStagesComplete />
    </PhoneFrame>
    <PhoneFrame scale={1.16} appearance="dark" style={{ ...box, opacity: darkP }}>
      <ItemDetailUI item={HERO_ITEM} checkIns={HERO_ITEM.checkIns} scrollY={0} allStagesComplete />
    </PhoneFrame>
    <div style={{ position: "absolute", left: 150, top: 810 }}><Mono size={22} color={palette.orange}>
      {dark ? "深色外观 · 跟随系统" : "浅色外观 · 跟随系统"}</Mono></div>
  </SceneFade>;
};
