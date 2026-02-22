<script setup>
import { onMounted, ref, computed } from "vue";
import { useProjectsStore } from "@/stores/projects";

const projectsStore = useProjectsStore();

const newProjectName = ref("");
const newProjectDesc = ref(""); 
const searchQuery = ref("");
const editingId = ref(null);

const editForm = ref({
  name: "",
  description: "",
});

onMounted(() => {
  projectsStore.fetchProjects();
});

const filteredProjects = computed(() => {
  if (!searchQuery.value) return projectsStore.projects;
  const lowerSearch = searchQuery.value.toLowerCase();
  return projectsStore.projects.filter((p) =>
    p.name.toLowerCase().includes(lowerSearch),
  );
});

const handleCreate = async () => {
  if (newProjectName.value) {
    await projectsStore.createProject(
      newProjectName.value,
      newProjectDesc.value,
    );
    newProjectName.value = "";
    newProjectDesc.value = "";
  }
};

const startEdit = (project) => {
  editingId.value = project.id;
  editForm.value = {
    name: project.name,
    description: project.description || "", 
  };
};

const saveEdit = async (project) => {
  const updated = {
    ...project,
    name: editForm.value.name,
    description: editForm.value.description,
  };
  await projectsStore.updateProject(updated);
  editingId.value = null;
};

const cancelEdit = () => {
  editingId.value = null;
};

const toggleStatus = async (project) => {
  if (project.is_enabled) {
    await projectsStore.disableProject(project.id);
  } else {
    await projectsStore.enableProject(project.id);
  }
};

const isActive = (p) => p.is_enabled; 
</script>

<template>
  <div>
    <h2>Gestion des Projets</h2>

    <div class="controls box">
      <h3>Nouveau Projet</h3>
      <div class="input-group">
        <input v-model="newProjectName" placeholder="Nom du projet..." />
        <input v-model="newProjectDesc" placeholder="Description courte..." />
        <button class="btn-primary" @click="handleCreate">Ajouter</button>
      </div>
    </div>

    <div class="search-bar">
      <input v-model="searchQuery" placeholder="Rechercher un projet..." />
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th>Info Projet</th>
          <th style="width: 100px">État</th>
          <th style="width: 180px">Actions</th>
        </tr>
      </thead>
      <transition-group name="list" tag="tbody">
        <tr
          v-for="project in filteredProjects"
          :key="project.id"
          :class="{ 'row-disabled': !isActive(project) }"
        >
          <td>
            <div v-if="editingId === project.id" class="edit-mode">
              <input
                v-model="editForm.name"
                placeholder="Nom"
                class="edit-input"
              />
              <textarea
                v-model="editForm.description"
                placeholder="Description"
                class="edit-input"
              ></textarea>
            </div>

            <div v-else>
              <div class="project-name">{{ project.name }}</div>
              <div class="project-desc">{{ project.description }}</div>
            </div>
          </td>

          <td>
            <span
              :class="isActive(project) ? 'badge-active' : 'badge-inactive'"
            >
              {{ isActive(project) ? "Actif" : "Désactivé" }}
            </span>
          </td>

          <td>
            <div v-if="editingId === project.id" class="action-buttons">
              <button class="btn-save" @click="saveEdit(project)">
                Enregistrer
              </button>
              <button class="btn-cancel" @click="cancelEdit">Annuler</button>
            </div>

            <div v-else class="action-buttons">
              <button class="btn-edit" @click="startEdit(project)">
                Modifier
              </button>
              <button
                :class="isActive(project) ? 'btn-disable' : 'btn-enable'"
                @click="toggleStatus(project)"
              >
                {{ isActive(project) ? "Désactiver" : "Réactiver" }}
              </button>
            </div>
          </td>
        </tr>
      </transition-group>
    </table>
  </div>
</template>

<style scoped>
.box {
  background: var(--card-bg);
  padding: 1.5rem;
  border-radius: var(--radius);
  margin-bottom: 1.5rem;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow);
}
.input-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.input-group input {
  flex: 1;
  min-width: 200px;
}

.search-bar input {
  margin-bottom: 1.5rem;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--card-bg);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
}
.data-table th,
.data-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  text-align: left;
  vertical-align: top;
}
.data-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: var(--secondary);
}

.project-name {
  font-weight: 600;
  color: var(--secondary);
}
.project-desc {
  font-size: 0.9em;
  color: var(--text-muted);
  margin-top: 4px;
}

.edit-mode {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.edit-input {
  width: 100%;
}

.badge-active {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.85em;
  font-weight: 600;
}
.badge-inactive {
  background: #ffebee;
  color: #c62828;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.85em;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
button {
  width: 100%;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9em;
  transition: background 0.2s;
}
.btn-primary { background: var(--primary); color: white; }
.btn-primary:hover { background: var(--primary-hover); }
.btn-save { background: #4caf50; color: white; }
.btn-cancel { background: #9e9e9e; color: white; }
.btn-edit { background: #2196f3; color: white; }
.btn-disable { background: var(--danger); color: white; }
.btn-enable { background: #66bb6a; color: white; }

.row-disabled {
  opacity: 0.6;
  background: #fafafa;
}

.data-table tbody tr {
  transition: all 0.2s ease;
}
.data-table tbody tr:hover:not(.row-disabled) {
  background: rgba(66, 185, 131, 0.05);
  transform: translateX(2px);
}
</style>
