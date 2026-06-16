/**
 * GET /api/sante-international
 * Dépense de santé comparée entre pays — % du PIB.
 * Source : Eurostat hlth_sha11_hf (TOT_HF, PC_GDP) via DBnomics.
 * On retient la dernière année commune à tous les pays pour une comparaison honnête.
 */

const GEOS: { code: string; label: string }[] = [
  { code: 'FR', label: 'France' },
  { code: 'DE', label: 'Allemagne' },
  { code: 'SE', label: 'Suède' },
  { code: 'IT', label: 'Italie' },
  { code: 'ES', label: 'Espagne' },
  { code: 'EU27_2020', label: 'Moyenne UE' },
]

export default defineCachedEventHandler(
  async (): Promise<SanteInternationalPayload> => {
    const docs = await fetchDbnomicsDocs(
      'Eurostat/hlth_sha11_hf',
      { geo: GEOS.map((g) => g.code), unit: ['PC_GDP'], icha11_hf: ['TOT_HF'] },
      20,
    )

    // Indexe les valeurs par pays puis par année.
    const byGeo = new Map<string, Map<number, number>>()
    for (const doc of docs) {
      const perYear = new Map<number, number>()
      for (const p of toPoints(doc)) perYear.set(p.year, p.value)
      byGeo.set(doc.dimensions.geo!, perYear)
    }

    // Dernière année renseignée pour TOUS les pays (comparaison sur une base homogène).
    const yearSets = [...byGeo.values()].map((m) => new Set(m.keys()))
    const commonYears = [...(yearSets[0] ?? [])].filter((y) => yearSets.every((s) => s.has(y)))
    const year = commonYears.length ? Math.max(...commonYears) : null

    const items: CountryValue[] = GEOS.map((g) => ({
      code: g.code,
      label: g.label,
      value: year ? byGeo.get(g.code)?.get(year) ?? null : null,
    }))
      .filter((g): g is CountryValue => typeof g.value === 'number')
      .sort((a, b) => b.value - a.value)

    return { year, items }
  },
  { maxAge: 60 * 60 * 24, name: 'sante-international', getKey: () => 'fr' },
)
