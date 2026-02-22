import { defineStore } from "pinia";

export const useGoalsStore = defineStore("goals", {
  state: () => ({
    goals: [] as any[],
    dailyGoal: 0,
  }),
  getters: {
    getActiveGoals: (state) => state.goals.filter((g) => !g.done),
    getCompletedGoals: (state) => state.goals.filter((g) => g.done),
    todayCompletedCount: (state) => state.goals.filter((g) => g.done).length,
    todayTotalCount: (state) => state.goals.length,
  },
  actions: {
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
    async addGoal(name: string, content: string) {
      const { data } = await this.$api.post("/api/daily-objectives", {
        name,
        content,
      });
      this.goals.push(data);
    },
    async completeGoal(id: string | number) {
      const { data } = await this.$api.patch(
        `/api/daily-objectives/${id}/done`,
      );
      const idx = this.goals.findIndex((g) => g.id === id);
      if (idx !== -1) this.goals[idx] = data;
    },
    async undoneGoal(id: string | number) {
      const { data } = await this.$api.patch(
        `/api/daily-objectives/${id}/undone`,
      );
      const idx = this.goals.findIndex((g) => g.id === id);
      if (idx !== -1) this.goals[idx] = data;
    },
    async deleteGoal(id: string | number) {
      await this.$api.delete(`/api/daily-objectives/${id}`);
      this.goals = this.goals.filter((g) => g.id !== id);
    },
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
    strategies: [{ storage: localStorage, paths: ["dailyGoal"] }],
  },
});
