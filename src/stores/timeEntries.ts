import { defineStore } from "pinia";

export const useTimeEntriesStore = defineStore("timeEntries", {
  state: () => ({
    entries: [] as any[],
    loading: false,
  }),

  getters: {
    // Entrée en cours (sans date de fin)
    runningEntry: (state) => state.entries.find((e) => e.end === null),
  },

  actions: {
    // Charger les entrées avec filtre optionnel from/to (YYYY-MM-DD)
    async fetchEntries(from: string | null = null, to: string | null = null) {
      this.loading = true;
      try {
        const params: Record<string, string> = {};
        if (from) params.from = from;
        if (to) params.to = to;

        const { data } = await this.$api.get("/api/time-entries", { params });

        // Si une entrée tourne en mémoire et n'est pas dans le retour API,
        // on la réinjecte pour ne pas perdre son affichage.
        const currentRunning = this.runningEntry;
        this.entries = data;

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

    // Démarrer un timer
    async startTimer(projectId: string, activityId: string) {
      const { data } = await this.$api.post("/api/time-entries", {
        project_id: projectId,
        activity_id: activityId,
      });
      this.entries.unshift(data);
    },

    // Stopper le timer d'une entrée
    async stopTimer(entryId: string) {
      const { data } = await this.$api.patch(
        `/api/time-entries/${entryId}/stop`,
      );
      const index = this.entries.findIndex((e) => e.id === entryId);
      if (index !== -1) {
        this.entries[index] = data;
      }
    },

    // Supprimer une entrée
    async deleteEntry(entryId: string) {
      await this.$api.delete(`/api/time-entries/${entryId}`);
      this.entries = this.entries.filter((e) => e.id !== entryId);
    },

    // Modifier une entrée existante
    async updateEntry(entry: {
      id: string;
      project_id: string;
      activity_id: string;
      start: string;
      end: string | null;
      comment?: string;
    }) {
      const { data } = await this.$api.put(`/api/time-entries/${entry.id}`, {
        project_id: entry.project_id,
        activity_id: entry.activity_id,
        start: entry.start,
        end: entry.end,
        comment: entry.comment || "",
      });
      const index = this.entries.findIndex((e) => e.id === entry.id);
      if (index !== -1) {
        this.entries[index] = data;
      }
    },

    // Créer une entrée manuelle (start ET end obligatoires)
    async createManualEntry(
      projectId: string,
      activityId: string,
      start: string,
      end: string,
      comment: string = "",
    ) {
      const { data } = await this.$api.post("/api/time-entries", {
        project_id: projectId,
        activity_id: activityId,
        start,
        end,
        comment,
      });
      this.entries.unshift(data);
    },
  },
  persist: {
    enabled: true,
    strategies: [{ storage: localStorage, paths: ["entries"] }],
  },
});
