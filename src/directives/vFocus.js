/**
 * Directive v-focus
 * Donne automatiquement le focus à l'élément lors de son montage.
 * Utile pour les champs de formulaire qui doivent recevoir le curseur
 * directement à l'ouverture.
 *
 * Usage : <input v-focus />
 */
export const vFocus = {
  mounted(el) {
    el.focus();
  },
};
