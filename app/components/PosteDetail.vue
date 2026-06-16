<script setup lang="ts">
/**
 * Bloc « détail » d'un poste : à gauche la répartition de ses sous-fonctions (donut + légende),
 * à droite leur évolution dans le temps. Autonome (gère son propre survol).
 */
import { COFOG_DEFS } from '~/utils/glossary'

const props = defineProps<{
  node: CofogFunction
  unit: Unit
  latestYear: number | null
  formatter: (v: number | undefined) => string
  shortFmt: (v: number) => string
}>()

const valueAt = (pts: Point[], year: number | null): number | undefined =>
  year == null ? undefined : pts.find((p) => p.year === year)?.value

const hovered = ref<string | null>(null)

/** Sous-fonctions (valeur > 0), triées par poids et colorées le long du spectre. */
const items = computed<DonutItem[]>(() => {
  const rows = props.node.children
    .map((n) => ({ code: n.code, label: n.label, value: valueAt(n.series[props.unit], props.latestYear) }))
    .filter((i): i is { code: string; label: string; value: number } => typeof i.value === 'number' && i.value > 0)
    .sort((a, b) => b.value - a.value)
  return rows.map((it, i) => ({ ...it, color: PRISM_RAMP[i % PRISM_RAMP.length]! }))
})
const itemsTotal = computed(() => items.value.reduce((s, i) => s + i.value, 0))
const center = computed(() => valueAt(props.node.series[props.unit], props.latestYear))

const childByCode = computed<Record<string, CofogNode>>(() =>
  Object.fromEntries(props.node.children.map((c) => [c.code, c])),
)
const lineSeries = computed<LineSeries[]>(() =>
  items.value.map((it) => ({
    id: it.code,
    label: it.label,
    color: it.color,
    points: childByCode.value[it.code]!.series[props.unit],
  })),
)

// Explication sous le graphe : sous-fonction survolée, sinon le poste lui-même.
const hoveredItem = computed(() => (hovered.value ? items.value.find((i) => i.code === hovered.value) ?? null : null))
const explainLabel = computed(() => hoveredItem.value?.label ?? props.node.label)
const explainDef = computed(() => COFOG_DEFS[hoveredItem.value?.code ?? props.node.code] ?? '')
const explainColor = computed(() => hoveredItem.value?.color ?? '#9b86df')
</script>

<template>
  <div class="detail-body">
    <div class="detail-grid">
      <div class="left">
        <ClientOnly>
          <PrismDonut
            :items="items"
            :selected="[]"
            v-model:hovered="hovered"
            :formatter="formatter"
            :center-label="node.label"
            :center-value="center ?? itemsTotal"
            @toggle="() => {}"
          />
          <template #fallback><div class="ph donut-ph" /></template>
        </ClientOnly>
        <ul class="legend">
          <li
            v-for="it in items"
            :key="it.code"
            :class="{ hl: hovered === it.code }"
            @mouseenter="hovered = it.code"
            @mouseleave="hovered = null"
          >
            <span class="chip" :style="{ background: it.color }" />
            <span class="lg-label">{{ it.label }}</span>
            <span class="lg-val">{{ formatter(it.value) }}</span>
            <span class="lg-bar"><i :style="{ width: (it.value / itemsTotal) * 100 + '%', background: it.color }" /></span>
          </li>
        </ul>
      </div>

      <div class="right">
        <ClientOnly>
          <PrismLine :series="lineSeries" :formatter="formatter" :short-fmt="shortFmt" />
          <template #fallback><div class="ph line-ph" /></template>
        </ClientOnly>
      </div>
    </div>

    <div class="explain">
      <span class="ex-dot" :style="{ background: explainColor }" />
      <p><strong>{{ explainLabel }}</strong> — {{ explainDef }}</p>
    </div>
  </div>
</template>

<style scoped>
.detail-grid {
  display: grid;
  grid-template-columns: 0.95fr 1fr;
  gap: 22px;
  align-items: center;
}
@media (max-width: 820px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
.legend {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.legend li {
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-rows: auto auto;
  column-gap: 9px;
  row-gap: 4px;
  align-items: center;
  padding: 6px 8px;
  border-radius: 9px;
  transition: background 0.14s ease;
}
.legend li.hl {
  background: var(--bg-soft);
}
.chip {
  width: 11px;
  height: 11px;
  border-radius: 3px;
  grid-row: 1;
}
.lg-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--ink);
  grid-row: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lg-val {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--ink-soft);
  grid-row: 1;
  white-space: nowrap;
}
.lg-bar {
  grid-column: 2 / 4;
  grid-row: 2;
  height: 3px;
  border-radius: 2px;
  background: var(--line);
  overflow: hidden;
}
.lg-bar i {
  display: block;
  height: 100%;
  border-radius: 2px;
}
.explain {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin-top: 18px;
  padding: 12px 14px;
  background: var(--bg-soft);
  border: 1px solid var(--line);
  border-radius: 12px;
}
.ex-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex: none;
  margin-top: 5px;
}
.explain p {
  margin: 0;
  font-size: 0.86rem;
  line-height: 1.5;
  color: var(--ink-soft);
}
.explain strong {
  color: var(--ink);
  font-weight: 800;
}

.ph {
  background: linear-gradient(90deg, var(--bg-soft), #f3f3f7, var(--bg-soft));
  border-radius: 12px;
}
.donut-ph {
  width: 100%;
  aspect-ratio: 1;
  max-width: 240px;
  border-radius: 50%;
  margin: 0 auto;
}
.line-ph {
  width: 100%;
  height: 220px;
}
</style>
