# Ranku — tier list animés (PWA)

Site web installable sur téléphone pour faire des tier lists d'animés (et de personnages), avec l'API GraphQL d'AniList. Projet séparé de Croc'Savoir (dossier C:\Users\darsh\culture-g).

## Choix techniques (décidés avec l'utilisateur le 2026-11-01)
- JavaScript pur (HTML/CSS/JS), site statique, PAS de framework, pas de serveur, hébergement GitHub Pages.
- PWA installable (manifest + service worker), comme Croc'Savoir.
- API : AniList GraphQL (https://graphql.anilist.co), lecture publique sans clé. Limite ~90 requêtes/min : délais + cache local, imports découpés.
- Glisser-déposer tactile : petite bibliothèque testée (type SortableJS) plutôt que du code maison.
- Sauvegarde locale (localStorage / IndexedDB), sans compte. Export/import JSON pour changer d'appareil.

## Source de données (décidé le 2026-11-01, remplace « AniList seul »)
- Il est INTERDIT d'embarquer des données scrappées d'AniList. On utilise à la place la base **anime-offline-database** (manami-project sur GitHub, ODbL v1.0 + DbCL v1.0, mise à jour hebdo, fichiers dans les Releases du dépôt, version « latest »).
- Contenu : titre, synonymes, type, épisodes, statut, saison/année, affiche/miniature, studios, tags, score, `sources` (URL AniList/MAL…) et `relatedAnime` (URL, pas des identifiants : extraire l'id depuis l'URL). Pas de personnages.
- Rôle de chaque source : la base = recherche (titres + synonymes) et regroupement par licence via `relatedAnime`. L'API AniList = complément pour les animés absents de la base (sorties récentes), les personnages, l'import par pseudo.
- Obligations ODbL : mention visible de la source (page À propos), base dérivée publiée sous ODbL. À FAIRE : lire le fichier LICENSE du dépôt avant de coder.
- Relations de la base potentiellement fautives (ex. One Piece fusionné avec Dragon Ball dans l'ancienne appli) : prévoir un petit fichier de coupures manuelles séparé.
- Les affiches restent hébergées chez les sources (liens) : à tester pour l'export image (CORS).

## Règles pour économiser la limite de session
- NE JAMAIS lire en entier (Read/cat) le gros JSON de la base ni les fichiers de données générés. Le traiter par script (téléchargement, réduction, découpage en petits fichiers) et n'afficher que quelques entrées en exemple + des chiffres.
- Fichier brut téléchargé hors de git (.gitignore), régénérable par le script.
- Pas de modification à la main des données ; corrections manuelles dans un petit fichier à part.
- Une session par étape ou par petite fonctionnalité ; l'utilisateur groupe ses retours.

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
- Il a déjà fait une appli similaire (Animeboxd, devenue Kibō, Expo) : ses anciennes notes sont dans notes/Animeboxd/. Seul ce qui touche à la tier list compte, surtout notes/Animeboxd/Update.md (journal de dev). À retenir : placement tactile « toucher l'animé puis toucher le tier » (plus fiable que le glisser pur), tiers nommables/ajoutables/supprimables, zone « Non classé » en pointillés, pas de note ni de sources de synopsis, pièges de fusion de licences (Dragon Ball, Attaque des Titans, One Piece), choix de jaquette = vraie série TV la plus ancienne, filtrer OAV/spéciaux/clips, cache AniList (30 j terminé / 6 h en cours), pannes AniList fréquentes.
- Interface de l'étape 1 : faire au mieux et simple, il la changera plus tard.
- Prochaine session : commencer l'étape 1 (après le reset hebdo).
