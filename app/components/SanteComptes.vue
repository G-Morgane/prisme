<script setup lang="ts">
/** Santé — dépense par prestataire (base SHA, tous financeurs). Donut + légende. */
const { data } = await useFetch<SanteComptesPayload>('/api/sante-comptes')
const latestYear = computed(() => data.value?.latestYear ?? null)

const hovered = ref<string | null>(null)

const group = (n: number): string => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
/** Montant (millions €) → libellé en milliards. */
const fmt = (v: number | undefined): string => (v == null ? '—' : `${group(v / 1000)} Md€`)

const valueAt = (pts: Point[], y: number | null): number | undefined =>
  y == null ? undefined : pts.find((p) => p.year === y)?.value

const items = computed<DonutItem[]>(() =>
  (data.value?.providers ?? [])
    .map((p) => ({ code: p.code, label: p.label, color: p.color, value: valueAt(p.points, latestYear.value) }))
    .filter((i): i is DonutItem => typeof i.value === 'number' && i.value > 0)
    .sort((a, b) => b.value - a.value),
)
const total = computed(() => items.value.reduce((s, i) => s + i.value, 0))
</script>

<template>
  <section class="card">
    <div class="card-head">
      <h2>Où va l'argent de la santé <span class="muted">· par prestataire</span></h2>
      <span class="src">DREES · base SHA</span>
    </div>

    <p class="scope">
      Périmètre <strong>tous financeurs</strong> (public + ménages + complémentaires) : ~{{ fmt(total) }}
      en {{ latestYear }}. Plus large que la part <em>publique</em> de la décomposition COFOG ci-dessus.
    </p>

    <div class="grid">
      <ClientOnly>
        <PrismDonut
          :items="items"
          :selected="[]"
          v-model:hovered="hovered"
          :formatter="fmt"
          center-label="Total santé"
          :center-value="total"
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
          <span class="lg-val">{{ fmt(it.value) }}</span>
          <span class="lg-share">{{ ((it.value / total) * 100).toFixed(0) }} %</span>
          <span class="lg-bar"><i :style="{ width: (it.value / total) * 100 + '%', background: it.color }" /></span>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 22px;
  box-shadow: var(--shadow);
  margin-bottom: 22px;
}
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}
.card-head h2 {
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  margin: 0;
}
.muted {
  color: var(--muted);
  font-weight: 600;
}
.src {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--muted);
  background: var(--bg-soft);
  border: 1px solid var(--line);
  padding: 3px 9px;
  border-radius: 99px;
  white-space: nowrap;
}
.scope {
  font-size: 0.84rem;
  color: var(--ink-soft);
  margin: 0 0 18px;
  line-height: 1.5;
  max-width: 720px;
}
.scope strong {
  color: var(--ink);
}

.grid {
  display: grid;
  grid-template-columns: 0.85fr 1fr;
  gap: 22px;
  align-items: center;
}
@media (max-width: 700px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
.legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.legend li {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  grid-template-rows: auto auto;
  column-gap: 9px;
  row-gap: 4px;
  align-items: center;
  padding: 7px 8px;
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
.lg-share {
  font-size: 0.74rem;
  font-weight: 700;
  color: var(--muted);
  grid-row: 1;
  min-width: 34px;
  text-align: right;
}
.lg-bar {
  grid-column: 2 / 5;
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
.ph {
  background: linear-gradient(90deg, var(--bg-soft), #f3f3f7, var(--bg-soft));
  border-radius: 50%;
  aspect-ratio: 1;
  max-width: 240px;
  margin: 0 auto;
  width: 100%;
}
</style>
