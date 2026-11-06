
> [!note]- 📅 Session dev — Animeboxd — 25/08/2026
> **Setup**
> 
> - Création du projet `animeboxd` (Expo, SDK 54)
> - Structure en 4 onglets posée : Accueil, Tier List, Top, Profil (via Expo Router)
> 
> **Écran Accueil**
> 
> - Barre de recherche connectée à l'API AniList (GraphQL)
> - Résultats triés par popularité pour de meilleurs matchs de recherche
> - Bouton "Ajouter" sur chaque résultat → sauvegarde dans le stockage local (AsyncStorage)
> - État "Ajouté ✓" qui persiste même après fermeture complète de l'appli
> 
> **Écran Tier List**
> 
> - Auto-population : tous les animés ajoutés depuis l'Accueil apparaissent automatiquement ici (rechargé à chaque visite de l'onglet)
> - Regroupement visuel par tier (S/A/B/C/D, chacun avec sa couleur)
> - Placement par appui long → menu contextuel qui s'ouvre près du point d'appui (façon menu Android), juste les lettres de tier, pas de mot "Tier"
> - Option pour désassigner un animé → retour en zone "Non classé"
> - Zone "Non classé" avec un style distinct (cadre pointillé) pour bien la différencier des vrais tiers
> 
> **À faire prochaine session**
> 
> - Onglet Top (classements 3/5/10, même logique d'auto-population)
> - Réfléchir au vrai design (actuellement 100% brut/sans style)
> - Plus tard : regroupement des animés par licence (ex. Dragon Ball / Dragon Ball Z ensemble)

> [!note]- 📅 Session dev — Animeboxd — 26/08/2026
> **Fusion Tier List / Top**
> 
> - Les deux vivent maintenant dans un seul onglet "Classements" avec un sélecteur en haut (Tier List / Top)
> - Ancien onglet "Top" recyclé en écran Liste (accessible depuis la barre du bas)
> 
> **Écran Liste**
> 
> - Toggle grille / liste verticale
> - Menu de tri : Date d'ajout, Alphabétique, Note
> - Compteur du nombre total d'animés
> - Boutons Trier / Filtrer (Filtrer encore juste visuel, pas fonctionnel)
> 
> **Fiche détails d'un animé (nouveau)**
> 
> - Accessible en tapant sur l'image d'un animé (recherche ou Liste)
> - Affiche synopsis, genres, année, épisodes, note AniList
> - Bouton Ajouter/Retirer de sa liste
> - Système de notation sur 10 intégré directement dans la fiche
> - Le bouton "Ajouter" a été retiré de la recherche — tout passe maintenant par la fiche
> 
> **Onglet Top**
> 
> - Construction d'un classement personnalisé (ajout, réordonnement, suppression)
> - Bug de réordonnement corrigé (boutons remplacés pour plus de fiabilité)
> 
> **Partage**
> 
> - Bouton de partage fonctionnel sur Tier List et Top — capture ce qui est affiché à l'écran et ouvre le partage natif (réseaux, galerie, etc.)
> 
> **À faire prochaine session**
> 
> - Onglet Profil (encore vide)
> - Filtre réel dans l'onglet Liste (par genre probablement)
> - Traduction des genres (actuellement en anglais, viennent de l'API)
> - Design/DA général (tout est encore très brut visuellement)
> - Plus tard : regroupement par licence, comptes + follow

> [!note]- 📅 Session dev — Animeboxd — 27/08/2026
> **Onglet Profil (construit de zéro)**
> 
> - 3 cartes stats : nombre total d'animés, note moyenne, nombre notés
> - Section "Derniers ajoutés" (5 plus récents)
> - Section "Mes favoris" (max 5, sans note affichée — les favoris c'est un coup de cœur, pas une note)
> - Les deux sections utilisent le même format de carte, largeur calculée pour tenir sur une ligne peu importe l'écran
> 
> **Filtre par genre (Liste)**
> 
> - Bouton "Filtrer" fonctionnel — sélection d'un ou plusieurs genres à la fois
> - Genres traduits en français (dictionnaire de correspondance)
> - Compteur affichant combien de résultats correspondent au filtre
> 
> **Corrections de bugs**
> 
> - Crash au changement grille/liste dans l'onglet Liste (problème de `key` sur le composant de liste) → corrigé
> - Recherche qui plantait parfois ("Animé introuvable", erreurs API) → ajout d'un délai avant chaque recherche pour ne pas saturer l'API AniList
> 
> **Fiche détails**
> 
> - Nouvelle section "Autres saisons" — affiche les préquelles/suites liées, cliquables pour naviguer entre les saisons d'une même licence
> 
> **Design (démarré)**
> 
> - Création d'un fichier de palette centralisé (`constants/theme.tsx`)
> - Direction choisie : thème sombre et coloré, violet comme couleur de marque, palette de tiers repensée pour se démarquer de TierMaker
> - Pas encore appliqué aux écrans — prochaine étape
> 
> **À faire prochaine session**
> 
> - Appliquer la nouvelle palette à tous les écrans (on allait commencer par Profil)
> - Plus tard : vrai regroupement automatique par licence, mode clair/sombre (structure prévue mais pas construite), comptes + follow

> [!note]- 📅 Session dev — Animeboxd (design & réflexion) — 28/08/2026
> Pas de code aujourd'hui — session dédiée à la direction visuelle et aux nouvelles idées, à partir d'apps de référence (Hyakanime, MyUtaku, MyAnimeList, Loadia).
> 
> **Logo**
> 
> - Créé : kanji 望 (espoir) en dégradé orange/jaune, clin d'œil à Goku
> - Dégradé réservé au logo uniquement, pas à toute la palette
> 
> **Direction écran d'accueil (mélange de 3 inspirations)**
> 
> - Barre du haut avec logo centré (façon MyAnimeList)
> - Recherche + bouton filtre juste en dessous (façon Hyakanime)
> - Sections "animés de la saison" + "recommandés" selon les mieux notés
> - Barre d'onglets en bas détachée/flottante (façon Loadia, juste la forme)
> 
> Couleur : passage du vert actuel à l'orange comme accent principal
> 
> **Fiche animé — nouvelles inspirations**
> 
> - Structure façon Hyakanime (poster, tags, description, stats, infos, source)
> - Section "dans le même univers" façon MyUtaku, gardée en scroll horizontal (déjà commencé avec "Autres saisons")
> - Ajout prévu : nom du studio d'animation
> 
> Nouvelle fonctionnalité actée : bouton Watchlist (à voir, séparé du fait d'avoir noté/vu) → deviendra un sous-onglet dans Liste
> 
> Méthode de travail : dessine lui-même les mises en page sur Excalidraw avant de les coder, pour garder une identité personnelle
> 
> **À faire prochaine session (code)**
> 
> - Watchlist (sous-onglet + statut par animé)
> - Studio d'animation dans la fiche détails
> - Élargir "Autres saisons" à plus de types de relations
> - Appliquer la nouvelle palette (orange) une fois la maquette Excalidraw prête

> [!note]- 📅 Session dev — Animeboxd (design, suite) — 29/08/2026
> **✅ Décisions actées**
> 
> - Logo final validé : kanji 望 blanc sur fond dégradé rouge foncé → rose → rose pâle (fichier `logo-v1-blanc-sur-degrade.png`)
> - Sélecteur de note (/20) : anneau avec trait d'encre continu (dégradé + bavure + petite goutte), contrôlé par une glissière horizontale en dessous du cercle pour ne jamais cacher le chiffre en glissant — abandon du geste circulaire (obstruction du doigt) et de l'odomètre (asymétrie dizaines/unités)
> - Bouton "Ma liste" → ouvrira un menu avec choix de statut (En cours/Terminé) + le sélecteur de note dedans, inspiré d'un screen Loadia
> 
> **🔄 Non tranché, à reprendre demain**
> 
> - Couleur de fond de l'appli : hésitation entre neutre gris et légère teinte rose façon Hyakanime
> - Couleur des boutons courants (Filtrer, etc.) : rose plein vs neutre gris avec juste des accents colorés ponctuels
> - Sentiment général que l'écran d'accueil "sonne faux" par rapport à l'ambiance nostalgique visée — hypothèse en cours : ça pourrait venir du manque de vraies affiches d'animés dans les maquettes (à vérifier directement dans le vrai code/Expo Go la prochaine fois, pas en maquette HTML)
> 
> **💡 Rappel pour la prochaine session**
> 
> Tester le vrai écran Accueil codé (avec vraies recherches/vraies affiches AniList) avant de continuer à ajuster les couleurs en maquette — ça permettra de vérifier si le problème vient vraiment du visuel générique ou d'autre chose.

> [!note]- 📅 Session dev — Animeboxd (fiche détails, code réel) — 30/08/2026
> **Construit de zéro dans `app/anime/detail.tsx`**
> 
> - Vraies icônes de plateformes de streaming (récupérées via l'API AniList, filtrées pour ne garder que le vrai streaming — pas les réseaux sociaux)
> - Boutons "Ma liste" / "Watchlist" qui changent de couleur (gris) une fois activés, avec possibilité de retirer un animé de la liste
> - Fenêtre "Ma liste" avec statut (En cours/Terminé) + cadran de notation en dégradé (rouge foncé → rose), sur 20 au lieu de 10
> - Synopsis tronqué à 3 lignes avec bouton "Lire plus"
> - Section "Autres saisons" élargie (plus de types de relations captés)
> - Puces d'infos (studio, statut, source) redessinées en plus compact
> - Poster flouté en fond + petit poster net centré, façon Hyakanime
> 
> **Corrections en cours en fin de session (dernières retouches envoyées juste avant la coupure)**
> 
> - Poster centré agrandi, flou réduit
> - Icônes des puces d'infos réduites (remplacées par un point de couleur, plus fiable que les emoji qui s'affichaient trop gros sur Android)
> - Transition en fondu plus douce entre le poster flouté et le contenu en dessous (au lieu d'une coupure nette)
> 
> **Limites identifiées, non résolues**
> 
> - Synopsis uniquement en anglais (l'API AniList ne fournit pas de traduction française)
> - Liste des saisons incomplète (l'API ne donne que les liens directs, pas la chaîne complète)
> 
> **Changement d'outil**
> 
> - Passage à Claude Pro + Claude Code pour la suite du développement — permettra d'éditer les fichiers directement sans copier-coller

> [!note]- 📅 Session dev — Kibō (fiche détail, accueil, classements, liste, navigation) — 31/08/2026
> **Fiche détails, plein de retouches**
> 
> - Poster flouté en fond agrandi, flou réduit, transition fondue enfin réussie (fini la coupure nette)
> - Puces d'infos compactées avec de simples points de couleur au lieu d'emoji (plus fiable sur Android)
> - Fenêtre "Ma liste" repensée visuellement
> - Sélecteur En cours/Terminé transformé en interrupteur animé qui glisse joliment
> - Le rose retiré de partout sauf des endroits stratégiques (bouton principal, roulette de note) — pour éviter le côté "trop coloré partout" qu'on avait identifié
> - Logos de streaming filtrés aux vraies plateformes utiles (Netflix, Prime Video, Crunchyroll, ADN, Disney+), avec des badges fixes pour Netflix/Prime plutôt que des icônes AniList parfois cassées
> - Synopsis maintenant traduit automatiquement en français — enfin réglé, le problème qu'on avait identifié comme "limite honnête" au tout début
> - Grosse amélioration de rapidité : les fiches déjà consultées se rouvrent quasi instantanément
> 
> **Onglet Classements, du gros travail visuel**
> 
> - Bouton de partage réparé (avant, ça ne capturait qu'une partie de l'écran)
> - Design des tiers repensé : dégradés, noms personnalisables, possibilité d'ajouter/supprimer des tiers
> - Podium du Top refait proprement (alignement, couronne sur le premier, halo doré)
> - Nouveau système pour réordonner le Top : on touche un animé pour le "prendre", on touche l'endroit où le déposer — plus intuitif que l'ancien système de flèches monter/descendre
> 
> **Onglet Liste**
> 
> - Ajout d'un sous-onglet Watchlist distinct
> 
> **Accueil enrichi**
> 
> - Deux nouvelles sections : "Tendances du moment" et "Classiques bien notés"
> - Le contenu recommandé change maintenant à chaque visite au lieu d'être toujours pareil
> - Petite croix pour vider la recherche rapidement
> 
> **Cohérence générale de l'appli**
> 
> - Barre du haut (logo + réglages) maintenant identique sur les 4 onglets
> - Correction d'un flash blanc gênant à l'ouverture des fiches (l'appli suivait le mode clair du téléphone au lieu de rester en sombre)
> - Tentatives pour améliorer l'animation de fermeture d'une fiche (pas encore satisfaisante)
> 
> **Ce qui reste à surveiller**
> 
> - L'animation de fermeture de fiche pas encore au point, à revalider
> - La traduction du synopsis utilise un service non-officiel — fonctionne bien mais pourrait un jour s'arrêter sans prévenir (l'appli reviendrait alors à l'anglais automatiquement dans ce cas)

> [!note]- 📅 Session dev — Kibō (simplification du regroupement + fiabilisation) — 01/09/2026
> **Simplification du scope (comme décidé ensemble)**
> 
> - Accueil : retour à l'affichage individuel (annulation du regroupement là-bas), le seul truc gardé est l'amélioration de fiabilité réseau
> - Onglet Liste ("Ma liste"/"Watchlist") : retour à l'affichage individuel aussi
> - Profil : ajout des deux compteurs (licences distinctes + entrées individuelles) en plus des stats existantes
> 
> **Tier List / Top : possibilité de détacher une saison du groupe**
> 
> - Nouvelle fonctionnalité : dans la fenêtre de saisons, tu peux maintenant "détacher" une saison précise de son groupe (elle redevient indépendante) ou la rattacher — pratique si le regroupement automatique se trompe sur un cas particulier
> - Une étoile permet de choisir manuellement quelle affiche représente le groupe, plutôt que de subir le choix automatique
> 
> **Ajout groupé depuis la fiche détails (celui qu'on avait prévu)**
> 
> - Quand tu appuies sur "+ Ajouter" sur un animé qui a plusieurs saisons liées, une liste à cocher apparaît pour ajouter d'un coup toutes celles que t'as déjà vues
> 
> **Nouveau : deux façons de voir l'onglet Liste**
> 
> - Un bouton pour basculer entre "Principal" (une carte par licence) et "Tout" (chaque saison affichée séparément) — flexibilité totale pour l'utilisateur
> 
> **Détection de licence améliorée**
> 
> - L'algorithme de regroupement a été élargi : avant, il suivait seulement la chaîne "préquelle/suite", maintenant il inclut aussi les films et spin-offs liés (donc Dragon Ball GT, Super, les films DBZ rejoignent bien la licence principale)
> - Un rattrapage automatique au démarrage recalcule les regroupements existants avec cette nouvelle méthode
> 
> **Plusieurs bugs corrigés en cours de route**
> 
> - La recherche sur l'Accueil et le bouton "Ajouter" qui chargeaient à l'infini — corrigé (le système envoyait trop de requêtes une par une au lieu de les grouper)
> - Les actions importantes (recherche, ouverture d'une fiche) ne sont plus bloquées derrière les tâches de fond
> - Ajout d'une limite de temps de 8 secondes sur le bouton "Ajouter" pour qu'il ne tourne plus jamais indéfiniment
> 
> **Un vrai problème identifié, pas encore résolu**
> 
> - Le choix automatique de l'affiche représentative d'une licence n'est pas fiable — Dragon Ball affiche parfois GT au lieu de la première saison, l'Attaque des Titans affiche la Saison 2. La solution de contournement (choisir l'affiche à la main avec l'étoile) existe déjà mais reste à tester.
> - Trois pistes proposées pour la suite : tester le contournement manuel, améliorer le critère automatique (privilégier les vraies séries + la date de sortie — ce qui a justement été fait dans la session suivante), ou annuler complètement le mode "Principal" si rien ne convainc.

> [!note]- 📅 Session dev — Kibō (choix des affiches de licence, nettoyage du contenu annexe, robustesse réseau) — 02/09/2026
> **Meilleur choix d'affiche pour une licence groupée**
> 
> - Avant : l'appli choisissait l'affiche un peu au hasard (le plus petit numéro d'identifiant), ce qui donnait des résultats bizarres — genre Dragon Ball GT comme affiche de toute la saga, ou la Saison 2 de l'Attaque des Titans à la place de la Saison 1
> - Corrigé : l'appli choisit maintenant en priorité une vraie série télé (pas un film/spécial), puis la plus ancienne dans le temps — donc logiquement la toute première saison
> - Un bug de mise en cache corrigé au passage : si tu ajoutais une saison plus tard (genre la Saison 1 après avoir eu la 2), l'affiche ne se remettait pas à jour automatiquement — maintenant si
> 
> **Nettoyage du contenu "parasite"**
> 
> - L'appli filtre maintenant automatiquement les OAV, épisodes spéciaux et clips musicaux qui polluaient les résultats de recherche et les licences
> - Les films sont filtrés seulement s'ils sont directement liés à une série (pas de souci pour un vrai film indépendant comme un Ghibli, qui reste bien visible)
> - Ce nettoyage s'applique partout : recherche, Accueil, ajout groupé, "Autres saisons"
> - Un passage automatique nettoie aussi rétroactivement ce que t'avais déjà dans ta liste
> 
> **"Autres saisons" plus complet**
> 
> - Avant, ça ne montrait que les saisons "voisines" directes. Maintenant ça remonte toute la chaîne (donc la Saison 7 de My Hero Academia apparaît bien depuis la Saison 3, pas juste les saisons juste à côté)
> - Affichage progressif : les saisons proches apparaissent tout de suite, les plus éloignées arrivent juste après
> 
> **Plusieurs bugs de fond corrigés**
> 
> - La limite du nombre de saisons qu'une licence pouvait contenir était trop basse et coupait certaines longues sagas avant d'atteindre les dernières saisons — remontée et corrigée avec un recalcul forcé
> - Les fiches consultées avant un certain point de la mise à jour affichaient des infos incomplètes (les films manquants sur certains animés) — corrigé avec un système de cache mis à jour proprement
> - Un souci d'espacement entre les requêtes réseau qui ralentissait tout sans raison
> 
> **Suite (et fin) du travail sur la robustesse réseau**
> 
> - Continuation de la correction commencée pour mieux gérer les pannes d'AniList (voir session précédente)
> - Petit bug annexe corrigé : un nettoyage automatique se marquait "terminé" même quand il avait échoué, ce qui fait qu'il n'aurait jamais vraiment nettoyé quoi que ce soit
> 
> **Grosse contrainte de cette session : AniList était en panne**
> 
> - Confirmé depuis deux connexions différentes — rien de ce qui a été codé n'a pu être testé en vrai sur le téléphone ce jour-là
> - Solution de secours (Jikan, une autre source de données) testée mais elle plantait aussi ce jour-là
> 
> **Ce qui reste à faire**
> 
> - Toujours pas de vrai "plan B" fonctionnel si AniList retombe en panne
> - Quelques fichiers de test temporaires encore présents dans le code, à nettoyer
> - Un gros rattrapage de données est prévu automatiquement la prochaine fois que l'appli se lance après que l'API remarche

> [!note]- 📅 Session dev — Kibō (panne AniList, résilience réseau, gros nettoyage technique) — 03/09/2026
> **Panne du côté d'AniList (pas de ta faute)**
> 
> - L'API AniList elle-même est tombée en panne pendant plusieurs heures (confirmé depuis deux connexions différentes — donc un vrai problème de leur côté, pas un bug chez toi)
> - L'appli ne gérait pas bien ce cas de figure : au lieu d'un message clair, ça affichait juste "Animé introuvable" partout sans explication
> 
> **Meilleure gestion des pannes réseau**
> 
> - L'appli sait maintenant reconnaître "AniList est en panne" et l'afficher clairement (un message en haut de l'Accueil, un bouton "Réessayer" sur les fiches, avec repli sur ce qui est déjà en cache si possible)
> - Après plusieurs échecs d'affilée, elle arrête d'insister pendant une minute au lieu de spammer des requêtes inutiles
> 
> **Faut-il tout recommencer sur un projet neuf ?**
> 
> - Question posée et tranchée : non. La plupart des galères récentes venaient de la complexité du sujet (les liens entre saisons chez AniList) et pas de la qualité du code — un grand nettoyage ciblé suffit, pas besoin de repartir de zéro
> 
> **Gros nettoyage du code**
> 
> - Renommage de fichiers mal nommés (un fichier s'appelait "top" alors qu'il gérait l'onglet Liste)
> - Suppression de tout ce qui restait du template de départ jamais utilisé (composants, images, écrans fantômes)
> - Réorganisation en profondeur : le code réseau (les appels à AniList) centralisé proprement à un seul endroit, les couleurs de l'appli centralisées aussi (au lieu d'être répétées littéralement partout), et l'écran Classements franchement allégé (divisé par deux en taille, mieux organisé en petits morceaux)
> 
> **Bugs découverts (qui existaient déjà, révélés par le nettoyage)**
> 
> - Le compteur de sélection dans "Gérer la sélection" restait bloqué à un chiffre à cause d'animés supprimés qui traînaient encore en mémoire — corrigé
> - Certains animés à plusieurs saisons (Mushoku Tensei, Les Carnets de l'apothicaire) avaient arrêté de se regrouper correctement — conséquence directe de la panne AniList du début de session (le système avait mal interprété les réponses vides pendant la panne) — corrigé avec une réparation automatique
> 
> **Optimisation des requêtes**
> 
> - Découverte que la limite de requêtes d'AniList était temporairement réduite (30/minute au lieu de 90 normalement) à cause de leur panne — l'appli s'ajuste maintenant automatiquement à cette limite plutôt que de la deviner
> - Grosse optimisation : résoudre les licences de plusieurs animés en une poignée de requêtes au lieu d'une quinzaine
> 
> **Mise en cache plus intelligente**
> 
> - Les fiches d'animés déjà consultées restent en mémoire plus ou moins longtemps selon si l'animé est terminé (30 jours) ou encore en diffusion (6h, ça change plus souvent)
> - Les sections de l'Accueil (Tendances, Saison, etc.) ne se rechargent plus à chaque fois que tu reviens dessus
> 
> **Ce qui reste à faire, identifié clairement**
> 
> - Le nettoyage des vieilles données lors des mises à jour reste "brutal" (efface tout) — à améliorer avant de penser au Play Store
> - L'identifiant MyAnimeList (pour une porte de sortie vers une autre source de données) pas encore ajouté
> - Le thème rose/orange était prêt en couleurs mais pas encore branché pour un vrai changement à la volée dans l'appli
> 
> **Plan validé pour la suite**
> 
> Finir le nettoyage → écran paramètres avec le changement de thème → préparation Play Store (icône, écran de démarrage, politique de confidentialité) → tester sur plusieurs jours d'utilisation réelle

> [!note]- 📅 Session dev — Kibō (nettoyage, thème, préparation à la sortie) — 04/09/2026
> **Renommage officiel**
> 
> - L'appli s'appelle maintenant officiellement Kibō dans tout le code (fini "animeboxd")
> 
> **Thème bleu/rose vraiment dynamique**
> 
> - Le sélecteur de thème dans les paramètres fonctionne maintenant partout d'un coup, pas juste sur certains boutons — logo, cadran de notation, cases à cocher, tout suit le thème choisi instantanément
> - Quelques oublis corrigés au passage (le contour de la note moyenne restait bleu par erreur, le logo aussi)
> 
> **Nouvel écran Paramètres**
> 
> - Bascule de thème
> - Bouton "Signaler un bug" qui prépare un email avec les infos utiles déjà remplies
> - Gestion du cache (voir combien de place ça prend, le vider)
> 
> **Fiche détails retravaillée**
> 
> - Les infos (studio, statut, etc.) sont maintenant regroupées dans une seule carte propre, mieux organisée
> - Les logos des plateformes de streaming corrigés (Crunchyroll et les autres retrouvent leurs vraies couleurs, seul Netflix était un cas particulier)
> 
> **Sous le capot (pas visible pour toi mais important)**
> 
> - Ajout d'un identifiant MyAnimeList en plus de celui d'AniList pour chaque animé — utile si un jour on veut se brancher sur une autre source de données
> - Correction d'un bug trouvé en cours de route : le regroupement par licence tournait deux fois pour rien dans un des écrans
> - Système intelligent pour recalculer les regroupements de licences si jamais on améliore la méthode plus tard, sans perdre les données existantes
> 
> **Icônes et image de l'appli**
> 
> - Les 4 logos étaient en fait des fichiers WebP déguisés en PNG (invisible à l'œil, mais ça aurait fait planter la mise en ligne) — corrigés
> - Icône ajustée pour respecter les zones de sécurité des différents formats (Android, iOS)
> 
> **Première mise en ligne préparée**
> 
> - Compte développeur créé, projet lié, premier "build" (version compilée) de test lancé
> 
> **Ce qui reste à faire, identifié clairement**
> 
> - Aucune sauvegarde des données — si tu perds ton téléphone ou le réinitialises, tout est perdu, sans solution actuellement. À régler avant le Play Store
> - Pas encore de politique de confidentialité écrite (obligatoire pour publier)
> - Rien n'a encore été testé sur un vrai appareil — le build tournait encore à la fin de la session

> [!note]- 📅 Session dev — Kibō (correction du bouton Ajouter, résistance aux pannes AniList, recherche améliorée) — 05/09/2026
> **Le vrai fond du problème "Ajouter trop lent" enfin trouvé**
> 
> - La cause exacte : la recherche des saisons liées tournait deux fois en même temps (une fois à l'ouverture de la fiche, une deuxième fois quand tu appuyais sur "Ajouter") — elles se marchaient dessus et se ralentissaient mutuellement
> - Corrigé : une seule recherche par fiche maintenant, partagée entre "Autres saisons" et le bouton Ajouter
> - Un filet de sécurité ajouté plus largement pour éviter que ce genre de doublon se reproduise ailleurs dans l'appli
> - La complétude est bien préservée comme demandé : la liste à cocher propose toujours toute la licence
> 
> **Un bug qui faisait planter l'appli, corrigé**
> 
> - Un fichier mal placé créait un 5ème onglet fantôme invisible qui plantait l'appli si jamais on tombait dessus — déplacé au bon endroit
> 
> **Meilleure gestion des pannes AniList (le service était encore en panne pendant cette session)**
> 
> - Confirmé : la panne est volontaire de leur côté (pas juste un ralentissement), et même leur solution de secours (Jikan) était à moitié cassée aussi
> - Bonne nouvelle repérée : les images restent accessibles même pendant la panne des données
> - L'appli garde maintenant en mémoire les dernières données valables et les réaffiche si la panne empêche un rechargement, plutôt que d'afficher un écran vide
> - Le bandeau d'erreur en haut ne reste plus affiché bêtement une fois le problème résolu
> 
> **Recherche améliorée dans les favoris (Profil)**
> 
> - Ajout d'une barre de recherche pour trouver plus vite un favori dans la liste
> - Petit souci d'affichage avec le clavier qui cachait la recherche — corrigé
> 
> **Grosse amélioration : recherche en français**
> 
> - Avant, il fallait taper le titre japonais romanisé ("Boku no Hero Academia") pour trouver un animé — chercher "My Hero Academia" ou "L'Attaque des Titans" ne donnait rien
> - Corrigé : la recherche reconnaît maintenant les titres anglais et les variantes connues, dans n'importe quel ordre de mots
> - Testé sur 18 cas différents, tous fonctionnent
> 
> **Grosse réflexion chiffrée sur un "catalogue embarqué"**
> 
> - Étude sérieuse pour savoir si l'appli pourrait embarquer une base de données locale (pour ne plus dépendre autant d'AniList) — mesures précises de poids et mémoire selon différentes options
> - Conclusion : une version "légère" (infos essentielles seulement) est réaliste, une version complète avec toutes les fiches détaillées prendrait trop de mémoire sur téléphone Android
> 
> **Ce qui reste à surveiller**
> 
> - Le bouton Ajouter reste un peu lent sur une très grosse licence (le doublon est réglé, mais les allers-retours réseau restent) — la vraie solution serait ce catalogue embarqué étudié cette session
> - Toujours aucune sauvegarde des données (le seul vrai point bloquant identifié pour une sortie Play Store)
> - Politique de confidentialité toujours pas écrite

> [!note]- 📅 Session dev — Kibō (catalogue embarqué, import, sauvegarde, mode manga) — 06/09/2026
> **Catalogue embarqué directement dans l'appli**
> 
> - L'appli embarque maintenant ses propres données : 12 358 licences, ~11 000 fiches légères pour la recherche instantanée, et les fiches complètes des 1000 animés les plus populaires — tout ça pour un poids total raisonnable (moins d'1 Mo au total)
> - Résultat concret : "Ajouter", "Autres saisons" et le regroupement par licence fonctionnent sans connexion internet pour tout animé connu
> - Petit détail amusant révélateur du sérieux du travail : il a fallu couper à la main 5 liens erronés entre licences, sinon One Piece et Dragon Ball auraient fusionné en une seule "licence" de 106 œuvres
> - *Avis : décision la plus importante de cette phase du projet — règle enfin la dépendance totale à une API qui tombe en panne régulièrement, plutôt que de continuer à bricoler des contournements*
> 
> **Import depuis AniList/MyAnimeList**
> 
> - Import de la liste existante depuis ces deux sites via le pseudo public, sans mot de passe
> - Testé sur des vraies listes (399 et 27 entrées), ça marche
> - *Avis : fonctionnalité intelligente pour attirer des gens qui utilisent déjà MAL/AniList sans tout retaper à la main*
> 
> **Sauvegarde des données — enfin réglé**
> 
> - Export de toute la liste dans un fichier, restauration possible plus tard
> - C'était le seul vrai point bloquant identifié depuis des semaines (téléphone perdu = tout perdu) — maintenant couvert
> - *Avis : gros soulagement, c'était le point le plus urgent avant d'envisager une sortie publique*
> 
> **Politique de confidentialité**
> 
> - Rédigée et publiée en ligne
> - *Avis : encore une case obligatoire pour le Play Store cochée, l'appli se rapproche d'un état publiable*
> 
> **Icône corrigée**
> 
> - Le kanji était mal dimensionné à cause d'un recadrage automatique d'Android qu'on n'avait pas anticipé — corrigé
> 
> **Fiche détails, retouches d'usage**
> 
> - Boutons Modifier/Retirer plus clairs, avec une vraie fenêtre de confirmation aux couleurs de l'appli plutôt que la popup grise d'Android par défaut
> - *Avis : petit détail, mais c'est ce genre de détail qui distingue une appli soignée d'une appli qui a juste des fonctionnalités*
> 
> **Le gros morceau de la session : le mode Manga**
> 
> - Bascule Animé/Manga directement dans la barre du haut
> - Chaque univers a sa propre couleur d'accent (bleu pour animé, rose/orange pour manga) — le thème n'est plus un choix libre dans les paramètres, il devient signalétique
> - Pas de regroupement par licence côté manga (logique : un manga n'a pas de "saisons" comme un animé)
> - Distinction Manga/Manhwa/Manhua selon le pays d'origine





