<script setup>
import { onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import AppHeader from "./components/AppHeader.vue";

const auth = useAuthStore();

onMounted(() => {
  if (auth.isConnected) {
    auth.$api.defaults.headers.common["Authorization"] = `key=${auth.apiKey}`;
  }
});
</script>

<template>
  <div id="app">
    <AppHeader />
    <main>
      <router-view />
    </main>
  </div>
</template>
