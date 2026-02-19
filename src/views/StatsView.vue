<script setup>
import { ref, onMounted, computed } from "vue";
import { useStatsStore } from "@/stores/stats";
import { useProjectsStore } from "@/stores/projects";
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
const dateFrom = ref(
  new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split("T")[0],
);
const dateTo = ref(new Date().toISOString().split("T")[0]);

onMounted(() => {
  projectsStore.fetchProjects();
  refresh();
});

const refresh = () => statsStore.fetchStats(dateFrom.value, dateTo.value);

// Formatage durée
const formatTime = (ms) => {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h${m.toString().padStart(2, "0")}`;
};

const totalMs = computed(() => {
  return statsStore.filteredEntries.reduce(
    (acc, e) => (e.end ? acc + (new Date(e.end) - new Date(e.start)) : acc),
    0,
  );
});

// Configuration des données pour Chart.js (Projets)
const projectChartData = computed(() => ({
  labels: Object.keys(statsStore.statsByProject),
  datasets: [
    {
      data: Object.values(statsStore.statsByProject),
      backgroundColor: ["#42b983", "#34495e", "#3498db", "#f1c40f", "#e74c3c"],
    },
  ],
}));

// Configuration des données pour Chart.js (Activités)
const activityChartData = computed(() => ({
  labels: Object.keys(statsStore.statsByActivity),
  datasets: [
    {
      data: Object.values(statsStore.statsByActivity).map((a) => a.total),
      backgroundColor: Object.values(statsStore.statsByActivity).map(
        (a) => a.color,
      ),
    },
  ],
}));
</script>

<template>
  <div class="stats-view">
    <h1>Statistiques du rapport</h1>

    <div class="filters card">
      <input type="date" v-model="dateFrom" @change="refresh" />
      <span>au</span>
      <input type="date" v-model="dateTo" @change="refresh" />
    </div>

    <div class="kpi-container">
      <div class="kpi-card">
        <span class="label">Temps Total</span>
        <span class="value">{{ formatTime(totalMs) }}</span>
      </div>
      <div class="kpi-card">
        <span class="label">Projets concernés</span>
        <span class="value">{{ statsStore.projectCount }}</span>
      </div>
      <div class="kpi-card">
        <span class="label">Moyenne / jour</span>
        <span class="value">{{ formatTime(totalMs / 30) }}</span>
      </div>
    </div>

    <div class="charts-grid">
      <div class="chart-box card">
        <h3>Répartition par Projet</h3>
        <Pie :data="projectChartData" />
      </div>
      <div class="chart-box card">
        <h3>Répartition par Activité</h3>
        <Pie :data="activityChartData" />
      </div>
    </div>
    <div class="details-section card">
      <h3>Détail des entrées (Ordre chronologique)</h3>
      <table class="chrono-table">
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
        <tbody>
          <tr v-for="entry in statsStore.filteredEntries" :key="entry.id">
            <td>{{ new Date(entry.start).toLocaleDateString() }}</td>
            <td>
              {{
                new Date(entry.start).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              }}
            </td>
            <td>
              {{
                entry.end
                  ? new Date(entry.end).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "--:--"
              }}
            </td>
            <td>{{ entry.project?.name }}</td>
            <td>{{ entry.activity?.name }}</td>
            <td class="bold">
              {{
                entry.end
                  ? formatTime(new Date(entry.end) - new Date(entry.start))
                  : "En cours"
              }}
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="statsStore.filteredEntries.length === 0" class="empty">
        Aucune entrée trouvée.
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
  gap: 15px;
  align-items: center;
  justify-content: center;
}

.kpi-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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
  font-size: 0.9rem;
  opacity: 0.8;
}
.kpi-card .value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #42b983;
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}
.chart-box h3 {
  text-align: center;
  margin-bottom: 20px;
}
</style>
