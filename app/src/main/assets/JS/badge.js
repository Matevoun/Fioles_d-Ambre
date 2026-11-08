/*
 * WEB SEULEMENT. Ne pas copier ce dossier dans les assets Android.
 * Le jeu ne l'appelle que si l'adresse est mathieu.charreyre.net.
 * S'il manque, A propos n'a pas de badge. Rien d'autre ne change.
 */
(function () {
  if (location.hostname !== "mathieu.charreyre.net") return;

  const style = document.createElement("style");
  style.textContent = [
    "a.badge-play{display:flex;justify-content:center;line-height:0;}",
    "a.badge-play img{width:min(11rem,70%);height:auto;}"
  ].join("");
  document.head.appendChild(style);

  const placer = () => {
    document.querySelectorAll("#app .card").forEach((card) => {
      const titre = card.querySelector("h2");
      if (!titre || titre.textContent.indexOf("propos") === -1) return;
      if (card.querySelector(".badge-play")) return;
      const lien = document.createElement("a");
      lien.className = "badge-play";
      lien.href = "https://play.google.com/store/apps/details?id=org.wda.fioles";
      lien.target = "_blank";
      lien.rel = "noreferrer";
      lien.title = "Installer Les Fioles d'Ambre depuis Google Play.";
      lien.setAttribute("aria-label", lien.title);
      const img = document.createElement("img");
      img.src = "./Picts/badge-google-play.png";
      img.alt = "Disponible sur Google Play";
      lien.appendChild(img);
      const licence = card.querySelector(".licence");
      if (licence) licence.insertAdjacentElement("afterend", lien);
      else card.appendChild(lien);
    });
  };

  const app = document.getElementById("app");
  if (!app) return;
  new MutationObserver(placer).observe(app, { childList: true, subtree: true });
  placer();
})();
