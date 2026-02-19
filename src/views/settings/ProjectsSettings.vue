<script setup>
import { onMounted, ref, computed } from "vue";
import { useProjectsStore } from "@/stores/projects";

const projectsStore = useProjectsStore();

// Variables
const newProjectName = ref("");
const newProjectDesc = ref(""); // Pour la création
const searchQuery = ref("");
const editingId = ref(null);

// On utilise un objet pour stocker les données en cours d'édition
const editForm = ref({
  name: "",
  description: "",
});

onMounted(() => {
  projectsStore.fetchProjects();
});

// --- RECHERCHE ---
const filteredProjects = computed(() => {
  if (!searchQuery.value) return projectsStore.projects;
  const lowerSearch = searchQuery.value.toLowerCase();
  return projectsStore.projects.filter((p) =>
    p.name.toLowerCase().includes(lowerSearch),
  );
});

// --- AJOUTER ---
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

// --- MODIFIER ---
const startEdit = (project) => {
  editingId.value = project.id;
  // On remplit le formulaire avec les valeurs actuelles
  editForm.value = {
    name: project.name,
    description: project.description || "", // Gestion du null
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

// --- DÉSACTIVER / RÉACTIVER ---
const toggleStatus = async (project) => {
  // Adaptez 'isActive' selon le vrai champ API (active, enable, etc.)
  if (project.is_enabled) {
    await projectsStore.disableProject(project.id);
  } else {
    await projectsStore.enableProject(project.id);
  }
};

const isActive = (p) => p.is_enabled; // À adapter selon API
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
      <input v-model="searchQuery" placeholder="🔍 Rechercher un projet..." />
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
  background: #f9f9f9;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
}
.input-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.input-group input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.search-bar input {
  width: 100%;
  padding: 8px;
  margin-bottom: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #eee;
}
.data-table th,
.data-table td {
  padding: 12px;
  border-bottom: 1px solid #eee;
  text-align: left;
  vertical-align: top;
}

.project-name {
  font-weight: bold;
  color: #2c3e50;
}
.project-desc {
  font-size: 0.9em;
  color: #666;
  margin-top: 4px;
}

.edit-mode {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.edit-input {
  padding: 6px;
  width: 100%;
  box-sizing: border-box;
  font-family: inherit;
}

.badge-active {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8em;
}
.badge-inactive {
  background: #ffebee;
  color: #c62828;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8em;
}

button {
  cursor: pointer;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.9em;
  margin-bottom: 4px;
}
.btn-primary {
  background: #42b983;
  color: white;
}
.btn-save {
  background: #4caf50;
  color: white;
  width: 100%;
}
.btn-cancel {
  background: #9e9e9e;
  color: white;
  width: 100%;
}
.btn-edit {
  background: #2196f3;
  color: white;
  display: block;
  width: 100%;
}
.btn-disable {
  background: #ef5350;
  color: white;
  display: block;
  width: 100%;
}
.btn-enable {
  background: #66bb6a;
  color: white;
  display: block;
  width: 100%;
}

.row-disabled {
  opacity: 0.6;
  background: #fdfdfd;
}

/* Transitions pour l'apparition/disparition des lignes du tableau */
.list-enter-active,
.list-leave-active {
  transition: all 0.35s ease;
}
.list-enter-from {
  opacity: 0;
  transform: translateX(-16px);
}
.list-leave-to {
  opacity: 0;
  transform: translateX(16px);
}
.list-move {
  transition: transform 0.35s ease;
}
</style>
