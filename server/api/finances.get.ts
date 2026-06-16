/**
 * GET /api/finances
 * Grands agrégats des finances publiques (APU) : recettes, dépenses, solde.
 * Source : Eurostat gov_10a_main via DBnomics.
 * na_item : TR (recettes), TE (dépenses), B9 (capacité(+)/besoin(−) de financement).
 */

type NaItem = 'TR' | 'TE' | 'B9'

export default defineCachedEventHandler(
  async (): Promise<FinancesPayload> => {
    const docs = await fetchDbnomicsDocs(
      'Eurostat/gov_10a_main',
      { geo: ['FR'], sector: ['S13'], unit: ['PC_GDP', 'MIO_EUR'], na_item: ['TR', 'TE', 'B9'] },
      20,
    )

    const latest = new Map<string, { year: number; value: number }>()
    for (const doc of docs) {
      const last = latestValue(doc)
      if (last) latest.set(`${doc.dimensions.na_item}|${doc.dimensions.unit}`, last)
    }
    const grab = (na: NaItem): Aggregate => ({
      pct: latest.get(`${na}|PC_GDP`)?.value ?? null,
      eur: latest.get(`${na}|MIO_EUR`)?.value ?? null,
    })

    const years = [...latest.values()].map((v) => v.year)
    return {
      latestYear: years.length ? Math.max(...years) : null,
      recettes: grab('TR'),
      depenses: grab('TE'),
      solde: grab('B9'),
    }
  },
  { maxAge: 60 * 60 * 24, name: 'finances', getKey: () => 'fr' },
)
