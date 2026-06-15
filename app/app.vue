<script setup lang="ts">
type Unit = 'MIO_EUR' | 'PC_GDP'
type Point = { year: number; value: number }
interface Fn { code: string; label: string; color: string; series: Record<Unit, Point[]> }
interface Payload { geo: string; latestYear: number | null; functions: Fn[]; total: Record<Unit, Point[]> }

const { data, pending, error } = await useFetch<Payload>('/api/depenses')

const unit = ref<Unit>('PC_GDP')
const selectedCodes = ref<string[]>([])
const hovered = ref<string | null>(null)

const RAMP = [
  '#4FBEE0', '#5AA6E6', '#6E92E6', '#8A82DD', '#A87FD4',
  '#C27BC9', '#D67EB9', '#E586A2', '#EE9389', '#F0AE83',
]

const valueAt = (pts: Point[], year: number | null) =>
  year == null ? undefined : pts.find((p) => p.year === year)?.value

const latestYear = computed(() => data.value?.latestYear ?? null)

// Groupe les milliers avec une espace : 1610 -> "1 610".
const group = (n: number) => {
  const s = String(Math.abs(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return n < 0 ? `-${s}` : s
}
const fmt = (v: number | undefined) => {
  if (v == null) return '—'
  return unit.value === 'PC_GDP' ? `${v.toFixed(1).replace('.', ',')} % du PIB` : `${group(v / 1000)} Md€`
}
const shortFmt = (v: number) => (unit.value === 'PC_GDP' ? `${Math.round(v)}%` : group(v / 1000))

const colorByCode = computed(() => {
  const map: Record<string, string> = {}
  const ranked = [...(data.value?.functions ?? [])]
    .map((f) => ({ code: f.code, v: valueAt(f.series.PC_GDP, latestYear.value) ?? 0 }))
    .sort((a, b) => b.v - a.v)
  ranked.forEach((r, i) => (map[r.code] = RAMP[i % RAMP.length]!))
  return map
})

const totalLatest = computed(() => valueAt(data.value?.total[unit.value] ?? [], latestYear.value))
const totalEur = computed(() => valueAt(data.value?.total.MIO_EUR ?? [], latestYear.value))
const totalPct = computed(() => valueAt(data.value?.total.PC_GDP ?? [], latestYear.value))

const items = computed(() =>
  (data.value?.functions ?? [])
    .map((f) => ({ code: f.code, label: f.label, value: valueAt(f.series[unit.value], latestYear.value), color: colorByCode.value[f.code]! }))
    .filter((i): i is { code: string; label: string; value: number; color: string } => typeof i.value === 'number')
    .sort((a, b) => b.value - a.value),
)
const itemsTotal = computed(() => items.value.reduce((s, i) => s + i.value, 0))

function toggle(code: string) {
  const i = selectedCodes.value.indexOf(code)
  if (i >= 0) selectedCodes.value.splice(i, 1)
  else selectedCodes.value.push(code)
}
const isSel = (code: string) => selectedCodes.value.includes(code)

// Postes sélectionnés, dans l'ordre d'affichage (poids décroissant).
const selectedItems = computed(() => items.value.filter((i) => isSel(i.code)))

// Séries pour la courbe : total si rien, sinon une série par poste.
interface Series { id: string; label: string; color: string | null; points: Point[] }
const lineSeries = computed<Series[]>(() => {
  if (!selectedCodes.value.length) {
    return [{ id: '__total__', label: 'Total', color: null, points: data.value?.total[unit.value] ?? [] }]
  }
  return selectedItems.value.map((i) => ({
    id: i.code,
    label: i.label,
    color: i.color,
    points: data.value!.functions.find((f) => f.code === i.code)!.series[unit.value],
  }))
})

const evoTitle = computed(() => {
  const n = selectedCodes.value.length
  if (n === 0) return 'Total des dépenses publiques'
  if (n === 1) return selectedItems.value[0]!.label
  return `Comparaison · ${n} postes`
})
const headerColor = computed(() => (selectedCodes.value.length === 1 ? selectedItems.value[0]!.color : null))
const singleValue = computed(() =>
  selectedCodes.value.length === 0 ? totalLatest.value : selectedCodes.value.length === 1 ? selectedItems.value[0]!.value : undefined,
)
const firstYear = computed(() => lineSeries.value[0]?.points[0]?.year ?? null)
</script>

<template>
  <div>
    <header class="nav">
      <PrismLogo :size="26" />
      <span class="nav-tag">France · administrations publiques</span>
    </header>

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

        <div class="grid">
          <!-- Répartition -->
          <section class="card">
            <div class="card-head">
              <div>
                <h2>Répartition par poste</h2>
                <p class="hint">Cliquez un ou plusieurs postes pour les comparer</p>
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
              <button v-if="selectedCodes.length" class="reset" @click="selectedCodes = []">↩ tout</button>
            </div>

            <div v-if="selectedCodes.length <= 1" class="evo-val">
              <span class="prism-text big">{{ fmt(singleValue) }}</span>
              <span class="evo-sub">en {{ latestYear }} · depuis {{ firstYear }}</span>
            </div>
            <div v-else class="cmp-legend">
              <span v-for="i in selectedItems" :key="i.code" class="cmp">
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

        <footer class="foot">
          <span>
            Source : Eurostat <code>gov_10a_exp</code> (classification COFOG) via DBnomics · dernier
            millésime fonctionnel {{ latestYear }} (~18 mois de décalage).
          </span>
          <span class="next">À venir — zoom « budget de l'État » : prévu vs exécuté par mission &amp; programme.</span>
        </footer>
      </template>
    </main>
  </div>
</template>

<style scoped>
.nav {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--line);
}
.nav-tag {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--muted);
}
@media (max-width: 560px) {
  .nav-tag {
    display: none;
  }
}

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
  border: 1px solid var(--line-strong);
  border-radius: 12px;
  background: var(--bg-soft);
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
  background: var(--ink);
  color: #fff;
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
  box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
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
