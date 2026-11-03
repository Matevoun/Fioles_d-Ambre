/*
 * Textes : Fioles d'Ambre
 * ©2026, Mathieu CHARREYRE pour WDA & Ambre.
 */

// Phrases lues par le joueur.
// A gauche, le nom appele par le jeu. On ne le change pas.
// A droite, le texte affiche. Pour traduire, on ne change que ca.
const textes = {
  pourAmbre: "Pour Ambrinette",
  titre: "Fioles d'Ambre",
  version: "version",
  regle: "Verser une m\xE9lasse seulement sur la m\xEAme couleur, ou dans une fiole vide. Une fois pleine d'une seule couleur, la fiole se ferme.",
  commencer: "Commencer",
  panique: "Panique dans le labo",
  paniqueCourt: "Panique",
  autreMelange: "Autre mélange",
  retourCampagne: "Retour à la campagne",
  aPropos: "\xC0 propos",
  niveau: "Niveau",
  coup: "coup",
  coups: "coups",
  son: "Son",
  silence: "Silence",
  consigne: "Toucher une fiole, puis une autre.",
  annuler: "Annuler",
  recommencer: "Recommencer",
  indice: "Indice",
  gagneTitre: "C'est rang\xE9.",
  niveauSuivant: "Niveau suivant",
  revoir: "Revoir",
  plafondTitre: "Félicitations.",
  plafondBlague: "Pour une fois qu'Ambre range quelque chose ...",
  plafondTexte: "La difficulté maximale est atteinte. Les niveaux suivants restent à ce niveau, avec un autre mélange.",
  plafondFoutoir: "Sinon, on peut lâcher Ambre dans le labo. Cela risque de faire un sacré foutoir.",
  continuer: "Continuer",
  bloqueTitre: "Partie bloqu\xE9e.",
  bloqueTexte: "Aucun des versements restants ne range les fioles.",
  aProposTitre: "\xC0 propos et cr\xE9dits",
  developpe: "D\xE9velopp\xE9",
  benevollement: "b\xE9n\xE9volement",
  par: "par",
  auteur: "Mathieu CHARREYRE",
  pourAsso: "pour l'",
  asso: "Association WDA",
  prenom: "Le pr\xE9nom du jeu est celui du Cafard Ambre ;-).",
  licence: "Licence CC BY-NC-SA 4.0.",
  versionWeb: "Version web",
  confidentialite: "Confidentialité",
  don: "Si ce jeu vous amuse, un don \xE0 l'association suffit. Rien n'est obligatoire.",
  hello: "HelloAsso",
  paypal: "PayPal",
  effaceAvertissement: "Cela efface le niveau en cours et ceux d\xE9j\xE0 d\xE9bloqu\xE9s.",
  ouiEffacer: "Oui, tout effacer",
  toutRecommencer: "Tout recommencer",
  fermer: "Fermer",
  noteRien: "Rien ne se verse. Annuler un coup, ou recommencer.",
  noteIndice: "Essayer ce versement.",
  verse: "verse",
  melasses: "m\xE9lasses",
  fiolesVides: "fioles vides",
  fioleVide: "une fiole vide",
  voile: "couches voil\xE9es",
  urlAuteur: "https://mathieu.charreyre.net",
  urlAsso: "https://wda-fr.org",
  urlWeb: "https://mathieu.charreyre.net/Fioles",
  urlConfidentialite: "https://wda-fr.org/index.php?page=Apps/fioles-d-ambre",
  urlHello: "https://www.helloasso.com/associations/association-wda/formulaires/1",
  urlPaypal: "https://www.paypal.com/donate/?hosted_button_id=DZRY58WUANTAJ",
  // Bulles au survol. Ce ne sont pas les textes des boutons.
  aideCommencer: "Reprendre la campagne au dernier niveau débloqué.",
  aidePanique: "Tirer un mélange de 8 à 12 mélasses, avec le voile.",
  aidePropos: "Crédits, dons, et remise à zéro.",
  aideAutre: "Abandonner ce mélange et en tirer un autre.",
  aideSon: "Rétablir le son.",
  aideSilence: "Couper le son.",
  aideAnnuler: "Revenir d'un versement.",
  aideRecommencer: "Rejouer ce même mélange depuis le début.",
  aideIndice: "Montrer un versement qui mène encore à la victoire.",
  aideSuivant: "Passer au niveau suivant.",
  aideContinuer: "Continuer la campagne au plafond de difficulté.",
  aideRetour: "Revenir à la campagne laissée en cours.",
  aideEffacer: "Effacer la partie et les niveaux débloqués.",
  aideOui: "Confirmer l'effacement.",
  aideFermer: "Fermer cette fenêtre.",
  aideAuteur: "Ouvrir le site de Mathieu CHARREYRE.",
  aideAsso: "Ouvrir le site de l'Association WDA.",
  aideWeb: "Jouer à la même version dans le navigateur.",
  aideConfidentialite: "Lire les règles de confidentialité de l'application.",
  aideHello: "Faire un don à l'association sur HelloAsso.",
  aidePaypal: "Faire un don à l'association sur PayPal."
};

// Colle un nombre devant un mot du bloc ci-dessus.
// ligneCoups : 1 Coup, ou 12 coups.
// ligneNiveau : 3 Melasses, 2 fioles vides. Avec le voile, ajoute couches voilees.
// Le singulier et le pluriel restent ici, pas dans la regle.
function ligneCoups(n) {
  return n === 1 ? `1 ${textes.coup}` : `${n} ${textes.coups}`;
}
function ligneNiveau(spec) {
  const mel = `${spec.colors} ${textes.melasses}`;
  const empty = spec.empties > 1 ? `${spec.empties} ${textes.fiolesVides}` : textes.fioleVide;
  return spec.hidden ? `${mel}, ${empty}, ${textes.voile}` : `${mel}, ${empty}`;
}
export {
  ligneCoups,
  ligneNiveau,
  textes
};
