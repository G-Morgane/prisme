/**
 * GET /api/etat-evolution
 * Évolution de la dépense de l'administration centrale (≈ État + organismes), en % du PIB.
 * Source : Eurostat gov_10a_main via DBnomics, sector S1311 (administration centrale),
 * na_item TE (dépense totale). Base comptabilité nationale — distincte du budget LOLF.
 */
export default defineCachedEventHandler(
  async (): Promise<EtatEvolutionPayload> => {
    const docs = await fetchDbnomicsDocs(
      'Eurostat/gov_10a_main',
      { geo: ['FR'], sector: ['S1311'], unit: ['PC_GDP'], na_item: ['TE'] },
      10,
    )
    const points = docs[0] ? toPoints(docs[0]) : []
    const years = points.map((p) => p.year)
    return { latestYear: years.length ? Math.max(...years) : null, points }
  },
  { maxAge: 60 * 60 * 24, name: 'etat-evolution', getKey: () => 'fr' },
)
