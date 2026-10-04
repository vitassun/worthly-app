/** One source of truth for the revised product film. */
export const FPS = 30;
export interface SceneTiming { id: string; title: string; from: number; durationInFrames: number }
const chapters: [string, string, number][] = [
  ["opening", "很想要，就代表值得？", 3.5],
  ["thesis", "买前的期待，买后的体验", 2.5],
  ["before", "轻量记录想要", 6],
  ["wait", "7 天后再看想要", 4],
  ["decide", "买了或没买，都留在记忆里", 3],
  ["purchase", "真实价格与差价", 4],
  ["past", "补录已经买过的东西", 4],
  ["time", "7 / 30 / 90 天回访", 8],
  ["queue", "完整待回访列表", 5],
  ["anytime", "随时记录现在的感觉", 4],
  ["correction", "更正或删除已有回访", 4],
  ["zoomout", "搜索和筛选消费记忆", 5],
  ["insight", "买前想要与后来满意", 5],
  ["patterns", "折扣、类别与长期购买记忆", 6],
  ["philosophy", "样本足够，才出现洞察", 4],
  ["privacy", "本地保存、导出与可选提醒", 6],
  ["appearance", "随系统切换深浅外观", 4],
  ["end", "Worthly / 值不值", 4],
];
let cursor = 0;
export const SCENES: SceneTiming[] = chapters.map(([id, title, seconds]) => {
  const scene = { id, title, from: cursor, durationInFrames: Math.round(seconds * FPS) };
  cursor += scene.durationInFrames;
  return scene;
});
export const TOTAL_FRAMES = cursor;
export const sceneById = (id: string): SceneTiming => {
  const scene = SCENES.find((entry) => entry.id === id);
  if (!scene) throw new Error('Unknown scene: ' + id);
  return scene;
};
export const toSeconds = (frames: number): number => frames / FPS;
export const sceneSeconds = (id: string, frame: number): number => (sceneById(id).from + frame) / FPS;
export const REVIEW_ROW_FRAMES = [20, 80, 140] as const;
