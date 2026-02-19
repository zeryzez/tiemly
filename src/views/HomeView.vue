<script setup>
import { ref, onMounted, computed } from "vue";
import { useProjectsStore } from "@/stores/projects";
import { useActivitiesStore } from "@/stores/activities";
import { useTimeEntriesStore } from "@/stores/timeEntries";
import { useGoalsStore } from "@/stores/goals";
import { marked } from "marked"; // Import de la bibliothèque Markdown

// Stores
const projectsStore = useProjectsStore();
const activitiesStore = useActivitiesStore();
const timeStore = useTimeEntriesStore();

// Variables
const notes = ref(""); // Notes pour l'activité en cours
const filterProject = ref(""); // Filtre par projet
const filterActivity = ref(""); // Filtre par activité
const filterKeyword = ref(""); // Filtre par mots-clés
const selectedProject = ref(""); // Projet sélectionné
const selectedActivity = ref(""); // Activité sélectionnée
const newProjectName = ref(""); // Nouveau projet
const newActivityName = ref(""); // Nouvelle activité

// Helper pour obtenir la date au format YYYY-MM-DD
const getTodayDate = () => new Date().toISOString().split("T")[0];

// Chargement des données au montage
onMounted(async () => {
  await Promise.all([
    projectsStore.fetchProjects(),
    activitiesStore.fetchActivities(),
    timeStore.fetchEntries(getTodayDate(), getTodayDate()),
  ]);
});

// Création rapide d'un projet
const quickCreateProject = async () => {
  if (newProjectName.value) {
    await projectsStore.createProject(
      newProjectName.value,
      "Créé depuis l'accueil",
    );
    newProjectName.value = "";
  }
};

// Création rapide d'une activité
const quickCreateActivity = async () => {
  if (newActivityName.value) {
    await activitiesStore.createActivity(newActivityName.value, "#000000");
    newActivityName.value = "";
  }
};

// Démarrer une activité
const handleStart = async () => {
  await timeStore.startTimer(selectedProject.value, selectedActivity.value);
  selectedProject.value = "";
  selectedActivity.value = "";
};

// Arrêter une activité
const handleStop = async (id) => {
  await timeStore.stopTimer(id);
};

// Fonction pour retrouver le nom de l'activité
const getActivityName = (entry) => {
  if (entry.activity && entry.activity.name) return entry.activity.name;
  const found = activitiesStore.activities.find(
    (a) => a.id === entry.activity_id,
  );
  return found ? found.name : "Activité inconnue";
};

// Fonction pour retrouver le nom du projet
const getProjectName = (entry) => {
  if (entry.project && entry.project.name) return entry.project.name;
  const found = projectsStore.projects.find((p) => p.id === entry.project_id);
  return found ? found.name : "Projet inconnu";
};

const goalsStore = useGoalsStore();

// Variables pour le formulaire
const newGoalName = ref("");
const newGoalDescription = ref("");

// Variables pour la recherche et l'affichage
const searchQuery = ref("");
const showCompleted = ref(false);

// Liste des objectifs filtrés
const filteredGoals = computed(() => {
  const goals = showCompleted.value
    ? goalsStore.getCompletedGoals // Accès direct au getter
    : goalsStore.getActiveGoals; // Accès direct au getter

  if (!searchQuery.value) return goals;

  const lowerQuery = searchQuery.value.toLowerCase();
  return goals.filter(
    (goal) =>
      goal.name.toLowerCase().includes(lowerQuery) ||
      goal.description.toLowerCase().includes(lowerQuery),
  );
});

// Ajouter un nouvel objectif
const addGoal = () => {
  if (newGoalName.value.trim() && newGoalDescription.value.trim()) {
    goalsStore.addGoal(newGoalName.value, newGoalDescription.value);
    newGoalName.value = "";
    newGoalDescription.value = "";
  }
};

// Marquer un objectif comme terminé
const completeGoal = (id) => {
  goalsStore.completeGoal(id);
};
</script>

