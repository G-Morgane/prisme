<script setup lang="ts">
/**
 * Tableau de bord — 3 vues en onglets : par poste (fonction), par nature, financement.
 * La vue « par poste » : donut des 10 fonctions COFOG + courbe d'évolution/comparaison,
 * et un détail à onglets pour les postes sélectionnés.
 */
const { data, pending, error } = await useFetch<DepensesPayload>('/api/depenses')

const unit = ref<Unit>('PC_GDP')
const selectedCodes = ref<string[]>([]) // postes sélectionnés (comparaison + détail)
const hovered = ref<string | null>(null)
const activeDetail = ref<string | null>(null) // onglet de détail actif
const view = ref<'poste' | 'nature' | 'finance'>('poste') // onglet de vue du tableau de bord

const { group, fmt, shortFmt } = useFormat(unit)

const valueAt = (pts: Point[], year: number | null): number | undefined =>
  year == null ? undefined : pts.find((p) => p.year === year)?.value
const latestYear = computed(() => data.value?.latestYear ?? null)

// ─── Vue « par poste » : les 10 divisions COFOG ───────────────────────────────
const divisions = computed<CofogFunction[]>(() => data.value?.functions ?? [])
const divByCode = computed<Record<string, CofogFunction>>(() =>
  Object.fromEntries(divisions.value.map((n) => [n.code, n])),
)

/** Postes (valeur > 0), triés par poids et colorés le long du spectre prisme. */
const items = computed<DonutItem[]>(() => {
  const rows = divisions.value
    .map((n) => ({ code: n.code, label: n.label, value: valueAt(n.series[unit.value], latestYear.value) }))
    .filter((i): i is { code: string; label: string; value: number } => typeof i.value === 'number' && i.value > 0)
    .sort((a, b) => b.value - a.value)
  return rows.map((it, i) => ({ ...it, color: PRISM_RAMP[i % PRISM_RAMP.length]! }))
})
const itemsTotal = computed(() => items.value.reduce((s, i) => s + i.value, 0))

const totalLatest = computed(() => valueAt(data.value?.total[unit.value] ?? [], latestYear.value))
const totalEur = computed(() => valueAt(data.value?.total.MIO_EUR ?? [], latestYear.value))
const totalPct = computed(() => valueAt(data.value?.total.PC_GDP ?? [], latestYear.value))

/** Ajoute/retire un poste de la sélection, en synchronisant l'onglet de détail actif. */
function toggle(code: string): void {
  const i = selectedCodes.value.indexOf(code)
  if (i >= 0) {
    selectedCodes.value.splice(i, 1)
    if (activeDetail.value === code) activeDetail.value = selectedCodes.value.at(-1) ?? null
  } else {
    selectedCodes.value.push(code)
    activeDetail.value = code // on bascule sur le poste qu'on vient d'ajouter
  }
}
function clearSelection(): void {
  selectedCodes.value = []
  activeDetail.value = null
}
const isSel = (code: string): boolean => selectedCodes.value.includes(code)
const selectedItems = computed(() => items.value.filter((i) => isSel(i.code)))

// Détail (onglets sous les cartes) des postes sélectionnés.
const selectedDivisionNodes = computed<CofogFunction[]>(() => selectedItems.value.map((i) => divByCode.value[i.code]!))
const colorOf = (code: string): string => items.value.find((i) => i.code === code)?.color ?? '#9b86df'
const activeNode = computed<CofogFunction | null>(() =>
  activeDetail.value ? divByCode.value[activeDetail.value] ?? null : null,
)
const activeValue = computed(() =>
  activeNode.value ? valueAt(activeNode.value.series[unit.value], latestYear.value) : undefined,
)

// Courbe : total si aucune sélection, sinon une série par poste sélectionné.
const lineSeries = computed<LineSeries[]>(() => {
  if (!selectedItems.value.length) {
    return [{ id: '__total__', label: 'Total', color: null, points: data.value?.total[unit.value] ?? [] }]
  }
  return selectedItems.value.map((it) => ({
    id: it.code,
    label: it.label,
    color: it.color,
    points: divByCode.value[it.code]!.series[unit.value],
  }))
})
const isSingle = computed(() => lineSeries.value.length === 1)

/** Légende sous le titre quand plusieurs courbes sont tracées. */
const cmpItems = computed(() =>
  lineSeries.value.map((s) => ({
    code: s.id,
    label: s.label,
    color: s.color ?? '#9b86df',
    value: valueAt(s.points, latestYear.value),
  })),
)

const evoTitle = computed<string>(() => {
  const n = selectedCodes.value.length
  if (n === 1) return selectedItems.value[0]!.label
  if (n > 1) return `Comparaison · ${n} postes`
  return 'Total des dépenses publiques'
})
const headerColor = computed(() => (isSingle.value ? lineSeries.value[0]!.color : null))
const singleValue = computed(() => (isSingle.value ? valueAt(lineSeries.value[0]!.points, latestYear.value) : undefined))
const firstYear = computed(() => lineSeries.value[0]?.points[0]?.year ?? null)
</script>

