// Glossaire partagé : définitions COFOG par code (pour le survol des sous-postes)
// et notions générales (pour la page Dictionnaire).

export const COFOG_DEFS: Record<string, string> = {
  // Niveau 1 — les 10 grandes fonctions
  GF01: "Fonctionnement général de l'État et des collectivités : exécutif, législatif, gestion des finances publiques, affaires étrangères — et la charge de la dette.",
  GF02: 'Forces armées, défense civile et aide militaire à l’étranger.',
  GF03: 'Police, justice, prisons et secours (pompiers, protection civile).',
  GF04: "Soutien à l'activité économique : transports, agriculture, énergie, emploi, industrie…",
  GF05: 'Gestion des déchets et des eaux usées, lutte contre la pollution, protection de la nature.',
  GF06: 'Logement, aménagement urbain, alimentation en eau, éclairage public.',
  GF07: 'Dépenses de santé : hôpitaux, soins de ville, médicaments, prévention.',
  GF08: 'Sport, culture, audiovisuel public, vie associative et cultuelle.',
  GF09: 'Éducation, du primaire au supérieur, et services annexes (cantines, transport scolaire…).',
  GF10: 'Prestations sociales : retraites, maladie, famille, chômage, pauvreté, logement social.',

  // Niveau 2 — sous-fonctions
  GF0101: 'Fonctionnement des gouvernements et parlements, administration fiscale et financière, diplomatie.',
  GF0102: "Aide au développement et transferts économiques vers d'autres pays.",
  GF0103: 'Services administratifs transversaux (gestion des agents publics, achats, bâtiments…).',
  GF0104: 'Recherche scientifique sans application précise prédéfinie.',
  GF0105: "Recherche & développement liée à l'administration générale.",
  GF0106: 'Administration générale non classée dans les autres sous-fonctions.',
  GF0107: "Intérêts payés chaque année par l'État sur sa dette (hors remboursement du capital).",
  GF0108: "Versements entre niveaux d'administration non affectés à une fonction précise.",
  GF0201: 'Forces armées : personnel, équipements et opérations militaires.',
  GF0202: 'Protection des populations et infrastructures en cas de crise ou de guerre.',
  GF0203: "Soutien militaire apporté à d'autres pays.",
  GF0204: 'Recherche militaire.',
  GF0205: 'Dépenses de défense non classées ailleurs.',
  GF0301: "Forces de police et maintien de l'ordre.",
  GF0302: 'Pompiers et secours (protection civile).',
  GF0303: 'Justice : tribunaux, magistrature, aide juridictionnelle.',
  GF0304: 'Prisons et réinsertion des détenus.',
  GF0305: 'Recherche dans le domaine de la sécurité.',
  GF0306: 'Ordre et sécurité non classés ailleurs.',
  GF0401: "Politiques économiques générales, régulation des marchés, soutien à l'emploi.",
  GF0402: 'Soutien à l’agriculture, la pêche, la forêt et la chasse.',
  GF0403: 'Politique énergétique et soutien aux filières de combustibles et d’énergie.',
  GF0404: 'Soutien à l’industrie, aux mines et à la construction (BTP).',
  GF0405: 'Routes, rail, transports en commun, ports, aéroports.',
  GF0406: 'Postes et télécommunications.',
  GF0407: 'Autres secteurs économiques (tourisme, commerce…).',
  GF0408: 'Recherche appliquée à l’économie.',
  GF0409: 'Soutien économique non classé ailleurs.',
  GF0501: 'Collecte et traitement des déchets.',
  GF0502: 'Assainissement et traitement des eaux usées.',
  GF0503: 'Réduction des pollutions de l’air, des sols et du bruit.',
  GF0504: 'Préservation des espèces et des espaces naturels.',
  GF0505: 'Recherche environnementale.',
  GF0506: 'Protection de l’environnement non classée ailleurs.',
  GF0601: 'Politique du logement : aides à la construction et à l’habitat.',
  GF0602: 'Aménagement et développement urbain.',
  GF0603: 'Distribution d’eau potable.',
  GF0604: 'Éclairage des voies publiques.',
  GF0605: 'Recherche sur l’habitat et l’urbanisme.',
  GF0606: 'Logements et équipements collectifs non classés ailleurs.',
  GF0701: 'Médicaments, prothèses, lunettes, appareils et matériel médical.',
  GF0702: 'Soins de ville hors hôpital : médecins, dentistes, infirmiers, laboratoires…',
  GF0703: 'Hôpitaux et cliniques : séjours et soins hospitaliers.',
  GF0704: 'Prévention : vaccination, dépistage, veille et campagnes sanitaires.',
  GF0705: 'Recherche médicale.',
  GF0706: 'Santé non classée ailleurs (administration des régimes d’assurance maladie…).',
  GF0801: 'Équipements et activités sportives et de loisir.',
  GF0802: 'Musées, patrimoine, spectacle vivant, bibliothèques.',
  GF0803: 'Radio et télévision publiques, édition.',
  GF0804: 'Soutien aux cultes et à la vie associative.',
  GF0805: 'Recherche dans le domaine des loisirs et de la culture.',
  GF0806: 'Loisirs, culture et culte non classés ailleurs.',
  GF0901: 'École maternelle et élémentaire.',
  GF0902: 'Collèges et lycées.',
  GF0903: 'Formations entre le bac et le supérieur (peu développées en France).',
  GF0904: 'Universités et grandes écoles.',
  GF0905: 'Dépenses d’éducation non rattachées à un niveau précis.',
  GF0906: 'Services annexes : cantines, transport scolaire, internats, médecine scolaire…',
  GF0907: 'Recherche liée à l’éducation.',
  GF0908: 'Enseignement non classé ailleurs.',
  GF1001: 'Indemnités journalières maladie, pensions d’invalidité et prise en charge du handicap.',
  GF1002: 'Pensions de retraite — de loin le plus gros poste de dépense publique.',
  GF1003: 'Pensions versées au conjoint survivant après le décès (pensions de réversion).',
  GF1004: 'Allocations familiales, congés parentaux, aides à la garde d’enfants.',
  GF1005: 'Allocations chômage et accompagnement vers l’emploi.',
  GF1006: 'Aides au logement (APL et assimilées).',
  GF1007: 'Lutte contre la pauvreté : RSA et autres minima sociaux.',
  GF1008: 'Recherche dans le champ de la protection sociale.',
  GF1009: 'Administration des régimes sociaux et dépenses sociales non classées ailleurs.',
}

