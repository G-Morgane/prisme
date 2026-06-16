<script setup lang="ts">
import { POSTES } from '~/utils/glossary'

// On ne liste que les postes enrichis (analyse en plus du tableau de bord).
const enrichedPostes = POSTES.filter((p) => p.enriched)
</script>

<template>
  <div class="shell">
    <aside class="sidebar">
      <NuxtLink to="/" class="brand"><PrismLogo :size="24" /></NuxtLink>

      <nav class="nav">
        <NuxtLink to="/" class="item">
          <span class="dotmark" /> Tableau de bord
        </NuxtLink>

        <p v-if="enrichedPostes.length" class="group">Analyses détaillées</p>
        <NuxtLink v-for="p in enrichedPostes" :key="p.code" :to="`/poste/${p.slug}`" class="item sub">
          {{ p.label }}
        </NuxtLink>

        <p class="group">Repères</p>
        <NuxtLink to="/dictionnaire" class="item">Dictionnaire</NuxtLink>
      </nav>
    </aside>

    <main class="content">
      <NuxtPage />
    </main>
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  align-items: flex-start;
  min-height: 100vh;
}
.sidebar {
  position: sticky;
  top: 0;
  flex: none;
  width: 244px;
  height: 100vh;
  overflow-y: auto;
  padding: 22px 16px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border-right: 1px solid var(--line);
}
.brand {
  display: inline-flex;
  padding: 4px 8px 18px;
  text-decoration: none;
}
.nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.group {
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 18px 10px 6px;
}
.item {
  display: flex;
  align-items: center;
  gap: 9px;
  text-decoration: none;
  color: var(--ink-soft);
  font-size: 0.86rem;
  font-weight: 600;
  padding: 8px 10px;
  border-radius: 9px;
  transition: all 0.13s ease;
}
.item.sub {
  font-size: 0.82rem;
  font-weight: 500;
  padding-left: 12px;
}
.item:hover {
  background: var(--bg-soft);
  color: var(--ink);
}
.item.router-link-exact-active {
  background: var(--bg-soft);
  color: var(--ink);
  box-shadow: inset 0 0 0 1px var(--line);
  font-weight: 700;
}
.dotmark {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--prism);
}

.content {
  flex: 1;
  min-width: 0;
}

@media (max-width: 860px) {
  .shell {
    flex-direction: column;
  }
  .sidebar {
    position: sticky;
    width: 100%;
    height: auto;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    overflow-x: auto;
    z-index: 20;
  }
  .brand {
    padding: 0 6px 0 0;
  }
  .nav {
    flex-direction: row;
    align-items: center;
    gap: 4px;
  }
  .nav .group {
    display: none;
  }
  .item {
    white-space: nowrap;
  }
  .item.sub {
    font-size: 0.8rem;
  }
}
</style>
