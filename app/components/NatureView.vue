<script setup lang="ts">
/** Dépense publique par nature économique (salaires, prestations…). Donut + légende, suit l'unité. */
const props = defineProps<{ unit: Unit }>()

const { data } = await useFetch<NaturePayload>('/api/depenses-nature')
const latestYear = computed(() => data.value?.latestYear ?? null)

const { fmt } = useFormat(toRef(props, 'unit'))

const hovered = ref<string | null>(null)

/** Montant d'une composante selon l'unité courante. */
const val = (it: NatureItem): number => (props.unit === 'PC_GDP' ? it.pct : it.eur)
const items = computed<DonutItem[]>(() =>
  (data.value?.items ?? [])
    .map((it) => ({ code: it.key, label: it.label, color: it.color, value: val(it) }))
    .filter((i) => i.value > 0)
    .sort((a, b) => b.value - a.value),
)
const total = computed(() => (props.unit === 'PC_GDP' ? data.value?.total.pct ?? 0 : data.value?.total.eur ?? 0))
</script>

<template>
  <section class="card">
    <div class="card-head">
      <div>
        <h2>À quoi sert l'argent ? <span class="muted">· par nature</span></h2>
        <p class="sub">La même dépense, vue par type plutôt que par fonction · {{ latestYear }}</p>
      </div>
      <span class="src">Eurostat</span>
    </div>

    <div class="grid">
      <ClientOnly>
        <PrismDonut
          :items="items"
          :selected="[]"
          v-model:hovered="hovered"
          :formatter="fmt"
          center-label="Total"
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
          <span class="lg-bar"><i :style="{ width: (it.value / total) * 100 + '%', background: it.color }" /></span>
        </li>
      </ul>
    </div>

    <p class="note">
      Les <strong>prestations sociales</strong> (retraites, santé remboursée, allocations) et les
      <strong>salaires</strong> des agents — profs, soignants, police… — forment l'essentiel : ce sont des
      revenus versés aux ménages, pas de l'argent « consommé » par l'État.
    </p>
  </section>
</template>

<style scoped>
.card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 22px;
  box-shadow: var(--shadow);
  margin-top: 22px;
}
.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}
.card-head h2 {
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  margin: 0;
}
.sub {
  font-size: 0.8rem;
  color: var(--muted);
  margin: 4px 0 0;
  font-weight: 500;
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
  grid-template-columns: auto 1fr auto;
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
.note {
  margin: 18px 0 0;
  font-size: 0.86rem;
  line-height: 1.6;
  color: var(--ink-soft);
  max-width: 760px;
}
.note strong {
  color: var(--ink);
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
