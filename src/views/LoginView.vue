<script setup>
import { ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";

const auth = useAuthStore();
const router = useRouter();

const name = ref("");
const email = ref("");
const apiKeyInput = ref("");
const errorMessage = ref("");

const register = async () => {
  try {
    const response = await auth.$api.post("/api/apikeys", {
      name: name.value,
      email: email.value,
    });

    const newKey = response.data.key;
    auth.setApiKey(newKey);

    router.push({ name: "home" });
  } catch (error) {
    errorMessage.value =
      "Erreur lors de la création : " +
      (error.response?.data?.message || error.message);
  }
};

const loginWithKey = () => {
  if (apiKeyInput.value) {
    auth.setApiKey(apiKeyInput.value);
    router.push({ name: "home" });
  }
};
</script>

<template>
  <div class="container login-container">
    <h1 class="text-center">Bienvenue sur Timely</h1>

    <div class="card">
      <h2>Je n'ai pas de compte</h2>
      <div class="form-group">
        <label>Nom complet :</label>
        <input v-model="name" type="text" placeholder="John Doe" />
      </div>
      <div class="form-group">
        <label>Email :</label>
        <input v-model="email" type="email" placeholder="john@example.com" />
      </div>
      <button class="btn btn-primary" style="width: 100%" @click="register">Créer mon compte</button>
    </div>

    <hr style="margin: 2rem 0; border: 0; border-top: 1px solid var(--border-color);" />

    <div class="card">
      <h2>J'ai déjà une clé API</h2>
      <div class="form-group">
        <label>Votre clé :</label>
        <input
          v-model="apiKeyInput"
          type="text"
          placeholder="Collez votre clé ici"
        />
      </div>
      <button class="btn btn-secondary" style="width: 100%" @click="loginWithKey">Entrer</button>
    </div>

    <p v-if="errorMessage" class="error text-center">{{ errorMessage }}</p>
  </div>
</template>

<style scoped>
.login-container {
  max-width: 450px;
  margin-top: 4rem;
}
.error {
  color: var(--danger);
  font-weight: 600;
  margin-top: 1rem;
}
</style>
