/**
 * Types partagés entre l'app (Vue) et le serveur (Nitro).
 * Le dossier `shared/types` est auto-importé par Nuxt 4 des deux côtés :
 * pas besoin d'`import` dans les composants / routes serveur.
 */

// ─── Unités & séries temporelles ──────────────────────────────────────────────

/** Unité d'affichage d'un montant : millions d'euros, ou pourcentage du PIB. */
export type Unit = 'MIO_EUR' | 'PC_GDP'

/** Un point d'une série annuelle. */
export interface Point {
  year: number
  value: number
}

/** Série annuelle déclinée dans les deux unités. */
export type UnitSeries = Record<Unit, Point[]>

// ─── Dépenses par fonction (COFOG) — /api/depenses ─────────────────────────────

/** Un poste ou sous-poste COFOG : code, libellé FR, et ses séries. */
export interface CofogNode {
  code: string
  label: string
  series: UnitSeries
}

/** Une division COFOG (niveau 1) et ses sous-fonctions (niveau 2). */
export interface CofogFunction extends CofogNode {
  children: CofogNode[]
}

/** Réponse de /api/depenses : arbre COFOG complet + total APU. */
export interface DepensesPayload {
  geo: string
  latestYear: number | null
  functions: CofogFunction[]
  total: UnitSeries
}

// ─── Dépense par nature économique — /api/depenses-nature ──────────────────────

/** Une composante économique (salaires, prestations…) avec ses montants. */
export interface NatureItem {
  key: string
  label: string
  color: string
  pct: number
  eur: number
}

export interface NaturePayload {
  latestYear: number | null
  items: NatureItem[]
  total: { pct: number; eur: number }
}

// ─── Agrégats des finances publiques — /api/finances ───────────────────────────

/** Un agrégat exprimé dans les deux unités (null si indisponible). */
export interface Aggregate {
  pct: number | null
  eur: number | null
}

export interface FinancesPayload {
  latestYear: number | null
  recettes: Aggregate
  depenses: Aggregate
  /** Solde public : négatif = déficit. */
  solde: Aggregate
}

// ─── Santé : comptes par prestataire — /api/sante-comptes ──────────────────────

export interface ProviderSeries {
  code: string
  label: string
  color: string
  points: Point[]
}

export interface SanteComptesPayload {
  latestYear: number | null
  providers: ProviderSeries[]
}

// ─── Santé : financeurs — /api/sante-financeurs ────────────────────────────────

export interface FinanceurItem {
  code: string
  label: string
  color: string
  eur: number
  /** Part en % du total santé. */
  share: number
}

export interface SanteFinanceursPayload {
  latestYear: number | null
  total: number
  items: FinanceurItem[]
}

// ─── Santé : comparaison internationale — /api/sante-international ──────────────

export interface CountryValue {
  code: string
  label: string
  value: number
}

export interface SanteInternationalPayload {
  year: number | null
  items: CountryValue[]
}

// ─── Santé : par pathologie — /api/sante-pathologies ───────────────────────────

export interface PathologyItem {
  label: string
  /** Montant en euros bruts (source CNAM). */
  eur: number
}

export interface SantePathologiesPayload {
  year: number | null
  items: PathologyItem[]
}

// ─── Budget de l'État (LOLF) — /api/budget-etat ────────────────────────────────

/** Un programme au sein d'une mission (montant en CP, euros). */
export interface ProgrammeItem {
  label: string
  cp: number
}

/** Une mission budgétaire (montant en CP, euros) et ses programmes. */
export interface MissionItem {
  label: string
  cp: number
  programmes: ProgrammeItem[]
}

/** Une nature de dépense LOLF (titre) : personnel, fonctionnement, intervention… */
export interface TitreItem {
  code: string
  label: string
  cp: number
}

export interface BudgetEtatPayload {
  year: number
  /** Loi de référence (ex. "PLF"). */
  loi: string
  /** Total du budget général (toutes missions). */
  totalBrut: number
  /** Total hors « Remboursements et dégrèvements » (mécanique fiscale). */
  totalNet: number
  /** Missions hors remboursements/dégrèvements, triées par poids. */
  missions: MissionItem[]
  /** Répartition par titre (nature LOLF). */
  titres: TitreItem[]
}

// ─── Évolution de la dépense de l'État — /api/etat-evolution ───────────────────

/** Trajectoire de la dépense de l'administration centrale (S1311), en % du PIB. */
export interface EtatEvolutionPayload {
  latestYear: number | null
  points: Point[]
}

// ─── Types présentationnels (composants de viz) ────────────────────────────────

/** Item générique pour le donut (PrismDonut). */
export interface DonutItem {
  code: string
  label: string
  value: number
  color: string
}

/** Une série pour le graphe linéaire (PrismLine). `color: null` => dégradé prisme. */
export interface LineSeries {
  id: string
  label: string
  color: string | null
  points: Point[]
}
