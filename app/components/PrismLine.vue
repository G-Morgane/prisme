<script setup lang="ts">
/**
 * Graphe linéaire SVG fait main : une ou plusieurs séries superposées.
 * Aire dégradée si série unique, tooltip multi-séries au survol, axe Y jamais négatif.
 */
const props = defineProps<{
  /** Séries à tracer (`color: null` => dégradé prisme). */
  series: LineSeries[]
  /** Libellé complet d'une valeur (tooltip). */
  formatter: (v: number | undefined) => string
  /** Libellé court d'une valeur (axe Y). */
  shortFmt: (v: number) => string
}>()

const VB_W = 640
const VB_H = 300
const M = { top: 18, right: 18, bottom: 30, left: 50 }
const PW = VB_W - M.left - M.right
const PH = VB_H - M.top - M.bottom

const uid = useId()
const single = computed(() => props.series.length === 1)
const base = computed(() => props.series[0]?.points ?? [])
const n = computed(() => base.value.length)

const bounds = computed(() => {
  const vals = props.series.flatMap((s) => s.points.map((p) => p.value))
  if (!vals.length) return { min: 0, max: 1 }
  let min = Math.min(...vals)
  let max = Math.max(...vals)
  const pad = (max - min || max || 1) * 0.12
  // jamais de minimum négatif (une dépense ne l'est pas) ; sinon on garde un axe « zoomé »
  return { min: Math.max(0, min - pad), max: max + pad }
})

/** Abscisse SVG de l'indice i (réparti sur la largeur du tracé). */
const x = (i: number): number => M.left + (n.value <= 1 ? 0 : (i / (n.value - 1)) * PW)
/** Ordonnée SVG d'une valeur v (selon les bornes calculées). */
const y = (v: number): number => {
  const { min, max } = bounds.value
  return M.top + (1 - (v - min) / (max - min || 1)) * PH
}

const paths = computed(() =>
  props.series.map((s) => {
    const line = s.points.map((p, i) => `${i ? 'L' : 'M'}${x(i)} ${y(p.value)}`).join('')
    const area = `${line}L${x(s.points.length - 1)} ${M.top + PH}L${x(0)} ${M.top + PH}Z`
    return { ...s, line, area, stroke: s.color ?? `url(#stroke-${uid})` }
  }),
)

const ticks = computed(() => {
  const { min, max } = bounds.value
  return Array.from({ length: 4 }, (_, i) => min + ((max - min) * i) / 3)
})

const xLabels = computed(() => {
  if (!n.value) return []
  const step = Math.max(1, Math.ceil(n.value / 6))
  const idx = new Set<number>()
  for (let i = 0; i < n.value; i += step) idx.add(i)
  idx.add(n.value - 1)
  return [...idx].sort((a, b) => a - b).map((i) => ({ i, year: base.value[i]!.year }))
})

// --- survol : on déduit l'indice le plus proche de la position de la souris ---
const svgRef = ref<SVGSVGElement | null>(null)
const hoverIdx = ref<number | null>(null)

function onMove(e: MouseEvent): void {
  const svg = svgRef.value
  if (!svg || n.value === 0) return
  const rect = svg.getBoundingClientRect()
  const sx = ((e.clientX - rect.left) / rect.width) * VB_W // position en coordonnées viewBox
  const i = Math.round(((sx - M.left) / PW) * (n.value - 1))
  hoverIdx.value = Math.max(0, Math.min(n.value - 1, i))
}

const hover = computed(() => {
  if (hoverIdx.value == null || !n.value) return null
  const i = hoverIdx.value
  const year = base.value[i]!.year
  const rows = props.series
    .map((s) => ({ label: s.label, color: s.color ?? '#9b86df', value: s.points[i]?.value }))
    .filter((r): r is { label: string; color: string; value: number } => typeof r.value === 'number')
    .sort((a, b) => b.value - a.value)
    .map((r) => ({ ...r, str: props.formatter(r.value) }))
  const px = x(i)
  // largeur adaptée au contenu (~6.4px par caractère à 11px) pour éviter tout chevauchement
  const CW = 7
  const bodyW = rows.length ? Math.max(...rows.map((r) => r.label.length * CW + r.str.length * CW + 52)) : 60
  const w = Math.min(320, Math.max(150, bodyW))
  const h = 22 + rows.length * 17
  let tx = px + 14
  if (tx + w > VB_W - M.right) tx = px - w - 14
  tx = Math.max(M.left, Math.min(VB_W - M.right - w, tx))
  const ty = Math.max(M.top, Math.min(M.top + PH - h, M.top + 6))
  return { i, px, rows, tx, ty, w, h, year }
})
</script>

