/**
 * GET /api/dette
 * Dette publique brute (% du PIB) et charge de la dette (intérêts, % du PIB).
 * Sources Eurostat via DBnomics : gov_10dd_edpt1 (dette, na_item GD) et
 * gov_10a_main (intérêts, na_item D41PAY).
 */
export default defineCachedEventHandler(
  async (): Promise<DettePayload> => {
    const [detteDocs, interetsDocs] = await Promise.all([
      fetchDbnomicsDocs('Eurostat/gov_10dd_edpt1', { geo: ['FR'], sector: ['S13'], unit: ['PC_GDP'], na_item: ['GD'] }, 10),
      fetchDbnomicsDocs('Eurostat/gov_10a_main', { geo: ['FR'], sector: ['S13'], unit: ['PC_GDP'], na_item: ['D41PAY'] }, 10),
    ])

    const dette = detteDocs[0] ? toPoints(detteDocs[0]) : []
    const interets = interetsDocs[0] ? toPoints(interetsDocs[0]) : []
    const years = dette.map((p) => p.year)

    return { latestYear: years.length ? Math.max(...years) : null, dette, interets }
  },
  { maxAge: 60 * 60 * 24, name: 'dette', getKey: () => 'fr' },
)
