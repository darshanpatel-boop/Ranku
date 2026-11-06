# Ranku

Site web installable (PWA) pour faire des tier lists d'animés. Sans compte : tout est sauvegardé sur l'appareil, avec export/import JSON.

## Utilisation
- Recherche d'un animé par titre (français, anglais ou japonais), puis ajout dans « Non classé ».
- Placement : toucher l'animé puis choisir le tier, ou le glisser-déposer.
- Tiers personnalisables (nom, couleur, ordre), plusieurs tier lists.

## Développement
Site statique en JavaScript pur, sans compilation. Pour le tester en local : `npx serve .` puis ouvrir l'adresse affichée.

Les données des animés sont générées par un script :
```
node scripts/build-data.mjs
```

## Données
- Base d'animés : [anime-offline-database](https://github.com/manami-project/anime-offline-database) (manami-project), licence [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1.0/). Le fichier `data/anime.json` en est une version réduite.
- Sorties récentes : API [AniList](https://anilist.co).
- Les affiches appartiennent à leurs ayants droit.