<template>
  <svg
    ref="svgRef"
    viewBox="0 0 640 300"
    class="line"
    @mousemove="onMove"
    @mouseleave="hoverIdx = null"
    role="img"
    aria-label="Évolution dans le temps"
  >
    <defs>
      <linearGradient :id="`stroke-${uid}`" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#5cc9e6" />
        <stop offset="0.35" stop-color="#6fa1e8" />
        <stop offset="0.62" stop-color="#9b86df" />
        <stop offset="0.82" stop-color="#ce7ec4" />
        <stop offset="1" stop-color="#ef9a86" />
      </linearGradient>
      <linearGradient :id="`area-${uid}`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" :stop-color="series[0]?.color ?? '#9b86df'" stop-opacity="0.2" />
        <stop offset="1" :stop-color="series[0]?.color ?? '#9b86df'" stop-opacity="0" />
      </linearGradient>
    </defs>

    <!-- grille -->
    <g class="grid">
      <g v-for="(t, i) in ticks" :key="i">
        <line :x1="M.left" :x2="VB_W - M.right" :y1="y(t)" :y2="y(t)" />
        <text :x="M.left - 8" :y="y(t) + 4" text-anchor="end">{{ shortFmt(t) }}</text>
      </g>
    </g>

    <!-- séries -->
    <g v-for="s in paths" :key="s.id">
      <path v-if="single" :d="s.area" :fill="`url(#area-${uid})`" />
      <path :d="s.line" fill="none" :stroke="s.stroke" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
    </g>

    <!-- labels X -->
    <text v-for="l in xLabels" :key="l.i" :x="x(l.i)" :y="VB_H - 8" text-anchor="middle" class="xlab">
      {{ l.year }}
    </text>

    <!-- survol -->
    <g v-if="hover">
      <line :x1="hover.px" :x2="hover.px" :y1="M.top" :y2="M.top + PH" class="cross" />
      <circle
        v-for="s in series"
        :key="s.id"
        v-show="s.points[hover.i]"
        :cx="hover.px"
        :cy="y(s.points[hover.i]?.value ?? 0)"
        r="4"
        :fill="s.color ?? '#9b86df'"
        stroke="#fff"
        stroke-width="2"
      />
      <g :transform="`translate(${hover.tx} ${hover.ty})`">
        <rect :width="hover.w" :height="hover.h" rx="10" class="tip-box" />
        <text x="13" y="17" class="tip-year">{{ hover.year }}</text>
        <g v-for="(r, ri) in hover.rows" :key="ri" :transform="`translate(13 ${30 + ri * 17})`">
          <circle cx="4" cy="-3.5" r="4" :fill="r.color" />
          <text x="15" y="0" class="tip-lab">{{ r.label }}</text>
          <text :x="hover.w - 27" y="0" text-anchor="end" class="tip-val">{{ r.str }}</text>
        </g>
      </g>
    </g>
  </svg>
</template>

<style scoped>
.line {
  width: 100%;
  height: auto;
  display: block;
}
.grid line {
  stroke: var(--line);
  stroke-width: 1;
}
.grid text {
  font-size: 13px;
  font-weight: 600;
  fill: var(--ink-soft);
}
.xlab {
  font-size: 13px;
  font-weight: 600;
  fill: var(--ink-soft);
}
.cross {
  stroke: var(--line-strong);
  stroke-width: 1;
  stroke-dasharray: 3 3;
}
.tip-box {
  fill: #fff;
  stroke: var(--line-strong);
  filter: drop-shadow(0 6px 16px rgba(23, 23, 31, 0.12));
}
.tip-year {
  font-size: 11px;
  font-weight: 700;
  fill: var(--ink-soft);
}
.tip-lab {
  font-size: 11px;
  font-weight: 600;
  fill: var(--ink);
}
.tip-val {
  font-size: 11px;
  font-weight: 800;
  fill: var(--ink);
}
</style>