<template>
  <main class="wrap">
    <section class="hero">
      <p class="eyebrow">Données ouvertes · Eurostat</p>
      <h1>Où va <span class="prism-text">l'argent public</span> ?</h1>
      <p class="lede">
        Prisme décompose la dépense publique française — État, Sécurité sociale et collectivités —
        par fonction, et la suit dans le temps.
      </p>
    </section>

    <div v-if="pending" class="state">Chargement…</div>
    <div v-else-if="error" class="state err">Erreur : {{ error.message }}</div>

    <template v-else>
      <section class="kpi-row">
        <div class="kpi">
          <div class="kpi-val prism-text">{{ fmt(totalLatest) }}</div>
          <div class="kpi-sub">
            dépense publique totale · {{ latestYear }}
            <template v-if="unit === 'PC_GDP' && totalEur">≈ {{ group(totalEur / 1000) }} Md€</template>
            <template v-else-if="unit === 'MIO_EUR' && totalPct">≈ {{ totalPct.toFixed(0) }} % du PIB</template>
          </div>
        </div>
        <div class="toggle">
          <button :class="{ on: unit === 'PC_GDP' }" @click="unit = 'PC_GDP'">% du PIB</button>
          <button :class="{ on: unit === 'MIO_EUR' }" @click="unit = 'MIO_EUR'">Milliards €</button>
        </div>
      </section>

      <nav class="vtabs">
        <button :class="{ on: view === 'poste' }" @click="view = 'poste'">Par poste</button>
        <button :class="{ on: view === 'nature' }" @click="view = 'nature'">Par nature</button>
        <button :class="{ on: view === 'finance' }" @click="view = 'finance'">Financement</button>
      </nav>

      <div v-show="view === 'poste'">
      <div class="grid">
        <!-- Répartition -->
        <section class="card">
          <div class="card-head">
            <div>
              <h2>Répartition par poste</h2>
              <p class="hint">Cliquez un ou plusieurs postes pour afficher leur détail ci-dessous</p>
            </div>
            <span class="badge">{{ latestYear }}</span>
          </div>
          <div class="repartition">
            <ClientOnly>
              <PrismDonut
                :items="items"
                :selected="selectedCodes"
                v-model:hovered="hovered"
                :formatter="fmt"
                center-label="Total"
                :center-value="totalLatest ?? itemsTotal"
                @toggle="toggle"
              />
              <template #fallback><div class="ph donut-ph" /></template>
            </ClientOnly>

            <ul class="legend">
              <li
                v-for="it in items"
                :key="it.code"
                :class="{ on: isSel(it.code), hl: hovered === it.code }"
                @mouseenter="hovered = it.code"
                @mouseleave="hovered = null"
                @click="toggle(it.code)"
              >
                <span class="chip" :class="{ active: isSel(it.code) }" :style="{ background: it.color, color: it.color }" />
                <span class="lg-label">{{ it.label }}</span>
                <span class="lg-val">{{ fmt(it.value) }}</span>
                <span class="lg-bar"><i :style="{ width: (it.value / itemsTotal) * 100 + '%', background: it.color }" /></span>
              </li>
            </ul>
          </div>
        </section>

        <!-- Évolution / comparaison -->
        <section class="card">
          <div class="card-head">
            <h2>
              <span class="dot" :style="{ background: headerColor ?? 'transparent', backgroundImage: headerColor ? 'none' : 'var(--prism)' }" />
              {{ evoTitle }}
            </h2>
            <button v-if="selectedCodes.length" class="reset" @click="clearSelection">↩ tout</button>
          </div>

          <div v-if="isSingle" class="evo-val">
            <span class="prism-text big">{{ fmt(singleValue) }}</span>
            <span class="evo-sub">en {{ latestYear }}</span>
          </div>
          <div v-else class="cmp-legend">
            <span v-for="i in cmpItems" :key="i.code" class="cmp">
              <span class="chip" :style="{ background: i.color }" />
              <span class="cmp-lab">{{ i.label }}</span>
              <b>{{ fmt(i.value) }}</b>
            </span>
          </div>

          <ClientOnly>
            <PrismLine :series="lineSeries" :formatter="fmt" :short-fmt="shortFmt" />
            <template #fallback><div class="ph line-ph" /></template>
          </ClientOnly>

          <div class="frise-wrap">
            <PrismTimeline :first-year="firstYear ?? 1995" :last-year="latestYear ?? 2023" />
          </div>
        </section>
      </div>

      <section v-if="selectedDivisionNodes.length" class="card detail-card">
        <div class="tabs">
          <div class="tabs-list">
            <button
              v-for="node in selectedDivisionNodes"
              :key="node.code"
              class="tab"
              :class="{ on: activeDetail === node.code }"
              :style="{ borderBottomColor: activeDetail === node.code ? colorOf(node.code) : 'transparent' }"
              @click="activeDetail = node.code"
            >
              <span class="tdot" :style="{ background: colorOf(node.code) }" />
              {{ node.label }}
            </button>
          </div>
          <span class="badge">Détail · {{ fmt(activeValue) }} · {{ latestYear }}</span>
        </div>

        <PosteDetail
          v-if="activeNode"
          :key="activeNode.code"
          :node="activeNode"
          :unit="unit"
          :latest-year="latestYear"
          :formatter="fmt"
          :short-fmt="shortFmt"
        />
      </section>
      </div>

      <NatureView v-show="view === 'nature'" :unit="unit" />
      <FinanceFlow v-show="view === 'finance'" />

      <footer class="foot">
        <span>
          Source : Eurostat <code>gov_10a_exp</code> (classification COFOG, niveaux 1 &amp; 2) via DBnomics ·
          dernier millésime fonctionnel {{ latestYear }} (~18 mois de décalage).
        </span>
        <span class="next">À venir — zoom « budget de l'État » : prévu vs exécuté par mission &amp; programme.</span>
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

