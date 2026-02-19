import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";
import api from "./api";
import piniaPersist from "pinia-plugin-persist";
import { useAuthStore } from "./stores/auth";
import Vue3Toastify from "vue3-toastify";
import "vue3-toastify/dist/index.css";
import { vMarkdown } from "./directives/vMarkdown";
import { vFocus } from "./directives/vFocus";

const app = createApp(App);
const pinia = createPinia();

pinia.use(({ store }) => {
  store.$api = api;
});
pinia.use(piniaPersist);

app.use(pinia);
app.use(Vue3Toastify, {
  autoClose: 3000,
  position: "bottom-right",
  theme: "colored",
});
const auth = useAuthStore(pinia);
if (auth.apiKey) {
  auth.$api.defaults.headers.common["Authorization"] = `key=${auth.apiKey}`;
}
app.use(router);

// Directives globales
app.directive("markdown", vMarkdown);
app.directive("focus", vFocus);

app.mount("#app");
