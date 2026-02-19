import { defineStore } from "pinia";

export const useProjectsStore = defineStore("projects", {
  state: () => ({
    projects: [],
  }),
  actions: {
    // 1. LISTER
    async fetchProjects() {
      const { data } = await this.$api.get("/api/projects");
      this.projects = data;
    },

    // 2. AJOUTER
    async createProject(name, description) {
      const { data } = await this.$api.post("/api/projects", {
        name,
        description,
      });
      this.projects.push(data);
    },

    // 3. MODIFIER (Infos générales)
    async updateProject(project) {
      // On utilise PUT pour mettre à jour le nom/description
      const { data } = await this.$api.put(`/api/projects/${project.id}`, {
        name: project.name,
        description: project.description,
      });
      // Mise à jour locale
      const index = this.projects.findIndex((p) => p.id === project.id);
      if (index !== -1) this.projects[index] = data;
    },

    // 4. DÉSACTIVER
    async disableProject(id) {
      // Appel du endpoint spécifique demandé
      const { data } = await this.$api.patch(`/api/projects/${id}/disable`);

      // Mise à jour locale
      const index = this.projects.findIndex((p) => p.id === id);
      if (index !== -1) this.projects[index] = data;
    },

    // 5. RÉACTIVER (Si endpoint /enable existe)
    async enableProject(id) {
      // Tentez '/enable' ou réessayez '/disable' si c'est un toggle
      try {
        const { data } = await this.$api.patch(`/api/projects/${id}/enable`);
        const index = this.projects.findIndex((p) => p.id === id);
        if (index !== -1) this.projects[index] = data;
      } catch (e) {
        console.error("L'endpoint /enable n'existe peut-être pas ?", e);
      }
    },
  },
});