// Les 10 postes COFOG (niveau 1) avec un slug d'URL — sert au menu et au routing.
export interface Poste {
  code: string
  slug: string
  label: string
  /**
   * enriched = a une analyse approfondie (source en plus de la décompo COFOG du dashboard).
   * Seuls les postes enrichis sont listés dans la sidebar pour ne pas la surcharger.
   */
  enriched?: boolean
  /** Missions du budget de l'État rattachées à ce poste (onglet « Budget de l'État »). */
  missions?: string[]
}
export const POSTES: Poste[] = [
  { code: 'GF10', slug: 'protection-sociale', label: 'Protection sociale', enriched: true },
  { code: 'GF07', slug: 'sante', label: 'Santé', enriched: true },
  { code: 'GF09', slug: 'enseignement', label: 'Enseignement', enriched: true, missions: ['Enseignement scolaire', 'Recherche et enseignement supérieur'] },
  { code: 'GF04', slug: 'affaires-economiques', label: 'Affaires économiques' },
  { code: 'GF01', slug: 'services-publics-generaux', label: 'Services publics généraux' },
  { code: 'GF03', slug: 'ordre-securite', label: 'Ordre et sécurité publics', enriched: true, missions: ['Sécurités', 'Justice'] },
  { code: 'GF02', slug: 'defense', label: 'Défense', enriched: true, missions: ['Défense'] },
  { code: 'GF06', slug: 'logements', label: 'Logements et équipements collectifs' },
  { code: 'GF08', slug: 'loisirs-culture', label: 'Loisirs, culture et culte' },
  { code: 'GF05', slug: 'environnement', label: "Protection de l'environnement" },
]
export const posteBySlug = (slug: string) => POSTES.find((p) => p.slug === slug)

