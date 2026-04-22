# paie

Assistant paie EVP en Next.js.

## Ce que contient ce dépôt

- un prototype interactif d'assistant EVP
- des parcours guidés par thème : Temps, Absence, Versement, Frais, Fin de contrat, Autre cas
- un moteur métier séparé dans `app/lib/evpEngine.ts`

## Lancer le projet

Prérequis :

- Node.js 20.9 ou supérieur d'après la documentation Next.js

Installation :

```bash
npm install
npm run dev
```

Puis ouvrir [http://localhost:3000](http://localhost:3000).

## Structure

- `app/page.tsx` : interface du prototype
- `app/lib/evpEngine.ts` : règles métier et questions
- `app/globals.css` : styles globaux

## Correctifs déjà intégrés

- purge des réponses cachées quand un changement de branche masque certaines questions
- synthèse copiée et panneau latéral alignés sur les seules réponses visibles
- plafonnement de la réponse sécurisée pour qu'elle ne dépasse pas la réponse technique
- prise en compte plus explicite des justificatifs dans le parcours télétravail

## Prochaine étape recommandée

Faire évoluer ce prototype vers une V2 orientée dossier :

- niveau dossier paie
- découpage en lignes EVP
- traitement ligne par ligne
- synthèse transverse de sécurisation
