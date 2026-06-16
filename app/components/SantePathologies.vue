<script setup lang="ts">
/** Santé — dépenses par pathologie (CNAM). Barres + avertissement (catégories qui se chevauchent). */
const { data } = await useFetch<SantePathologiesPayload>('/api/sante-pathologies')
const items = computed<PathologyItem[]>(() => data.value?.items ?? [])
const year = computed(() => data.value?.year ?? null)
const max = computed(() => Math.max(...items.value.map((i) => i.eur), 1))
/** Montants ameli en euros bruts → milliards. */
const md = (e: number): string => (e / 1e9).toLocaleString('fr-FR', { maximumFractionDigits: 1 })
</script>

<template>
  <section class="card">
    <div class="head">
      <div>
        <h2>Par pathologie</h2>
        <p class="sub">Dépenses d'assurance maladie affectées à chaque pathologie · {{ year }}</p>
      </div>
      <span class="src">CNAM</span>
    </div>

    <div class="warn">
      ⚠️ Lecture en « <strong>dépenses des personnes concernées</strong> » : un même patient peut relever de
      plusieurs pathologies, donc ces montants <strong>se chevauchent et ne s'additionnent pas</strong>.
    </div>

    <ul class="rows">
      <li v-for="it in items" :key="it.label">
        <span class="lbl" :title="it.label">{{ it.label }}</span>
        <div class="track"><div class="fill" :style="{ width: (it.eur / max) * 100 + '%' }" /></div>
        <span class="val">{{ md(it.eur) }} Md€</span>
      </li>
    </ul>
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
  margin-bottom: 16px;
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
.warn {
  font-size: 0.82rem;
  line-height: 1.5;
  color: var(--ink-soft);
  background: #fff7f3;
  border: 1px solid #f6dccd;
  border-radius: 10px;
  padding: 11px 14px;
  margin-bottom: 18px;
}
.warn strong {
  color: var(--ink);
}
.rows {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.rows li {
  display: grid;
  grid-template-columns: minmax(180px, 280px) 1fr auto;
  align-items: center;
  gap: 14px;
}
.lbl {
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.track {
  height: 20px;
  background: var(--bg-soft);
  border-radius: 6px;
  overflow: hidden;
}
.fill {
  height: 100%;
  border-radius: 6px;
  background: linear-gradient(90deg, #5cc9e6, #9b86df);
  transition: width 0.4s ease;
}
.val {
  font-size: 0.84rem;
  font-weight: 700;
  color: var(--ink-soft);
  min-width: 60px;
  text-align: right;
}
@media (max-width: 600px) {
  .rows li {
    grid-template-columns: 1fr auto;
  }
  .track {
    display: none;
  }
}
</style>