<template>
  <div class="home-container">
    <h1>Time Tracker</h1>

    <!-- Activité en cours -->
    <div v-if="timeStore.runningEntry" class="active-entry-card">
      <h3>⏱️ Activité en cours...</h3>
      <p>
        <strong>Projet :</strong> {{ timeStore.runningEntry.project?.name
        }}<br />
        <strong>Activité :</strong> {{ timeStore.runningEntry.activity?.name
        }}<br />
        <strong>Début :</strong>
        {{ new Date(timeStore.runningEntry.start).toLocaleTimeString() }}
      </p>
      <textarea
        v-model="notes"
        placeholder="Prenez des notes ici..."
      ></textarea>
      <div v-html="marked(notes)"></div>
      <button class="stop-btn" @click="handleStop(timeStore.runningEntry.id)">
        STOPPER
      </button>
    </div>

    <!-- Démarrage d'une nouvelle activité -->
    <div v-else class="tracker-card">
      <div v-if="projectsStore.projects.length === 0" class="warning-box">
        <p>Vous n'avez aucun projet.</p>
        <div class="quick-add">
          <input v-model="newProjectName" placeholder="Nom du projet..." />
          <button @click="quickCreateProject">Créer Projet</button>
        </div>
      </div>

      <div
        v-else-if="activitiesStore.activities.length === 0"
        class="warning-box"
      >
        <p>Il vous manque des types d'activités (ex: Dév, Réunion...).</p>
        <div class="quick-add">
          <input v-model="newActivityName" placeholder="Nom de l'activité..." />
          <button @click="quickCreateActivity">Créer Activité</button>
        </div>
      </div>

      <div v-else class="controls">
        <select v-model="selectedProject">
          <option value="" disabled>Choisir un projet</option>
          <option v-for="p in projectsStore.projects" :key="p.id" :value="p.id">
            {{ p.name }}
          </option>
        </select>

        <select v-model="selectedActivity">
          <option value="" disabled>Type d'activité</option>
          <option
            v-for="a in activitiesStore.activities"
            :key="a.id"
            :value="a.id"
          >
            {{ a.name }}
          </option>
        </select>

        <button
          class="start-btn"
          :disabled="!selectedProject || !selectedActivity"
          @click="handleStart"
        >
          DÉMARRER
        </button>
      </div>
    </div>

    <!-- Liste des activités -->
    <div class="entries-list">
      <h2>Activités du jour</h2>
      <div class="filters">
        <select v-model="filterProject">
          <option value="">Tous les projets</option>
          <option v-for="p in projectsStore.projects" :key="p.id" :value="p.id">
            {{ p.name }}
          </option>
        </select>
        <select v-model="filterActivity">
          <option value="">Toutes les activités</option>
          <option
            v-for="a in activitiesStore.activities"
            :key="a.id"
            :value="a.id"
          >
            {{ a.name }}
          </option>
        </select>
        <input
          v-model="filterKeyword"
          placeholder="Rechercher par mot-clé..."
        />
      </div>
      <ul>
        <li
          v-for="entry in timeStore.entries.filter(
            (e) =>
              (!filterProject || e.project_id === filterProject) &&
              (!filterActivity || e.activity_id === filterActivity) &&
              (!filterKeyword || e.notes?.includes(filterKeyword)),
          )"
          :key="entry.id"
          class="entry-item"
        >
          <div class="info">
            <strong>{{ getProjectName(entry) }}</strong> -
            {{ getActivityName(entry) }}
          </div>
          <div class="time">
            {{
              new Date(entry.start).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            }}
            -
            <span v-if="entry.end">
              {{
                new Date(entry.end).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              }}
            </span>
            <span v-else class="tag-running">En cours...</span>
          </div>
        </li>
      </ul>
      <p v-if="timeStore.entries.length === 0">Rien pour l'instant.</p>
    </div>
  </div>

  <!-- Section Objectifs journaliers -->
  <div class="goals-section">
    <h2>Objectifs journaliers</h2>

    <!-- Formulaire d'ajout d'un objectif -->
    <div class="goal-form">
      <input
        v-model="newGoalName"
        placeholder="Nom de l'objectif"
        class="goal-input"
      />
      <textarea
        v-model="newGoalDescription"
        placeholder="Description de l'objectif (Markdown supporté)"
        class="goal-textarea"
      ></textarea>
      <button @click="addGoal" class="btn-add-goal">Ajouter</button>
    </div>

    <!-- Recherche et filtres -->
    <div class="goal-filters">
      <input
        v-model="searchQuery"
        placeholder="Rechercher un objectif..."
        class="goal-search"
      />
      <button
        @click="showCompleted = !showCompleted"
        class="btn-toggle-completed"
      >
        {{
          showCompleted
            ? "Voir les objectifs actifs"
            : "Voir les objectifs passés"
        }}
      </button>
    </div>

    <!-- Liste des objectifs -->
    <ul class="goal-list">
      <li v-for="goal in filteredGoals" :key="goal.id" class="goal-item">
        <div class="goal-header">
          <strong>{{ goal.name }}</strong>
          <span class="goal-date">
            Créé le : {{ new Date(goal.createdAt).toLocaleDateString() }}
          </span>
        </div>
        <div class="goal-description" v-html="marked(goal.description)"></div>
        <button
          v-if="!goal.completed"
          @click="completeGoal(goal.id)"
          class="btn-complete-goal"
        >
          Terminer
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.home-container {
  padding: 20px;
}
.active-entry-card {
  background-color: #e8f5e9;
  border: 1px solid #4caf50;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 2rem;
  text-align: center;
}
.stop-btn {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 10px 20px;
  font-weight: bold;
  cursor: pointer;
  border-radius: 4px;
  margin-top: 10px;
}
.tracker-card {
  margin-bottom: 2rem;
}
.warning-box {
  background-color: #fff3cd;
  border: 1px solid #ffeeba;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 1rem;
}
.quick-add {
  display: flex;
  gap: 10px;
}
.controls {
  display: flex;
  gap: 10px;
}
.entries-list {
  margin-top: 2rem;
}
.filters {
  display: flex;
  gap: 10px;
  margin-bottom: 1rem;
}
.entry-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  border-bottom: 1px solid #eee;
}
.tag-running {
  color: #f44336;
  font-weight: bold;
}
.goals-section {
  margin-top: 2rem;
}

.goal-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 1rem;
}

.goal-input,
.goal-textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.goal-textarea {
  min-height: 80px;
}

.btn-add-goal {
  align-self: flex-start;
  padding: 8px 12px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.goal-filters {
  display: flex;
  gap: 10px;
  margin-bottom: 1rem;
}

.goal-search {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.btn-toggle-completed {
  padding: 8px 12px;
  background-color: #2c3e50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.goal-list {
  list-style: none;
  padding: 0;
}

.goal-item {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 10px;
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.goal-description {
  margin: 10px 0;
  font-size: 0.9rem;
  color: #555;
}

.btn-complete-goal {
  padding: 6px 10px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
