// Dépenses des administrations publiques (APU) par fonction COFOG.
// Source : Eurostat gov_10a_exp, via l'API DBnomics (JSON, sans clé).
// sector S13 = ensemble des administrations publiques ; na_item TE = dépense totale.

const PROVIDER = 'Eurostat/GOV_10A_EXP'

// Les 10 divisions COFOG + libellés FR + couleur de la part au donut.
const COFOG: { code: string; label: string; color: string }[] = [
  { code: 'GF01', label: 'Services publics généraux', color: '#6b7280' },
  { code: 'GF02', label: 'Défense', color: '#4b5563' },
  { code: 'GF03', label: 'Ordre et sécurité publics', color: '#0ea5e9' },
  { code: 'GF04', label: 'Affaires économiques', color: '#6366f1' },
  { code: 'GF05', label: "Protection de l'environnement", color: '#22c55e' },
  { code: 'GF06', label: 'Logements et équipements collectifs', color: '#14b8a6' },
  { code: 'GF07', label: 'Santé', color: '#ef4444' },
  { code: 'GF08', label: 'Loisirs, culture et culte', color: '#f59e0b' },
  { code: 'GF09', label: 'Enseignement', color: '#8b5cf6' },
  { code: 'GF10', label: 'Protection sociale', color: '#ec4899' },
]

type Point = { year: number; value: number }
type Unit = 'MIO_EUR' | 'PC_GDP'

interface DbnomicsDoc {
  series_code: string
  dimensions: Record<string, string>
  period: string[]
  value: (number | null)[]
}

function toPoints(doc: DbnomicsDoc): Point[] {
  return doc.period
    .map((p, i) => ({ year: Number(p), value: doc.value[i] }))
    .filter((p): p is Point => Number.isFinite(p.year) && typeof p.value === 'number')
}

export default defineCachedEventHandler(
  async () => {
    const dimensions = {
      geo: ['FR'],
      sector: ['S13'],
      na_item: ['TE'],
      unit: ['MIO_EUR', 'PC_GDP'],
      cofog99: [...COFOG.map((c) => c.code), 'TOTAL'],
    }
    const url =
      `https://api.db.nomics.world/v22/series/${PROVIDER}` +
      `?dimensions=${encodeURIComponent(JSON.stringify(dimensions))}` +
      `&observations=1&limit=100`

    const res = await $fetch<{ series: { docs: DbnomicsDoc[] } }>(url)
    const docs = res.series.docs

    // Indexe les séries par (cofog99, unit).
    const byKey = new Map<string, Point[]>()
    for (const doc of docs) {
      const key = `${doc.dimensions.cofog99}|${doc.dimensions.unit}`
      byKey.set(key, toPoints(doc))
    }

    const series = (code: string) => ({
      MIO_EUR: byKey.get(`${code}|MIO_EUR`) ?? [],
      PC_GDP: byKey.get(`${code}|PC_GDP`) ?? [],
    })

    const functions = COFOG.map((c) => ({ ...c, series: series(c.code) }))
    const total = series('TOTAL')

    const years = total.PC_GDP.map((p) => p.year)
    const latestYear = years.length ? Math.max(...years) : null

    return { geo: 'FR', latestYear, functions, total } satisfies {
      geo: string
      latestYear: number | null
      functions: { code: string; label: string; color: string; series: Record<Unit, Point[]> }[]
      total: Record<Unit, Point[]>
    }
  },
  { maxAge: 60 * 60 * 24, name: 'depenses-cofog', getKey: () => 'fr' },
)
