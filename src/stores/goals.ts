import { defineStore } from "pinia";

export const useGoalsStore = defineStore("goals", {
  state: () => ({
    goals: [], // Liste des objectifs
  }),
  getters: {
    // Récupérer les objectifs non atteints
    getActiveGoals: (state) => {
      return state.goals.filter((goal) => !goal.completed);
    },

    // Récupérer les objectifs atteints
    getCompletedGoals: (state) => {
      return state.goals.filter((goal) => goal.completed);
    },
  },
  actions: {
    // Ajouter un objectif
    addGoal(name, description) {
      const newGoal = {
        id: Date.now(), // Identifiant unique
        name,
        description,
        createdAt: new Date().toISOString(),
        completed: false,
      };
      this.goals.push(newGoal);
    },

    // Marquer un objectif comme terminé
    completeGoal(id) {
      const goal = this.goals.find((g) => g.id === id);
      if (goal) goal.completed = true;
    },
  },
  persist: {
    enabled: true,
    strategies: [{ storage: localStorage, paths: ["goals"] }],
  },
});
