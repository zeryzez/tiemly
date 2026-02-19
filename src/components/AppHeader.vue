<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useTimeEntriesStore } from "@/stores/timeEntries";
import { useGoalsStore } from "@/stores/goals";
import { useProjectsStore } from "@/stores/projects";
import { useActivitiesStore } from "@/stores/activities";
import { useRouter } from "vue-router";

const auth = useAuthStore();
const timeStore = useTimeEntriesStore();
const goalsStore = useGoalsStore();
const projectsStore = useProjectsStore();
const activitiesStore = useActivitiesStore();
const router = useRouter();

const now = ref(Date.now());
let timer = null;

const getTodayDate = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const toLocalDateKey = (dateLike) => {
  const d = new Date(dateLike);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const formatDuration = (ms) => {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const formatHours = (ms) => {
  const hours = ms / 3600000;
  return `${hours.toFixed(2)} h`;
};

const runningProjectName = computed(() => {
  const entry = timeStore.runningEntry;
  if (!entry) return "-";
  if (entry.project?.name) return entry.project.name;
  if (entry.project_id) {
    const p = projectsStore.projects.find((x) => x.id === entry.project_id);
    return p?.name || "Projet inconnu";
  }
  return "Projet inconnu";
});

const runningActivityName = computed(() => {
  const entry = timeStore.runningEntry;
  if (!entry) return "-";
  if (entry.activity?.name) return entry.activity.name;
  if (entry.activity_id) {
    const a = activitiesStore.activities.find(
      (x) => x.id === entry.activity_id,
    );
    return a?.name || "Activité inconnue";
  }
  return "Activité inconnue";
});

const runningDuration = computed(() => {
  const entry = timeStore.runningEntry;
  if (!entry) return "00:00:00";
  return formatDuration(now.value - new Date(entry.start).getTime());
});

const totalWorkedTodayMs = computed(() => {
  const today = getTodayDate();

  return timeStore.entries.reduce((sum, entry) => {
    if (!entry?.start) return sum;
    if (toLocalDateKey(entry.start) !== today) return sum;

    const start = new Date(entry.start).getTime();
    const end = entry.end ? new Date(entry.end).getTime() : now.value;
    return sum + Math.max(0, end - start);
  }, 0);
});

const progress = computed(() => {
  if (goalsStore.dailyGoal <= 0) return 0;
  return Math.min((timeStore.entries.length / goalsStore.dailyGoal) * 100, 100);
});

const stopRunning = async () => {
  if (timeStore.runningEntry?.id) {
    await timeStore.stopTimer(timeStore.runningEntry.id);
  }
};

const logout = () => {
  auth.logout();
  timeStore.$reset();
  router.push({ name: "login" });
};

onMounted(async () => {
  if (auth.isConnected) {
    const today = getTodayDate();
    await Promise.all([
      timeStore.fetchEntries(today, today),
      projectsStore.fetchProjects(),
      activitiesStore.fetchActivities(),
    ]);
  }

  timer = setInterval(() => {
    now.value = Date.now();
  }, 1000);
});

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <header v-if="auth.isConnected" class="app-header">
    <nav class="nav-links">
      <router-link to="/">Activité</router-link>
      <router-link to="/stats">Statistiques</router-link>
      <router-link to="/settings">Paramètres</router-link>
    </nav>

    <div class="status-block">
      <div v-if="timeStore.runningEntry" class="running-card">
        <strong>En cours :</strong>
        <span>{{ runningProjectName }} · {{ runningActivityName }}</span>
        <span>Durée : {{ runningDuration }}</span>
        <button class="stop-btn" @click="stopRunning">Stop</button>
      </div>
      <div v-else class="running-card muted">
        <strong>En cours :</strong> <span>Aucune activité</span>
      </div>

      <div class="hours-line">
        <strong>Aujourd’hui :</strong> {{ formatHours(totalWorkedTodayMs) }}
      </div>
    </div>

    <div class="goals-display">
      <span
        >Objectifs du jour : {{ timeStore.entries.length }} /
        {{ goalsStore.dailyGoal }}</span
      >
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
    </div>

    <button @click="logout" class="logout-btn">Déconnexion</button>
  </header>
</template>

<style scoped>
.app-header {
  display: grid;
  grid-template-columns: auto 1fr 260px auto;
  gap: 16px;
  align-items: center;
  padding: 1rem;
  background: #2c3e50;
  color: white;
}
.nav-links a {
  color: #aaa;
  text-decoration: none;
  margin-right: 15px;
  font-weight: bold;
}
.nav-links a.router-link-active {
  color: #42b983;
}
.status-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.running-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  padding: 6px 10px;
}
.running-card.muted {
  opacity: 0.8;
}
.stop-btn {
  margin-left: auto;
  background: #f44336;
  border: none;
  color: white;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
}
.hours-line {
  font-size: 0.9rem;
}
.goals-display {
  display: flex;
  flex-direction: column;
  width: 100%;
  font-size: 0.8rem;
}
.progress-bar {
  height: 6px;
  background: #555;
  border-radius: 3px;
  margin-top: 4px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: #42b983;
  transition: width 0.5s ease;
}
.logout-btn {
  background: none;
  border: 1px solid #aaa;
  color: #aaa;
  padding: 5px 10px;
  cursor: pointer;
  border-radius: 4px;
}
.logout-btn:hover {
  color: white;
  border-color: white;
}
</style>
