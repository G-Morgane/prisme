<script setup lang="ts">
/** Collectivités locales (S1313) — dépenses par fonction COFOG. Donut + légende. */
const { data } = await useFetch<CollectivitesPayload>('/api/collectivites')

const hovered = ref<string | null>(null)
const group = (n: number): string => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
const md = (e: number | undefined): string => (e == null ? '—' : `${group(e / 1000)} Md€`)

const year = computed(() => data.value?.latestYear ?? null)
const total = computed(() => data.value?.totalEur ?? 0)
const items = computed<DonutItem[]>(() =>
  (data.value?.items ?? []).map((it, i) => ({
    code: it.code,
    label: it.label,
    value: it.eur,
    color: PRISM_RAMP[i % PRISM_RAMP.length]!,
  })),
)

useHead({ title: 'Prisme — collectivités locales' })
</script>

<template>
  <main class="wrap">
    <NuxtLink to="/" class="back">‹ Tableau de bord</NuxtLink>

    <section class="hero">
      <p class="eyebrow">Administrations publiques locales · {{ year }}</p>
      <h1>Les <span class="prism-text">collectivités locales</span></h1>
      <p class="lede">
        Communes, départements et régions : leurs dépenses par fonction. La 3ᵉ sphère publique, après
        l'État et la Sécurité sociale.
      </p>
    </section>

    <section class="kpi-row">
      <div class="kpi">
        <div class="kpi-val prism-text">{{ md(total) }}</div>
        <div class="kpi-sub">dépense des collectivités · {{ year }}</div>
      </div>
    </section>

    <section class="card">
      <div class="card-head">
        <h2>Dépenses par fonction <span class="muted">· COFOG</span></h2>
        <span class="src">Eurostat</span>
      </div>
      <div class="grid">
        <ClientOnly>
          <PrismDonut
            :items="items"
            :selected="[]"
            v-model:hovered="hovered"
            :formatter="md"
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
            <span class="lbl">{{ it.label }}</span>
            <span class="val">{{ md(it.value) }}</span>
          </li>
        </ul>
      </div>
      <p class="note">
        Les collectivités pèsent surtout sur les <strong>affaires économiques</strong> (transports, voirie),
        l'<strong>enseignement</strong> (bâtiments des écoles, collèges, lycées), le <strong>social</strong>
        et l'aménagement — des compétences de proximité.
      </p>
    </section>

    <footer class="foot">
      Source : Eurostat <code>GOV_10A_EXP</code>, secteur S1313 (APU locales) via DBnomics.
    </footer>
  </main>
</template>

<style scoped>
.back {
  display: inline-block;
  margin-top: 28px;
  color: var(--muted);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
}
.back:hover {
  color: var(--ink);
}
.hero {
  padding: 14px 0 8px;
  max-width: 640px;
}
.eyebrow {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 0 0 12px;
}
.hero h1 {
  font-size: clamp(2rem, 5vw, 2.8rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  margin: 0 0 14px;
}
.lede {
  font-size: 1.02rem;
  color: var(--ink-soft);
  margin: 0;
}
.kpi-row {
  margin: 26px 0 22px;
}
.kpi-val {
  font-size: clamp(2.2rem, 6vw, 3rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1;
}
.kpi-sub {
  font-size: 0.9rem;
  color: var(--ink-soft);
  margin-top: 8px;
  font-weight: 500;
}
.card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 22px;
  box-shadow: var(--shadow);
}
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
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
  align-items: center;
  gap: 10px;
  padding: 8px;
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
}
.lbl {
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--ink);
}
.val {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--ink-soft);
  white-space: nowrap;
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
.foot {
  margin-top: 22px;
  font-size: 0.8rem;
  color: var(--muted);
}
.foot code {
  background: var(--bg-soft);
  border: 1px solid var(--line);
  padding: 0 5px;
  border-radius: 5px;
}
</style>
