import { marked } from "marked";

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
