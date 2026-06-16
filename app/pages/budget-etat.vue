<script setup lang="ts">
/**
 * Budget de l'État (LOLF), PLF 2025 — vue par mission et par nature (titre).
 * Source : data.economie.gouv.fr. Montants nets (hors remboursements & dégrèvements).
 */
const { data } = await useFetch<BudgetEtatPayload>('/api/budget-etat')
const { data: evo } = await useFetch<EtatEvolutionPayload>('/api/etat-evolution')

const view = ref<'mission' | 'titre' | 'evolution'>('mission')
const hovered = ref<string | null>(null)

// Évolution (administration centrale, % du PIB) → série pour PrismLine.
const evoSeries = computed<LineSeries[]>(() => [
  { id: 'central', label: 'Administration centrale', color: null, points: evo.value?.points ?? [] },
])
const pctFmt = (v: number | undefined): string => (v == null ? '—' : `${v.toFixed(1).replace('.', ',')} % du PIB`)
const pctShort = (v: number): string => `${Math.round(v)}%`

const group = (n: number): string => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
/** Euros bruts → milliards, ou millions sous le milliard (évite les « 0 Md€ »). */
const md = (e: number | undefined): string => {
  if (e == null) return '—'
  return Math.abs(e) < 1e9 ? `${group(e / 1e6)} M€` : `${group(e / 1e9)} Md€`
}

const year = computed(() => data.value?.year ?? null)
const totalNet = computed(() => data.value?.totalNet ?? 0)
const totalBrut = computed(() => data.value?.totalBrut ?? 0)

// ─── Vue « par mission » : barres avec dépliage inline des programmes (accordéon) ───
const TOP = 15
const expanded = ref<Set<string>>(new Set())

/** Déplie/replie une mission. */
function toggleMission(label: string): void {
  const next = new Set(expanded.value)
  next.has(label) ? next.delete(label) : next.add(label)
  expanded.value = next
}

/** Une ligne : mission (dépliable) ou programme (enfant inséré sous sa mission). */
interface BarRow {
  kind: 'mission' | 'programme'
  key: string
  label: string
  cp: number
  expandable: boolean
  open: boolean
}

// Échelle commune : la plus grosse mission = 100 % (les programmes restent à la même échelle).
const barMax = computed(() => Math.max(...(data.value?.missions ?? []).map((m) => m.cp), 1))

const rows = computed<BarRow[]>(() => {
  const all = data.value?.missions ?? []
  const out: BarRow[] = []
  for (const m of all.slice(0, TOP)) {
    const open = expanded.value.has(m.label)
    const programmes = m.programmes ?? []
    out.push({ kind: 'mission', key: m.label, label: m.label, cp: m.cp, expandable: programmes.length > 0, open })
    // Programmes insérés juste sous la mission dépliée.
    if (open) {
      for (const p of programmes) {
        out.push({ kind: 'programme', key: `${m.label}/${p.label}`, label: p.label, cp: p.cp, expandable: false, open: false })
      }
    }
  }
  const rest = all.slice(TOP)
  if (rest.length) {
    out.push({ kind: 'mission', key: '__autres__', label: `Autres (${rest.length} missions)`, cp: rest.reduce((s, m) => s + m.cp, 0), expandable: false, open: false })
  }
  return out
})

function onRowClick(row: BarRow): void {
  if (row.expandable) toggleMission(row.label)
}

// ─── Vue « par nature » : donut des titres LOLF ───
const titreItems = computed<DonutItem[]>(() =>
  (data.value?.titres ?? []).map((t, i) => ({
    code: t.code,
    label: t.label,
    value: t.cp,
    color: PRISM_RAMP[i % PRISM_RAMP.length]!,
  })),
)
const titreTotal = computed(() => titreItems.value.reduce((s, t) => s + t.value, 0))

useHead({ title: "Prisme — budget de l'État" })
</script>

