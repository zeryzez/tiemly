import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    apiKey: null,
    user: null,
  }),
  getters: {
    isConnected: (state) => !!state.apiKey,
  },
  actions: {
    setApiKey(key) {
      this.apiKey = key;
      this.$api.defaults.headers.common["Authorization"] = `key=${key}`;
    },
    logout() {
      this.apiKey = null;
      this.user = null;
      delete this.$api.defaults.headers.common["Authorization"];
    },
    async fetchProfile() {
      try {
        const { data } = await this.$api.get("/api/profile");
        this.user = data;
        return { success: true, data };
      } catch (error) {
        console.error("Erreur chargement profil", error);
        return { success: false, error };
      }
    },
    async updateProfile(updatedData) {
      try {
        const { data } = await this.$api.put("/api/profile", updatedData);
        this.user = data;
        return { success: true };
      } catch (error) {
        console.error("Erreur lors de la mise à jour du profil", error);
        return { success: false, error };
      }
    },
  },
  persist: {
    enabled: true,
    strategies: [{ storage: localStorage, paths: ["apiKey"] }],
  },
});
