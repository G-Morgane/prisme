import type { Ref } from 'vue'

/**
 * Formatage partagé des montants, selon l'unité courante.
 * - groupage des milliers avec une espace (1610 → « 1 610 »), sans dépendre d'Intl
 * - `fmt` : libellé complet (« 23,4 % du PIB » ou « 1 610 Md€ »)
 * - `shortFmt` : version courte pour les axes de graphe
 *
 * `Unit` provient des types partagés (auto-importés).
 */
export function useFormat(unit: Ref<Unit>) {
  /** Groupe les milliers : 1610 → "1 610". */
  const group = (n: number): string => {
    const s = String(Math.abs(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    return n < 0 ? `-${s}` : s
  }

  /** Libellé complet d'une valeur selon l'unité (€ en milliards, ou % du PIB). */
  const fmt = (v: number | undefined): string => {
    if (v == null) return '—'
    return unit.value === 'PC_GDP' ? `${v.toFixed(1).replace('.', ',')} % du PIB` : `${group(v / 1000)} Md€`
  }

  /** Libellé court pour les graduations d'axe (« 23% » ou « 320 »). */
  const shortFmt = (v: number): string => (unit.value === 'PC_GDP' ? `${Math.round(v)}%` : group(v / 1000))

  return { group, fmt, shortFmt }
}
