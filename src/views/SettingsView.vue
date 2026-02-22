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
  max-width: 1000px;
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
  width: 220px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  padding: 1rem 0;
  box-shadow: var(--shadow);
  height: fit-content;
}
.settings-nav a {
  padding: 12px 20px;
  text-decoration: none;
  color: var(--secondary);
  border-left: 4px solid transparent;
  transition: all 0.2s;
  font-weight: 500;
}
.settings-nav a:hover {
  background: var(--bg-color);
}
.settings-nav a.router-link-active {
  border-left-color: var(--primary);
  background: rgba(66, 185, 131, 0.1);
  color: var(--primary);
  font-weight: 600;
}
.settings-content {
  flex-grow: 1;
  background: var(--card-bg);
  padding: 2rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}
</style>
