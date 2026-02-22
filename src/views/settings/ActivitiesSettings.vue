<script setup>
import { onMounted, ref, computed } from "vue";
import { useActivitiesStore } from "@/stores/activities";

const activitiesStore = useActivitiesStore();

const newName = ref("");
const newColor = ref("#000000"); 
const searchQuery = ref("");
const editingId = ref(null);

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

const handleCreate = async () => {
  if (newName.value) {
    await activitiesStore.createActivity(newName.value, newColor.value);
    newName.value = "";
    newColor.value = "#000000";
  }
};

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

const toggleStatus = async (activity) => {
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
        placeholder="Rechercher une activité..."
      />
    </div>

    <transition-group name="list" tag="ul" class="list">
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
              Sauvegarder
            </button>
            <button class="btn-cancel icon-btn" @click="cancelEdit">Annuler</button>
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
    </transition-group>
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
  align-items: center;
}
.input-group input[type="text"] {
  flex: 1;
}
.color-picker {
  height: 40px;
  width: 50px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  padding: 2px;
  background: white;
}

.search-bar input {
  margin-bottom: 1.5rem;
}

.list {
  list-style: none;
  padding: 0;
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  background: var(--card-bg);
  box-shadow: var(--shadow);
  overflow: hidden;
}
.list li {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
}
.list li:last-child {
  border-bottom: none;
}

.row-content {
  display: flex;
  align-items: center;
  gap: 12px;
}
.name {
  flex-grow: 1;
  font-weight: 600;
  color: var(--secondary);
}
.color-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: inline-block;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.edit-input {
  flex-grow: 1;
}

.actions {
  display: flex;
  gap: 8px;
}
.btn-small {
  padding: 6px 12px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  transition: background 0.2s;
}
.icon-btn {
  padding: 6px 10px;
  border: none;
  cursor: pointer;
  border-radius: 6px;
  font-size: 1rem;
}

.btn-primary {
  background: var(--primary);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}
.btn-primary:hover { background: var(--primary-hover); }
.btn-edit { background: #2196f3; color: white; }
.btn-disable { background: var(--danger); color: white; }
.btn-enable { background: #66bb6a; color: white; }
.btn-save { background: #4caf50; color: white; }
.btn-cancel { background: #9e9e9e; color: white; }

.row-disabled {
  opacity: 0.6;
  background: #fafafa;
}

.list li {
  transition: all 0.2s ease;
}
.list li:hover:not(.row-disabled) {
  transform: translateX(4px);
  background: rgba(66, 185, 131, 0.05);
}
</style>
