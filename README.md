# Prisme

**Les données publiques, en toute clarté.**

Prisme décompose la dépense publique française — État, Sécurité sociale et collectivités — par fonction, et la suit dans le temps. Répartition par poste, évolution depuis 1995, comparaison de plusieurs postes en parallèle, et repères chronologiques (mandats présidentiels).

## Données

- **Source** : Eurostat `gov_10a_exp` — dépenses des administrations publiques par fonction (classification **COFOG**), secteur S13 (ensemble des APU).
- **Accès** : API [DBnomics](https://db.nomics.world/) (JSON, sans clé), agrégée côté serveur dans `server/api/depenses.get.ts` (cache 24 h).
- **Unités** : % du PIB et milliards d'euros.
- Dernier millésime fonctionnel disponible : **2023** (~18 mois de décalage).

## Stack

- [Nuxt 4](https://nuxt.com/) / Vue 3
- Graphiques **faits main en SVG** (aucune librairie de charts) : donut, courbes multi-séries, frise chronologique
- Identité visuelle « prisme » iridescente, police Manrope

## Développement

```bash
npm install
npm run dev      # http://localhost:3002
```

```bash
npm run build    # build de production
npm run preview
```

## Structure

```
app/
  app.vue                  # page principale
  assets/css/main.css      # tokens & identité visuelle
  components/
    PrismLogo.vue          # logo + wordmark
    PrismDonut.vue         # répartition (donut SVG, multi-sélection)
    PrismLine.vue          # évolution / comparaison (courbes SVG)
    PrismTimeline.vue      # frise des présidents, alignée sur l'axe temporel
server/
  api/depenses.get.ts      # récupération & mise en forme des données COFOG
```

---

Données ouvertes Eurostat. Projet personnel.
