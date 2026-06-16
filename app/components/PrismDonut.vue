<script setup lang="ts">
/**
 * Donut SVG fait main : une part par item, avec survol/sélection.
 * Mise en avant : la part survolée prime, sinon les parts sélectionnées.
 * Le centre affiche le détail de la part active, ou le total fourni.
 */
const props = defineProps<{
  items: DonutItem[]
  /** Codes sélectionnés (mis en avant). */
  selected: string[]
  /** Code survolé (v-model:hovered). */
  hovered: string | null
  /** Formate une valeur pour l'affichage central. */
  formatter: (v: number | undefined) => string
  /** Libellé du centre quand rien n'est actif. */
  centerLabel: string
  /** Valeur du centre quand rien n'est actif. */
  centerValue: number
}>()
const emit = defineEmits<{ toggle: [code: string]; 'update:hovered': [code: string | null] }>()

// Géométrie du donut (repère SVG 220×220).
const CX = 110
const CY = 110
const R_OUT = 96
const R_IN = 61
const PAD = 0.022 // espace angulaire entre parts (rad)

/** Point sur un cercle de rayon r à l'angle a (0 = haut, sens horaire). */
const point = (r: number, a: number): [number, number] => [CX + r * Math.sin(a), CY - r * Math.cos(a)]

/** Une part calculée, prête à dessiner. */
interface Slice {
  code: string
  label: string
  value: number
  color: string
  d: string
  mid: number
}

const total = computed(() => props.items.reduce((sum, i) => sum + i.value, 0))

const slices = computed<Slice[]>(() => {
  const t = total.value
  const out: Slice[] = []
  let a = 0
  for (const it of props.items) {
    const frac = t ? it.value / t : 0
    const a0 = a + PAD / 2
    const a1 = a + frac * 2 * Math.PI - PAD / 2
    a += frac * 2 * Math.PI
    if (a1 <= a0) continue
    const large = a1 - a0 > Math.PI ? 1 : 0
    const [osx, osy] = point(R_OUT, a0)
    const [oex, oey] = point(R_OUT, a1)
    const [iex, iey] = point(R_IN, a1)
    const [isx, isy] = point(R_IN, a0)
    // Anneau : arc extérieur (sens horaire) puis retour par l'arc intérieur.
    const d = `M${osx} ${osy}A${R_OUT} ${R_OUT} 0 ${large} 1 ${oex} ${oey}L${iex} ${iey}A${R_IN} ${R_IN} 0 ${large} 0 ${isx} ${isy}Z`
    out.push({ code: it.code, label: it.label, value: it.value, color: it.color, d, mid: (a0 + a1) / 2 })
  }
  return out
})

// Parts mises en avant : survol prioritaire, sinon la sélection.
const activeCodes = computed<string[]>(() => (props.hovered ? [props.hovered] : props.selected))
const isActive = (code: string): boolean => activeCodes.value.length === 0 || activeCodes.value.includes(code)
const isPopped = (code: string): boolean => props.hovered === code || props.selected.includes(code)

/** Léger décalage radial d'une part mise en avant. */
const offset = (mid: number, on: boolean): string =>
  on ? `translate(${Math.sin(mid) * 5} ${-Math.cos(mid) * 5})` : ''

/** Contenu affiché au centre du donut. */
interface CenterDisplay {
  value: string
  label: string
  pct: number | null
}
const display = computed<CenterDisplay>(() => {
  const t = total.value
  const pctOf = (v: number): number | null => (t ? (v / t) * 100 : null)

  // 1. Survol → la part survolée.
  if (props.hovered) {
    const it = props.items.find((i) => i.code === props.hovered)
    if (it) return { value: props.formatter(it.value), label: it.label, pct: pctOf(it.value) }
  }
  // 2. Une seule sélection → cette part.
  if (props.selected.length === 1) {
    const it = props.items.find((i) => i.code === props.selected[0])
    if (it) return { value: props.formatter(it.value), label: it.label, pct: pctOf(it.value) }
  }
  // 3. Plusieurs sélections → leur somme.
  if (props.selected.length > 1) {
    const sum = props.items.filter((i) => props.selected.includes(i.code)).reduce((s, i) => s + i.value, 0)
    return { value: props.formatter(sum), label: `${props.selected.length} postes`, pct: pctOf(sum) }
  }
  // 4. Sinon → le total fourni.
  return { value: props.formatter(props.centerValue), label: props.centerLabel, pct: null }
})
</script>

<template>
  <svg viewBox="0 0 220 220" class="donut" role="img" aria-label="Répartition des dépenses par poste">
    <g
      v-for="s in slices"
      :key="s.code"
      class="slice"
      :class="{ dim: !isActive(s.code) }"
      :transform="offset(s.mid, isPopped(s.code))"
      @mouseenter="emit('update:hovered', s.code)"
      @mouseleave="emit('update:hovered', null)"
      @click="emit('toggle', s.code)"
    >
      <path :d="s.d" :fill="s.color" />
    </g>

    <text :x="CX" :y="CY - 6" text-anchor="middle" class="c-value">{{ display.value }}</text>
    <text :x="CX" :y="CY + 14" text-anchor="middle" class="c-label">{{ display.label }}</text>
    <text v-if="display.pct != null" :x="CX" :y="CY + 30" text-anchor="middle" class="c-pct">
      {{ display.pct.toFixed(1).replace('.', ',') }} % du total
    </text>
  </svg>
</template>

<style scoped>
.donut {
  width: 100%;
  height: auto;
  max-width: 320px;
  display: block;
  margin: 0 auto;
}
.slice {
  cursor: pointer;
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}
.slice path {
  transition: filter 0.18s ease;
}
.slice.dim {
  opacity: 0.28;
}
.slice:hover path {
  filter: saturate(1.08);
}
.c-value {
  font-size: 19px;
  font-weight: 800;
  fill: var(--ink);
  letter-spacing: -0.02em;
}
.c-label {
  font-size: 9.5px;
  font-weight: 600;
  fill: var(--ink-soft);
}
.c-pct {
  font-size: 8.5px;
  font-weight: 500;
  fill: var(--muted);
}
</style>
