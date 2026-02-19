// src/stores/stats.js
import { defineStore } from "pinia";

export const useStatsStore = defineStore("stats", {
  state: () => ({
    filteredEntries: [],
    loading: false,
  }),
  getters: {
    // Calcul du temps total sur la sélection
    totalDurationMs: (state) => {
      return state.filteredEntries.reduce(
        (acc, e) => (e.end ? acc + (new Date(e.end) - new Date(e.start)) : acc),
        0,
      );
    },
    // Nombre de projets (utile pour le KPI)
    projectCount: (state) =>
      new Set(state.filteredEntries.map((e) => e.project_id)).size,

    // Données pour le graphe Projet
    statsByProject: (state) => {
      const map = {};
      state.filteredEntries.forEach((e) => {
        if (!e.end) return;
        const name = e.project?.name || "Inconnu";
        map[name] = (map[name] || 0) + (new Date(e.end) - new Date(e.start));
      });
      return map;
    },
    // Données pour le graphe Activité
    statsByActivity: (state) => {
      const map = {};
      state.filteredEntries.forEach((e) => {
        if (!e.end) return;
        const name = e.activity?.name || "Inconnu";
        const color = e.activity?.color || "#cccccc";
        if (!map[name]) map[name] = { total: 0, color };
        map[name].total += new Date(e.end) - new Date(e.start);
      });
      return map;
    },
  },
  actions: {
    async fetchStats(fromDate, toDate, projectId = null) {
      this.loading = true;
      try {
        const params = { from: fromDate, to: toDate };
        if (projectId) params.project_id = projectId; // On ajoute le filtre si présent

        const { data } = await this.$api.get("/api/time-entries", { params });

        // Tri chronologique (du plus ancien au plus récent pour le rapport)
        this.filteredEntries = data.sort(
          (a, b) => new Date(a.start) - new Date(b.start),
        );
      } finally {
        this.loading = false;
      }
    },
  },
});
