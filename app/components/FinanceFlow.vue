<script setup lang="ts">
/**
 * « D'où vient l'argent ? » : recettes vs dépenses (barres), l'écart = le déficit.
 * Vise à corriger l'idée reçue « 57 % de dépenses ⇒ 43 % restant au privé ».
 */
const { data } = await useFetch<FinancesPayload>('/api/finances')

const group = (n: number): string => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
const pc = (v: number | null | undefined): string => (v == null ? '—' : `${v.toFixed(1).replace('.', ',')} %`)
const md = (v: number | null | undefined): string => (v == null ? '' : `${group(v / 1000)} Md€`)

const dep = computed(() => data.value?.depenses.pct ?? 0)
const rec = computed(() => data.value?.recettes.pct ?? 0)
const deficit = computed(() => Math.abs(data.value?.solde.pct ?? 0)) // |solde| (le solde est négatif)
const year = computed(() => data.value?.latestYear ?? null)

// Échelle : la plus grande valeur (les dépenses) occupe 100 % de la largeur.
const scale = computed(() => Math.max(dep.value, rec.value, 1))
const w = (v: number): string => `${(v / scale.value) * 100}%`
</script>

<template>
  <section class="card">
    <div class="head">
      <div>
        <h2>D'où vient l'argent ?</h2>
        <p class="sub">Recettes, dépenses et déficit des administrations publiques · {{ year }}</p>
      </div>
      <span class="src">Eurostat</span>
    </div>

    <div class="bars">
      <div class="row">
        <span class="lbl">Recettes</span>
        <div class="track"><div class="fill rec" :style="{ width: w(rec) }" /></div>
        <span class="val">{{ pc(rec) }}</span>
      </div>
      <div class="row">
        <span class="lbl">Dépenses</span>
        <div class="track">
          <div class="fill dep" :style="{ width: w(rec) }" />
          <div class="fill defi" :style="{ left: w(rec), width: w(deficit) }" />
        </div>
        <span class="val">{{ pc(dep) }}</span>
      </div>
    </div>

    <p class="note">
      L'écart entre les deux — le <strong class="defi-txt">déficit ({{ pc(deficit) }} du PIB</strong>, soit
      ~{{ md(Math.abs(data?.solde.eur ?? 0)) }}) — est <strong>financé par l'emprunt</strong>, ce qui alimente la dette publique.
      Les dépenses ne sont donc pas « prélevées » sur le PIB : l'essentiel (retraites, santé, salaires publics…)
      <strong>retourne dans l'économie</strong>.
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

.bars {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 18px;
}
.row {
  display: grid;
  grid-template-columns: 90px 1fr auto;
  align-items: center;
  gap: 14px;
}
.lbl {
  font-size: 0.86rem;
  font-weight: 700;
  color: var(--ink-soft);
}
.track {
  position: relative;
  height: 30px;
  background: var(--bg-soft);
  border-radius: 8px;
  overflow: hidden;
}
.fill {
  position: absolute;
  top: 0;
  bottom: 0;
  border-radius: 8px;
  transition: width 0.4s ease;
}
.fill.rec {
  left: 0;
  background: linear-gradient(90deg, #5cc9e6, #6fa1e8);
}
.fill.dep {
  left: 0;
  background: linear-gradient(90deg, #9b86df, #b58fd6);
  border-radius: 8px 0 0 8px;
}
.fill.defi {
  background: repeating-linear-gradient(45deg, #ef9a86, #ef9a86 6px, #f2b09f 6px, #f2b09f 12px);
  border-radius: 0 8px 8px 0;
}
.val {
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--ink);
  min-width: 56px;
  text-align: right;
}
.note {
  font-size: 0.86rem;
  line-height: 1.6;
  color: var(--ink-soft);
  margin: 0;
  max-width: 760px;
}
.note strong {
  color: var(--ink);
}
.defi-txt {
  color: #d9805f;
}
</style>
