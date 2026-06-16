/**
 * GET /api/collectivites
 * Dépenses des collectivités locales (administrations publiques locales, secteur S1313)
 * par fonction COFOG. Source : Eurostat GOV_10A_EXP via DBnomics (MIO_EUR, na_item TE).
 */

/** Les 10 fonctions COFOG (niveau 1) avec leurs libellés FR. */
const DIVISIONS: { code: string; label: string }[] = [
  { code: 'GF01', label: 'Services publics généraux' },
  { code: 'GF02', label: 'Défense' },
  { code: 'GF03', label: 'Ordre et sécurité publics' },
  { code: 'GF04', label: 'Affaires économiques' },
  { code: 'GF05', label: "Protection de l'environnement" },
  { code: 'GF06', label: 'Logements et équipements collectifs' },
  { code: 'GF07', label: 'Santé' },
  { code: 'GF08', label: 'Loisirs, culture et culte' },
  { code: 'GF09', label: 'Enseignement' },
  { code: 'GF10', label: 'Protection sociale' },
]

export default defineCachedEventHandler(
  async (): Promise<CollectivitesPayload> => {
    const docs = await fetchDbnomicsDocs(
      'Eurostat/GOV_10A_EXP',
      { geo: ['FR'], sector: ['S1313'], unit: ['MIO_EUR'], na_item: ['TE'], cofog99: DIVISIONS.map((d) => d.code) },
      40,
    )

    const latest = new Map<string, { year: number; value: number }>()
    for (const doc of docs) {
      const last = latestValue(doc)
      if (last) latest.set(doc.dimensions.cofog99!, last)
    }

    const items: CollectiviteItem[] = DIVISIONS.map((d) => ({ ...d, eur: latest.get(d.code)?.value ?? 0 }))
      .filter((i) => i.eur > 0)
      .sort((a, b) => b.eur - a.eur)
    const totalEur = items.reduce((s, i) => s + i.eur, 0)
    const years = [...latest.values()].map((v) => v.year)

    return { latestYear: years.length ? Math.max(...years) : null, totalEur, items }
  },
  { maxAge: 60 * 60 * 24, name: 'collectivites', getKey: () => 'fr' },
)
