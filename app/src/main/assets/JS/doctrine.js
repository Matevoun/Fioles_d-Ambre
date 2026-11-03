/*
 * # Doctrine : Fioles d'Ambre
 * ©2026, Mathieu CHARREYRE pour WDA & Ambre.
 *
 * ## Obligations
 * Toute modification de ce jeu, par un humain ou par une IA, commence par la lecture de ce fichier. Le bandeau en tête des fichiers de code le rappelle. On ne le retire pas.
 *
 * Le numéro de jeu doit être visible à l'écran. On l'incrémente dans le cas d'un changement. On ne le cache pas.
 *
 * ## Fichiers que l'on peut lire
 *
 * Le jeu en ligne n'est pas un seul fichier compressé. La page reste à la racine. Le reste est rangé :
 *
 * - `index.html` : La page, seule à la racine du jeu, avec le référencement
 * - `manifest.webmanifest` : La fiche d'installation du jeu
 * - `llms.txt` : La carte du jeu pour une IA. Celle du site entier reste à la racine de charreyre.net. On ne la remplace pas. On y ajoute un lien.
 * - `CSS/fioles.css` : L'apparence des boutons
 * - `fonts/Fraunces.woff2` et `fonts/Outfit.woff2` : Les deux polices, dans le jeu. On n'appelle plus fonts.googleapis.com. La page web et l'application Android ne chargent aucun fichier distant pour démarrer. Les liens de don et de crédit ne partent que si on les touche, et ils s'ouvrent dans le navigateur.
 * - `JS/regle.js` : La règle, les niveaux, l'indice
 * - `JS/dessin.js` : Les fioles et la mélasse
 * - `JS/son.js` : Les sons, et la nappe de laboratoire de l'accueil. Tout est synthétisé. Pas de fichier audio. Un navigateur peut la bloquer tant qu'on n'a pas touché la page. Le premier toucher la lance, il ne coupe pas le son. Ensuite le bouton la coupe. La nappe s'arrête dès que la partie commence.
 * - `JS/jeu.js` : Les boutons, la partie, l'enregistrement
 * - `JS/textes.js` : Toutes les phrases lues par le joueur
 * - `JS/doctrine.js` : Cette doctrine
 * - `Picts/fiole.png` : Le verre
 * - `Picts/accueil.webp` : Le laboratoire de l'accueil, sans texte. 1536×1024. On ne l'étire pas. S'il manque de la place, on recadre. Sur un écran étroit, le bloc de texte est en haut et l'image montre les fioles cassées en bas. Le large ne change pas. Pas pendant la partie. Tous les boutons ont la même hauteur. Autre mélange et le son sont sur la même ligne.
 * - `Picts/partage.png` : L'image de partage, 1200×630. Une seule fiole droite, pleine d'ambre, bouchée. Le verre et le liège sont ceux du jeu. Pas de coulée dessinée par-dessus. Le titre est écrit par le code. « Les Folies d'Ambre » est barré, puis « Pardon ... ». Ce n'est pas une faute.
 * - `Picts/bouchon.png` : Le liège, cylindre droit, fond transparent
 * - `Picts/favicon.svg` : L'icône de la page
 * - `Picts/annuler.svg`, `recommencer.svg`, `indice.svg`, `apropos.svg`, `son.svg`, `silence.svg` : Les six icônes des boutons. Ce sont des dessins Lucide copiés ici (licence ISC). On n'importe pas la bibliothèque.
 *
 * Les chemins des images de fioles partent du fichier `JS/dessin.js`. Les icônes des boutons partent de `index.html`.
 * Les phrases lues par le joueur sont dans `textes.js`, appelées par leur nom. On n'écrit pas une phrase dans un autre fichier. Pour traduire, on change les chaînes, pas les noms.
 *
 * Hors ligne, sur la Dropbox, le dossier `Fioles/_Off-Line/Betas/` garde les anciennes bêta. `v1.zip` est la 0.1. `v2.zip` est la 0.2. On ne les sert pas au joueur. On n'y touche pas quand on met le jeu à jour.
 *
 * `robots.txt`, `sitemap.xml`, `humans.txt` et `llms.txt` de charreyre.net sont à la racine du site. On n'y met pas une copie à la place. On y ajoute le jeu. `security.txt` va dans `/.well-known/`, pas dans ce dossier.
 *
 * ## Identité
 *
 * - Titre : **Fioles d'Ambre**.
 * - Clin d'oeil au prénom d'Ambre, mon petit Cafard, qui aime ce genre de jeu. ;-)
 * - Développé bénévolement par Mathieu CHARREYRE pour l'Association WDA (https://wda-fr.org).
 * - Pas de prix, pas de publicité, pas de jauge d'énergie, pas de coffre, pas de compte. Si quelqu'un veut donner, il donne à la WDA.
 * - HelloAsso : https://www.helloasso.com/associations/association-wda/formulaires/1
 * - PayPal : https://www.paypal.com/donate/?hosted_button_id=DZRY58WUANTAJ
 * - Licence : CC BY-NC-SA 4.0. C'est le nom court de : citer les crédits, pas de commercialisation, partage à l'identique. À l'écran, une seule ligne, sous la phrase sur Ambre.
 * - Dans À propos, sous la licence, deux liens au même format que HelloAsso et PayPal : Version web (https://mathieu.charreyre.net/Fioles) et Confidentialité (https://wda-fr.org/index.php?page=Apps/fioles-d-ambre). Pas sur l'accueil. L'accueil garde les fioles cassées. Chaque lien d'À propos a une bulle, comme les boutons : title et aria-label. Un lien n'a pas d'attribut alt.
 *
 * Le texte "À propos" reprend ces crédits. Le mot "bénévolement" reste plus grand que le corps, comme sur PixelGod.
 *
 * ## Règle unique
 *
 * On verse le haut d'une fiole sur une autre seulement si :
 *
 * 1. La fiole d'arrivée est vide, ou
 * 2. Sa couleur du dessus est la même.
 *
 * On verse autant d'unités de cette couleur que la place le permet. Une fiole vide ne se sélectionne pas. On ne verse pas une fiole sur elle-même.
 *
 * Une fiole pleine d'une seule couleur se bouche. Ce n'est pas une seconde règle : Ces unités sont déjà toutes réunies, les verser ailleurs ne sert jamais. On ne débouche pas.
 *
 * Rien d'autre. Pas de bombe, pas de fiole gelée, pas de couleur joker, pas de chrono, pas de vie. La difficulté augmente, la règle non.
 *
 * ## Courbe
 *
 * Chaque couleur a exactement 4 unités. Il y a toujours au moins une fiole vide.
 *
 * | Niveaux | Couleurs | Fioles vides | Voile | Coups du chemin |
 * | --- | --- | --- | --- | --- |
 * | 1 | 3 | 2 | non | 3 |
 * | 2 | 3 | 2 | non | 5 |
 * | 3 | 3 | 2 | non | 8 |
 * | 4 à 6 | 4 | 2 | non | 10, 13, 16 |
 * | 7 à 10 | 5 | 2 | non | 12 à 18 |
 * | 11 à 14 | 5 | 1 | non | 10 à 14 |
 * | 15 à 18 | 6 | 2 | non | 14 à 20 |
 * | 19 à 22 | 6 | 1 | non | 12 à 18 |
 * | 23 à 26 | 7 | 2 | oui | 16 à 22 |
 * | 27 à 30 | 7 | 1 | oui | 14 à 20 |
 * | 31 à 34 | 8 | 2 | oui | 18 à 24 |
 * | 35 à 40 | 8 | 1 | oui | 16 à 22 |
 * | 41 à 46 | 9 | 1 | oui | 18 |
 * | 47 à 52 | 10 | 1 | oui | 20 |
 * | 53 à 58 | 11 | 1 | oui | 22 |
 * | 59 et plus | 12 | 1 | oui | 24 |
 *
 * Le 59 est le dernier cran. Après, le nombre de mélasses ne monte plus. Il n'y a pas de 13e couleur. Les niveaux continuent, chacun avec son mélange, à cette difficulté.
 *
 * Le bandeau ne s'ouvre qu'une fois, après le 59, avant le 60. La difficulté maximale est atteinte, les suivants restent à ce niveau. On peut continuer, ou lâcher Ambre dans le labo. Tout recommencer le montrera de nouveau. Une partie déjà rangée, même rouverte ensuite, réaffiche la victoire. On ne la laisse pas devant Recommencer.
 *
 * Le générateur part d'un tableau rangé et défait des versements légaux, à l'envers. Chaque niveau reste soluble. Le joueur peut mettre plus de coups que la ligne du tableau : c'est normal, la ligne est un chemin, pas un chrono. La campagne ne change pas d'un lancement à l'autre : le niveau 12 est toujours le même.
 *
 * Panique dans le labo est à côté, pas à la place. Même générateur, entre 8 et 12 mélasses, toujours une fiole vide, toujours le voile. Le nombre est tiré avec le mélange. Sans le voile, ce serait un gros niveau du début. Chaque partie est neuve et soluble. L'indice suit ce mélange, pas un numéro de niveau. Recommencer rejoue le même mélange. Autre mélange en tire un nouveau. Retour à la campagne rend la partie laissée en cours. Panique ne débloque aucun niveau.
 *
 * Chaque bouton a une bulle au survol, dans `textes.js` (les clés `aide...`). Ce n'est pas le mot écrit sur le bouton. Un bouton n'a pas d'attribut alt : le titre et le nom pour le lecteur d'écran portent la bulle. Les icônes gardent un alt vide, le bouton parle déjà.
 *
 * Le voile cache seulement ce qui est sous la bande de couleur du dessus. On voit toujours toute la couleur versable. Ce qui est caché forme un seul bloc, sans trou ni tranche. Quand la bande part, la bande suivante se dévoile en entier.
 *
 * Annuler pendant un versement coupe ce versement. Il ne le laisse pas aller au bout. Un niveau ne se valide pas en annulant. Annuler est illimité. L'indice est gratuit. Il montre le prochain versement d'un chemin qui range encore les fioles, pas un versement qui bloque le coup d'après. Ce n'est pas la liste des coups. Recommencer rejoue le même mélange. Tout recommencer, dans À propos, demande une confirmation, puis efface la partie enregistrée, les niveaux débloqués, et ramène à l'accueil.
 *
 * La partie est bloquée quand aucun enchaînement ne range les fioles, même s'il reste un versement. Si un versement dévoile encore une couche cachée, on ne bloque pas : On laisse jouer ce versement, puis on revérifie. Si on n'a pas le temps d'en être sûr, on ne bloque pas. Annuler et recommencer restent là.
 *
 * ## Matières
 *
 * La mélasse est épaisse, lente, lisible. Couleurs franches. Pas de bonbon criard, pas de style publicitaire vulgaire.
 *
 * Pas de motif dans le liquide. Ni points, ni hachures, ni chevrons, ni vagues dessinées.
 *
 * Plusieurs unités de la même couleur, l'une sur l'autre, forment un seul bloc. Pas de barre entre elles. Ce bloc se verse en une fois : C'est déjà la règle, le haut d'une même couleur part ensemble. Deux couleurs différentes restent deux bandes, avec une séparation lisible.
 *
 * La paroi de verre est une image, pas un dessin de code. Fichier : `Picts/fiole.png`, la fiole 512×1024 au fond transparent (`fiole_FIXED_512x1024`). L'intérieur est vide pour laisser voir la mélasse. On ne l'étire pas : le cadre du jeu garde le rapport 1:2 de cette image.
 *
 * Le liquide, le ménisque et le filet qui se verse restent dessinés par le code. Une image fixe ne sait pas verser. Pas de planche de sprites de liquide.
 *
 * L'idée CSS proposée à part (liquide en dessous, image de verre par-dessus, le doigt traverse l'image) est juste. Elle est faite sur le canvas, pas avec ces classes : Le versement, le bouchon et le toucher sont déjà là. On ne réécrit pas le jeu en blocs HTML pour trois règles CSS.
 *
 * Assets utiles encore, si on en ajoute (fond transparent, vue de face, aucun texte dans l'image) :
 *
 * - Un fond d'atelier sombre, lampe ambrée, sans aucune fiole
 * - Une icône : une seule fiole de verre, mélasse ambrée
 * - Eventuellement une goutte discrète, pour l'écran de victoire
 *
 * Le bouchon est `Picts/bouchon.png` : Un cylindre de liège, fond transparent, sans chapeau. Il est dessiné avant le verre, pour se voir en transparence. Il est un peu plus large que le trou, un peu plus long que l'image, et le haut dépasse un peu du buvant. On ne le dessine pas dans l'image de la fiole.
 *
 * Le filet qui se verse est un ruban de mélasse. Il pend entre les deux goulots, plus épais au milieu. Pas un trait droit.
 *
 * Quand la partie est rangée, de petites bulles montent. Elles naissent transparentes et s'éteignent avant le haut. Rien ne reste collé au bord.
 *
 * Sur un écran étroit, le titre du niveau et la ligne des mélasses prennent toute la largeur. Autre mélange et le son restent sur la ligne de la marque. Le nombre de coups ne se coupe pas du mot « coups ».
 *
 * À ne pas faire dessiner : planches de liquides, douze bouteilles différentes, texte, personnages, motifs à coller dans la mélasse.
 *
 * ## Portage
 *
 * La version jouable est le client web, au doigt, téléphone compris. Un port Godot recopiera cette règle, cette courbe et ces crédits. Il ne les réinvente pas.
 *
 * ## Commentaires
 *
 * Les commentaires de code restent sans accents. Le texte que lit le joueur est en Français accentué.
 */
export const DOCTRINE_VERSION = 1;
export const GAME_VERSION = "0.20";
