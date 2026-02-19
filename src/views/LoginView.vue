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
  <div class="login-container">
    <h1>Bienvenue sur Timely</h1>

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
      <button @click="register">Créer mon compte</button>
    </div>

    <hr />

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
      <button @click="loginWithKey" class="secondary">Entrer</button>
    </div>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  </div>
</template>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 2rem auto;
  padding: 1rem;
  text-align: center;
}
.card {
  border: 1px solid #ddd;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}
.form-group {
  margin-bottom: 1rem;
  text-align: left;
}
input {
  width: 100%;
  padding: 0.5rem;
  margin-top: 0.5rem;
}
button {
  width: 100%;
  padding: 0.7rem;
  background-color: #42b983;
  color: white;
  border: none;
  cursor: pointer;
}
button.secondary {
  background-color: #2c3e50;
}
.error {
  color: red;
}
</style>
