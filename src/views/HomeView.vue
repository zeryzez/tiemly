<script setup>
import { ref, onMounted, computed } from "vue";
import { useProjectsStore } from "@/stores/projects";
import { useActivitiesStore } from "@/stores/activities";
import { useTimeEntriesStore } from "@/stores/timeEntries";
import { useGoalsStore } from "@/stores/goals";
import { dateMixin } from "@/mixins/dateMixin";

const projectsStore = useProjectsStore();
const activitiesStore = useActivitiesStore();
const timeStore = useTimeEntriesStore();
const goalsStore = useGoalsStore();

const {
  mixinGetTodayDate,
  mixinFormatTime,
  mixinFormatDurationH,
  mixinToApiDatetime,
  mixinFormatDate,
} = dateMixin.methods;

const selectedProject = ref("");
const selectedActivity = ref("");
const newProjectName = ref("");
const newActivityName = ref("");
const notes = ref("");

const filterProject = ref("");
const filterActivity = ref("");
const filterKeyword = ref("");

const editingEntryId = ref(null);
const editForm = ref({
  project_id: "",
  activity_id: "",
  start: "",
  end: "",
  comment: "",
});

const showManualForm = ref(false);
const manualForm = ref({
  project_id: "",
  activity_id: "",
  start: "",
  end: "",
  comment: "",
});

const newGoalName = ref("");
const newGoalContent = ref("");
const searchQuery = ref("");
const showCompleted = ref(false);
const editingGoalId = ref(null);
const editGoalForm = ref({ name: "", content: "" });

onMounted(async () => {
  const today = mixinGetTodayDate();
  await Promise.all([
    projectsStore.fetchProjects(),
    activitiesStore.fetchActivities(),
    timeStore.fetchEntries(today, today),
    goalsStore.fetchGoals(today),
  ]);
});

const activeProjects = computed(() =>
  projectsStore.projects.filter((p) => p.is_enabled),
);
const activeActivities = computed(() =>
  activitiesStore.activities.filter((a) => a.is_enabled),
);

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

const handleStart = async () => {
  await timeStore.startTimer(selectedProject.value, selectedActivity.value);
  selectedProject.value = "";
  selectedActivity.value = "";
  notes.value = "";
  await goalsStore.fetchGoals(mixinGetTodayDate());
};

const handleStop = async (id) => {
  await timeStore.stopTimer(id);
};

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

const entryDuration = (entry) => {
  if (!entry.end) return "en cours";
  const ms = new Date(entry.end) - new Date(entry.start);
  return mixinFormatDurationH(ms);
};

const startEditEntry = (entry) => {
  editingEntryId.value = entry.id;
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

    <div class="entries-section">
      <div class="section-header">
        <h2>Activités du jour</h2>
        <button class="btn-secondary" @click="showManualForm = !showManualForm">
          {{ showManualForm ? "Annuler" : "+ Entrée manuelle" }}
        </button>
      </div>

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

      <transition-group name="list" tag="ul" class="entries-list">
        <li v-for="entry in filteredEntries" :key="entry.id" class="entry-item">
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
                Modifier
              </button>
              <button
                class="btn-icon btn-delete"
                @click="deleteEntry(entry.id)"
              >
                Supprimer
              </button>
            </div>
          </div>
        </li>
      </transition-group>

      <p v-if="filteredEntries.length === 0" class="empty-msg">
        Aucune entrée pour aujourd'hui.
      </p>
    </div>

    <div class="goals-section">
      <h2>Objectifs journaliers</h2>

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

      <transition-group name="list" tag="ul" class="goal-list">
        <li v-for="goal in filteredGoals" :key="goal.id" class="goal-item">
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

          <div v-else>
            <div class="goal-header">
              <strong :class="{ 'goal-done': goal.done }">{{
                goal.name
              }}</strong>
              <span class="goal-date">{{
                mixinFormatDate(goal.date || goal.created_at)
              }}</span>
            </div>
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
                Terminer
              </button>
              <button v-else @click="undoneGoal(goal.id)" class="btn-undone">
                Rouvrir
              </button>
              <button class="btn-icon btn-edit" @click="startEditGoal(goal)">
                Modifier
              </button>
              <button class="btn-icon btn-delete" @click="deleteGoal(goal.id)">
                Supprimer
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

.active-entry-card {
  background: linear-gradient(135deg, #e8f5e9, #f1f8e9);
  border: 1px solid var(--primary);
  padding: 20px;
  border-radius: var(--radius);
  margin-bottom: 2rem;
  box-shadow: var(--shadow);
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
  background: var(--primary);
  animation: pulse-anim 1.5s ease-in-out infinite;
}
@keyframes pulse-anim {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.7); }
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
  background: var(--danger);
  color: white;
  border: none;
  padding: 10px 24px;
  font-weight: bold;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s;
}
.stop-btn:hover {
  background: var(--danger-hover);
}

.tracker-card {
  margin-bottom: 2rem;
}
.warning-box {
  background: #fff3cd;
  border: 1px solid #ffd54f;
  padding: 15px;
  border-radius: var(--radius);
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
}

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
}
.entries-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.entry-item {
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  margin-bottom: 8px;
  background: white;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
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
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}
.entry-comment {
  color: var(--text-muted);
  font-size: 0.85rem;
  font-style: italic;
}
.entry-time {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  color: var(--text-muted);
}
.tag-running {
  color: var(--danger);
  font-weight: bold;
}
.duration-chip {
  background: #f5f5f5;
  border: 1px solid var(--border-color);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 500;
}
.entry-actions {
  display: flex;
  gap: 4px;
}
.entry-edit-form {
  padding: 16px;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.manual-form {
  margin-bottom: 1rem;
}
.manual-form h4 {
  margin: 0 0 12px;
}

.form-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.form-row select,
.form-row input {
  flex: 1;
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
.edit-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.goals-section {
  margin-top: 1rem;
}
.goal-form {
  margin-bottom: 1rem;
}
.goal-form h4 {
  margin: 0 0 12px;
}
.goal-input {
  margin-bottom: 12px;
}
.goal-textarea {
  min-height: 80px;
  margin-bottom: 12px;
}
.goal-filters {
  display: flex;
  gap: 10px;
  margin-bottom: 1rem;
}
.goal-search {
  flex: 1;
}
.goal-list {
  list-style: none;
  padding: 0;
}
.goal-item {
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  padding: 16px;
  margin-bottom: 10px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}
.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.goal-date {
  font-size: 0.85rem;
  color: var(--text-muted);
}
.goal-done {
  text-decoration: line-through;
  color: var(--text-muted);
}
.goal-description {
  font-size: 0.95rem;
  color: var(--text-main);
  margin: 10px 0;
  line-height: 1.5;
}
.goal-item-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}
.goal-edit-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-msg {
  text-align: center;
  color: var(--text-muted);
  padding: 20px;
}

.entry-item,
.goal-item {
  transition: all 0.2s ease;
}
.entry-item:hover,
.goal-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}
</style>
