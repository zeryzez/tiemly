import { defineStore } from "pinia";

export const useActivitiesStore = defineStore("activities", {
  state: () => ({
    activities: [],
  }),
  actions: {
    async fetchActivities() {
      const { data } = await this.$api.get("/api/activities");
      this.activities = data;
    },

    async createActivity(name, color = "#000000") {
      // On envoie une couleur par défaut car l'API peut l'exiger, mais on ne la demande plus à l'user
      const { data } = await this.$api.post("/api/activities", {
        name,
        color,
      });
      this.activities.push(data);
    },

    async updateActivity(activity) {
      const { data } = await this.$api.put(`/api/activities/${activity.id}`, {
        name: activity.name,
        color: activity.color || "#000000",
      });
      const index = this.activities.findIndex((a) => a.id === activity.id);
      if (index !== -1) this.activities[index] = data;
    },

    async disableActivity(id) {
      const { data } = await this.$api.patch(`/api/activities/${id}/disable`);
      const index = this.activities.findIndex((a) => a.id === id);
      if (index !== -1) this.activities[index] = data;
    },

    async enableActivity(id) {
      try {
        const { data } = await this.$api.patch(`/api/activities/${id}/enable`);
        const index = this.activities.findIndex((a) => a.id === id);
        if (index !== -1) this.activities[index] = data;
      } catch (e) {
        console.error("Erreur réactivation", e);
      }
    },
  },
});
