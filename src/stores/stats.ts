import { defineStore } from "pinia";

export const useStatsStore = defineStore("stats", {
  state: () => ({
    filteredEntries: [],
    loading: false,
  }),
  getters: {
    totalDurationMs: (state) => {
      return state.filteredEntries.reduce(
        (acc, e) => (e.end ? acc + (new Date(e.end) - new Date(e.start)) : acc),
        0,
      );
    },
    projectCount: (state) =>
      new Set(state.filteredEntries.map((e) => e.project_id)).size,
    statsByProject: (state) => {
      const map = {};
      state.filteredEntries.forEach((e) => {
        if (!e.end) return;
        const key = e.project_id || "inconnu";
        map[key] = (map[key] || 0) + (new Date(e.end) - new Date(e.start));
      });
      return map;
    },
    statsByActivity: (state) => {
      const map = {};
      state.filteredEntries.forEach((e) => {
        if (!e.end) return;
        const key = e.activity_id || "inconnu";
        const color = e.activity?.color || "#cccccc";
        if (!map[key]) map[key] = { total: 0, color };
        map[key].total += new Date(e.end) - new Date(e.start);
      });
      return map;
    },
  },
  actions: {
    async fetchStats(fromDate, toDate, projectId = null) {
      this.loading = true;
      try {
        const params = { from: fromDate, to: toDate };
        if (projectId) params.project_id = projectId;

        const { data } = await this.$api.get("/api/time-entries", { params });
        console.log("Stats API response", data);
        this.filteredEntries = data.sort(
          (a, b) => new Date(a.start) - new Date(b.start),
        );
      } finally {
        this.loading = false;
      }
    },
  },
});
