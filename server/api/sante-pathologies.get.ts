/**
 * GET /api/sante-pathologies
 * Dépenses de santé par pathologie — cartographie médicalisée de l'Assurance Maladie.
 * Source : data.ameli (CNAM), dataset "depenses" (API OpenDataSoft Explore v2.1).
 *
 * ⚠️ Les catégories SE CHEVAUCHENT (un patient peut relever de plusieurs pathologies) :
 * ce n'est PAS une partition. On retient les dépenses « tous postes » (dep_niv_1=Dépenses)
 * au niveau agrégé (type_somme=Total), et on exclut la ligne « Total consommants » (grand total).
 */

/** Ligne renvoyée par l'agrégation OpenDataSoft. */
interface AmeliRow {
  patho_niv1: string
  total: number
}

const ANNEE = 2023
const AMELI_URL = 'https://data.ameli.fr/api/explore/v2.1/catalog/datasets/depenses/records'

export default defineCachedEventHandler(
  async (): Promise<SantePathologiesPayload> => {
    const params = new URLSearchParams({
      select: 'patho_niv1,sum(montant) as total',
      where: `year(annee)=${ANNEE} AND dep_niv_1="Dépenses" AND type_somme="Total"`,
      group_by: 'patho_niv1',
      order_by: 'total desc',
      limit: '30',
    })
    const res = await $fetch<{ results: AmeliRow[] }>(`${AMELI_URL}?${params}`)

    const items: PathologyItem[] = (res.results ?? [])
      // Exclut le grand total et garde les montants positifs.
      .filter((r) => r.patho_niv1 && !/^total/i.test(r.patho_niv1) && typeof r.total === 'number' && r.total > 0)
      .map((r) => ({ label: r.patho_niv1, eur: r.total }))
      .sort((a, b) => b.eur - a.eur)
      .slice(0, 12)

    return { year: ANNEE, items }
  },
  { maxAge: 60 * 60 * 24, name: 'sante-pathologies', getKey: () => 'fr' },
)
