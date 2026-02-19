import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

// 1. Import des vues
import HomeView from "../views/HomeView.vue";
import LoginView from "../views/LoginView.vue";
// Nouveaux imports pour les paramètres
import SettingsView from "../views/SettingsView.vue";
import ProfileSettings from "../views/settings/ProfileSettings.vue";
import ProjectsSettings from "../views/settings/ProjectsSettings.vue";
import ActivitiesSettings from "../views/settings/ActivitiesSettings.vue";
import StatsView from "../views/StatsView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/login",
      name: "login",
      component: LoginView,
    },
    {
      path: "/",
      name: "home",
      component: HomeView,
      meta: { requiresAuth: true },
    },
    {
      path: "/stats",
      name: "stats",
      component: StatsView,
      meta: { requiresAuth: true },
    },
    // 2. Ajout de la route Paramètres avec ses enfants
    {
      path: "/settings",
      name: "settings",
      component: SettingsView,
      meta: { requiresAuth: true },
      redirect: { name: "settings-profile" }, // Redirection automatique vers le profil
      children: [
        {
          path: "profile", // Notez: pas de '/' au début pour les enfants
          name: "settings-profile",
          component: ProfileSettings,
        },
        {
          path: "projects",
          name: "settings-projects",
          component: ProjectsSettings,
        },
        {
          path: "activities",
          name: "settings-activities",
          component: ActivitiesSettings,
        },
      ],
    },
  ],
});

router.beforeEach((to, from) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.isConnected) {
    return { name: "login" };
  }
});

export default router;
