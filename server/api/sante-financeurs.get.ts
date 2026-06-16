/**
 * GET /api/sante-financeurs
 * Dépense de santé par FINANCEUR (qui paie ?) — base SHA.
 * Source : Eurostat hlth_sha11_hf via DBnomics.
 * HF1 = administrations publiques & Sécurité sociale ; HF2 = assurances volontaires
 * (mutuelles / complémentaires) ; HF3 = reste à charge des ménages.
 */

const FINANCEURS: { code: string; label: string; color: string }[] = [
  { code: 'HF1', label: 'Sécurité sociale & État (public)', color: '#5AA6E6' },
  { code: 'HF2', label: 'Mutuelles & complémentaires', color: '#A87FD4' },
  { code: 'HF3', label: 'Reste à charge des ménages', color: '#EE9389' },
]

export default defineCachedEventHandler(
  async (): Promise<SanteFinanceursPayload> => {
    const docs = await fetchDbnomicsDocs(
      'Eurostat/hlth_sha11_hf',
      { geo: ['FR'], unit: ['MIO_EUR'], icha11_hf: FINANCEURS.map((f) => f.code) },
      20,
    )

    const latest = new Map<string, { year: number; value: number }>()
    for (const doc of docs) {
      const last = latestValue(doc)
      if (last) latest.set(doc.dimensions.icha11_hf!, last)
    }

    const raw = FINANCEURS.map((f) => ({ ...f, eur: latest.get(f.code)?.value ?? 0 })).filter((f) => f.eur > 0)
    const total = raw.reduce((sum, f) => sum + f.eur, 0)
    const items: FinanceurItem[] = raw.map((f) => ({ ...f, share: total ? (f.eur / total) * 100 : 0 }))

    const years = [...latest.values()].map((v) => v.year)
    return {
      latestYear: years.length ? Math.max(...years) : null,
      total,
      items,
    }
  },
  { maxAge: 60 * 60 * 24, name: 'sante-financeurs', getKey: () => 'fr' },
)
