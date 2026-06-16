/**
 * GET /api/depenses-nature
 * Dépense publique par NATURE économique (et non par fonction).
 * Source : Eurostat gov_10a_main via DBnomics (transactions ESA).
 * « Autres » = total (TE) − somme des composantes nommées, pour garantir une partition exacte.
 */

/** Transactions ESA récupérées (TE = total dépense). */
const NA_ITEMS = ['TE', 'D1PAY', 'P2', 'D62PAY', 'D632PAY', 'P51G', 'D41PAY', 'D3PAY']

/** Définition d'affichage des composantes (ordre, libellé, couleur). */
const COMPONENTS: { key: keyof NatureBuckets; label: string; color: string }[] = [
  { key: 'prestations', label: 'Prestations sociales', color: '#4FBEE0' },
  { key: 'salaires', label: 'Rémunération des agents publics', color: '#6E92E6' },
  { key: 'fonctionnement', label: 'Fonctionnement (achats courants)', color: '#8A82DD' },
  { key: 'investissement', label: 'Investissement', color: '#A87FD4' },
  { key: 'autres', label: 'Autres transferts', color: '#C27BC9' },
  { key: 'dette', label: 'Charge de la dette (intérêts)', color: '#E586A2' },
  { key: 'subventions', label: 'Subventions', color: '#F0AE83' },
]

/** Montants regroupés par grande nature, pour une unité donnée. */
interface NatureBuckets {
  prestations: number
  salaires: number
  fonctionnement: number
  investissement: number
  dette: number
  subventions: number
  autres: number
  total: number
}

export default defineCachedEventHandler(
  async (): Promise<NaturePayload> => {
    const docs = await fetchDbnomicsDocs(
      'Eurostat/gov_10a_main',
      { geo: ['FR'], sector: ['S13'], unit: ['PC_GDP', 'MIO_EUR'], na_item: NA_ITEMS },
      40,
    )

    // Dernière valeur par (transaction, unité).
    const latest = new Map<string, { year: number; value: number }>()
    for (const doc of docs) {
      const last = latestValue(doc)
      if (last) latest.set(`${doc.dimensions.na_item}|${doc.dimensions.unit}`, last)
    }
    const get = (na: string, u: Unit): number => latest.get(`${na}|${u}`)?.value ?? 0

    // Regroupe les transactions ESA en grandes natures lisibles.
    const build = (u: Unit): NatureBuckets => {
      const te = get('TE', u)
      const prestations = get('D62PAY', u) + get('D632PAY', u) // espèces + nature
      const named =
        prestations + get('D1PAY', u) + get('P2', u) + get('P51G', u) + get('D41PAY', u) + get('D3PAY', u)
      return {
        prestations,
        salaires: get('D1PAY', u),
        fonctionnement: get('P2', u),
        investissement: get('P51G', u),
        dette: get('D41PAY', u),
        subventions: get('D3PAY', u),
        autres: Math.max(0, te - named), // garantit que tout boucle sur TE
        total: te,
      }
    }
    const pct = build('PC_GDP')
    const eur = build('MIO_EUR')

    const items: NatureItem[] = COMPONENTS.map((c) => ({
      key: c.key,
      label: c.label,
      color: c.color,
      pct: pct[c.key],
      eur: eur[c.key],
    }))

    const years = [...latest.values()].map((v) => v.year)
    return {
      latestYear: years.length ? Math.max(...years) : null,
      items,
      total: { pct: pct.total, eur: eur.total },
    }
  },
  { maxAge: 60 * 60 * 24, name: 'depenses-nature', getKey: () => 'fr' },
)
