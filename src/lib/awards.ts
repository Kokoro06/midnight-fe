import type { FestivalAward } from './directus'

export const TOP_AWARD_PRIORITY = [
  '金棕櫚獎',
  '金熊獎',
  '金獅獎',
  '最佳劇情長片',
  '最佳影片',
  '評審團大獎',
  '銀熊獎-評審團大獎',
  '銀獅獎-評審團大獎',
  '評審團獎',
  '銀熊獎-最佳導演',
  '銀獅獎-最佳導演',
  '最佳導演',
]

function sortByPriority(a: FestivalAward, b: FestivalAward): number {
  const pa = TOP_AWARD_PRIORITY.indexOf(a.award_category)
  const pb = TOP_AWARD_PRIORITY.indexOf(b.award_category)
  const priorityA = pa === -1 ? 999 : pa
  const priorityB = pb === -1 ? 999 : pb
  if (priorityA !== priorityB) return priorityA - priorityB
  return b.year - a.year
}

export function topAward(awards: FestivalAward[]): FestivalAward | null {
  if (!awards || awards.length === 0) return null
  const won = awards.filter((a) => a.result === 'won')
  const pool = won.length > 0 ? won : awards
  return pool.slice().sort(sortByPriority)[0]
}

export function topAwards(awards: FestivalAward[], max = 3): FestivalAward[] {
  if (!awards || awards.length === 0) return []
  const won = awards.filter((a) => a.result === 'won').slice().sort(sortByPriority)
  if (won.length >= max) return won.slice(0, max)
  const nominated = awards
    .filter((a) => a.result === 'nominated')
    .slice()
    .sort(sortByPriority)
  return [...won, ...nominated.slice(0, max - won.length)]
}
