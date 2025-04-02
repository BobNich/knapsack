<script setup lang="ts">
import {computed} from 'vue';

interface Item {
  value: number;
}

interface SelectedItem {
  item: number;
  index: number;
}

const props = defineProps({
  chromosome: {
    type: Array as () => number[],
    required: true
  },
  items: {
    type: Array as () => Item[],
    required: true
  },
  targetWeight: {
    type: Number,
    required: true
  },
  highlightSelected: {
    type: Boolean,
    default: true
  }
});

const totalWeight = computed((): number => {
  return props.chromosome.reduce((total: number, gene: number, index: number) => {
    return total + (gene === 1 ? props.items[index].value : 0);
  }, 0);
});

const fitnessValue = computed((): number => {
  return Math.abs(totalWeight.value - props.targetWeight);
});

const selectedItems = computed((): SelectedItem[] => {
  return props.chromosome
      .map((gene: number, index: number) => ({gene, item: props.items[index], index}))
      .filter(({gene}) => gene === 1)
      .map(({item, index}) => ({
        item: item.value,
        index
      }));
});

const isOptimal = computed((): boolean => {
  return fitnessValue.value === 0;
});
</script>

<style scoped>
@import 'ChromosomeVisualizer.css';
</style>

<template>
  <div class="card mb-3" :class="{ 'optimal-solution': isOptimal }">
    <div class="gene-container mb-4">
      <div
          v-for="(gene, index) in chromosome"
          :key="index"
          class="gene-box"
          :class="{ 'gene-selected': gene === 1 && highlightSelected }"
          :style="{ 'animation-delay': `${index * 0.03}s` }"
      >
        {{ gene }}
      </div>
    </div>

    <div class="stats-section">
      <div class="section-label">
        <span class="label-icon">📊</span> Solution Stats
      </div>

      <div class="stats-grid">
        <div class="stat-card weight-stat">
          <div class="stat-icon">⚖️</div>
          <div class="stat-title">Total Weight</div>
          <div class="stat-value" :class="{ 'text-success': isOptimal }">{{ totalWeight }}</div>
        </div>

        <div class="stat-card target-stat">
          <div class="stat-icon">🎯</div>
          <div class="stat-title">Target Weight</div>
          <div class="stat-value">{{ targetWeight }}</div>
        </div>

        <div class="stat-card fitness-stat">
          <div class="stat-icon">💯</div>
          <div class="stat-title">Fitness Value</div>
          <div class="stat-value" :class="{ 'text-success': isOptimal }">{{ fitnessValue }}</div>
        </div>
      </div>

      <div class="section-label mt-4">
        <span class="label-icon">🧩</span> Selected Items
      </div>

      <div class="selected-items-container">
        <div class="selected-items">
          {{ selectedItems.map(s => `${s.item} (${s.index})`).join(', ') || 'None' }}
        </div>
      </div>
    </div>
  </div>
</template>
