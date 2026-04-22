# paie

Assistant paie EVP en Next.js.

## Ce que contient ce depot

- un workspace V2 de dossier paie multi-EVP
- des parcours guides par theme : Temps, Absence, Versement, Frais, Fin de contrat, Autre cas
- un moteur metier separe dans `app/lib/evpEngine.ts`

## Lancer le projet

Prerequis :

- Node.js 20.9 ou superieur

Installation :

```bash
npm install
npm run dev
```

Puis ouvrir [http://localhost:3000](http://localhost:3000).

## Structure

- `app/page.tsx` : workspace dossier + lignes EVP + assistant de ligne
- `app/lib/evpEngine.ts` : regles metier et questions
- `app/globals.css` : styles globaux

## Ce que la V2 lot 1 apporte

- un niveau dossier paie avec contexte commun
- la creation et la selection de plusieurs lignes EVP
- une synthese transverse du dossier
- un assistant guide conserve a l interieur de chaque ligne
- la purge des reponses cachees quand un changement de branche masque certaines questions
- une synthese et un panneau lateral alignes sur les seules reponses visibles
- un plafonnement de la reponse securisee pour qu elle ne depasse pas la reponse technique
- une prise en compte plus explicite des justificatifs dans le parcours teletravail

## Prochaine etape recommandee

Faire evoluer cette base V2 vers un vrai poste de travail paie :

- decoupage pilote ou assiste en lignes EVP
- pieces justificatives par ligne
- traitement ligne par ligne
- controles transverses entre lignes
- synthese transverse de securisation