<template>
  <main class="wrap">
    <NuxtLink to="/" class="back">‹ Tableau de bord</NuxtLink>

    <section class="hero">
      <p class="eyebrow">Budget de l'État · LOLF · {{ year }}</p>
      <h1>Le <span class="prism-text">budget de l'État</span></h1>
      <p class="lede">
        Le budget propre de l'État (hors Sécurité sociale et collectivités), voté par mission, et
        ventilé par nature de dépense. Crédits de paiement, projet de loi de finances {{ year }}.
      </p>
    </section>

    <section class="kpi-row">
      <div class="kpi">
        <div class="kpi-val prism-text">{{ md(totalNet) }}</div>
        <div class="kpi-sub">
          budget général net · {{ year }} · {{ md(totalBrut) }} avec les remboursements &amp; dégrèvements
        </div>
      </div>
    </section>

    <nav class="vtabs">
      <button :class="{ on: view === 'mission' }" @click="view = 'mission'">Par mission</button>
      <button :class="{ on: view === 'titre' }" @click="view = 'titre'">Par nature</button>
      <button :class="{ on: view === 'evolution' }" @click="view = 'evolution'">Évolution</button>
    </nav>

    <!-- Par mission (dépliage inline des programmes) -->
    <section v-if="view === 'mission'" class="card">
      <div class="card-head">
        <h2>Dépenses par mission</h2>
        <span class="src">data.economie.gouv.fr</span>
      </div>
      <p class="hint">Cliquez une mission pour déplier ses programmes</p>
      <TransitionGroup tag="ul" name="acc" class="rows">
        <li
          v-for="r in rows"
          :key="r.key"
          :class="['row', r.kind, { click: r.expandable }]"
          @click="onRowClick(r)"
        >
          <span class="lbl" :title="r.label">
            <span v-if="r.expandable" class="chev" :class="{ open: r.open }" aria-hidden="true">▸</span>
            {{ r.label }}
          </span>
          <div class="track"><div class="fill" :style="{ width: (r.cp / barMax) * 100 + '%' }" /></div>
          <span class="val">{{ md(r.cp) }}</span>
        </li>
      </TransitionGroup>
    </section>

    <!-- Par nature (titre) -->
    <section v-else-if="view === 'titre'" class="card">
      <div class="card-head">
        <h2>Dépenses par nature <span class="muted">· titres LOLF</span></h2>
        <span class="src">data.economie.gouv.fr</span>
      </div>
      <div class="grid">
        <ClientOnly>
          <PrismDonut
            :items="titreItems"
            :selected="[]"
            v-model:hovered="hovered"
            :formatter="md"
            center-label="Budget net"
            :center-value="titreTotal"
            @toggle="() => {}"
          />
          <template #fallback><div class="ph donut-ph" /></template>
        </ClientOnly>

        <ul class="legend">
          <li
            v-for="t in titreItems"
            :key="t.code"
            :class="{ hl: hovered === t.code }"
            @mouseenter="hovered = t.code"
            @mouseleave="hovered = null"
          >
            <span class="chip" :style="{ background: t.color }" />
            <span class="lbl2">{{ t.label }}</span>
            <span class="val2">{{ md(t.value) }}</span>
          </li>
        </ul>
      </div>
      <p class="note">
        Le <strong>personnel</strong> (salaires des agents de l'État : enseignants, militaires, police…) et
        l'<strong>intervention</strong> (aides et transferts) forment l'essentiel du budget de l'État.
      </p>
    </section>

    <!-- Évolution dans le temps (administration centrale, % du PIB) -->
    <section v-else-if="view === 'evolution'" class="card">
      <div class="card-head">
        <h2>Évolution dans le temps <span class="muted">· administration centrale</span></h2>
        <span class="src">Eurostat</span>
      </div>
      <p class="hint">Dépense de l'administration centrale (État + organismes), en % du PIB · depuis 1995</p>
      <ClientOnly>
        <PrismLine :series="evoSeries" :formatter="pctFmt" :short-fmt="pctShort" />
        <template #fallback><div class="ph line-ph" /></template>
      </ClientOnly>
      <p class="note">
        Périmètre « administration centrale » en base comptabilité nationale (Eurostat) — un peu plus large
        que le budget LOLF ci-dessus. Le pic <strong>2020</strong> reflète la réponse à la crise Covid.
      </p>
    </section>

    <footer class="foot">
      Source : <code>plf25-depenses-2025-selon-destination</code> (data.economie.gouv.fr). Crédits de paiement,
      budget général. À venir : zoom mission → programmes, et prévu vs exécuté.
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
  max-width: 640px;
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

.vtabs {
  display: flex;
  gap: 24px;
  border-bottom: 1px solid var(--line);
  margin: 0 0 22px;
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

.hint {
  font-size: 0.78rem;
  color: var(--muted);
  margin: 0 0 14px;
  font-weight: 500;
}

/* Barres « par mission » + programmes dépliés en dessous */
.rows {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;
  position: relative;
}
/* Animation accordéon : ouverture en fondu/glissé, repli net + les voisines se décalent en douceur */
.acc-enter-active {
  transition: opacity 0.2s ease, transform 0.22s ease;
}
.acc-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}
.acc-move {
  transition: transform 0.24s ease;
}
.rows li {
  display: grid;
  grid-template-columns: minmax(200px, 300px) 1fr auto;
  align-items: center;
  gap: 14px;
  padding: 4px 8px;
  margin: 0 -8px;
  border-radius: 8px;
}
.row.mission.click {
  cursor: pointer;
  transition: background 0.13s ease;
}
.row.mission.click:hover {
  background: var(--bg-soft);
}
.chev {
  display: inline-block;
  font-size: 0.7rem;
  color: var(--muted);
  margin-right: 6px;
  transition: transform 0.16s ease;
}
.chev.open {
  transform: rotate(90deg);
}
/* Programmes (sous-niveau) : indentés, plus petits, couleur distincte */
.row.programme .lbl {
  padding-left: 34px;
  font-weight: 500;
  font-size: 0.8rem;
  color: var(--ink-soft);
}
.row.programme .track {
  height: 14px;
}
.row.programme .fill {
  background: #cdbdf2;
}
.row.programme .val {
  font-weight: 600;
  color: var(--muted);
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
  min-width: 64px;
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

/* Donut « par nature » */
.grid {
  display: grid;
  grid-template-columns: 0.85fr 1fr;
  gap: 22px;
  align-items: center;
}
@media (max-width: 700px) {
  .grid {
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
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 9px;
  transition: background 0.14s ease;
}
.legend li.hl {
  background: var(--bg-soft);
}
.chip {
  width: 11px;
  height: 11px;
  border-radius: 3px;
}
.lbl2 {
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--ink);
}
.val2 {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--ink-soft);
  white-space: nowrap;
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
.ph {
  background: linear-gradient(90deg, var(--bg-soft), #f3f3f7, var(--bg-soft));
  border-radius: 50%;
  aspect-ratio: 1;
  max-width: 240px;
  margin: 0 auto;
  width: 100%;
}
.line-ph {
  border-radius: 12px;
  aspect-ratio: auto;
  max-width: none;
  height: 230px;
}

.foot {
  margin-top: 22px;
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
