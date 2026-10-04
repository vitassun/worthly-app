/** Region checks for the revised storyboard. Checks the actual rendered pixels. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { decodePng } from "./lib/png.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const index = process.argv.indexOf("--dir");
const dir = path.resolve(root, index >= 0 ? process.argv[index + 1] : "qa/frames-v020");
const manifest = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf8"));
const results = [];
function count(png, bounds, predicate) {
  let n = 0;
  for(let y = bounds[1]; y < bounds[3]; y++) for(let x = bounds[0]; x < bounds[2]; x++) {
    const i = (y * png.width + x) * 3;
    if(predicate(...png.data.subarray(i, i + 3))) n++;
  }
  return n;
}
const ink = (r,g,b) => Math.max(Math.abs(r-239), Math.abs(g-234), Math.abs(b-224)) > 25;
const orange = (r,g,b) => r > 150 && r-g > 30 && g-b > 12;
function check(png, file, label, box, min, predicate = ink) {
  const pixels = count(png, box, predicate);
  results.push({ file, label, pixels, min, pass: pixels >= min });
}
for(const entry of manifest.frames) {
  const png = decodePng(fs.readFileSync(path.join(root, entry.file)));
  const file = path.basename(entry.file);
  check(png, file, "演示数据与界面重绘说明", [150,1030,1000,1060], 100);
  check(png, file, "主标题可见", [150,180,1180,680], 1500);
  if([9,21,25,38,42,46,50,52,72,76.5].includes(entry.time)) {
    check(png, file, "完整设备与屏幕", [1280,35,1770,1048], 10000);
    check(png, file, "屏幕导航标题", [1400,115,1700,180], 60);
  }
  if(entry.time === 25) check(png,file,"已经买了开关",[1650,745,1730,800],300,orange);
  if(entry.time === 33.5) for(const y of [326,544,762]) check(png,file,"阶段回访及感受",[150,y,1770,y+195],1200);
  if(entry.time === 56) check(png,file,"买前与买后洞察",[900,290,1690,800],50000);
  if(entry.time === 62) for(const y of [370,565,760]) check(png,file,"长期规律指标",[150,y,1770,y+170],2000);
  if(entry.time === 76.5) check(png,file,"深色强调卡文字",[1310,915,1735,990],100);
  if(entry.time === 80) check(png,file,"钢琴采样署名与许可",[1060,930,1770,1015],1500);
}
const failed = results.filter(r => !r.pass);
console.log(`${results.length} region checks · ${failed.length} failed`);
for(const r of failed) console.log(`FAIL ${r.file} ${r.label}: ${r.pixels} < ${r.min}`);
fs.mkdirSync(path.join(root,"qa/reports"),{recursive:true});
fs.writeFileSync(path.join(root,"qa/reports/probes-v020.json"),JSON.stringify(results,null,2)+"\n");
process.exitCode = failed.length || !results.length ? 1 : 0;
