<script setup lang="ts">
/**
 * Dictionnaire : liste alphabétique cherchable (notions + 10 postes COFOG).
 * Clic sur une entrée → drawer latéral ; un poste affiche aussi ses sous-postes.
 */
import { GENERAL, COFOG_DEFS } from '~/utils/glossary'

const { data } = await useFetch<DepensesPayload>('/api/depenses')
const divisions = computed<CofogFunction[]>(() => data.value?.functions ?? [])

useHead({ title: 'Prisme — dictionnaire' })

/** Un sous-poste affiché dans le drawer d'un poste. */
interface Sub {
  label: string
  def: string
}
/** Une entrée du dictionnaire (notion générale ou poste COFOG). */
interface Entry {
  key: string
  term: string
  def: string
  tag: string
  kind: 'notion' | 'poste'
  subs?: Sub[]
}

/** Normalise pour la recherche/tri : sans accents, minuscules. */
const norm = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const entries = computed<Entry[]>(() => {
  const out: Entry[] = []
  for (const t of GENERAL) out.push({ key: `n-${t.term}`, term: t.term, def: t.def, tag: 'Notion', kind: 'notion' })
  for (const d of divisions.value) {
    out.push({
      key: d.code,
      term: d.label,
      def: COFOG_DEFS[d.code] ?? '',
      tag: 'Poste',
      kind: 'poste',
      subs: d.children.map((c) => ({ label: c.label, def: COFOG_DEFS[c.code] ?? '' })),
    })
  }
  return out.sort((a, b) => norm(a.term).localeCompare(norm(b.term)))
})

const q = ref('')
const filtered = computed(() => {
  const query = norm(q.value.trim())
  if (!query) return entries.value
  return entries.value.filter((e) => {
    if (norm(e.term).includes(query) || norm(e.def).includes(query)) return true
    // un poste remonte aussi si l'un de ses sous-postes correspond (ex. « hôpital » → Santé)
    return (e.subs ?? []).some((s) => norm(s.label).includes(query) || norm(s.def).includes(query))
  })
})

const selected = ref<Entry | null>(null)

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') selected.value = null
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <main class="wrap">
    <section class="hero">
      <p class="eyebrow">Glossaire</p>
      <h1>Le <span class="prism-text">dictionnaire</span></h1>
      <p class="lede">Toutes les notions, postes et sous-postes — cherchez un terme, cliquez pour le détail.</p>
    </section>

    <div class="search">
      <svg viewBox="0 0 24 24" class="search-ic" aria-hidden="true">
        <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2" />
        <path d="M20 20l-3.2-3.2" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
      <input v-model="q" type="search" placeholder="Rechercher un terme (PIB, réversion, hôpital…)" />
      <span class="count">{{ filtered.length }}</span>
    </div>

    <ul class="dico">
      <li v-for="e in filtered" :key="e.key" class="row" @click="selected = e">
        <span class="r-term">{{ e.term }}</span>
        <span class="r-tag" :class="e.kind">{{ e.tag }}</span>
      </li>
      <li v-if="!filtered.length" class="empty">Aucun terme ne correspond à « {{ q }} ».</li>
    </ul>

    <Transition name="drawer">
      <div v-if="selected" class="drawer-wrap">
        <div class="backdrop" @click="selected = null" />
        <aside class="drawer">
          <button class="close" aria-label="Fermer" @click="selected = null">✕</button>
          <span class="r-tag" :class="selected.kind">{{ selected.tag }}</span>
          <h2>{{ selected.term }}</h2>
          <p class="d-def">{{ selected.def || 'Définition à venir.' }}</p>

          <div v-if="selected.subs?.length" class="subs-block">
            <h3>Sous-postes</h3>
            <dl>
              <div v-for="s in selected.subs" :key="s.label" class="sub">
                <dt>{{ s.label }}</dt>
                <dd>{{ s.def || '—' }}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </Transition>
  </main>
</template>

<style scoped>
.hero {
  padding: 56px 0 8px;
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
  font-size: clamp(2.1rem, 5vw, 3rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  margin: 0 0 14px;
}
.lede {
  font-size: 1.05rem;
  color: var(--ink-soft);
  margin: 0;
}

.search {
  position: sticky;
  top: 70px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 28px 0 8px;
  padding: 12px 16px;
  background: var(--panel);
  border: 1px solid var(--line-strong);
  border-radius: 14px;
  box-shadow: var(--shadow);
}
.search-ic {
  width: 20px;
  height: 20px;
  color: var(--muted);
  flex: none;
}
.search input {
  flex: 1;
  border: 0;
  outline: none;
  background: none;
  font-family: inherit;
  font-size: 1rem;
  color: var(--ink);
}
.search input::placeholder {
  color: var(--muted);
}
.count {
  font-size: 0.74rem;
  font-weight: 700;
  color: var(--muted);
  background: var(--bg-soft);
  border: 1px solid var(--line);
  padding: 2px 9px;
  border-radius: 99px;
}

.dico {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 13px 12px;
  border-bottom: 1px solid var(--line);
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.13s ease;
}
.row:hover {
  background: var(--bg-soft);
}
.r-term {
  font-weight: 700;
  font-size: 0.84rem;
  color: var(--ink);
}
.r-tag {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 99px;
  white-space: nowrap;
  background: var(--bg-soft);
  border: 1px solid var(--line);
  color: var(--muted);
}
.r-tag.notion {
  color: #5b8def;
  background: #eef3fe;
  border-color: #dce8fd;
}
.r-tag.poste {
  color: #9b6fd0;
  background: #f3edfb;
  border-color: #e8ddf6;
}
.empty {
  padding: 40px 12px;
  text-align: center;
  color: var(--muted);
}

/* Drawer */
.drawer-wrap {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  justify-content: flex-end;
}
.backdrop {
  position: absolute;
  inset: 0;
  background: rgba(23, 23, 31, 0.28);
  backdrop-filter: blur(2px);
}
.drawer {
  position: relative;
  width: min(460px, 92vw);
  height: 100%;
  background: #fff;
  border-left: 1px solid var(--line);
  box-shadow: -16px 0 48px -24px rgba(23, 23, 31, 0.4);
  padding: 80px 48px 48px;
  overflow-y: auto;
}
.close {
  position: absolute;
  top: 18px;
  right: 18px;
  border: 1px solid var(--line);
  background: var(--bg-soft);
  color: var(--ink-soft);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.85rem;
}
.close:hover {
  color: var(--ink);
}
.drawer h2 {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 16px 0 20px;
  line-height: 1.2;
}
.drawer h2::after {
  content: '';
  display: block;
  width: 40px;
  height: 3px;
  border-radius: 2px;
  margin-top: 18px;
  background: var(--prism);
}
.d-def {
  font-size: 1rem;
  line-height: 1.75;
  color: var(--ink-soft);
  margin: 0;
}

.subs-block {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--line);
}
.subs-block h3 {
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 0 0 16px;
}
.subs-block dl {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.subs-block .sub dt {
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--ink);
  margin-bottom: 4px;
}
.subs-block .sub dd {
  margin: 0;
  font-size: 0.86rem;
  line-height: 1.55;
  color: var(--ink-soft);
}

.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.22s ease;
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}
.drawer-enter-active .drawer,
.drawer-leave-active .drawer {
  transition: transform 0.26s cubic-bezier(0.22, 1, 0.36, 1);
}
.drawer-enter-from .drawer,
.drawer-leave-to .drawer {
  transform: translateX(100%);
}
</style>
