import React from "react";
import { device, palette } from "../design/tokens";
import { NavBar, NavAction, StatusBar, TabBar } from "../components/Chrome";
import { DueCheckInCard } from "./HomeUI";
import { PENDING_DEMO_ITEMS } from "../data/demo";
/** v0.2.0 ReviewQueueView: native navigation, all due items, no extra metrics. */
export const ReviewQueueUI: React.FC = () => <div style={{ position: "relative", width: device.width,
  height: device.height, background: palette.cream }}>
  <StatusBar /><NavBar title="待回访" leading={<NavAction label="首页" />} />
  <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
    {PENDING_DEMO_ITEMS.map(item => <DueCheckInCard key={item.id} item={item} stage={7} />)}
  </div>
  <TabBar active="home" />
</div>;
