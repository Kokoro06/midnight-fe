const KEY = 'mm.seen-movies.v1'
const TTL_MS = 7 * 24 * 60 * 60 * 1000

type SeenMap = Record<string, number>

function readMap(): SeenMap {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as SeenMap) : {}
  } catch {
    return {}
  }
}

function writeMap(m: SeenMap): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(m))
  } catch {
    // quota full or storage disabled — fail silently
  }
}

export function loadSeen(now: number = Date.now()): Map<string, number> {
  const map = readMap()
  const result = new Map<string, number>()
  for (const [id, ts] of Object.entries(map)) {
    if (now - ts < TTL_MS) result.set(id, ts)
  }
  return result
}

export function markSeen(ids: string[], now: number = Date.now()): void {
  const map = readMap()
  for (const id of Object.keys(map)) {
    if (now - map[id] >= TTL_MS) delete map[id]
  }
  for (const id of ids) map[id] = now
  writeMap(map)
}

// 階梯式衰減：剛看過扣最多，超過 7 天歸零
// 數值需大於典型 score 變動（top score ~6-8），才能真的把已看過的片擠出 top pool
export function seenPenalty(lastSeen: number | undefined, now: number = Date.now()): number {
  if (!lastSeen) return 0
  const age = now - lastSeen
  if (age < 60 * 60 * 1000) return 3.0           // 1 小時內
  if (age < 24 * 60 * 60 * 1000) return 1.5      // 1 天內
  if (age < 3 * 24 * 60 * 60 * 1000) return 0.7  // 3 天內
  if (age < TTL_MS) return 0.2                   // 7 天內
  return 0
}
