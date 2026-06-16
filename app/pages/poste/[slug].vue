<script setup lang="ts">
/**
 * Page d'analyse d'un poste de dépense (route /poste/[slug]).
 * Décomposition COFOG pour tous les postes ; Santé est enrichie de sources
 * supplémentaires affichées en onglets (prestataire, financeur, international, pathologie).
 */
import { posteBySlug } from '~/utils/glossary'

const route = useRoute()
const poste = computed(() => posteBySlug(String(route.params.slug)))

const { data } = await useFetch<DepensesPayload>('/api/depenses')
const node = computed<CofogFunction | null>(
  () => data.value?.functions.find((f) => f.code === poste.value?.code) ?? null,
)
const latestYear = computed(() => data.value?.latestYear ?? null)

const unit = ref<Unit>('PC_GDP')
const { fmt, group, shortFmt } = useFormat(unit)

const valueAt = (pts: Point[] | undefined, y: number | null): number | undefined =>
  y == null || !pts ? undefined : pts.find((p) => p.year === y)?.value
const kpi = computed(() => valueAt(node.value?.series[unit.value], latestYear.value))
const kpiEur = computed(() => valueAt(node.value?.series.MIO_EUR, latestYear.value))
const kpiPct = computed(() => valueAt(node.value?.series.PC_GDP, latestYear.value))

// Onglet de vue (Santé uniquement ; les autres postes n'ont que « cofog »).
const view = ref<'cofog' | 'prestataire' | 'financeur' | 'international' | 'patho'>('cofog')

useHead({ title: () => `Prisme — ${poste.value?.label ?? 'poste'}` })
</script>

<template>
  <main class="wrap">
    <div v-if="!poste" class="state">
      Poste inconnu. <NuxtLink to="/" class="link">Retour au tableau de bord</NuxtLink>
    </div>

    <template v-else>
      <NuxtLink to="/" class="back">‹ Tableau de bord</NuxtLink>

      <section class="hero">
        <p class="eyebrow">Poste de dépense · COFOG</p>
        <h1>{{ poste.label }}</h1>
      </section>

      <section class="kpi-row">
        <div class="kpi">
          <div class="kpi-val prism-text">{{ fmt(kpi) }}</div>
          <div class="kpi-sub">
            dépense {{ latestYear }}
            <template v-if="unit === 'PC_GDP' && kpiEur">≈ {{ group(kpiEur / 1000) }} Md€</template>
            <template v-else-if="unit === 'MIO_EUR' && kpiPct">≈ {{ kpiPct.toFixed(1).replace('.', ',') }} % du PIB</template>
          </div>
        </div>
        <div class="toggle">
          <button :class="{ on: unit === 'PC_GDP' }" @click="unit = 'PC_GDP'">% du PIB</button>
          <button :class="{ on: unit === 'MIO_EUR' }" @click="unit = 'MIO_EUR'">Milliards €</button>
        </div>
      </section>

      <!-- Santé : onglets multi-sources -->
      <template v-if="poste.slug === 'sante'">
        <nav class="vtabs">
          <button :class="{ on: view === 'cofog' }" @click="view = 'cofog'">Décomposition</button>
          <button :class="{ on: view === 'prestataire' }" @click="view = 'prestataire'">Par prestataire</button>
          <button :class="{ on: view === 'financeur' }" @click="view = 'financeur'">Qui paie ?</button>
          <button :class="{ on: view === 'international' }" @click="view = 'international'">International</button>
          <button :class="{ on: view === 'patho' }" @click="view = 'patho'">Par pathologie</button>
        </nav>

        <section v-if="view === 'cofog' && node" class="card">
          <div class="card-head">
            <h2>Décomposition fonctionnelle <span class="muted">· sous-fonctions COFOG</span></h2>
            <span class="src">Eurostat</span>
          </div>
          <PosteDetail :node="node" :unit="unit" :latest-year="latestYear" :formatter="fmt" :short-fmt="shortFmt" />
        </section>
        <SanteComptes v-else-if="view === 'prestataire'" />
        <SanteFinanceurs v-else-if="view === 'financeur'" />
        <SanteInternational v-else-if="view === 'international'" />
        <SantePathologies v-else-if="view === 'patho'" />
      </template>

      <!-- Autres postes : décompo COFOG + sources à venir -->
      <template v-else>
        <section v-if="node" class="card">
          <div class="card-head">
            <h2>Décomposition fonctionnelle <span class="muted">· sous-fonctions COFOG</span></h2>
            <span class="src">Eurostat</span>
          </div>
          <PosteDetail :node="node" :unit="unit" :latest-year="latestYear" :formatter="fmt" :short-fmt="shortFmt" />
        </section>
        <section class="card soon">
          <h2>Sources détaillées</h2>
          <p class="soon-txt">
            Bientôt : sources administratives nationales adaptées à ce poste (budget de l'État LOLF,
            DREES, OFGL…).
          </p>
        </section>
      </template>

      <footer class="foot">
        Décomposition fonctionnelle : Eurostat <code>gov_10a_exp</code> (COFOG) via DBnomics.
        Définitions sur le <NuxtLink to="/dictionnaire" class="link">dictionnaire</NuxtLink>.
      </footer>
    </template>
  </main>
</template>

<style scoped>
.wrap {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 24px 64px;
}
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
.state {
  padding: 80px;
  text-align: center;
  color: var(--muted);
}
.link {
  color: #7c8cf0;
  font-weight: 600;
}

.hero {
  padding: 14px 0 8px;
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
  margin: 0;
}

.kpi-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin: 28px 0 24px;
}
.kpi-val {
  font-size: clamp(2.2rem, 6vw, 3rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1;
}
.kpi-sub {
  font-size: 0.92rem;
  color: var(--ink-soft);
  margin-top: 8px;
  font-weight: 500;
}
.toggle {
  display: inline-flex;
  padding: 4px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #eef0f4;
}
.toggle button {
  border: 0;
  background: transparent;
  padding: 9px 18px;
  border-radius: 9px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--ink-soft);
  transition: all 0.16s ease;
}
.toggle button.on {
  background: #fff;
  color: var(--ink);
  box-shadow: 0 1px 2px rgba(23, 23, 31, 0.08), 0 2px 6px -2px rgba(23, 23, 31, 0.14);
}

.vtabs {
  display: flex;
  flex-wrap: wrap;
  gap: 22px;
  border-bottom: 1px solid var(--line);
  margin: 4px 0 22px;
}
.vtabs button {
  position: relative;
  border: 0;
  background: none;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--muted);
  padding: 10px 2px;
  margin-bottom: -1px;
  cursor: pointer;
  transition: color 0.14s ease;
}
.vtabs button:hover {
  color: var(--ink-soft);
}
.vtabs button.on {
  color: var(--ink);
}
.vtabs button.on::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  border-radius: 2px;
  background: var(--prism);
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
  margin-bottom: 16px;
}
.card-head h2,
.soon h2 {
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
}
.soon {
  border-style: dashed;
  box-shadow: none;
  background: var(--bg-soft);
}
.soon-txt {
  margin: 10px 0 0;
  color: var(--ink-soft);
  font-size: 0.92rem;
  line-height: 1.55;
}

.foot {
  margin-top: 18px;
  font-size: 0.8rem;
  color: var(--muted);
  line-height: 1.5;
}
.foot code {
  background: var(--bg-soft);
  border: 1px solid var(--line);
  padding: 0 5px;
  border-radius: 5px;
}
</style>
