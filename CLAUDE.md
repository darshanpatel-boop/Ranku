# Ranku — tier list animés (PWA)

Site web installable sur téléphone pour faire des tier lists d'animés (et de personnages), avec l'API GraphQL d'AniList. Projet séparé de Croc'Savoir (dossier C:\Users\darsh\culture-g).

## Choix techniques (décidés avec l'utilisateur le 2026-11-01)
- JavaScript pur (HTML/CSS/JS), site statique, PAS de framework, pas de serveur, hébergement GitHub Pages.
- PWA installable (manifest + service worker), comme Croc'Savoir.
- API : AniList GraphQL (https://graphql.anilist.co), lecture publique sans clé. Limite ~90 requêtes/min : délais + cache local, imports découpés.
- Glisser-déposer tactile : petite bibliothèque testée (type SortableJS) plutôt que du code maison.
- Sauvegarde locale (localStorage), sans compte. L'export/import JSON a été retiré à la demande de l'utilisateur.

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
- Dev : serveur local `node scripts/dev-server.mjs` (port 5173) ; captures et tests possibles avec Chrome headless (C:/Program Files/Google/Chrome/Application/chrome.exe --headless=new --screenshot=...). Les pages de test de DA sont dans design/ (hors site).
- Push : l'utilisateur autorise commit + git push sur Ranku (voir mémoire), de préférence groupés en fin de bloc de travail. Site : https://darshanpatel-boop.github.io/Ranku/

## État du projet (2026-11-06)
- Étape 1 FAITE : recherche (base locale data/anime.json générée par scripts/build-data.mjs + AniList en complément), tier list, glisser-déposer (SortableJS en forceFallback, SANS placement par sélection), plusieurs listes en onglets, PWA (service worker réseau d'abord), animations de base.
- DA décidée : fond ardoise, accent BLEU (#4f8cff) partout, logo Ran (corail) + ku (bleu), tiers collés avec lettre qui rayonne et légende, « Non classé » = tableau en liège avec polaroïds, boutons en verre translucide. Flèches ▲▼ sur chaque tier, bouton de recherche au-dessus du liège, fenêtre d'ajout (grille d'affiches, puce Ajouter, coche puis Retirer + poubelle au survol, option masquer les ajoutés, filtres, raccourci « / »).
- Retirer un animé de la liste : seulement via la coche dans la fenêtre d'ajout (idée en attente : zone poubelle où glisser).
- Étape 2, partie 1 FAITE (licences calculées au build) : scripts/build-data.mjs relie les animés « liés » (relatedAnime) en groupes, uniquement entre séries/films/OVA/ONA, et seulement si leurs titres se ressemblent (un nom commence comme l'autre ou mêmes 2 premiers mots) pour éviter les méga-groupes (sans ce filtre : un groupe de 1562 animés). Résultat dans data/anime.json : rows[i][8] = id de licence (0 = seul) et groups[id] = indices des lignes (le premier = jaquette : série TV la plus ancienne). Corrections manuelles : data-manual/cuts.json (cuts / solo / join, clés a<idAniList> ou m<idMAL>). Vérifié : Shingeki 17, MHA 21, Naruto 21, Dragon Ball (+Z, GT, Kai, Super, Daima) 36 fusionnés d'office, One Piece séparé. Gros groupes assumés : Gundam 188, Pokémon 116, Conan 70, Doraemon 72.
- Étape 2, partie 2 FAITE, SIMPLIFIÉE à la demande de l'utilisateur : une licence ne contient QUE des séries TV (les films/OVA/ONA rattachés à une série sont retirés de data/anime.json par le build ; les films indépendants restent) ; plus de notion de « vu » ni de tiroir. Modèle de carte = list.items[key] avec key 'g'+clé de la jaquette (ex. ga16498) et m = clés des saisons de la carte ; une carte sans m = animé seul ou saison séparée. Recherche : une carte par licence (pile d'affiches, « N saisons »), un clic sur « Ajouter » ajoute directement la carte. Tier list : badge ×N ; un clic sur une carte (hors glisser) ouvre la fiche : ★ jaquette, Séparer (carte à part juste après), Regrouper, Retirer de ma liste. La licence d'un item est retrouvée par contenu (gidOf(m[0])), pas par un id numérique, car les ids de groupe changent à chaque reconstruction de la base.
- Export image FAIT : bouton « Partager » au-dessus des tiers (fenêtre #dlgShare) : le canvas est dessiné dans app.js (buildShareImage, 1200 px de large) ; les affiches MAL (ACAO: *) et AniList (ACAO reflété) autorisent crossOrigin='anonymous', donc pas de canvas bloqué et pas de proxy. Actions : télécharger le PNG, copier l'image (si ClipboardItem), partage natif Web Share avec fichier (mobile). Option « Ajouter aussi Non classé ».
- Reste à faire : import AniList par pseudo (utilisera les mêmes groupes), puis personnages, import MAL.
- Pas encore fait : étape 2 (fusion des licences via relatedAnime + import AniList par pseudo), étape 3 (personnages), étape 4 (import MAL + export image).
- Pièges rencontrés : ne pas dépendre de l'événement « close » des <dialog> pour valider (on utilise « submit ») ; éviter les classes génériques (.dot) qui entrent en conflit entre fichiers de style ; toujours vérifier le rendu par capture (Chrome headless) plutôt que supposer.
