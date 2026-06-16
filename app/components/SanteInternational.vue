<script setup lang="ts">
/** Santé — comparaison internationale (% du PIB), France mise en avant. */
const { data } = await useFetch<SanteInternationalPayload>('/api/sante-international')
const items = computed<CountryValue[]>(() => data.value?.items ?? [])
const year = computed(() => data.value?.year ?? null)
const max = computed(() => Math.max(...items.value.map((i) => i.value), 1))
</script>

<template>
  <section class="card">
    <div class="head">
      <div>
        <h2>Comparaison internationale</h2>
        <p class="sub">Dépense totale de santé, en % du PIB · {{ year }}</p>
      </div>
      <span class="src">Eurostat · SHA</span>
    </div>

    <ul class="rows">
      <li v-for="it in items" :key="it.code" :class="{ fr: it.code === 'FR', eu: it.code === 'EU27_2020' }">
        <span class="lbl">{{ it.label }}</span>
        <div class="track"><div class="fill" :style="{ width: (it.value / max) * 100 + '%' }" /></div>
        <span class="val">{{ it.value.toFixed(1).replace('.', ',') }} %</span>
      </li>
    </ul>

    <p class="note">
      La France se situe <strong>au-dessus de la moyenne européenne</strong> (~10 %), dans le peloton
      de tête avec l'Allemagne et la Suède.
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
.rows {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.rows li {
  display: grid;
  grid-template-columns: 110px 1fr auto;
  align-items: center;
  gap: 14px;
}
.lbl {
  font-size: 0.86rem;
  font-weight: 600;
  color: var(--ink-soft);
}
.track {
  height: 22px;
  background: var(--bg-soft);
  border-radius: 7px;
  overflow: hidden;
}
.fill {
  height: 100%;
  border-radius: 7px;
  background: #c9cdd6;
  transition: width 0.4s ease;
}
.val {
  font-size: 0.86rem;
  font-weight: 700;
  color: var(--ink-soft);
  min-width: 48px;
  text-align: right;
}
/* France mise en avant */
.rows li.fr .lbl {
  color: var(--ink);
  font-weight: 800;
}
.rows li.fr .fill {
  background: var(--prism);
}
.rows li.fr .val {
  color: var(--ink);
  font-weight: 800;
}
/* moyenne UE en pointillé visuel */
.rows li.eu .fill {
  background: repeating-linear-gradient(45deg, #b9bdc7, #b9bdc7 5px, #cfd3db 5px, #cfd3db 10px);
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
