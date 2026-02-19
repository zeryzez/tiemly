<script setup>
import { ref, onMounted, computed } from "vue";
import { useProjectsStore } from "@/stores/projects";
import { useActivitiesStore } from "@/stores/activities";
import { useTimeEntriesStore } from "@/stores/timeEntries";
import { useGoalsStore } from "@/stores/goals";
import { dateMixin } from "@/mixins/dateMixin";

// Stores
const projectsStore = useProjectsStore();
const activitiesStore = useActivitiesStore();
const timeStore = useTimeEntriesStore();
const goalsStore = useGoalsStore();

// Helpers date via mixin
const {
  mixinGetTodayDate,
  mixinFormatTime,
  mixinFormatDurationH,
  mixinToApiDatetime,
  mixinFormatDate,
} = dateMixin.methods;

// --- TIME TRACKER ---
const selectedProject = ref("");
const selectedActivity = ref("");
const newProjectName = ref("");
const newActivityName = ref("");
const notes = ref("");

// --- FILTRES LISTE ---
const filterProject = ref("");
const filterActivity = ref("");
const filterKeyword = ref("");

// --- EDITION ENTRÉE ---
const editingEntryId = ref(null);
const editForm = ref({
  project_id: "",
  activity_id: "",
  start: "",
  end: "",
  comment: "",
});

// --- ENTRÉE MANUELLE ---
const showManualForm = ref(false);
const manualForm = ref({
  project_id: "",
  activity_id: "",
  start: "",
  end: "",
  comment: "",
});

// --- OBJECTIFS ---
const newGoalName = ref("");
const newGoalContent = ref("");
const searchQuery = ref("");
const showCompleted = ref(false);
const editingGoalId = ref(null);
const editGoalForm = ref({ name: "", content: "" });

// --- CHARGEMENT ---
onMounted(async () => {
  const today = mixinGetTodayDate();
  await Promise.all([
    projectsStore.fetchProjects(),
    activitiesStore.fetchActivities(),
    timeStore.fetchEntries(today, today),
    goalsStore.fetchGoals(today),
  ]);
});

// --- PROJETS ACTIFS (pour les selects) ---
const activeProjects = computed(() =>
  projectsStore.projects.filter((p) => p.is_enabled),
);
const activeActivities = computed(() =>
  activitiesStore.activities.filter((a) => a.is_enabled),
);

// --- NOM HELPERS ---
const getActivityName = (entry) => {
  if (entry.activity?.name) return entry.activity.name;
  const found = activitiesStore.activities.find(
    (a) => a.id === entry.activity_id,
  );
  return found ? found.name : "Activité inconnue";
};
const getProjectName = (entry) => {
  if (entry.project?.name) return entry.project.name;
  const found = projectsStore.projects.find((p) => p.id === entry.project_id);
  return found ? found.name : "Projet inconnu";
};

// --- CRÉATION RAPIDE ---
const quickCreateProject = async () => {
  if (newProjectName.value) {
    await projectsStore.createProject(newProjectName.value, "");
    newProjectName.value = "";
  }
};
const quickCreateActivity = async () => {
  if (newActivityName.value) {
    await activitiesStore.createActivity(newActivityName.value, "#42b983");
    newActivityName.value = "";
  }
};

// --- TIMER ---
const handleStart = async () => {
  await timeStore.startTimer(selectedProject.value, selectedActivity.value);
  selectedProject.value = "";
  selectedActivity.value = "";
  notes.value = "";
  // Rafraîchir les objectifs du header via le store goals
  await goalsStore.fetchGoals(mixinGetTodayDate());
};

const handleStop = async (id) => {
  await timeStore.stopTimer(id);
};

// --- LISTE FILTRÉE ---
const filteredEntries = computed(() =>
  timeStore.entries.filter((e) => {
    if (filterProject.value && e.project_id !== filterProject.value)
      return false;
    if (filterActivity.value && e.activity_id !== filterActivity.value)
      return false;
    if (
      filterKeyword.value &&
      !(e.comment || "")
        .toLowerCase()
        .includes(filterKeyword.value.toLowerCase())
    )
      return false;
    return true;
  }),
);

// Durée formattée d'une entrée
const entryDuration = (entry) => {
  if (!entry.end) return "en cours";
  const ms = new Date(entry.end) - new Date(entry.start);
  return mixinFormatDurationH(ms);
};

