<template>
  <div class="settings-container">
    <h1>Paramètres</h1>

    <div class="settings-layout">
      <nav class="settings-nav">
        <router-link :to="{ name: 'settings-profile' }">Mon Profil</router-link>
        <router-link :to="{ name: 'settings-projects' }"
          >Gestion Projets</router-link
        >
        <router-link :to="{ name: 'settings-activities' }"
          >Gestion Activités</router-link
        >
      </nav>

      <main class="settings-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.settings-container {
  max-width: 900px;
  margin: 2rem auto;
  padding: 0 1rem;
}
.settings-layout {
  display: flex;
  gap: 2rem;
  margin-top: 2rem;
}
.settings-nav {
  display: flex;
  flex-direction: column;
  width: 200px;
}
.settings-nav a {
  padding: 10px;
  text-decoration: none;
  color: #2c3e50;
  border-left: 3px solid transparent;
}
.settings-nav a.router-link-active {
  border-left-color: #42b983;
  background: #f4f4f4;
  font-weight: bold;
}
.settings-content {
  flex-grow: 1;
  background: #fff;
  padding: 1rem;
  border: 1px solid #eee;
  border-radius: 8px;
}
</style>
