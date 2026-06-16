<script setup lang="ts">
/** Santé — qui paie ? (Sécu / mutuelles / reste à charge). Barre 100 % empilée. */
const { data } = await useFetch<SanteFinanceursPayload>('/api/sante-financeurs')
const items = computed<FinanceurItem[]>(() => data.value?.items ?? [])
const year = computed(() => data.value?.latestYear ?? null)
const group = (n: number): string => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
</script>

<template>
  <section class="card">
    <div class="head">
      <div>
        <h2>Qui paie ?</h2>
        <p class="sub">Financement de la dépense de santé · {{ year }}</p>
      </div>
      <span class="src">Eurostat · SHA</span>
    </div>

    <div class="stack">
      <div
        v-for="it in items"
        :key="it.code"
        class="seg"
        :style="{ width: it.share + '%', background: it.color }"
      >
        <span v-if="it.share > 8">{{ Math.round(it.share) }} %</span>
      </div>
    </div>

    <ul class="legend">
      <li v-for="it in items" :key="it.code">
        <span class="chip" :style="{ background: it.color }" />
        <span class="lbl">{{ it.label }}</span>
        <span class="val">{{ group(it.eur / 1000) }} Md€</span>
        <span class="sh">{{ Math.round(it.share) }} %</span>
      </li>
    </ul>

    <p class="note">
      Avec un <strong>reste à charge des ménages d'environ 9 %</strong>, la France a l'une des
      couvertures publiques les plus élevées et l'un des restes à charge les plus faibles d'Europe.
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
}
.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
}
.head h2 {
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
.stack {
  display: flex;
  height: 42px;
  border-radius: 10px;
  overflow: hidden;
  gap: 2px;
}
.seg {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 0.82rem;
  font-weight: 800;
  min-width: 2px;
  transition: width 0.4s ease;
}
.legend {
  list-style: none;
  margin: 18px 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 22px;
}
.legend li {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.84rem;
}
.chip {
  width: 11px;
  height: 11px;
  border-radius: 3px;
}
.lbl {
  color: var(--ink-soft);
  font-weight: 600;
}
.val {
  color: var(--ink);
  font-weight: 800;
}
.sh {
  color: var(--muted);
  font-weight: 700;
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
</style>
