import { marked } from "marked";

/**
 * Directive v-markdown
 * Rend automatiquement du contenu Markdown en HTML dans l'élément cible.
 *
 * Usage : <div v-markdown="texteMarkdown"></div>
 */
export const vMarkdown = {
  mounted(el, binding) {
    el.innerHTML = marked.parse(binding.value || "");
  },
  updated(el, binding) {
    if (binding.value !== binding.oldValue) {
      el.innerHTML = marked.parse(binding.value || "");
    }
  },
};
