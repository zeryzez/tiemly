<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useTimeEntriesStore } from "@/stores/timeEntries";
import { useGoalsStore } from "@/stores/goals";
import { useProjectsStore } from "@/stores/projects";
import { useActivitiesStore } from "@/stores/activities";
import { useRouter } from "vue-router";
import { dateMixin } from "@/mixins/dateMixin";

const auth = useAuthStore();
const timeStore = useTimeEntriesStore();
const goalsStore = useGoalsStore();
const projectsStore = useProjectsStore();
const activitiesStore = useActivitiesStore();
const router = useRouter();

const now = ref(Date.now());
let timer = null;
const { mixinGetTodayDate, mixinToLocalDateKey, mixinFormatDurationHMS } =
  dateMixin.methods;

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
  return mixinFormatDurationHMS(now.value - new Date(entry.start).getTime());
});

const totalWorkedTodayMs = computed(() => {
  const today = mixinGetTodayDate();
  return timeStore.entries.reduce((sum, entry) => {
    if (!entry?.start) return sum;
    if (mixinToLocalDateKey(entry.start) !== today) return sum;
    const start = new Date(entry.start).getTime();
    const end = entry.end ? new Date(entry.end).getTime() : now.value;
    return sum + Math.max(0, end - start);
  }, 0);
});
const goalsTarget = computed(() =>
  goalsStore.dailyGoal > 0
    ? goalsStore.dailyGoal
    : goalsStore.todayTotalCount,
);

const goalsProgress = computed(() => {
  if (goalsTarget.value === 0) return 0;
  return Math.min((goalsStore.todayCompletedCount / goalsTarget.value) * 100, 100);
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
    const today = mixinGetTodayDate();
    await Promise.all([
      timeStore.fetchEntries(today, today),
      projectsStore.fetchProjects(),
      activitiesStore.fetchActivities(),
      goalsStore.fetchGoals(today),
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
        <span class="pulse-dot"></span>
        <strong>En cours :</strong>
        <span>{{ runningProjectName }} · {{ runningActivityName }}</span>
        <span class="duration-badge">{{ runningDuration }}</span>
        <button class="stop-btn" @click="stopRunning">Stop</button>
      </div>
      <div v-else class="running-card muted">
        <strong>En cours :</strong> <span>Aucune activité</span>
      </div>

      <div class="hours-line">
        <strong>Aujourd'hui :</strong> {{ formatHours(totalWorkedTodayMs) }}
      </div>
    </div>

    <div class="goals-display">
      <span>
        Objectifs du jour :
        <strong>{{ goalsStore.todayCompletedCount }}</strong>
        / {{ goalsTarget }}
      </span>
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: goalsProgress + '%' }"
        ></div>
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
  padding: 1rem 2rem;
  background: var(--secondary);
  color: white;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.nav-links a {
  color: rgba(255,255,255,0.7);
  text-decoration: none;
  margin-right: 20px;
  font-weight: 600;
  transition: color 0.2s;
}
.nav-links a:hover {
  color: white;
}
.nav-links a.router-link-active {
  color: var(--primary);
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
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 6px 12px;
}
.running-card.muted {
  opacity: 0.6;
  background: transparent;
  border-color: transparent;
}

.pulse-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--primary);
  animation: pulse-anim 1.5s ease-in-out infinite;
  flex-shrink: 0;
}
@keyframes pulse-anim {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.7); }
}
.duration-badge {
  background: rgba(66, 185, 131, 0.2);
  border: 1px solid var(--primary);
  padding: 2px 8px;
  border-radius: 12px;
  font-family: monospace;
  font-size: 0.9rem;
  color: var(--primary);
}
.stop-btn {
  margin-left: auto;
  background: var(--danger);
  border: none;
  color: white;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}
.stop-btn:hover {
  background: var(--danger-hover);
}
.hours-line {
  font-size: 0.9rem;
  color: rgba(255,255,255,0.9);
}
.goals-display {
  display: flex;
  flex-direction: column;
  width: 100%;
  font-size: 0.85rem;
}
.progress-bar {
  height: 6px;
  background: rgba(255,255,255,0.2);
  border-radius: 3px;
  margin-top: 6px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--primary);
  transition: width 0.5s ease;
}
.logout-btn {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.5);
  color: white;
  padding: 6px 12px;
  cursor: pointer;
  border-radius: 6px;
  font-weight: 600;
  transition: all 0.2s;
}
.logout-btn:hover {
  background: rgba(255,255,255,0.1);
  border-color: white;
}
</style>
