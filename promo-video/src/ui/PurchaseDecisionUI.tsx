import React from "react";
import { device, layout, palette } from "../design/tokens";
import { fontFamily, type } from "../design/typography";
import { DateChip, NavAction, NavBar, StatusBar } from "../components/Chrome";
import {
  Card,
  DisplayTitle,
  Field,
  Overline,
  PrimaryButton,
  Text,
} from "../components/WorthlyCard";
import { formatCurrency, type DemoItem } from "../data/demo";

/**
 * `PurchaseDecisionView` (mode: `.bought`) reconstructed. This is the moment the
 * real price replaces the remembered price — and the only place a discount can
 * truthfully come from.
 */
export const PurchaseDecisionUI: React.FC<{
  item: DemoItem;
  paidPrice: string;
  purchaseDate: string;
  caret?: boolean;
  confirmPressed?: number;
  scrollY?: number;
}> = ({ item, paidPrice, purchaseDate, caret, confirmPressed = 0, scrollY = 0 }) => (
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
    <NavBar title="标记已买" leading={<NavAction label="取消" />} />

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
          padding: `24px ${layout.pagePadding}px 24px`,
          display: "flex",
          flexDirection: "column",
          gap: 26,
        }}
      >
        <div>
          <Overline>PURCHASE</Overline>
          <DisplayTitle style={{ marginTop: 8 }}>{item.name}</DisplayTitle>
          <Text size={type.body} color={palette.muted} style={{ marginTop: 8 }}>
            记录真实成交，而不是记忆里的价格。
          </Text>
        </div>

        <Card style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          {item.originalPrice !== undefined ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontFamily: fontFamily.mono,
                fontSize: type.body,
                color: palette.ink,
              }}
            >
              <span>原价</span>
              <span>{formatCurrency(item.originalPrice)}</span>
            </div>
          ) : null}

          <Field
            text={paidPrice}
            placeholder="最终到手价（可选）"
            caret={caret}
            fontSize={type.body}
            fontWeight={400}
            padding="6px 10px"
            radius={8}
            bordered
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              minHeight: 34,
            }}
          >
            <div
              style={{
                fontFamily: fontFamily.sans,
                fontSize: type.body,
                color: palette.ink,
              }}
            >
              购买日期
            </div>
            <DateChip label={purchaseDate} />
          </div>
        </Card>

        <PrimaryButton label="确认已购买" pressed={confirmPressed} />
      </div>
    </div>
  </div>
);
