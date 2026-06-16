<script setup lang="ts">
/** Comparaison internationale — dépense publique totale en % du PIB. Barres, France mise en avant. */
const { data } = await useFetch<InternationalPayload>('/api/international')

const year = computed(() => data.value?.year ?? null)
const items = computed<CountryValue[]>(() => data.value?.total ?? [])
const max = computed(() => Math.max(...items.value.map((i) => i.value), 1))

useHead({ title: 'Prisme — comparaison internationale' })
</script>

<template>
  <main class="wrap">
    <NuxtLink to="/" class="back">‹ Tableau de bord</NuxtLink>

    <section class="hero">
      <p class="eyebrow">Comparaison européenne · {{ year }}</p>
      <h1>La France <span class="prism-text">dépense-t-elle plus</span> ?</h1>
      <p class="lede">
        Dépense publique totale (toutes administrations), en % du PIB. La France est régulièrement en
        tête des pays de l'OCDE sur cet indicateur.
      </p>
    </section>

    <section class="card">
      <div class="card-head">
        <h2>Dépense publique totale <span class="muted">· % du PIB</span></h2>
        <span class="src">Eurostat</span>
      </div>
      <ul class="rows">
        <li v-for="it in items" :key="it.code" :class="{ fr: it.code === 'FR', eu: it.code === 'EU27_2020' }">
          <span class="lbl">{{ it.label }}</span>
          <div class="track"><div class="fill" :style="{ width: (it.value / max) * 100 + '%' }" /></div>
          <span class="val">{{ it.value.toFixed(1).replace('.', ',') }} %</span>
        </li>
      </ul>
      <p class="note">
        Un niveau élevé ne dit rien en soi de l'efficacité : il reflète surtout le poids de la protection
        sociale publique (retraites, santé) — largement financée par l'impôt en France, par l'assurance
        privée ailleurs.
      </p>
    </section>

    <footer class="foot">
      Source : Eurostat <code>GOV_10A_EXP</code> (COFOG, total) via DBnomics.
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
  margin: 0 0 26px;
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
  margin-bottom: 20px;
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
  grid-template-columns: 120px 1fr auto;
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
.rows li.eu .fill {
  background: repeating-linear-gradient(45deg, #b9bdc7, #b9bdc7 5px, #cfd3db 5px, #cfd3db 10px);
}
.note {
  margin: 20px 0 0;
  font-size: 0.86rem;
  line-height: 1.6;
  color: var(--ink-soft);
  max-width: 760px;
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
