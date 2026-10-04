import React from "react";
import { palette, device } from "../design/tokens";
import { NavBar, StatusBar, TabBar, Switch } from "../components/Chrome";
import { Text } from "../components/WorthlyCard";

/** Visible settings and wording from SettingsView.swift. No pretend share sheet. */
export const SettingsUI: React.FC = () => {
  const row: React.CSSProperties = { padding: "14px 16px", minHeight: 44, boxSizing: "border-box" };
  const group: React.CSSProperties = { background: palette.surface, borderRadius: 14, overflow: "hidden" };
  return <div style={{ position: "relative", width: device.width, height: device.height, background: palette.cream }}>
    <StatusBar /><NavBar title="我的" />
    <div style={{ padding: "20px 20px 100px" }}>
      <Text size={13} color={palette.muted} style={{ marginBottom: 8 }}>数据</Text>
      <div style={group}><div style={row}><Text>导出我的数据</Text></div>
        <div style={row}><Text color={palette.orange}>删除所有数据</Text></div></div>
      <Text size={13} color={palette.muted} style={{ marginTop: 24, marginBottom: 8 }}>提醒</Text>
      <div style={group}><div style={{ ...row, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <Text size={15}>7 / 30 / 90 天回访提醒</Text><Switch on={false} /></div></div>
      <Text size={12} color={palette.muted} style={{ margin: "10px 12px 0" }}>
        开启后，Worthly 会在回访当天上午提醒一次。不会发送营销通知。拒绝通知权限后，App 内的回访队列仍然可用。
      </Text>
      <Text size={13} color={palette.muted} style={{ marginTop: 24, marginBottom: 8 }}>偏好</Text>
      <div style={group}>{[["货币", "CNY · 人民币"], ["语言", "简体中文"]].map(([label, value]) =>
        <div key={label} style={{ ...row, display: "flex", justifyContent: "space-between" }}>
          <Text size={15}>{label}</Text><Text size={15} color={palette.muted}>{value}</Text></div>)}</div>
      <Text size={13} color={palette.muted} style={{ marginTop: 24, marginBottom: 8 }}>关于</Text>
      <div style={{ ...group, ...row }}><Text size={13} color={palette.muted}>
        你的记录保存在这台设备上。导出由系统分享功能在本地完成；Worthly 不会上传你的消费数据。
      </Text></div>
    </div>
    <TabBar active="me" />
  </div>;
};
