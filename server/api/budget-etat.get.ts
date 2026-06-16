/**
 * GET /api/budget-etat
 * Budget de l'État (nomenclature LOLF) — PLF 2025, budget général.
 * Source : data.economie.gouv.fr, dataset "plf25-depenses-2025-selon-destination"
 * (API OpenDataSoft Explore v2.1). Montants en crédits de paiement (CP), euros.
 *
 * On exclut la mission « Remboursements et dégrèvements » (mécanique fiscale, ~147 Md€)
 * du détail des missions et du total « net », car elle fausse la lecture.
 */

const DATASET = 'plf25-depenses-2025-selon-destination'
const BASE = `https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/${DATASET}/records`
const REMBOURSEMENTS = 'Remboursements et dégrèvements'

/** Libellés des titres LOLF (nature de la dépense). */
const TITRE_LABELS: Record<string, string> = {
  '1': 'Pouvoirs publics',
  '2': 'Personnel (salaires)',
  '3': 'Fonctionnement',
  '4': 'Charge de la dette',
  '5': 'Investissement',
  '6': 'Intervention (aides, transferts)',
  '7': 'Opérations financières',
}

/** Récupère une agrégation (group_by + sum CP) du budget général, filtre optionnel. */
async function aggregateByCP(groupBy: string, where = 'typebudget="BG"'): Promise<{ key: string; cp: number }[]> {
  const params = new URLSearchParams({
    select: `${groupBy},sum(credit_de_paiement) as cp`,
    where,
    group_by: groupBy,
    order_by: 'cp desc',
    limit: '100',
  })
  const res = await $fetch<{ results: Record<string, number | string>[] }>(`${BASE}?${params}`)
  return (res.results ?? []).map((r) => ({ key: String(r[groupBy] ?? ''), cp: Number(r.cp) || 0 }))
}

/** Arbre mission → programme (CP) en un seul appel (group_by multi-champs). */
async function fetchProgrammes(): Promise<{ mission: string; programme: string; cp: number }[]> {
  const params = new URLSearchParams({
    select: 'libelle_mission,libelle_programme,sum(credit_de_paiement) as cp',
    where: 'typebudget="BG"',
    group_by: 'libelle_mission,libelle_programme',
    order_by: 'cp desc',
    limit: '400',
  })
  const res = await $fetch<{ results: { libelle_mission: string; libelle_programme: string; cp: number }[] }>(`${BASE}?${params}`)
  return (res.results ?? []).map((r) => ({ mission: r.libelle_mission, programme: r.libelle_programme, cp: Number(r.cp) || 0 }))
}

export default defineCachedEventHandler(
  async (): Promise<BudgetEtatPayload> => {
    const [byMission, byTitre, byProgramme] = await Promise.all([
      aggregateByCP('libelle_mission'),
      // par titre : on exclut les remboursements/dégrèvements pour rester cohérent avec le net
      aggregateByCP('titre', `typebudget="BG" AND libelle_mission!="${REMBOURSEMENTS}"`),
      fetchProgrammes(),
    ])

    // Programmes regroupés par mission (triés par poids).
    const progByMission = new Map<string, ProgrammeItem[]>()
    for (const r of byProgramme) {
      if (!r.programme) continue
      const list = progByMission.get(r.mission) ?? []
      list.push({ label: r.programme, cp: r.cp })
      progByMission.set(r.mission, list)
    }

    const totalBrut = byMission.reduce((s, m) => s + m.cp, 0)
    const missions: MissionItem[] = byMission
      .filter((m) => m.key && m.key !== REMBOURSEMENTS && m.cp > 0)
      .map((m) => ({
        label: m.key,
        cp: m.cp,
        programmes: (progByMission.get(m.key) ?? []).sort((a, b) => b.cp - a.cp),
      }))
    const totalNet = missions.reduce((s, m) => s + m.cp, 0)

    const titres: TitreItem[] = byTitre
      .filter((t) => t.cp > 0)
      .map((t) => ({ code: t.key, label: TITRE_LABELS[t.key] ?? `Titre ${t.key}`, cp: t.cp }))
      .sort((a, b) => b.cp - a.cp)

    return { year: 2025, loi: 'PLF', totalBrut, totalNet, missions, titres }
  },
  { maxAge: 60 * 60 * 24, name: 'budget-etat', getKey: () => 'plf2025-prog' },
)
