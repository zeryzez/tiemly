<script setup>
import { onMounted, ref, computed } from "vue";
import { useActivitiesStore } from "@/stores/activities";

const activitiesStore = useActivitiesStore();

// Variables
const newName = ref("");
const newColor = ref("#000000"); // Couleur par défaut création
const searchQuery = ref("");
const editingId = ref(null);

// Données d'édition
const editForm = ref({
  name: "",
  color: "",
});

onMounted(() => {
  activitiesStore.fetchActivities();
});

const filteredActivities = computed(() => {
  if (!searchQuery.value) return activitiesStore.activities;
  const lowerSearch = searchQuery.value.toLowerCase();
  return activitiesStore.activities.filter((a) =>
    a.name.toLowerCase().includes(lowerSearch),
  );
});

// --- CRÉATION ---
const handleCreate = async () => {
  if (newName.value) {
    // Note: createActivity attend (name, color)
    await activitiesStore.createActivity(newName.value, newColor.value);
    newName.value = "";
    newColor.value = "#000000";
  }
};

// --- ÉDITION ---
const startEdit = (activity) => {
  editingId.value = activity.id;
  editForm.value = {
    name: activity.name,
    color: activity.color || "#000000",
  };
};

const saveEdit = async (activity) => {
  const updated = {
    ...activity,
    name: editForm.value.name,
    color: editForm.value.color,
  };
  await activitiesStore.updateActivity(updated);
  editingId.value = null;
};

const cancelEdit = () => {
  editingId.value = null;
};

// --- ACTIVE / DISABLE ---
const toggleStatus = async (activity) => {
  // Adaptez le champ 'active' selon votre API
  if (activity.is_enabled) {
    await activitiesStore.disableActivity(activity.id);
  } else {
    await activitiesStore.enableActivity(activity.id);
  }
};
const isActive = (a) => a.is_enabled;
</script>

<template>
  <div>
    <h2>Gestion des Activités</h2>

    <div class="controls box">
      <div class="input-group">
        <input v-model="newName" placeholder="Nouvelle activité..." />
        <input
          type="color"
          v-model="newColor"
          title="Choisir couleur"
          class="color-picker"
        />
        <button class="btn-primary" @click="handleCreate">Ajouter</button>
      </div>
    </div>

    <div class="search-bar">
      <input
        v-model="searchQuery"
        placeholder="🔍 Rechercher une activité..."
      />
    </div>

    <ul class="list">
      <li
        v-for="activity in filteredActivities"
        :key="activity.id"
        :class="{ 'row-disabled': !isActive(activity) }"
      >
        <div v-if="editingId === activity.id" class="row-content">
          <input type="color" v-model="editForm.color" class="color-picker" />
          <input v-model="editForm.name" class="edit-input" />

          <div class="actions">
            <button class="btn-save icon-btn" @click="saveEdit(activity)">
              💾
            </button>
            <button class="btn-cancel icon-btn" @click="cancelEdit">❌</button>
          </div>
        </div>

        <div v-else class="row-content">
          <span
            class="color-dot"
            :style="{ backgroundColor: activity.color }"
          ></span>
          <span class="name">{{ activity.name }}</span>

          <div class="actions">
            <button class="btn-edit btn-small" @click="startEdit(activity)">
              Modifier
            </button>

            <button
              :class="isActive(activity) ? 'btn-disable' : 'btn-enable'"
              class="btn-small"
              @click="toggleStatus(activity)"
            >
              {{ isActive(activity) ? "OFF" : "ON" }}
            </button>
          </div>
        </div>
      </li>
    </ul>
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
  align-items: center;
}
.input-group input[type="text"] {
  flex: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.color-picker {
  height: 35px;
  width: 50px;
  border: none;
  cursor: pointer;
  background: none;
}

.search-bar input {
  width: 100%;
  padding: 8px;
  margin-bottom: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.list {
  list-style: none;
  padding: 0;
  border: 1px solid #eee;
  border-radius: 4px;
}
.list li {
  padding: 10px;
  border-bottom: 1px solid #eee;
  background: white;
}
.list li:last-child {
  border-bottom: none;
}

.row-content {
  display: flex;
  align-items: center;
  gap: 10px;
}
.name {
  flex-grow: 1;
  font-weight: bold;
  color: #333;
}
.color-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: inline-block;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.edit-input {
  flex-grow: 1;
  padding: 5px;
}

.actions {
  display: flex;
  gap: 5px;
}
.btn-small {
  padding: 5px 10px;
  border-radius: 4px;
  border: 1px solid #ddd;
  cursor: pointer;
}
.icon-btn {
  padding: 5px 10px;
  border: none;
  cursor: pointer;
  border-radius: 4px;
}

.btn-primary {
  background: #42b983;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
}
.btn-edit {
  background: #2196f3;
  color: white;
  border: none;
}
.btn-disable {
  background: #ef5350;
  color: white;
  border: none;
}
.btn-enable {
  background: #66bb6a;
  color: white;
  border: none;
}
.btn-save {
  background: #4caf50;
  color: white;
}
.btn-cancel {
  background: #9e9e9e;
  color: white;
}

.row-disabled {
  opacity: 0.6;
  background: #fcfcfc;
}
</style>
