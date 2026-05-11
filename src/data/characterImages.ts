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

export function characterImageUrl(key: ResultKey): string {
  return CHARACTER_IMAGES[key] ?? CHARACTER_IMAGE_FALLBACK;
}
