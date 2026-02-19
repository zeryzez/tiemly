<script setup>
import { ref, onMounted, computed } from "vue";
import { useStatsStore } from "@/stores/stats";
import { useProjectsStore } from "@/stores/projects";
import { useActivitiesStore } from "@/stores/activities";
import { dateMixin } from "@/mixins/dateMixin";
import { Pie } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
} from "chart.js";

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale);

const statsStore = useStatsStore();
const projectsStore = useProjectsStore();
const activitiesStore = useActivitiesStore();
const { mixinFormatDurationH } = dateMixin.methods;

// Filtres date — pré-remplis sur le mois en cours
const dateFrom = ref(
  new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split("T")[0],
);
const dateTo = ref(new Date().toISOString().split("T")[0]);

// Filtre projet optionnel
const selectedProjectId = ref("");

onMounted(() => {
  projectsStore.fetchProjects();
  activitiesStore.fetchActivities();
  refresh();
});

// --- Résolution des noms à partir des IDs ---
const getProjectName = (id) =>
  projectsStore.projects.find((p) => p.id === id)?.name || id || "-";

const getActivityName = (id) =>
  activitiesStore.activities.find((a) => a.id === id)?.name || id || "-";

const getActivityColor = (id) =>
  activitiesStore.activities.find((a) => a.id === id)?.color || "#cccccc";

const refresh = () =>
  statsStore.fetchStats(
    dateFrom.value,
    dateTo.value,
    selectedProjectId.value || null,
  );

// --- Formatage ---
const formatTime = (ms) => mixinFormatDurationH(ms);

const totalMs = computed(() =>
  statsStore.filteredEntries.reduce(
    (acc, e) => (e.end ? acc + (new Date(e.end) - new Date(e.start)) : acc),
    0,
  ),
);

// --- Graphes ---
const projectChartData = computed(() => ({
  labels: Object.keys(statsStore.statsByProject).map((id) =>
    getProjectName(id),
  ),
  datasets: [
    {
      data: Object.values(statsStore.statsByProject),
      backgroundColor: [
        "#42b983",
        "#34495e",
        "#3498db",
        "#f1c40f",
        "#e74c3c",
        "#9b59b6",
        "#1abc9c",
        "#e67e22",
      ],
    },
  ],
}));

const activityChartData = computed(() => ({
  labels: Object.keys(statsStore.statsByActivity).map((id) =>
    getActivityName(id),
  ),
  datasets: [
    {
      data: Object.values(statsStore.statsByActivity).map((a) => a.total),
      backgroundColor: Object.keys(statsStore.statsByActivity).map((id) =>
        getActivityColor(id),
      ),
    },
  ],
}));

// Options graphes pour afficher durée en tooltip
const chartOptions = {
  plugins: {
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const ms = ctx.parsed;
          const h = Math.floor(ms / 3600000);
          const m = Math.floor((ms % 3600000) / 60000);
          return ` ${ctx.label} : ${h}h${String(m).padStart(2, "0")}`;
        },
      },
    },
    legend: {
      position: "bottom",
    },
  },
};

// Nombre de jours dans la période (pour la moyenne journalière)
const dayCount = computed(() => {
  const from = new Date(dateFrom.value);
  const to = new Date(dateTo.value);
  const diff = (to - from) / (1000 * 60 * 60 * 24) + 1;
  return Math.max(1, diff);
});
</script>

