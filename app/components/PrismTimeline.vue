<script setup lang="ts">
/**
 * Frise des présidents de la République, alignée sur l'axe X de PrismLine
 * (mêmes marges + viewBox), pour relier l'évolution des dépenses au mandat en cours.
 */
const props = defineProps<{ firstYear: number; lastYear: number }>()

const VB_W = 640
const M = { left: 50, right: 18 }
const PW = VB_W - M.left - M.right

/** Un mandat présidentiel (bornes en années décimales, mi-mai ≈ .37). */
interface Mandate {
  name: string
  start: number
  end: number
  color: string
}
const PRESIDENTS: Mandate[] = [
  { name: 'Chirac', start: 1995.0, end: 2007.37, color: '#7C98C9' },
  { name: 'Sarkozy', start: 2007.37, end: 2012.37, color: '#5AA6E6' },
  { name: 'Hollande', start: 2012.37, end: 2017.37, color: '#E586A2' },
  { name: 'Macron', start: 2017.37, end: 2025.0, color: '#9B86DF' },
]

/** Abscisse SVG d'une année (bornée au cadre du graphe). */
const x = (year: number): number => {
  const span = props.lastYear - props.firstYear || 1
  const clamped = Math.max(props.firstYear, Math.min(props.lastYear, year))
  return M.left + ((clamped - props.firstYear) / span) * PW
}

/** Un segment de frise prêt à dessiner. */
interface Segment {
  name: string
  color: string
  x0: number
  w: number
  cx: number
  years: string
  wide: boolean
}
const segments = computed<Segment[]>(() =>
  PRESIDENTS.map((p) => {
    const x0 = x(p.start)
    const w = x(p.end) - x0
    return {
      name: p.name,
      color: p.color,
      x0,
      w,
      cx: x0 + w / 2,
      years: `${Math.round(Math.max(p.start, props.firstYear))}–${Math.round(Math.min(p.end, props.lastYear))}`,
      wide: w > 64, // assez large pour afficher les années sous le nom
    }
  }).filter((s) => s.w > 2),
)
</script>

<template>
  <svg viewBox="0 0 640 46" class="frise" role="img" aria-label="Présidents de la République sur la période">
    <g v-for="s in segments" :key="s.name">
      <rect :x="s.x0 + 1" y="6" :width="Math.max(0, s.w - 2)" height="34" rx="8" :fill="s.color" />
      <text :x="s.cx" y="21" text-anchor="middle" class="name">{{ s.name }}</text>
      <text v-if="s.wide" :x="s.cx" y="33" text-anchor="middle" class="years">{{ s.years }}</text>
    </g>
  </svg>
</template>

<style scoped>
.frise {
  width: 100%;
  height: auto;
  display: block;
}
.name {
  font-size: 12px;
  font-weight: 700;
  fill: #fff;
}
.years {
  font-size: 9.5px;
  font-weight: 600;
  fill: rgba(255, 255, 255, 0.85);
}
</style>