// --- EDITION ENTRÉE ---
const startEditEntry = (entry) => {
  editingEntryId.value = entry.id;
  // Convertir en format datetime-local (YYYY-MM-DDTHH:MM)
  const toLocalInput = (dt) => {
    if (!dt) return "";
    const d = new Date(dt);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  editForm.value = {
    project_id: entry.project_id || entry.project?.id || "",
    activity_id: entry.activity_id || entry.activity?.id || "",
    start: toLocalInput(entry.start),
    end: toLocalInput(entry.end),
    comment: entry.comment || "",
  };
};

const saveEditEntry = async (entry) => {
  await timeStore.updateEntry({
    id: entry.id,
    project_id: editForm.value.project_id,
    activity_id: editForm.value.activity_id,
    start: mixinToApiDatetime(editForm.value.start),
    end: editForm.value.end ? mixinToApiDatetime(editForm.value.end) : null,
    comment: editForm.value.comment,
  });
  editingEntryId.value = null;
};

const cancelEditEntry = () => {
  editingEntryId.value = null;
};

const deleteEntry = async (id) => {
  if (confirm("Supprimer cette entrée ?")) {
    await timeStore.deleteEntry(id);
  }
};

// --- ENTRÉE MANUELLE ---
const submitManualEntry = async () => {
  if (
    !manualForm.value.project_id ||
    !manualForm.value.activity_id ||
    !manualForm.value.start ||
    !manualForm.value.end
  ) {
    return;
  }
  await timeStore.createManualEntry(
    manualForm.value.project_id,
    manualForm.value.activity_id,
    mixinToApiDatetime(manualForm.value.start),
    mixinToApiDatetime(manualForm.value.end),
    manualForm.value.comment,
  );
  manualForm.value = {
    project_id: "",
    activity_id: "",
    start: "",
    end: "",
    comment: "",
  };
  showManualForm.value = false;
};

// --- OBJECTIFS ---
const filteredGoals = computed(() => {
  const goals = showCompleted.value
    ? goalsStore.getCompletedGoals
    : goalsStore.getActiveGoals;
  if (!searchQuery.value) return goals;
  const q = searchQuery.value.toLowerCase();
  return goals.filter(
    (g) =>
      g.name.toLowerCase().includes(q) ||
      (g.content || "").toLowerCase().includes(q),
  );
});

const addGoal = async () => {
  if (!newGoalName.value.trim()) return;
  await goalsStore.addGoal(newGoalName.value, newGoalContent.value);
  newGoalName.value = "";
  newGoalContent.value = "";
};

const completeGoal = async (id) => {
  await goalsStore.completeGoal(id);
};

const undoneGoal = async (id) => {
  await goalsStore.undoneGoal(id);
};

const deleteGoal = async (id) => {
  if (confirm("Supprimer cet objectif ?")) {
    await goalsStore.deleteGoal(id);
  }
};

const startEditGoal = (goal) => {
  editingGoalId.value = goal.id;
  editGoalForm.value = { name: goal.name, content: goal.content || "" };
};
const saveEditGoal = async (id) => {
  await goalsStore.updateGoal(
    id,
    editGoalForm.value.name,
    editGoalForm.value.content,
  );
  editingGoalId.value = null;
};
const cancelEditGoal = () => {
  editingGoalId.value = null;
};
</script>

<template>
  <div class="home-container">
    <h1>Time Tracker</h1>

    <!-- Activité en cours -->
    <transition name="fade">
      <div v-if="timeStore.runningEntry" class="active-entry-card">
        <div class="active-header">
          <span class="pulse-dot"></span>
          <h3>Activité en cours</h3>
        </div>
        <p>
          <strong>Projet :</strong>
          {{
            timeStore.runningEntry.project?.name ||
            getProjectName(timeStore.runningEntry)
          }}
          &nbsp;|&nbsp;
          <strong>Activité :</strong>
          {{
            timeStore.runningEntry.activity?.name ||
            getActivityName(timeStore.runningEntry)
          }}
          &nbsp;|&nbsp;
          <strong>Début :</strong>
          {{ mixinFormatTime(timeStore.runningEntry.start) }}
        </p>
        <div class="notes-block">
          <textarea
            v-model="notes"
            v-focus
            placeholder="Prenez des notes (Markdown supporté)..."
            class="notes-textarea"
          ></textarea>
          <div v-if="notes" class="notes-preview" v-markdown="notes"></div>
        </div>
        <button class="stop-btn" @click="handleStop(timeStore.runningEntry.id)">
          Stopper
        </button>
      </div>
    </transition>

    <!-- Démarrage d'une nouvelle activité -->
    <div v-if="!timeStore.runningEntry" class="tracker-card">
      <div v-if="activeProjects.length === 0" class="warning-box">
        <p>Vous n'avez aucun projet actif.</p>
        <div class="quick-add">
          <input v-model="newProjectName" placeholder="Nom du projet..." />
          <button @click="quickCreateProject">Créer Projet</button>
        </div>
      </div>

      <div v-else-if="activeActivities.length === 0" class="warning-box">
        <p>Vous n'avez aucun type d'activité actif.</p>
        <div class="quick-add">
          <input v-model="newActivityName" placeholder="Nom de l'activité..." />
          <button @click="quickCreateActivity">Créer Activité</button>
        </div>
      </div>

      <div v-else class="controls">
        <select v-model="selectedProject">
          <option value="" disabled>Choisir un projet</option>
          <option v-for="p in activeProjects" :key="p.id" :value="p.id">
            {{ p.name }}
          </option>
        </select>

        <select v-model="selectedActivity">
          <option value="" disabled>Type d'activité</option>
          <option v-for="a in activeActivities" :key="a.id" :value="a.id">
            {{ a.name }}
          </option>
        </select>

        <button
          class="start-btn"
          :disabled="!selectedProject || !selectedActivity"
          @click="handleStart"
        >
          Démarrer
        </button>
      </div>
    </div>

    <!-- Liste des activités du jour -->
    <div class="entries-section">
      <div class="section-header">
        <h2>Activités du jour</h2>
        <button class="btn-secondary" @click="showManualForm = !showManualForm">
          {{ showManualForm ? "Annuler" : "+ Entrée manuelle" }}
        </button>
      </div>

      <!-- Formulaire entrée manuelle -->
      <transition name="slide-down">
        <div v-if="showManualForm" class="manual-form card">
          <h4>Nouvelle entrée passée</h4>
          <div class="form-row">
            <select v-model="manualForm.project_id">
              <option value="" disabled>Projet *</option>
              <option v-for="p in activeProjects" :key="p.id" :value="p.id">
                {{ p.name }}
              </option>
            </select>
            <select v-model="manualForm.activity_id">
              <option value="" disabled>Activité *</option>
              <option v-for="a in activeActivities" :key="a.id" :value="a.id">
                {{ a.name }}
              </option>
            </select>
          </div>
          <div class="form-row">
            <label>
              Début *
              <input type="datetime-local" v-model="manualForm.start" />
            </label>
            <label>
              Fin *
              <input type="datetime-local" v-model="manualForm.end" />
            </label>
          </div>
          <input
            v-model="manualForm.comment"
            placeholder="Commentaire..."
            class="full-input"
          />
          <button class="btn-primary" @click="submitManualEntry">
            Enregistrer
          </button>
        </div>
      </transition>

      <!-- Filtres -->
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
        <input v-model="filterKeyword" placeholder="Mots-clés..." />
      </div>

      <!-- Liste avec transition -->
      <transition-group name="list" tag="ul" class="entries-list">
        <li v-for="entry in filteredEntries" :key="entry.id" class="entry-item">
          <!-- Mode édition -->
          <div v-if="editingEntryId === entry.id" class="entry-edit-form">
            <div class="form-row">
              <select v-model="editForm.project_id">
                <option
                  v-for="p in projectsStore.projects"
                  :key="p.id"
                  :value="p.id"
                >
                  {{ p.name }}
                </option>
              </select>
              <select v-model="editForm.activity_id">
                <option
                  v-for="a in activitiesStore.activities"
                  :key="a.id"
                  :value="a.id"
                >
                  {{ a.name }}
                </option>
              </select>
            </div>
            <div class="form-row">
              <label>
                Début
                <input type="datetime-local" v-model="editForm.start" />
              </label>
              <label>
                Fin
                <input type="datetime-local" v-model="editForm.end" />
              </label>
            </div>
            <input
              v-model="editForm.comment"
              placeholder="Commentaire..."
              class="full-input"
            />
            <div class="edit-actions">
              <button class="btn-save" @click="saveEditEntry(entry)">
                Enregistrer
              </button>
              <button class="btn-cancel" @click="cancelEditEntry">
                Annuler
              </button>
            </div>
          </div>

          <!-- Mode lecture -->
          <div v-else class="entry-row">
            <div class="entry-info">
              <strong>{{ getProjectName(entry) }}</strong>
              <span class="activity-badge">{{ getActivityName(entry) }}</span>
              <span v-if="entry.comment" class="entry-comment">
                {{ entry.comment }}
              </span>
            </div>
            <div class="entry-time">
              <span>{{ mixinFormatTime(entry.start) }}</span>
              <span>→</span>
              <span v-if="entry.end">{{ mixinFormatTime(entry.end) }}</span>
              <span v-else class="tag-running">En cours...</span>
              <span class="duration-chip">{{ entryDuration(entry) }}</span>
            </div>
            <div class="entry-actions">
              <button class="btn-icon btn-edit" @click="startEditEntry(entry)">
                ✏️
              </button>
              <button
                class="btn-icon btn-delete"
                @click="deleteEntry(entry.id)"
              >
                🗑️
              </button>
            </div>
          </div>
        </li>
      </transition-group>

      <p v-if="filteredEntries.length === 0" class="empty-msg">
        Aucune entrée pour aujourd'hui.
      </p>
    </div>

    <!-- Section Objectifs journaliers -->
    <div class="goals-section">
      <h2>Objectifs journaliers</h2>

      <!-- Formulaire d'ajout -->
      <div class="goal-form card">
        <h4>Nouvel objectif</h4>
        <input
          v-model="newGoalName"
          placeholder="Nom de l'objectif *"
          class="goal-input"
        />
        <textarea
          v-model="newGoalContent"
          placeholder="Description (Markdown supporté)..."
          class="goal-textarea"
        ></textarea>
        <button
          @click="addGoal"
          class="btn-primary"
          :disabled="!newGoalName.trim()"
        >
          Ajouter
        </button>
      </div>

      <!-- Recherche et bascule -->
      <div class="goal-filters">
        <input
          v-model="searchQuery"
          placeholder="Rechercher un objectif..."
          class="goal-search"
        />
        <button @click="showCompleted = !showCompleted" class="btn-secondary">
          {{ showCompleted ? "Voir actifs" : "Voir terminés" }}
        </button>
      </div>

      <!-- Liste des objectifs avec transition -->
      <transition-group name="list" tag="ul" class="goal-list">
        <li v-for="goal in filteredGoals" :key="goal.id" class="goal-item">
          <!-- Mode édition objectif -->
          <div v-if="editingGoalId === goal.id" class="goal-edit-form">
            <input v-model="editGoalForm.name" class="goal-input" />
            <textarea
              v-model="editGoalForm.content"
              class="goal-textarea"
            ></textarea>
            <div class="edit-actions">
              <button class="btn-save" @click="saveEditGoal(goal.id)">
                Enregistrer
              </button>
              <button class="btn-cancel" @click="cancelEditGoal">
                Annuler
              </button>
            </div>
          </div>

          <!-- Mode lecture objectif -->
          <div v-else>
            <div class="goal-header">
              <strong :class="{ 'goal-done': goal.done }">{{
                goal.name
              }}</strong>
              <span class="goal-date">{{
                mixinFormatDate(goal.date || goal.created_at)
              }}</span>
            </div>
            <!-- Directive v-markdown pour le rendu du contenu -->
            <div
              v-if="goal.content"
              class="goal-description"
              v-markdown="goal.content"
            ></div>
            <div class="goal-item-actions">
              <button
                v-if="!goal.done"
                @click="completeGoal(goal.id)"
                class="btn-complete"
              >
                ✓ Terminer
              </button>
              <button v-else @click="undoneGoal(goal.id)" class="btn-undone">
                ↩ Rouvrir
              </button>
              <button class="btn-icon btn-edit" @click="startEditGoal(goal)">
                ✏️
              </button>
              <button class="btn-icon btn-delete" @click="deleteGoal(goal.id)">
                🗑️
              </button>
            </div>
          </div>
        </li>
      </transition-group>

      <p v-if="filteredGoals.length === 0" class="empty-msg">
        {{
          showCompleted ? "Aucun objectif terminé." : "Aucun objectif en cours."
        }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  padding: 1.5rem;
  max-width: 900px;
  margin: 0 auto;
}

/* ---- ACTIVE CARD ---- */
.active-entry-card {
  background: linear-gradient(135deg, #e8f5e9, #f1f8e9);
  border: 1px solid #4caf50;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 2rem;
}
.active-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.active-header h3 {
  margin: 0;
  color: #2e7d32;
}
.pulse-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #4caf50;
  animation: pulse-anim 1.5s ease-in-out infinite;
}
@keyframes pulse-anim {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(0.7);
  }
}
.notes-block {
  margin: 12px 0;
}
.notes-textarea {
  width: 100%;
  min-height: 80px;
  padding: 10px;
  border: 1px solid #c8e6c9;
  border-radius: 6px;
  resize: vertical;
  font-family: inherit;
  box-sizing: border-box;
}
.notes-preview {
  background: #fff;
  border: 1px solid #c8e6c9;
  border-radius: 6px;
  padding: 10px;
  margin-top: 8px;
  font-size: 0.9rem;
}
.stop-btn {
  background: #f44336;
  color: white;
  border: none;
  padding: 10px 24px;
  font-weight: bold;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s;
}
.stop-btn:hover {
  background: #d32f2f;
}

