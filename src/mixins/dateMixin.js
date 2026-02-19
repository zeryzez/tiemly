/**
 * Mixin fournissant des helpers de formatage de date et de durée,
 * réutilisables dans plusieurs composants.
 */
export const dateMixin = {
  methods: {
    /**
     * Formate une date en format local (ex : "19/02/2026")
     */
    mixinFormatDate(dateLike) {
      if (!dateLike) return "-";
      return new Date(dateLike).toLocaleDateString("fr-FR");
    },

    /**
     * Formate une heure depuis une date (ex : "14:35")
     */
    mixinFormatTime(dateLike) {
      if (!dateLike) return "--:--";
      return new Date(dateLike).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    },

    /**
     * Formate une durée en millisecondes en "HH:MM:SS"
     */
    mixinFormatDurationHMS(ms) {
      const totalSec = Math.max(0, Math.floor(ms / 1000));
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    },

    /**
     * Formate une durée en millisecondes en "Xh YY" (ex : "2h03")
     */
    mixinFormatDurationH(ms) {
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      return `${h}h${String(m).padStart(2, "0")}`;
    },

    /**
     * Retourne la date du jour au format YYYY-MM-DD
     */
    mixinGetTodayDate() {
      const d = new Date();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    },

    /**
     * Convertit n'importe quelle date en clé YYYY-MM-DD locale
     */
    mixinToLocalDateKey(dateLike) {
      const d = new Date(dateLike);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    },

    /**
     * Convertit une date JS en chaîne "YYYY-MM-DD HH:MM:SS" pour l'API
     */
    mixinToApiDatetime(dateLike) {
      const d = new Date(dateLike);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const hh = String(d.getHours()).padStart(2, "0");
      const min = String(d.getMinutes()).padStart(2, "0");
      const ss = String(d.getSeconds()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
    },
  },
};
