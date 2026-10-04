# Worthly v0.2.0 宣发视频 — 2026-10-05

交付：`renders/worthly-promo-v0.2.0.mp4`，1920 × 1080，16:9，30 fps，82 秒，H.264 + AAC。
中文画面文案，原创钢琴曲《A Little Time》，84 BPM、C 大调，无旁白。真实钢琴采样来源为 Salamander Grand Piano v3 / Alexander Holm（CC BY 3.0），来源、许可和署名保存在 `audio-sources/salamander/` 并在片尾显示。所有功能依据当前 iOS App，记录为演示数据。74–78 秒的深浅外观使用当前 App 的真实 SwiftUI 模拟器视图渲染；其余界面为重绘，成片按段落持续标明。

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
- 用户指出深色颜色偏差后，用真实 SwiftUI 视图渲染替换深浅外观段落；同时纠正重绘的状态 / 折扣误用橙色、导航动作颜色及旧回访额外淡化。
- 片尾加入用户指定的「更多功能，敬请期待」与「尚未正式上架 App Store」。
- 根据用户反馈重做为有问答旋律、轻柔伴奏和自然结尾的钢琴曲，移除旧合成器铺底与密集提示音；帧提取清单的帧率取自实际合成，不再残留 60 fps。

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

本轮起始 HEAD 与 GitHub main：`a5047447600f16dd121064df99f94f50ec8317da`。
文档标注的功能基线 `333c812` 是其父提交；两者 App 源码完全相同。用户确认采用当前 main。
用户随后将任务扩展为 App v0.2.0 + 新版视频。本轮包含 App 修复和功能改进，仍不修改持久化模型或启用未来功能；完整说明见 `docs/V0_2_0_RELEASE_NOTES.md`。CI 的设备产物检查补充真实验证，原三道构建与测试门禁保留。

## 复现

```text
npm ci
npm run typecheck
npm run verify:data
npm run verify:native
npm run score
npm run qa
npm run render
npm run sequence
npm run verify:encode
npm run verify:audio
```

钢琴渲染还需要 PATH 中的 ffmpeg（本机已安装）；13 个原始钢琴 FLAC 子集随源码保存，可离线复现，无新增 npm 依赖。完整音源许可和发布署名见 `audio-sources/salamander/ATTRIBUTION.md`。

`npm run render` 直接生成最终文件 `renders/worthly-promo-v0.2.0.mp4`。原 32 秒版保留在本地原文件名下。帧和报告放在 `qa/`。
`README-original.md` 与 `probe-original-frames.mjs` 是旧版说明和旧版区域检查，仅作为历史，不代表当前结果。

记录库演示包含 10 件已完成阶段回访的购买、4 件待首次回访购买、1 件考虑中、1 件没买。满意度与长期规律来自其中已评估的 10 件购买，平均 6.9；未回访及没买记录不混入满意度。

Windows 上没有本地 Xcode，也未做 iPhone 实机 QA。独立手动工作流 `Promo Native Reference` 已在 GitHub macOS 的 iPhone 17 / iOS 26.2 上渲染真实 `ItemDetailView`；主 CI 的 Debug / 63 项 XCTest / Release / 未签名 IPA 门禁保持完整。

原生素材见 `public/native-reference/`。来源提交为 `ec9414296a2c1889fbc4aaece924e7372250325e`，捕获运行为 [37219653303](https://github.com/vitassun/worthly-app/actions/runs/37219653303)。该提交的生产 App 与已验证的 `f4932fa` 一致。工作流仅在一次性 runner 中向既有测试文件追加截图夹具，运行后按原始字节恢复；不提交或改变生产 App、项目及既有测试。4 张原生 PNG、种子记录、系统 / 版本 / 尺寸 / SHA 元数据随素材保存，视频使用两张顶部图，不调色。

捕获是独立 `UIHostingController` 中真实 `ThingsView → NavigationStack → ItemDetailView` 的视图渲染；没有合成整个 `RootTabView`，也不是系统录屏或真机录像。设备外框仍是视频构图，图像缩放至画面内的屏幕尺寸；系统状态栏不在该原生窗口截图中。另两张 AFTER 图用于核对强调卡与回访。`verify:native` 从实际 Swift 主题读取六个颜色，检查原生 PNG 的尺寸与元数据、记录哈希，并验证深浅两组主题颜色均存在。

## 成片检查

- 19 个屏幕布局检查、42 个关键时刻、72 个画面区域检查均通过；原生素材的 12 个主题颜色检查均通过。
- 2460 帧全片扫描无空白帧；20 个成片解码画面与无损源帧比较通过。
- 16 项声音检查通过：-16 LUFS、无削波、首尾淡出、左右声级平衡、全片主体无意外静音、AAC 保持源母带响度。
- 钢琴版含片尾音源署名，已完整重新渲染，再通过画面一致性与声音检查；旧配乐的局部铃声检查仅用于仍声明铃声的旧曲目，新钢琴曲不含铃声或提示音。
- `qa/reports/` 中的 `*-v020*`、`screen-layout.*`、`encode-fidelity.*`、`audio.*`、`sequence.txt` 与 `score-cues.json` 对应本次交付。
