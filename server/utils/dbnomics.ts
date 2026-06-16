/**
 * Petit client pour l'API DBnomics (https://api.db.nomics.world).
 * Mutualise la construction d'URL et le parsing des séries, utilisés par
 * plusieurs routes (`/api/depenses`, `/api/finances`, `/api/sante-*`…).
 * Auto-importé par Nitro (dossier `server/utils`).
 * Les types partagés (`Point`…) sont auto-importés par Nuxt — pas d'`import` nécessaire.
 */

/** Un document série renvoyé par DBnomics (champs utiles seulement). */
export interface DbnomicsDoc {
  /** Codes des dimensions (ex. { geo: 'FR', unit: 'MIO_EUR', cofog99: 'GF07' }). */
  dimensions: Record<string, string>
  /** Périodes (années sous forme de chaîne, ex. "2023"). */
  period: string[]
  /** Valeurs alignées sur `period` (null = donnée manquante). */
  value: (number | null)[]
}

/** Filtre de dimensions DBnomics : { dimension: [codes autorisés] }. */
export type DbnomicsDimensions = Record<string, string[]>

/**
 * Récupère les séries d'un dataset DBnomics filtrées par dimensions.
 * @param providerDataset  ex. "Eurostat/gov_10a_exp"
 * @param dimensions       ex. { geo: ['FR'], unit: ['MIO_EUR'] }
 * @param limit            nombre max de séries (défaut 100)
 */
export async function fetchDbnomicsDocs(
  providerDataset: string,
  dimensions: DbnomicsDimensions,
  limit = 100,
): Promise<DbnomicsDoc[]> {
  const url =
    `https://api.db.nomics.world/v22/series/${providerDataset}` +
    `?dimensions=${encodeURIComponent(JSON.stringify(dimensions))}` +
    `&observations=1&limit=${limit}`
  const res = await $fetch<{ series: { docs: DbnomicsDoc[] } }>(url)
  return res.series.docs
}

/** Convertit un document DBnomics en série de points exploitables (sans valeurs nulles). */
export function toPoints(doc: DbnomicsDoc): Point[] {
  return doc.period
    .map((p, i) => ({ year: Number(p), value: doc.value[i] }))
    .filter((p): p is Point => Number.isFinite(p.year) && typeof p.value === 'number')
}

/** Dernière valeur (la plus récente) d'un document, ou null. */
export function latestValue(doc: DbnomicsDoc): { year: number; value: number } | null {
  const points = toPoints(doc)
  return points.length ? points[points.length - 1]! : null
}