/* ---- TRACKER CARD ---- */
.tracker-card {
  margin-bottom: 2rem;
}
.warning-box {
  background: #fff3cd;
  border: 1px solid #ffd54f;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 1rem;
}
.quick-add {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}
.controls {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}
.controls select {
  flex: 1;
  min-width: 160px;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 6px;
}
.start-btn {
  background: #42b983;
  color: white;
  border: none;
  padding: 10px 24px;
  font-weight: bold;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s;
}
.start-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.start-btn:not(:disabled):hover {
  background: #2e9e6e;
}

/* ---- ENTRIES SECTION ---- */
.entries-section {
  margin-bottom: 3rem;
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.filters {
  display: flex;
  gap: 10px;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}
.filters select,
.filters input {
  flex: 1;
  min-width: 140px;
  padding: 7px;
  border: 1px solid #ddd;
  border-radius: 6px;
}
.entries-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.entry-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 8px;
  background: white;
  overflow: hidden;
}
.entry-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  flex-wrap: wrap;
}
.entry-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.activity-badge {
  background: #e3f2fd;
  color: #1565c0;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
}
.entry-comment {
  color: #777;
  font-size: 0.85rem;
  font-style: italic;
}
.entry-time {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  color: #555;
}
.tag-running {
  color: #f44336;
  font-weight: bold;
}
.duration-chip {
  background: #f5f5f5;
  border: 1px solid #ddd;
  padding: 2px 7px;
  border-radius: 10px;
  font-size: 0.8rem;
}
.entry-actions {
  display: flex;
  gap: 4px;
}
.entry-edit-form {
  padding: 12px;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ---- MANUAL FORM ---- */
.manual-form {
  margin-bottom: 1rem;
  padding: 16px;
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}
.manual-form h4 {
  margin: 0 0 12px;
}

/* ---- SHARED FORM ELEMENTS ---- */
.form-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.form-row select,
.form-row input {
  flex: 1;
  padding: 7px;
  border: 1px solid #ccc;
  border-radius: 6px;
  min-width: 140px;
}
.form-row label {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.85rem;
  min-width: 140px;
}
.full-input {
  width: 100%;
  padding: 7px;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-sizing: border-box;
}
.edit-actions {
  display: flex;
  gap: 8px;
}
.card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 1rem;
}

