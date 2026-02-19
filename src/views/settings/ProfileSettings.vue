<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useGoalsStore } from "@/stores/goals";

const auth = useAuthStore();
const goalsStore = useGoalsStore();

const profileName = ref("");
const profileEmail = ref("");
const savingProfile = ref(false);
const profileMessage = ref("");
const profileError = ref("");
onMounted(async () => {
  if (auth.isConnected) {
    await auth.fetchProfile();
  }
});

const updateGoal = (event) => {
  const val = parseInt(event.target.value);
  if (!val || val < 0) {
    goalsStore.dailyGoal = 0;
  } else {
    goalsStore.dailyGoal = val;
  }
};

const saveProfile = async () => {
  profileMessage.value = "";
  profileError.value = "";

  const payload = {};
  if (profileName.value.trim()) payload.name = profileName.value.trim();
  if (profileEmail.value.trim()) payload.email = profileEmail.value.trim();

  if (Object.keys(payload).length === 0) {
    profileError.value = "Renseigne au moins le nom ou l'email.";
    return;
  }

  savingProfile.value = true;
  const result = await auth.updateProfile(payload);
  savingProfile.value = false;

  if (result.success) {
    profileMessage.value = "Profil mis à jour.";
    profileName.value = "";
    profileEmail.value = "";
  } else {
    profileError.value =
      result.error?.response?.data?.message ||
      result.error?.message ||
      "Erreur lors de la mise à jour.";
  }
};
</script>

<template>
  <div>
    <h2>Mon Profil</h2>

    <div class="card">
      <h3>Mes Préférences</h3>
      <div class="form-group">
        <label>Objectif journalier (nombre de tâches) :</label>
        <input
          type="number"
          :value="goalsStore.dailyGoal"
          @input="updateGoal"
          min="1"
        />
      </div>
    </div>

    <div class="card" style="margin-top: 20px">
      <h3>Mettre à jour mon profil</h3>
      <div class="form-group">
        <label>Nom</label>
        <input v-model="profileName" type="text" placeholder="Nouveau nom" />
      </div>
      <div class="form-group">
        <label>Email</label>
        <input
          v-model="profileEmail"
          type="email"
          placeholder="nouvel@email.com"
        />
      </div>
      <button @click="saveProfile" :disabled="savingProfile">
        {{ savingProfile ? "Enregistrement..." : "Mettre à jour" }}
      </button>
      <p v-if="profileMessage" class="success">{{ profileMessage }}</p>
      <p v-if="profileError" class="error">{{ profileError }}</p>
    </div>

    <div class="card" style="margin-top: 20px">
      <h3>Compte</h3>
      <p>
        <strong>Nom actuel :</strong> {{ auth.user?.name || "Non renseigné" }}
      </p>
      <p>
        <strong>Email actuel :</strong>
        {{ auth.user?.email || "Non renseigné" }}
      </p>
      <p><strong>Clé API :</strong> {{ auth.apiKey }}</p>
    </div>
  </div>
</template>

<style scoped>
.card {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #ddd;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 12px;
}
input {
  padding: 8px;
  max-width: 260px;
}
button {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  background: #42b983;
  color: white;
  cursor: pointer;
}
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.success {
  color: #2e7d32;
  margin-top: 10px;
}
.error {
  color: #c62828;
  margin-top: 10px;
}
</style>
