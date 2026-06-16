<script setup lang="ts">
/** Budget de l'État rattaché à un poste : les missions concernées et leurs programmes. */
const props = defineProps<{ missions: string[] }>()

const { data } = await useFetch<BudgetEtatPayload>('/api/budget-etat')

const group = (n: number): string => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
const md = (e: number): string => (Math.abs(e) < 1e9 ? `${group(e / 1e6)} M€` : `${group(e / 1e9)} Md€`)

/** Missions rattachées (présentes dans le budget), avec leurs programmes. */
const blocks = computed<MissionItem[]>(() =>
  (data.value?.missions ?? []).filter((m) => props.missions.includes(m.label)),
)
// Échelle commune à tous les programmes affichés.
const max = computed(() =>
  Math.max(...blocks.value.flatMap((m) => m.programmes.map((p) => p.cp)), 1),
)
</script>

<template>
  <section class="card">
    <div class="card-head">
      <h2>Budget de l'État <span class="muted">· missions rattachées</span></h2>
      <span class="src">data.economie.gouv.fr</span>
    </div>

    <div v-for="m in blocks" :key="m.label" class="block">
      <div class="m-head">
        <span class="m-label">{{ m.label }}</span>
        <span class="m-cp">{{ md(m.cp) }}</span>
      </div>
      <ul class="rows">
        <li v-for="p in m.programmes" :key="p.label">
          <span class="lbl" :title="p.label">{{ p.label }}</span>
          <div class="track"><div class="fill" :style="{ width: (p.cp / max) * 100 + '%' }" /></div>
          <span class="val">{{ md(p.cp) }}</span>
        </li>
      </ul>
    </div>

    <p class="note">
      Crédits du budget de l'État (PLF 2025). C'est ici que figurent les <strong>salaires</strong> des
      agents (titre 2) — enseignants, militaires, policiers, magistrats — versés via ces programmes.
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
.block {
  margin-bottom: 18px;
}
.m-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--line);
}
.m-label {
  font-size: 0.92rem;
  font-weight: 800;
  color: var(--ink);
}
.m-cp {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--muted);
}
.rows {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.rows li {
  display: grid;
  grid-template-columns: minmax(180px, 280px) 1fr auto;
  align-items: center;
  gap: 14px;
}
.lbl {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.track {
  height: 16px;
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
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--ink-soft);
  min-width: 56px;
  text-align: right;
}
.note {
  margin: 6px 0 0;
  font-size: 0.86rem;
  line-height: 1.6;
  color: var(--ink-soft);
  max-width: 760px;
}
.note strong {
  color: var(--ink);
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
