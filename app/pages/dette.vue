<script setup lang="ts">
/** Dette publique : trajectoire (% PIB) + charge de la dette (intérêts, % PIB). */
const { data } = await useFetch<DettePayload>('/api/dette')

const pctFmt = (v: number | undefined): string => (v == null ? '—' : `${v.toFixed(1).replace('.', ',')} % du PIB`)
const pctShort = (v: number): string => `${Math.round(v)}%`

const year = computed(() => data.value?.latestYear ?? null)
const lastDette = computed(() => data.value?.dette.at(-1)?.value)
const lastInterets = computed(() => data.value?.interets.at(-1)?.value)

const detteSeries = computed<LineSeries[]>(() => [
  { id: 'dette', label: 'Dette publique', color: null, points: data.value?.dette ?? [] },
])
const interetsSeries = computed<LineSeries[]>(() => [
  { id: 'interets', label: 'Charge de la dette', color: '#ef9a86', points: data.value?.interets ?? [] },
])

useHead({ title: 'Prisme — dette publique' })
</script>

<template>
  <main class="wrap">
    <NuxtLink to="/" class="back">‹ Tableau de bord</NuxtLink>

    <section class="hero">
      <p class="eyebrow">Dette des administrations publiques · {{ year }}</p>
      <h1>La <span class="prism-text">dette publique</span></h1>
      <p class="lede">
        La dette est le cumul des déficits passés. Chaque année où les dépenses dépassent les recettes,
        l'État emprunte — et paie des intérêts dessus (la « charge de la dette »).
      </p>
    </section>

    <section class="kpi-row">
      <div class="kpi">
        <div class="kpi-val prism-text">{{ pctFmt(lastDette) }}</div>
        <div class="kpi-sub">dette publique brute · {{ year }}</div>
      </div>
    </section>

    <section class="card">
      <div class="card-head">
        <h2>Évolution de la dette <span class="muted">· % du PIB</span></h2>
        <span class="src">Eurostat</span>
      </div>
      <ClientOnly>
        <PrismLine :series="detteSeries" :formatter="pctFmt" :short-fmt="pctShort" />
        <template #fallback><div class="ph line-ph" /></template>
      </ClientOnly>
    </section>

    <section class="card">
      <div class="card-head">
        <h2>Charge de la dette <span class="muted">· intérêts, % du PIB</span></h2>
        <span class="src">Eurostat</span>
      </div>
      <ClientOnly>
        <PrismLine :series="interetsSeries" :formatter="pctFmt" :short-fmt="pctShort" />
        <template #fallback><div class="ph line-ph" /></template>
      </ClientOnly>
      <p class="note">
        Les intérêts versés représentent <strong>{{ pctFmt(lastInterets) }}</strong> en {{ year }}. Tombés
        très bas dans les années 2010 grâce aux taux faibles, ils <strong>remontent</strong> avec la hausse
        des taux et de la dette — c'est l'un des plus gros postes du budget de l'État.
      </p>
    </section>

    <footer class="foot">
      Sources : Eurostat <code>gov_10dd_edpt1</code> (dette) et <code>gov_10a_main</code> (intérêts) via DBnomics.
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
  max-width: 660px;
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
  margin-bottom: 22px;
}
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
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
.note {
  margin: 14px 0 0;
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
  border-radius: 12px;
  height: 230px;
}
.foot {
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
