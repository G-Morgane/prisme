/**
 * GET /api/sante-comptes
 * Dépense de santé par prestataire — base SHA (System of Health Accounts),
 * version harmonisée des « Comptes de la santé » (DREES).
 * Source : Eurostat hlth_sha11_hp via DBnomics. Couvre TOUS les financeurs (public + privé).
 */

/** Prestataires SHA de tête (codes HP) + libellés FR + couleur du donut. */
const PROVIDERS: { code: string; label: string; color: string }[] = [
  { code: 'HP1', label: 'Hôpitaux', color: '#4FBEE0' },
  { code: 'HP3', label: 'Soins de ville (ambulatoire)', color: '#5AA6E6' },
  { code: 'HP5', label: 'Biens médicaux (pharmacies, optique…)', color: '#8A82DD' },
  { code: 'HP2', label: 'Soins de longue durée', color: '#A87FD4' },
  { code: 'HP7', label: 'Administration de la santé', color: '#C27BC9' },
  { code: 'HP4', label: 'Services auxiliaires (labos, transport)', color: '#E586A2' },
  { code: 'HP6', label: 'Prévention', color: '#F0AE83' },
]

export default defineCachedEventHandler(
  async (): Promise<SanteComptesPayload> => {
    const docs = await fetchDbnomicsDocs(
      'Eurostat/hlth_sha11_hp',
      { geo: ['FR'], unit: ['MIO_EUR'], icha11_hp: PROVIDERS.map((p) => p.code) },
      50,
    )

    const byCode = new Map<string, Point[]>()
    for (const doc of docs) byCode.set(doc.dimensions.icha11_hp!, toPoints(doc))

    const providers: ProviderSeries[] = PROVIDERS.map((p) => ({ ...p, points: byCode.get(p.code) ?? [] }))
    const years = providers.flatMap((p) => p.points.map((pt) => pt.year))

    return {
      latestYear: years.length ? Math.max(...years) : null,
      providers,
    }
  },
  { maxAge: 60 * 60 * 24, name: 'sante-comptes', getKey: () => 'fr' },
)
