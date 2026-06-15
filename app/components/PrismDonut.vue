<script setup lang="ts">
interface Item { code: string; label: string; value: number; color: string }

const props = defineProps<{
  items: Item[]
  selected: string[]
  hovered: string | null
  formatter: (v: number | undefined) => string
  centerLabel: string
  centerValue: number
}>()
const emit = defineEmits<{ toggle: [v: string]; 'update:hovered': [v: string | null] }>()

const CX = 110
const CY = 110
const R_OUT = 96
const R_IN = 61
const PAD = 0.022

const point = (r: number, a: number) => [CX + r * Math.sin(a), CY - r * Math.cos(a)]

const total = computed(() => props.items.reduce((s, i) => s + i.value, 0))

const slices = computed(() => {
  const t = total.value
  const out: { code: string; label: string; value: number; color: string; d: string; mid: number }[] = []
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
    const d = `M${osx} ${osy}A${R_OUT} ${R_OUT} 0 ${large} 1 ${oex} ${oey}L${iex} ${iey}A${R_IN} ${R_IN} 0 ${large} 0 ${isx} ${isy}Z`
    out.push({ code: it.code, label: it.label, value: it.value, color: it.color, d, mid: (a0 + a1) / 2 })
  }
  return out
})

// Parts mises en avant : survol prioritaire, sinon la sélection.
const activeCodes = computed<string[]>(() => {
  if (props.hovered) return [props.hovered]
  return props.selected
})
const isActive = (code: string) => activeCodes.value.length === 0 || activeCodes.value.includes(code)
const isPopped = (code: string) => props.hovered === code || props.selected.includes(code)

function offset(mid: number, on: boolean) {
  if (!on) return ''
  return `translate(${Math.sin(mid) * 5} ${-Math.cos(mid) * 5})`
}

const display = computed(() => {
  const t = total.value
  if (props.hovered) {
    const it = props.items.find((i) => i.code === props.hovered)
    if (it) return { value: props.formatter(it.value), label: it.label, pct: t ? (it.value / t) * 100 : null }
  }
  const sel = props.selected
  if (sel.length === 1) {
    const it = props.items.find((i) => i.code === sel[0])
    if (it) return { value: props.formatter(it.value), label: it.label, pct: t ? (it.value / t) * 100 : null }
  }
  if (sel.length > 1) {
    const sum = props.items.filter((i) => sel.includes(i.code)).reduce((s, i) => s + i.value, 0)
    return { value: props.formatter(sum), label: `${sel.length} postes`, pct: t ? (sum / t) * 100 : null }
  }
  return { value: props.formatter(props.centerValue), label: props.centerLabel, pct: null as number | null }
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