<template>
  <div class="stats-view">
    <h1>Statistiques</h1>

    <!-- Filtres -->
    <div class="filters card">
      <label>
        Du
        <input type="date" v-model="dateFrom" @change="refresh" />
      </label>
      <span>au</span>
      <label>
        <input type="date" v-model="dateTo" @change="refresh" />
      </label>
      <label>
        Projet
        <select v-model="selectedProjectId" @change="refresh">
          <option value="">Tous les projets</option>
          <option v-for="p in projectsStore.projects" :key="p.id" :value="p.id">
            {{ p.name }}
          </option>
        </select>
      </label>
    </div>

    <!-- KPIs -->
    <div class="kpi-container">
      <div class="kpi-card">
        <span class="label">Temps total</span>
        <span class="value">{{ formatTime(totalMs) }}</span>
      </div>
      <div class="kpi-card" v-if="!selectedProjectId">
        <span class="label">Projets concernés</span>
        <span class="value">{{ statsStore.projectCount }}</span>
      </div>
      <div class="kpi-card">
        <span class="label">Moyenne / jour</span>
        <span class="value">{{ formatTime(totalMs / dayCount) }}</span>
      </div>
      <div class="kpi-card">
        <span class="label">Entrées</span>
        <span class="value">{{ statsStore.filteredEntries.length }}</span>
      </div>
    </div>

    <!-- Graphes -->
    <div class="charts-grid">
      <div v-if="!selectedProjectId" class="chart-box card">
        <h3>Répartition par Projet</h3>
        <div class="chart-wrapper">
          <Pie
            v-if="Object.keys(statsStore.statsByProject).length"
            :data="projectChartData"
            :options="chartOptions"
          />
          <p v-else class="empty">Aucune donnée.</p>
        </div>
      </div>
      <div class="chart-box card">
        <h3>Répartition par Activité</h3>
        <div class="chart-wrapper">
          <Pie
            v-if="Object.keys(statsStore.statsByActivity).length"
            :data="activityChartData"
            :options="chartOptions"
          />
          <p v-else class="empty">Aucune donnée.</p>
        </div>
      </div>
    </div>

    <!-- Détail des entrées -->
    <div class="details-section card">
      <h3>Détail des entrées — ordre chronologique</h3>
      <div v-if="statsStore.loading" class="loading">Chargement...</div>
      <table v-else class="chrono-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Début</th>
            <th>Fin</th>
            <th>Projet</th>
            <th>Activité</th>
            <th>Durée</th>
          </tr>
        </thead>
        <transition-group name="list" tag="tbody">
          <tr v-for="entry in statsStore.filteredEntries" :key="entry.id">
            <td>{{ new Date(entry.start).toLocaleDateString("fr-FR") }}</td>
            <td>
              {{
                new Date(entry.start).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              }}
            </td>
            <td>
              {{
                entry.end
                  ? new Date(entry.end).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "--:--"
              }}
            </td>
            <td>{{ getProjectName(entry.project_id) }}</td>
            <td>
              <span
                v-if="getActivityColor(entry.activity_id) !== '#cccccc'"
                class="color-dot"
                :style="{ background: getActivityColor(entry.activity_id) }"
              ></span>
              {{ getActivityName(entry.activity_id) }}
            </td>
            <td class="bold">
              {{
                entry.end
                  ? formatTime(new Date(entry.end) - new Date(entry.start))
                  : "En cours"
              }}
            </td>
          </tr>
        </transition-group>
      </table>
      <p
        v-if="!statsStore.loading && statsStore.filteredEntries.length === 0"
        class="empty"
      >
        Aucune entrée trouvée pour la période sélectionnée.
      </p>
    </div>
  </div>
</template>

<style scoped>
.stats-view {
  padding: 2rem;
  max-width: 1100px;
  margin: 0 auto;
}
.card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
}
.filters {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;
}
.filters label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #555;
}
.filters input,
.filters select {
  padding: 7px 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  min-width: 140px;
}
.filters span {
  padding-bottom: 6px;
  font-size: 0.9rem;
  color: #777;
}

.kpi-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  margin-bottom: 2rem;
}
.kpi-card {
  background: #2c3e50;
  color: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}
.kpi-card .label {
  display: block;
  font-size: 0.85rem;
  opacity: 0.75;
  margin-bottom: 6px;
}
.kpi-card .value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #42b983;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-bottom: 2rem;
}
.chart-box h3 {
  text-align: center;
  margin-bottom: 16px;
  color: #2c3e50;
}
.chart-wrapper {
  max-width: 350px;
  margin: 0 auto;
}

.chrono-table {
  width: 100%;
  border-collapse: collapse;
}
.chrono-table th,
.chrono-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
  font-size: 0.9rem;
}
.chrono-table th {
  background: #f5f5f5;
  font-weight: 600;
  color: #444;
}
.bold {
  font-weight: 600;
  color: #2c3e50;
}
.color-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 5px;
  vertical-align: middle;
}
.empty {
  text-align: center;
  color: #aaa;
  padding: 20px;
}
.loading {
  text-align: center;
  padding: 20px;
  color: #888;
}

/* Transition tableau */
.list-enter-active,
.list-leave-active {
  transition: opacity 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
}
</style>
