/**
 * GET /api/depenses
 * Dépenses des administrations publiques (APU) françaises par fonction COFOG,
 * niveaux 1 (divisions) et 2 (sous-fonctions). Source : Eurostat gov_10a_exp via DBnomics.
 * sector S13 = ensemble des APU ; na_item TE = dépense totale.
 */

// Libellés FR. Code "GFdd" = division (niv. 1), "GFdddd" = sous-fonction (niv. 2).
const LABELS: Record<string, string> = {
  GF01: 'Services publics généraux',
  GF0101: 'Organes exécutifs, finances, affaires extérieures',
  GF0102: 'Aide économique extérieure',
  GF0103: 'Services généraux',
  GF0104: 'Recherche fondamentale',
  GF0105: 'R&D Services publics généraux',
  GF0106: 'Services publics généraux n.c.a.',
  GF0107: 'Charge de la dette publique',
  GF0108: 'Transferts généraux entre administrations',
  GF02: 'Défense',
  GF0201: 'Défense militaire',
  GF0202: 'Défense civile',
  GF0203: 'Aide militaire à l’étranger',
  GF0204: 'R&D Défense',
  GF0205: 'Défense n.c.a.',
  GF03: 'Ordre et sécurité publics',
  GF0301: 'Police',
  GF0302: 'Protection civile (incendie)',
  GF0303: 'Tribunaux (justice)',
  GF0304: 'Administration pénitentiaire',
  GF0305: 'R&D Ordre et sécurité',
  GF0306: 'Ordre et sécurité n.c.a.',
  GF04: 'Affaires économiques',
  GF0401: 'Économie générale, commerce, emploi',
  GF0402: 'Agriculture, pêche, forêt',
  GF0403: 'Combustibles et énergie',
  GF0404: 'Industrie, mines, BTP',
  GF0405: 'Transports',
  GF0406: 'Communications',
  GF0407: 'Autres branches',
  GF0408: 'R&D Affaires économiques',
  GF0409: 'Affaires économiques n.c.a.',
  GF05: 'Protection de l’environnement',
  GF0501: 'Gestion des déchets',
  GF0502: 'Gestion des eaux usées',
  GF0503: 'Lutte contre la pollution',
  GF0504: 'Biodiversité et protection de la nature',
  GF0505: 'R&D Environnement',
  GF0506: 'Environnement n.c.a.',
  GF06: 'Logements et équipements collectifs',
  GF0601: 'Logement',
  GF0602: 'Équipements collectifs',
  GF0603: 'Alimentation en eau',
  GF0604: 'Éclairage public',
  GF0605: 'R&D Logement et équipements',
  GF0606: 'Logements et équipements n.c.a.',
  GF07: 'Santé',
  GF0701: 'Produits et matériels médicaux',
  GF0702: 'Services ambulatoires',
  GF0703: 'Services hospitaliers',
  GF0704: 'Santé publique',
  GF0705: 'R&D Santé',
  GF0706: 'Santé n.c.a.',
  GF08: 'Loisirs, culture et culte',
  GF0801: 'Sports et loisirs',
  GF0802: 'Culture',
  GF0803: 'Audiovisuel et édition',
  GF0804: 'Culte et vie associative',
  GF0805: 'R&D Loisirs et culture',
  GF0806: 'Loisirs, culture n.c.a.',
  GF09: 'Enseignement',
  GF0901: 'Préélémentaire et primaire',
  GF0902: 'Secondaire',
  GF0903: 'Post-secondaire non supérieur',
  GF0904: 'Supérieur',
  GF0905: 'Non défini par niveau',
  GF0906: 'Services annexes',
  GF0907: 'R&D Enseignement',
  GF0908: 'Enseignement n.c.a.',
  GF10: 'Protection sociale',
  GF1001: 'Maladie et invalidité',
  GF1002: 'Vieillesse (retraites)',
  GF1003: 'Survie (réversion)',
  GF1004: 'Famille et enfants',
  GF1005: 'Chômage',
  GF1006: 'Logement social',
  GF1007: 'Exclusion sociale',
  GF1008: 'R&D Protection sociale',
  GF1009: 'Protection sociale n.c.a.',
}

const DIVISIONS = ['GF01', 'GF02', 'GF03', 'GF04', 'GF05', 'GF06', 'GF07', 'GF08', 'GF09', 'GF10']
const isGroup = (code: string): boolean => /^GF\d{4}$/.test(code) // sous-fonction (niveau 2)

export default defineCachedEventHandler(
  async (): Promise<DepensesPayload> => {
    // On récupère tous les codes COFOG d'un coup (divisions + sous-fonctions + TOTAL),
    // dans les deux unités.
    const docs = await fetchDbnomicsDocs(
      'Eurostat/GOV_10A_EXP',
      { geo: ['FR'], sector: ['S13'], na_item: ['TE'], unit: ['MIO_EUR', 'PC_GDP'] },
      400,
    )

    // Indexe les points par (code COFOG, unité).
    const byKey = new Map<string, Point[]>()
    for (const doc of docs) {
      byKey.set(`${doc.dimensions.cofog99}|${doc.dimensions.unit}`, toPoints(doc))
    }
    const series = (code: string): UnitSeries => ({
      MIO_EUR: byKey.get(`${code}|MIO_EUR`) ?? [],
      PC_GDP: byKey.get(`${code}|PC_GDP`) ?? [],
    })
    const node = (code: string): CofogNode => ({ code, label: LABELS[code] ?? code, series: series(code) })

    // Sous-fonctions effectivement présentes dans les données, rattachées à leur division.
    const groups = [...byKey.keys()]
      .map((k) => k.split('|')[0]!)
      .filter((code, i, all) => isGroup(code) && all.indexOf(code) === i)

    const functions: CofogFunction[] = DIVISIONS.map((d) => ({
      ...node(d),
      children: groups.filter((g) => g.slice(0, 4) === d).map(node),
    }))

    const total = series('TOTAL')
    const years = total.PC_GDP.map((p) => p.year)

    return {
      geo: 'FR',
      latestYear: years.length ? Math.max(...years) : null,
      functions,
      total,
    }
  },
  { maxAge: 60 * 60 * 24, name: 'depenses-cofog', getKey: () => 'fr-v2' },
)