/* ---- GOALS ---- */
.goals-section {
  margin-top: 1rem;
}
.goal-form {
  margin-bottom: 1rem;
}
.goal-form h4 {
  margin: 0 0 10px;
}
.goal-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  margin-bottom: 8px;
  box-sizing: border-box;
}
.goal-textarea {
  width: 100%;
  min-height: 80px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  resize: vertical;
  margin-bottom: 8px;
  font-family: inherit;
  box-sizing: border-box;
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
  border-radius: 6px;
}
.goal-list {
  list-style: none;
  padding: 0;
}
.goal-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 14px;
  margin-bottom: 8px;
  background: white;
}
.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.goal-date {
  font-size: 0.8rem;
  color: #999;
}
.goal-done {
  text-decoration: line-through;
  color: #aaa;
}
.goal-description {
  font-size: 0.9rem;
  color: #555;
  margin: 8px 0;
  line-height: 1.5;
}
.goal-item-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}
.goal-edit-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ---- BUTTONS ---- */
.btn-primary {
  background: #42b983;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-secondary {
  background: #eceff1;
  color: #2c3e50;
  border: 1px solid #ccc;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-secondary:hover {
  background: #dde;
}
.btn-save {
  background: #4caf50;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 5px;
  cursor: pointer;
}
.btn-cancel {
  background: #9e9e9e;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 5px;
  cursor: pointer;
}
.btn-complete {
  background: #4caf50;
  color: white;
  border: none;
  padding: 5px 12px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.85rem;
}
.btn-undone {
  background: #78909c;
  color: white;
  border: none;
  padding: 5px 12px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.85rem;
}
.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.15s;
}
.btn-icon:hover {
  background: #f0f0f0;
}
.empty-msg {
  text-align: center;
  color: #aaa;
  padding: 20px;
}

/* ---- TRANSITIONS ---- */
/* Apparition/disparition d'éléments individuels */
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Formulaire qui glisse vers le bas */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}
.slide-down-enter-to,
.slide-down-leave-from {
  max-height: 500px;
}

/* Animation de liste (ajout / suppression) */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}
.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
.list-move {
  transition: transform 0.3s ease;
}
</style>
