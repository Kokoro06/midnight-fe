import type { ResultKey } from "./quizData";

// 八種角色對應的圖片路徑（相對於 public/）
// 之後想換圖只要：
//   1. 把新圖丟進 public/img/，檔名照著對應 key 命名
//   2. 或直接修改下方對應表的路徑
export const CHARACTER_IMAGES: Record<ResultKey, string> = {
  A: "img/character-A.png", // 深夜燈塔者
  B: "img/character-B.png", // 暗室捕夢人
  C: "img/character-C.png", // 廢墟考古家
  D: "img/character-D.png", // 燒腦追光者
  E: "img/character-E.png", // 療癒放映師
  F: "img/character-F.png", // 情緒縱火犯
  G: "img/character-G.png", // 線索共謀者
  H: "img/character-H.png", // 邪典探險家
};

// 圖片載入失敗時的備用圖
export const CHARACTER_IMAGE_FALLBACK = "img/character.png";

// Cache-busting version：Caddyfile 對 *.png 套 immutable 30 天 cache，
// 圖檔內容更新時 bump 此版本號讓行動裝置重抓
const CHARACTER_IMAGE_VERSION = "2";

export function characterImageUrl(key: ResultKey): string {
  const path = CHARACTER_IMAGES[key] ?? CHARACTER_IMAGE_FALLBACK;
  return `${path}?v=${CHARACTER_IMAGE_VERSION}`;
}