export interface Term {
  term: string
  def: string
}

export const GENERAL: Term[] = [
  {
    term: 'PIB (Produit intérieur brut)',
    def: "La richesse produite en France en un an. Rapporter une dépense au PIB permet de la comparer dans le temps et entre pays, indépendamment de l'inflation et de la taille de l'économie.",
  },
  {
    term: 'Dépense publique',
    def: "L'ensemble des dépenses des administrations publiques : prestations sociales, salaires des agents, investissements, intérêts de la dette, aides aux entreprises et aux ménages. En France, elle représente environ 57 % du PIB.",
  },
  {
    term: 'Administrations publiques (APU)',
    def: "Les trois sphères publiques réunies : l'État (et ses organismes), les collectivités locales (APUL) et la Sécurité sociale (ASSO). Prisme couvre l'ensemble des APU.",
  },
  {
    term: '% du PIB',
    def: 'Exprime une dépense en proportion de la richesse nationale. Plus parlant que l’euro courant pour suivre une tendance ou comparer des pays de tailles différentes.',
  },
  {
    term: 'COFOG (CFAP en français)',
    def: 'Classification internationale des fonctions des administrations publiques. Elle range la dépense par finalité (santé, éducation, défense…) en 10 grandes fonctions (niveau 1) et leurs sous-fonctions (niveau 2).',
  },
  {
    term: 'Niveau 1 / niveau 2',
    def: 'Niveau 1 = les 10 grands postes COFOG. Niveau 2 = leur détail (ex. Santé → hospitalier, ambulatoire, médicaments…). Eurostat ne descend pas plus bas.',
  },
  {
    term: 'n.c.a. (non classé ailleurs)',
    def: 'Catégorie résiduelle d’une fonction, pour les dépenses qui n’entrent dans aucune sous-fonction précise (administration des régimes, dépenses multi-usages…). Généralement faible.',
  },
  {
    term: 'R&D',
    def: 'Recherche & développement. Dans COFOG, chaque grande fonction possède une ligne R&D dédiée — souvent très petite, parfois nulle.',
  },
  {
    term: 'Charge de la dette',
    def: 'Les intérêts que l’État paie chaque année sur sa dette (à distinguer du remboursement du capital). Classée dans les Services publics généraux.',
  },
  {
    term: 'Réversion',
    def: 'Part de la retraite d’une personne décédée reversée à son conjoint survivant. Relève de la sous-fonction « Survie » de la protection sociale.',
  },
  {
    term: 'Sécurité sociale',
    def: 'Le système qui finance la protection sociale (maladie, retraite, famille…). C’est l’une des trois composantes des administrations publiques et le principal financeur des prestations sociales.',
  },
  {
    term: 'Eurostat',
    def: "Office statistique de l'Union européenne. Source des données de Prisme (jeu de données gov_10a_exp), récupérées via l'API DBnomics.",
  },
  {
    term: 'Recettes publiques',
    def: "Tout ce que perçoivent les administrations publiques : impôts, cotisations sociales, et autres recettes (revenus du domaine, amendes…). En France ~51-52 % du PIB. Les dépenses (~57 %) leur sont supérieures, l'écart étant le déficit.",
  },
  {
    term: 'Prélèvements obligatoires',
    def: "La partie des recettes publiques constituée des impôts et des cotisations sociales versés de façon obligatoire. En France ~43-44 % du PIB. Sous-ensemble des recettes publiques.",
  },
  {
    term: 'Déficit public',
    def: "Quand les dépenses publiques dépassent les recettes sur une année. Il est comblé par l'emprunt. En 2024, ~5,8 % du PIB. À ne pas confondre avec la dette (le cumul des déficits passés).",
  },
  {
    term: 'Dette publique',
    def: "Le total de ce que doivent les administrations publiques, accumulé au fil des déficits successifs. Chaque année de déficit l'augmente. Les intérêts versés dessus sont la « charge de la dette ».",
  },
]
