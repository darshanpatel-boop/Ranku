# Tier list animés (PWA)

Site web installable sur téléphone pour faire des tier lists d'animés (et de personnages), avec l'API GraphQL d'AniList. Projet séparé de Croc'Savoir (dossier C:\Users\darsh\culture-g).

## Choix techniques (décidés avec l'utilisateur le 2026-11-01)
- JavaScript pur (HTML/CSS/JS), site statique, PAS de framework, pas de serveur, hébergement GitHub Pages.
- PWA installable (manifest + service worker), comme Croc'Savoir.
- API : AniList GraphQL (https://graphql.anilist.co), lecture publique sans clé. Limite ~90 requêtes/min : délais + cache local, imports découpés.
- Glisser-déposer tactile : petite bibliothèque testée (type SortableJS) plutôt que du code maison.
- Sauvegarde locale (localStorage / IndexedDB), sans compte. Export/import JSON pour changer d'appareil.

## Cahier des charges
1. Recherche d'un animé par titre, images fournies par l'API (plus d'import d'images, plus de « pas vu »).
2. Import de la liste AniList par pseudo (filtre « terminé »). Import MyAnimeList : export XML déposé sur le site, retrouvé côté AniList via idMal (Jikan par pseudo en option, moins stable).
3. Fusion des saisons/films d'une même licence via les relations AniList (préquelle/suite...). Fusion AUTOMATIQUE + CORRECTION MANUELLE (séparer/regrouper, choisir la jaquette). Ex. My Hero Academia = 1 carte ; cas ambigus type Dragon Ball / Z / GT / Super.
4. Tier lists de personnages : principaux automatiques depuis les animés importés, recherche de n'importe quel personnage ; les antagonistes n'ont pas de rôle dans AniList, donc ajout manuel.
5. PLUSIEURS tier lists sauvegardées.
6. Export de la tier list en image : à tester tôt (risque de canvas bloqué par CORS sur les images AniList, prévoir un contournement).

## Ordre de travail proposé
1. Recherche + tier list + glisser-déposer + sauvegarde locale + PWA.
2. Import AniList + fusion des licences.
3. Personnages.
4. Import MAL + export image.

## Préférences de l'utilisateur
- Francophone, répondre en français, messages courts.
- Il teste sur son téléphone et fait des retours.
- Il a déjà fait une appli similaire avec l'API AniList : ses anciennes notes iront dans notes/ (voir notes/).
