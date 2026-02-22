import { defineStore } from "pinia";

export const useProjectsStore = defineStore("projects", {
  state: () => ({
    projects: [],
  }),
  actions: {
    async fetchProjects() {
      const { data } = await this.$api.get("/api/projects");
      this.projects = data;
    },
    async createProject(name, description) {
      const { data } = await this.$api.post("/api/projects", {
        name,
        description,
      });
      this.projects.push(data);
    },
    async updateProject(project) {
      const { data } = await this.$api.put(`/api/projects/${project.id}`, {
        name: project.name,
        description: project.description,
      });
      const index = this.projects.findIndex((p) => p.id === project.id);
      if (index !== -1) this.projects[index] = data;
    },
    async disableProject(id) {
      const { data } = await this.$api.patch(`/api/projects/${id}/disable`);
      const index = this.projects.findIndex((p) => p.id === id);
      if (index !== -1) this.projects[index] = data;
    },
    async enableProject(id) {
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
