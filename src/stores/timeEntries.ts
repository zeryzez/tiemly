import { defineStore } from "pinia";

export const useTimeEntriesStore = defineStore("timeEntries", {
  state: () => ({
    entries: [],
    loading: false,
  }),

  getters: {
    runningEntry: (state) => state.entries.find((e) => e.end === null),
  },

  actions: {
    async fetchEntries() {
      this.loading = true;
      try {
        const { data } = await this.$api.get("/api/time-entries");
        console.log("Entries reçues", data);

        // ASTUCE : Si on a déjà une activité qui tourne (runningEntry) en mémoire,
        // et qu'elle n'est pas dans les données reçues (data), on la réinjecte manuellement.
        const currentRunning = this.runningEntry;

        this.entries = data;

        // Si on avait une activité en cours et qu'elle a disparu après le fetch, on la remet
        if (
          currentRunning &&
          !this.entries.find((e) => e.id === currentRunning.id)
        ) {
          this.entries.unshift(currentRunning);
        }
      } catch (e) {
        console.error("Erreur chargement entrées", e);
      } finally {
        this.loading = false;
      }
    },

    async startTimer(projectId, activityId) {
      const { data } = await this.$api.post("/api/time-entries", {
        project_id: projectId,
        activity_id: activityId,
      });
      this.entries.unshift(data);
    },

    async stopTimer(entryId) {
      const { data } = await this.$api.patch(
        `/api/time-entries/${entryId}/stop`,
      );

      const index = this.entries.findIndex((e) => e.id === entryId);
      if (index !== -1) {
        this.entries[index] = data;
      }
    },

    async deleteEntry(entryId) {
      await this.$api.delete(`/api/time-entries/${entryId}`);
      this.entries = this.entries.filter((e) => e.id !== entryId);
    },
  },
  persist: {
    enabled: true,
    strategies: [{ storage: localStorage, paths: ["entries"] }],
  },
});
