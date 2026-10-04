# Worthly v0.2.0 宣发视频 — 2026-10-05

交付：`renders/worthly-promo-v0.2.0.mp4`，1920 × 1080，16:9，30 fps，82 秒，H.264 + AAC。
中文画面文案，原创器乐配乐，无旁白。所有功能依据当前 iOS App；界面为重绘，记录为演示数据，成片持续标明。

## 修正

- 原片 32 秒过于紧凑：延长关键功能停留时间，完整展示设备，避免上下裁切。
- 记录库的旧状态菜单改为当前 App 的状态筛选条，分类与排序使用真实名称。
- 加入考虑中、没买的示例记录，演示「没买」筛选后的结果与数量。
- 想要度动画使用整数，避免出现 App 不支持的小数评分。
- 补充过去购买日期、可选本地提醒、JSON 导出、数据删除、设备本地保存与深浅外观。
- 同步 v0.2.0：回访修改 / 确认删除、完整待回访与待决定列表、预计使用的原生菜单。
- 展示折扣 / 类别 / 长期最高最低购买记忆；指标仍由同一示例数据和本地洞察规则计算。
- 第一份洞察的 3 件阶段回访门槛，与长期洞察的独立门槛均有交代。
- 修复深色重绘的强调卡标签对比度。
- 配乐重新编排到新时间线；帧提取清单的帧率取自实际合成，不再残留 60 fps。

## 功能依据

| 视频段落 | 当前 App 实现 |
| --- | --- |
| 6–12s：名称、类别、动机、想要度、预计频率、来源备注 | `Worthly/Features/AddItem/AddItemView.swift` |
| 12–16s：记下 7 天后在首页重新考虑 | `DecisionReviewSchedule.swift`、`HomeView.swift`；不是推送通知 |
| 16–23s：买了 / 没买，实际价格与购买日期 | `PurchaseDecisionView.swift`、`ItemDetailView.swift` |
| 23–27s：已买物品与过去购买日期 | `AddItemView.swift` 的 alreadyBought 和 DatePicker |
| 27–35s：依次 7 / 30 / 90 天回访 | `CheckInSchedule.swift`、`CheckInView.swift` |
| 35–40s：全部待回访 / 待决定 | `HomeView.swift` 的 `ReviewQueueView` |
| 44–48s：修改或删除旧回访 | `CheckInView.swift`、`CheckInRecordService.swift`、`WorthlyDataDeletion.swift`；编辑保留原日期与阶段 |
| 40–44s：随时回访 | `CheckIn.isAdHoc`、`CheckInView.swift`；不完成阶段、不参与满意度洞察 |
| 48–53s：状态、分类、搜索、排序、没买历史 | `ThingsView.swift`、`ItemLibraryQuery.swift` |
| 53–68s：满意度、期待差异、折扣、类别、长期记忆、门槛 | `InsightEngine.swift`、`InsightsView.swift` |
| 68–74s：本地保存、JSON 导出、删除、可选提醒 | `SettingsView.swift`、`WorthlyDataExporter.swift`、`CheckInReminderService.swift` |
| 74–78s：跟随系统深浅外观 | `WorthlyTheme.swift`、`WorthlyApp.swift` |

没有宣传云同步、账号、AI、自动导入、记账预算、订阅、上架或下载可用性。
「记录现在的感觉」仅用于已购买物品；随时回访不被包装成统计样本。
示例价格不代表实时商品价格或购买推荐。

## 基线

本地 HEAD 与 GitHub main：`a5047447600f16dd121064df99f94f50ec8317da`。
文档标注的功能基线 `333c812` 是其父提交；两者 App 源码完全相同。用户确认采用当前 main。
用户随后将任务扩展为 App v0.2.0 + 新版视频。本轮包含 App 修复和功能改进，仍不修改持久化模型或启用未来功能；完整说明见 `docs/V0_2_0_RELEASE_NOTES.md`。CI 的设备产物检查补充真实验证，原三道构建与测试门禁保留。

## 复现

```text
npm ci
npm run typecheck
npm run verify:data
npm run score
npm run qa
npm run render
npm run sequence
npm run verify:encode
npm run verify:audio
```

`npm run render` 直接生成最终文件 `renders/worthly-promo-v0.2.0.mp4`。原 32 秒版保留在本地原文件名下。帧和报告放在 `qa/`。
`README-original.md` 与 `probe-original-frames.mjs` 是旧版说明和旧版区域检查，仅作为历史，不代表当前结果。

记录库演示包含 10 件已完成阶段回访的购买、4 件待首次回访购买、1 件考虑中、1 件没买。满意度与长期规律来自其中已评估的 10 件购买，平均 6.9；未回访及没买记录不混入满意度。

重绘不能替代 iPhone 实机 QA。Windows 上未运行 Xcode / 模拟器；当前 iOS CI 仅验证仓库 App 构建，不验证视频视觉质量。

## 成片检查

- 19 个屏幕布局检查、42 个关键时刻、69 个画面区域检查均通过。
- 2460 帧全片扫描无空白帧；20 个成片解码画面与无损源帧比较通过。
- 19 项声音检查通过：-16 LUFS、无削波、首尾淡出、24 个配乐提示与 7 / 30 / 90 回访动画同步。
- 最后一次混音提高了 12.3 秒的提示音。最终 MP4 保留已验证的视频流，仅更新 AAC 音轨；更新后重新通过画面一致性与声音检查。
- `qa/reports/` 中的 `*-v020*`、`screen-layout.*`、`encode-fidelity.*`、`audio.*`、`sequence.txt` 与 `score-cues.json` 对应本次交付。
