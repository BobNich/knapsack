<script setup>
import KnapsackVisualizer from './components/main/KnapsackVisualizer.vue';
import './styles/App.css';
</script>

<template>
  <div class="app-background">
    <div class="app-header animate-fadeIn">
      <div class="logo animate-float">
        <span class="icon">🎒</span>
        <span class="title">Knapsack GA</span>
      </div>
    </div>
    <main>
      <KnapsackVisualizer/>
    </main>
  </div>
</template>
