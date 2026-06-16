<script setup lang="ts">
/** Logo Prisme : marque (prisme + dispersion) et wordmark « PRISM » + « E » en 3 barres. */
withDefaults(defineProps<{ size?: number; showWord?: boolean }>(), { size: 28, showWord: true })
</script>

<template>
  <span class="logo">
    <svg :width="size" :height="size" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="prismMark" x1="4" y1="28" x2="28" y2="6" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#5cc9e6" />
          <stop offset="0.3" stop-color="#6fa1e8" />
          <stop offset="0.55" stop-color="#9b86df" />
          <stop offset="0.8" stop-color="#ce7ec4" />
          <stop offset="1" stop-color="#ef9a86" />
        </linearGradient>
      </defs>
      <!-- prisme -->
      <path d="M16 5.5 L27 23.5 H5 Z" stroke="url(#prismMark)" stroke-width="2" stroke-linejoin="round" />
      <!-- rayon entrant + spectre sortant -->
      <path d="M3 19 H12" stroke="#c9c9d4" stroke-width="2" stroke-linecap="round" />
      <path d="M20 17 L30 12" stroke="url(#prismMark)" stroke-width="2" stroke-linecap="round" opacity="0.9" />
      <path d="M20.5 20 L30.5 18" stroke="url(#prismMark)" stroke-width="2" stroke-linecap="round" opacity="0.6" />
    </svg>

    <span v-if="showWord" class="word">
      <span class="letters">PRISM</span>
      <span class="ebars" aria-hidden="true">
        <i style="background: #e586a2" />
        <i style="background: #9b86df" />
        <i style="background: #5cc9e6" />
      </span>
      <span class="sr">E</span>
    </span>
  </span>
</template>

<style scoped>
.logo {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.word {
  display: inline-flex;
  align-items: center;
  gap: 0.16em;
  font-weight: 700;
  font-size: 1.22rem;
}
.letters {
  color: var(--ink);
  letter-spacing: 0.16em;
  /* compense le letter-spacing en trop après le M */
  margin-right: -0.16em;
}
.ebars {
  display: inline-flex;
  flex-direction: column;
  justify-content: space-between;
  width: 0.58em;
  height: 0.72em;
  /* aligne le bloc sur les capitales plutôt que sur le centre de la ligne */
  transform: translateY(-0.04em);
}
.ebars i {
  display: block;
  height: 0.17em;
  border-radius: 1.5px;
}
.sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