.hero {
  padding: 56px 0 8px;
  max-width: 640px;
}
.eyebrow {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 0 0 14px;
}
.hero h1 {
  font-size: clamp(2.1rem, 5vw, 3.1rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.05;
  margin: 0 0 16px;
}
.lede {
  font-size: 1.05rem;
  color: var(--ink-soft);
  margin: 0;
  max-width: 560px;
}

.state {
  padding: 80px;
  text-align: center;
  color: var(--muted);
}
.state.err {
  color: #c0506b;
}

.kpi-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin: 40px 0 24px;
}
.kpi-val {
  font-size: clamp(2.4rem, 6vw, 3.4rem);
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
  gap: 24px;
  border-bottom: 1px solid var(--line);
  margin: 6px 0 22px;
}
.vtabs button {
  position: relative;
  border: 0;
  background: none;
  font-family: inherit;
  font-size: 0.92rem;
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

.grid {
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  gap: 22px;
}
@media (max-width: 900px) {
  .grid {
    grid-template-columns: 1fr;
  }
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
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 18px;
  gap: 12px;
}
.card-head h2 {
  font-size: 1.02rem;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 9px;
  letter-spacing: -0.01em;
}
.hint {
  font-size: 0.78rem;
  color: var(--muted);
  margin: 4px 0 0;
  font-weight: 500;
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex: none;
}
.badge {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--muted);
  background: var(--bg-soft);
  border: 1px solid var(--line);
  padding: 3px 9px;
  border-radius: 99px;
  white-space: nowrap;
}
.reset {
  border: 1px solid var(--line);
  background: var(--bg-soft);
  color: var(--ink-soft);
  font-size: 0.78rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 99px;
  cursor: pointer;
  white-space: nowrap;
}

.repartition {
  display: grid;
  grid-template-columns: 0.85fr 1fr;
  gap: 18px;
  align-items: center;
}
@media (max-width: 560px) {
  .repartition {
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
  cursor: pointer;
  transition: background 0.14s ease;
}
.legend li.hl,
.legend li:hover {
  background: var(--bg-soft);
}
.legend li.on {
  background: var(--bg-soft);
  box-shadow: inset 0 0 0 1px var(--line-strong);
}
.chip {
  width: 11px;
  height: 11px;
  border-radius: 3px;
  grid-row: 1;
  transition: box-shadow 0.14s ease;
}
.chip.active {
  box-shadow: 0 0 0 2px #fff, 0 0 0 3.5px currentColor;
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

.evo-val {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 6px;
  min-height: 32px;
}
.big {
  font-size: 1.7rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}
.evo-sub {
  font-size: 0.82rem;
  color: var(--muted);
  font-weight: 500;
}
.cmp-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  margin-bottom: 10px;
  min-height: 32px;
}
.cmp {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  color: var(--ink-soft);
  font-weight: 500;
}
.cmp .chip {
  width: 10px;
  height: 10px;
}
.cmp-lab {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cmp b {
  color: var(--ink);
  font-weight: 800;
}

.ph {
  background: linear-gradient(90deg, var(--bg-soft), #f3f3f7, var(--bg-soft));
  border-radius: 12px;
}
.donut-ph {
  width: 100%;
  aspect-ratio: 1;
  max-width: 260px;
  border-radius: 50%;
  margin: 0 auto;
}
.line-ph {
  width: 100%;
  height: 230px;
}

.frise-wrap {
  margin-top: 6px;
}

.detail-card {
  margin-top: 22px;
}
.tabs {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 18px;
  border-bottom: 1px solid var(--line);
}
.tabs .badge {
  margin-bottom: 10px;
}
.tabs-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}
.tab {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 0;
  background: none;
  color: var(--muted);
  font-size: 0.88rem;
  font-weight: 600;
  padding: 10px 1px;
  margin-bottom: -1px;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: color 0.14s ease;
}
.tab:hover {
  color: var(--ink-soft);
}
.tab.on {
  color: var(--ink);
}
.tdot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex: none;
  opacity: 0.45;
  transition: opacity 0.14s ease;
}
.tab.on .tdot {
  opacity: 1;
}

.foot {
  margin-top: 34px;
  padding-top: 18px;
  border-top: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--muted);
}
.foot code {
  background: var(--bg-soft);
  border: 1px solid var(--line);
  padding: 0 5px;
  border-radius: 5px;
  font-size: 0.92em;
}
.next {
  font-weight: 600;
  color: var(--ink-soft);
}
</style>
