import { describe, it, expect } from 'vitest'
import { topAward, topAwards, TOP_AWARD_PRIORITY } from '../awards'
import type { FestivalAward } from '../directus'

function makeAward(
  id: string,
  award_category: string,
  result: 'won' | 'nominated',
  year = 2020,
  festival = 'Cannes',
): FestivalAward {
  return {
    id,
    festival,
    year,
    edition: null,
    award_category,
    result,
  }
}

describe('topAwards()', () => {
  it('空陣列 → 回傳 []', () => {
    expect(topAwards([])).toEqual([])
  })

  it('null/undefined → 回傳 []', () => {
    // @ts-expect-error 測試容錯
    expect(topAwards(null)).toEqual([])
    // @ts-expect-error 測試容錯
    expect(topAwards(undefined)).toEqual([])
  })

  it('5 個 won → 取前 3 個，priority 高的在前', () => {
    const awards: FestivalAward[] = [
      makeAward('1', '最佳導演', 'won'),
      makeAward('2', '金棕櫚獎', 'won'),
      makeAward('3', '評審團獎', 'won'),
      makeAward('4', '金熊獎', 'won'),
      makeAward('5', '最佳影片', 'won'),
    ]
    const result = topAwards(awards, 3)
    expect(result).toHaveLength(3)
    expect(result[0].award_category).toBe('金棕櫚獎')
    expect(result[1].award_category).toBe('金熊獎')
    expect(result[2].award_category).toBe('最佳影片')
  })

  it('1 個 won + 4 個 nominated → 結果 [won, nominated, nominated]，won 永遠在最前', () => {
    const awards: FestivalAward[] = [
      makeAward('w1', '最佳導演', 'won'),
      makeAward('n1', '金棕櫚獎', 'nominated'),
      makeAward('n2', '金熊獎', 'nominated'),
      makeAward('n3', '評審團獎', 'nominated'),
      makeAward('n4', '最佳影片', 'nominated'),
    ]
    const result = topAwards(awards, 3)
    expect(result).toHaveLength(3)
    expect(result[0].result).toBe('won')
    expect(result[0].award_category).toBe('最佳導演')
    expect(result[1].result).toBe('nominated')
    expect(result[2].result).toBe('nominated')
    // 補上來的 nominated 應該是 priority 高的（金棕櫚獎 > 金熊獎）
    expect(result[1].award_category).toBe('金棕櫚獎')
    expect(result[2].award_category).toBe('金熊獎')
  })

  it('0 個 won、4 個 nominated → 取 3 個 nominated，按 priority 排序', () => {
    const awards: FestivalAward[] = [
      makeAward('n1', '最佳導演', 'nominated'),
      makeAward('n2', '金棕櫚獎', 'nominated'),
      makeAward('n3', '評審團大獎', 'nominated'),
      makeAward('n4', '金獅獎', 'nominated'),
    ]
    const result = topAwards(awards, 3)
    expect(result).toHaveLength(3)
    expect(result.every((a) => a.result === 'nominated')).toBe(true)
    expect(result[0].award_category).toBe('金棕櫚獎')
    expect(result[1].award_category).toBe('金獅獎')
    expect(result[2].award_category).toBe('評審團大獎')
  })

  it('1 個 won、0 個 nominated（max=3）→ 只回 1 個', () => {
    const awards: FestivalAward[] = [makeAward('w1', '金棕櫚獎', 'won')]
    const result = topAwards(awards, 3)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('w1')
  })

  it('同 priority 不同 year → 較新的 year 在前', () => {
    const awards: FestivalAward[] = [
      makeAward('a', '金棕櫚獎', 'won', 2010),
      makeAward('b', '金棕櫚獎', 'won', 2023),
      makeAward('c', '金棕櫚獎', 'won', 2018),
    ]
    const result = topAwards(awards, 3)
    expect(result[0].year).toBe(2023)
    expect(result[1].year).toBe(2018)
    expect(result[2].year).toBe(2010)
  })

  it('award_category 不在 TOP_AWARD_PRIORITY 表內 → 排到最後（priority = 999）', () => {
    const awards: FestivalAward[] = [
      makeAward('unknown', '某個沒在表內的獎', 'won'),
      makeAward('cannes', '金棕櫚獎', 'won'),
    ]
    const result = topAwards(awards, 3)
    expect(result[0].award_category).toBe('金棕櫚獎')
    expect(result[1].award_category).toBe('某個沒在表內的獎')
  })

  it('max=1 → 只回 1 個，且行為與 topAward() 對齊', () => {
    const awards: FestivalAward[] = [
      makeAward('1', '最佳導演', 'won'),
      makeAward('2', '金棕櫚獎', 'won'),
      makeAward('3', '評審團獎', 'won'),
    ]
    const resultMulti = topAwards(awards, 1)
    const resultSingle = topAward(awards)
    expect(resultMulti).toHaveLength(1)
    expect(resultMulti[0].id).toBe(resultSingle?.id)
    expect(resultMulti[0].award_category).toBe('金棕櫚獎')
  })

  it('TOP_AWARD_PRIORITY 是非空陣列且包含金棕櫚獎', () => {
    expect(TOP_AWARD_PRIORITY.length).toBeGreaterThan(0)
    expect(TOP_AWARD_PRIORITY[0]).toBe('金棕櫚獎')
  })
})

describe('topAward()', () => {
  it('空陣列 → null', () => {
    expect(topAward([])).toBeNull()
  })

  it('null → null', () => {
    // @ts-expect-error 測試容錯
    expect(topAward(null)).toBeNull()
  })

  it('有 won 時，取 won 中 priority 最高的', () => {
    const awards: FestivalAward[] = [
      makeAward('won-low', '最佳導演', 'won'),
      makeAward('won-high', '金棕櫚獎', 'won'),
      makeAward('nom-highest', '金棕櫚獎', 'nominated', 2024),
    ]
    const result = topAward(awards)
    expect(result?.id).toBe('won-high')
    expect(result?.result).toBe('won')
  })

  it('全 nominated 時，從整池取 priority 最高的（舊邏輯保留）', () => {
    const awards: FestivalAward[] = [
      makeAward('n1', '最佳導演', 'nominated'),
      makeAward('n2', '金棕櫚獎', 'nominated'),
      makeAward('n3', '評審團獎', 'nominated'),
    ]
    const result = topAward(awards)
    expect(result?.id).toBe('n2')
    expect(result?.award_category).toBe('金棕櫚獎')
  })

  it('won 之間用 year 做 tie-break：新 year 在前', () => {
    const awards: FestivalAward[] = [
      makeAward('old', '金棕櫚獎', 'won', 2000),
      makeAward('new', '金棕櫚獎', 'won', 2020),
    ]
    const result = topAward(awards)
    expect(result?.id).toBe('new')
  })
})
