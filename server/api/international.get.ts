/**
 * GET /api/international
 * Dépense publique totale par pays, en % du PIB (comparaison européenne).
 * Source : Eurostat GOV_10A_EXP via DBnomics (sector S13, na_item TE, cofog99 TOTAL).
 * On retient la dernière année commune à tous les pays.
 */

const GEOS: { code: string; label: string }[] = [
  { code: 'FR', label: 'France' },
  { code: 'DE', label: 'Allemagne' },
  { code: 'IT', label: 'Italie' },
  { code: 'ES', label: 'Espagne' },
  { code: 'SE', label: 'Suède' },
  { code: 'NL', label: 'Pays-Bas' },
  { code: 'EU27_2020', label: 'Moyenne UE' },
]

export default defineCachedEventHandler(
  async (): Promise<InternationalPayload> => {
    const docs = await fetchDbnomicsDocs(
      'Eurostat/GOV_10A_EXP',
      { geo: GEOS.map((g) => g.code), sector: ['S13'], unit: ['PC_GDP'], na_item: ['TE'], cofog99: ['TOTAL'] },
      30,
    )

    // valeurs par pays → par année
    const byGeo = new Map<string, Map<number, number>>()
    for (const doc of docs) {
      const perYear = new Map<number, number>()
      for (const p of toPoints(doc)) perYear.set(p.year, p.value)
      byGeo.set(doc.dimensions.geo!, perYear)
    }

    // dernière année commune à tous les pays
    const yearSets = [...byGeo.values()].map((m) => new Set(m.keys()))
    const common = [...(yearSets[0] ?? [])].filter((y) => yearSets.every((s) => s.has(y)))
    const year = common.length ? Math.max(...common) : null

    const total: CountryValue[] = GEOS.map((g) => ({
      code: g.code,
      label: g.label,
      value: year ? byGeo.get(g.code)?.get(year) ?? null : null,
    }))
      .filter((g): g is CountryValue => typeof g.value === 'number')
      .sort((a, b) => b.value - a.value)

    return { year, total }
  },
  { maxAge: 60 * 60 * 24, name: 'international', getKey: () => 'eu' },
)
