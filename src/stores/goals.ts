import { defineStore } from "pinia";

export const useGoalsStore = defineStore("goals", {
  state: () => ({
    goals: [] as any[],
    // Objectif journalier en nombre de tâches (préférence locale)
    dailyGoal: 0,
  }),
  getters: {
    // Objectifs non atteints
    getActiveGoals: (state) => state.goals.filter((g) => !g.done),
    // Objectifs atteints
    getCompletedGoals: (state) => state.goals.filter((g) => g.done),
    // Nombre d'objectifs atteints aujourd'hui
    todayCompletedCount: (state) => state.goals.filter((g) => g.done).length,
    // Nombre total d'objectifs chargés
    todayTotalCount: (state) => state.goals.length,
  },
  actions: {
    // Charger les objectifs depuis l'API (filtrés par date si fournie)
    async fetchGoals(date: string | null = null) {
      try {
        const params: Record<string, string> = {};
        if (date) params.date = date;
        const { data } = await this.$api.get("/api/daily-objectives", {
          params,
        });
        this.goals = data;
      } catch (e) {
        console.error("Erreur chargement objectifs", e);
      }
    },

    // Ajouter un objectif (name obligatoire, content optionnel)
    async addGoal(name: string, content: string) {
      const { data } = await this.$api.post("/api/daily-objectives", {
        name,
        content,
      });
      this.goals.push(data);
    },

    // Marquer un objectif comme atteint
    async completeGoal(id: string | number) {
      const { data } = await this.$api.patch(
        `/api/daily-objectives/${id}/done`,
      );
      const idx = this.goals.findIndex((g) => g.id === id);
      if (idx !== -1) this.goals[idx] = data;
    },

    // Marquer un objectif comme non atteint
    async undoneGoal(id: string | number) {
      const { data } = await this.$api.patch(
        `/api/daily-objectives/${id}/undone`,
      );
      const idx = this.goals.findIndex((g) => g.id === id);
      if (idx !== -1) this.goals[idx] = data;
    },

    // Supprimer un objectif
    async deleteGoal(id: string | number) {
      await this.$api.delete(`/api/daily-objectives/${id}`);
      this.goals = this.goals.filter((g) => g.id !== id);
    },

    // Mettre à jour un objectif
    async updateGoal(id: string | number, name: string, content: string) {
      const { data } = await this.$api.put(`/api/daily-objectives/${id}`, {
        name,
        content,
      });
      const idx = this.goals.findIndex((g) => g.id === id);
      if (idx !== -1) this.goals[idx] = data;
    },
  },
  persist: {
    enabled: true,
    // On ne persiste que la préférence locale dailyGoal
    strategies: [{ storage: localStorage, paths: ["dailyGoal"] }],
  },
});
