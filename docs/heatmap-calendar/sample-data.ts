import type { HeatmapDatum } from '@/registry/ikui/heatmap-calendar'

/** Fixed end date so the grid is deterministic across server/client renders. */
export const END_DATE = new Date(2026, 5, 1)

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Deterministic ~1 year of activity, skewed toward quiet days with bursts. */
export const activity: HeatmapDatum[] = (() => {
  const rand = mulberry32(42)
  const out: HeatmapDatum[] = []
  for (let i = 0; i < 365; i++) {
    const d = new Date(END_DATE)
    d.setDate(d.getDate() - i)
    const r = rand()
    const value = r < 0.45 ? 0 : Math.round(r * r * 14)
    if (value > 0) {
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      out.push({ date: `${d.getFullYear()}-${m}-${day}`, value })
    }
  }
  return out
})()
