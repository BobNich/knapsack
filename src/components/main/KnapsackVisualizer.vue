<script setup lang="ts">
import {ref, computed, onMounted, nextTick} from 'vue';
import KnapsackChart from '../chart/KnapsackChart.vue';
import ChromosomeVisualizer from '../chromosome/ChromosomeVisualizer.vue';
import FitnessDistribution from '../distribution/FitnessDistribution.vue';
import knapsackConfig from '../../config/knapsackConfig';
import {runGeneticAlgorithm} from '../../utils/geneticAlgorithm';

interface GenerationData {
  generation: number;
  averageFitness: number;
  bestFitness: number;
  bestChromosome: number[];
  bestWeight: number;
}

const populationSize = ref(100);
const generations = ref(50);
const procreationProbabilities = ref([...knapsackConfig.algorithmParams.procreationProbabilities]);
const crossoverProbability = ref(knapsackConfig.algorithmParams.crossoverProbability);
const mutationRate = ref(knapsackConfig.algorithmParams.mutationRate);

const items = ref([]);
const targetWeight = ref(knapsackConfig.defaultProblem.targetWeight);
const customItems = ref('1, 2, 3, 4, 5, 6');
const nextItemId = ref(1);
const itemPositions = ref(new Map());

const isRunning = ref(false);
const isPaused = ref(false);
const history = ref<GenerationData[]>([]);
const currentGeneration = ref(0);
const currentPopulation = ref<any[]>([]);
const bestSolution = ref(null);
const executionSpeed = ref(1000); // milliseconds
const updateInterval = ref(null);

const algorithmProgressPanel = ref(null);
const numberInput = ref(null);

onMounted(() => {
  knapsackConfig.defaultProblem.items.forEach(value => {
    items.value.push({
      id: nextItemId.value++,
      value
    });
  });
  items.value.sort((a, b) => a.value - b.value);
  customItems.value = items.value.map(item => item.value).join(', ');

  setTimeout(() => {
    setupPositionTracking();
  }, 500);
});

const setupPositionTracking = () => {
  const itemElements = document.querySelectorAll('.item-block');
  itemElements.forEach((el: HTMLElement) => {
    const itemId = parseInt(el.dataset.itemId as string);
    itemPositions.value.set(itemId, el.getBoundingClientRect());
  });
};

const saveItemPositions = () => {
  const itemElements = document.querySelectorAll('.item-block');
  itemElements.forEach((el: HTMLElement) => {
    const itemId = parseInt(el.dataset.itemId as string);
    itemPositions.value.set(itemId, el.getBoundingClientRect());
  });
};

const animateToNewPositions = () => {
  const itemElements = document.querySelectorAll('.item-block');

  itemElements.forEach((el: HTMLElement) => {
    const itemId = parseInt(el.dataset.itemId as string);
    const oldPosition = itemPositions.value.get(itemId);

    if (oldPosition) {
      const newPosition = el.getBoundingClientRect();
      const deltaX = oldPosition.left - newPosition.left;
      const deltaY = oldPosition.top - newPosition.top;

      if (deltaX !== 0 || deltaY !== 0) {
        el.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        el.classList.remove('position-animate');
      }
    }
  });

  requestAnimationFrame(() => {
    itemElements.forEach((el: HTMLElement) => {
      const itemId = parseInt(el.dataset.itemId as string);
      if (itemPositions.value.has(itemId)) {
        el.classList.add('position-animate');

        requestAnimationFrame(() => {
          el.style.transform = '';
        });
      }
    });

    setTimeout(() => {
      saveItemPositions();
    }, 400);
  });
};

const addSingleNumber = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    addNumberFromInput(event.target as HTMLInputElement);
    setTimeout(() => {
      if (numberInput.value) {
        numberInput.value.focus();
      }
    }, 10);
  }
};

const addNumberFromInput = (inputElement: HTMLInputElement) => {
  const number = parseInt(inputElement.value);
  if (!isNaN(number) && number > 0) {
    saveItemPositions();

    items.value.push({
      id: nextItemId.value++,
      value: number
    });
    items.value.sort((a, b) => a.value - b.value);
    customItems.value = items.value.map(item => item.value).join(', ');
    inputElement.value = '';

    nextTick(() => {
      animateToNewPositions();
      if (numberInput.value) {
        numberInput.value.focus();
      }
    });
  }
};

const removeItem = (index) => {
  const itemElements = document.querySelectorAll('.item-block');
  if (itemElements[index]) {
    saveItemPositions();

    const itemElement = itemElements[index];
    itemElement.classList.add('item-removing');

    setTimeout(() => {
      items.value.splice(index, 1);
      customItems.value = items.value.map(item => item.value).join(', ');

      nextTick(() => {
        animateToNewPositions();
      });
    }, 300);
  }
};

const removeAllItems = () => {
  if (items.value.length === 0) return;

  saveItemPositions();

  const itemElements = document.querySelectorAll('.item-block');
  itemElements.forEach((el: HTMLElement) => {
    el.classList.add('item-removing');
  });

  setTimeout(() => {
    items.value = [];
    customItems.value = '';

    if (numberInput.value) {
      numberInput.value.focus();
    }
  }, 300);
};

const startAlgorithm = () => {
  if (isRunning.value) return;

  resetExecution();
  isRunning.value = true;

  const validItems = items.value.map(item => {
    if (typeof item.value !== 'undefined') {
      return item;
    } else {
      return {id: nextItemId.value++, value: item};
    }
  });

  const result = runGeneticAlgorithm(
      validItems,
      targetWeight.value,
      populationSize.value,
      generations.value,
      procreationProbabilities.value,
      crossoverProbability.value,
      mutationRate.value,
      onGenerationComplete
  );

  history.value = result.history;
  bestSolution.value = result.solution;

  for (let i = 0; i < result.history.length; i++) {
    if (i < result.populations.length) {
      (result.history[i] as any)._population = JSON.parse(JSON.stringify(result.populations[i]));
    }
  }

  startVisualization();

  setTimeout(() => {
    scrollToAlgorithmProgress();
  }, 0);
};

const onGenerationComplete = (generationData: GenerationData, population: any[]) => {
  if (generationData.generation === 0) {
    history.value = [generationData];
  } else {
    history.value.push(generationData);
  }
  currentPopulation.value = [...population];
};

const startVisualization = () => {
  currentGeneration.value = 0;

  if (history.value.length > 0) {
    const historyItem = history.value[0] as any;
    if (historyItem._population) {
      currentPopulation.value = [...historyItem._population];
    }
  }

  setTimeout(() => {
    updateInterval.value = setInterval(() => {
      if (currentGeneration.value < history.value.length - 1) {
        currentGeneration.value += 1;

        const historyItem = history.value[currentGeneration.value] as any;
        if (historyItem._population) {
          currentPopulation.value = JSON.parse(JSON.stringify(historyItem._population));
        }
      } else {
        stopVisualization();
      }
    }, executionSpeed.value);
  }, 100);
};

const scrollToAlgorithmProgress = () => {
  if (algorithmProgressPanel.value) {
    nextTick(() => {
      algorithmProgressPanel.value.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    });
  }
};

const pauseVisualization = () => {
  if (updateInterval.value) {
    clearInterval(updateInterval.value);
    updateInterval.value = null;
  }
  isPaused.value = true;
};

const resumeVisualization = () => {
  if (!isPaused.value) return;

  isPaused.value = false;

  updateInterval.value = setInterval(() => {
    if (currentGeneration.value < history.value.length - 1) {
      currentGeneration.value += 1;

      const historyItem = history.value[currentGeneration.value] as any;
      if (historyItem._population) {
        currentPopulation.value = JSON.parse(JSON.stringify(historyItem._population));
      }
    } else {
      stopVisualization();
    }
  }, executionSpeed.value);
};

const stopVisualization = () => {
  if (updateInterval.value) {
    clearInterval(updateInterval.value);
    updateInterval.value = null;
  }
  isRunning.value = false;
  isPaused.value = false;
};

const resetExecution = () => {
  stopVisualization();
  history.value = [];
  currentGeneration.value = 0;
  currentPopulation.value = [];
  bestSolution.value = null;
  isPaused.value = false;
};

const visibleHistory = computed(() => {
  return history.value.slice(0, currentGeneration.value + 1);
});

const currentBestChromosome = computed(() => {
  if (visibleHistory.value.length === 0) return [];
  return visibleHistory.value[visibleHistory.value.length - 1].bestChromosome;
});

const currentBestFitness = computed(() => {
  if (visibleHistory.value.length === 0) return 0;
  return visibleHistory.value[visibleHistory.value.length - 1].bestFitness;
});

const foundExactSolution = computed(() => {
  return currentBestFitness.value === 0;
});

const progressPercent = computed(() => {
  if (generations.value === 0) return 0;
  return (currentGeneration.value / generations.value) * 100;
});

onMounted(() => {
  return () => {
    if (updateInterval.value) {
      clearInterval(updateInterval.value);
    }
  };
});

const controlAction = () => {
  if (!isRunning.value) {
    startAlgorithm();
  } else if (isPaused.value) {
    resumeVisualization();
  } else {
    pauseVisualization();
  }
};

const limitTargetWeight = (event) => {
  const maxValue = 99999999;
  if (event.target.value.length > 8) {
    event.target.value = event.target.value.slice(0, 8);
    targetWeight.value = parseInt(event.target.value);
  }
  if (parseInt(event.target.value) > maxValue) {
    event.target.value = maxValue.toString();
    targetWeight.value = maxValue;
  }
};

const addNumberFromButton = () => {
  if (numberInput.value) {
    addNumberFromInput(numberInput.value);
  }
};

</script>

<style scoped>
@import 'KnapsackVisualizer.css';
</style>

<template>
  <div>
    <h1>Knapsack Problem Genetic Algorithm Visualizer</h1>

    <div class="glass-panels vertical-layout">
      <div class="panel">
        <div class="panel-header">
          <h2>Problem Configuration</h2>
        </div>

        <div class="items-card">
          <div class="items-card-header">
            <h3>Knapsack Items</h3>
            <button
                v-if="items.length > 0"
                @click="removeAllItems"
                class="delete-all-btn"
                title="Delete all items"
            >
              Clear All
            </button>
          </div>

          <div class="items-visualization">
            <div v-if="items.length === 0" class="no-items">
              <div class="no-items-icon">🎒</div>
              <div class="no-items-text">Add some items to your knapsack</div>
            </div>

            <div v-else class="items-container-wrapper">
              <div class="items-container">
                <div
                    v-for="(item, index) in items"
                    :key="item.id"
                    class="item-block"
                    :data-item-id="item.id"
                    :style="{
                    '--item-color': `hsl(${(item.value * 20) % 360}, 65%, 75%)`,
                    '--item-width': item.value.toString().length > 2 ? `${Math.min(150, Math.max(70, item.value.toString().length * 20))}px` : '70px',
                    '--item-index': index
                  }"
                >
                  <div class="item-weight">{{ item.value }}</div>
                  <button @click="removeItem(index)" class="item-remove-btn">
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="items-input-row">
            <div class="number-input-container">
              <input
                  ref="numberInput"
                  type="number"
                  @keydown="addSingleNumber"
                  class="number-input-square"
                  min="1"
                  placeholder="Enter item weight..."
              />
              <button class="add-number-btn" @click="addNumberFromButton" title="Add item">
                <span class="add-icon"></span>
              </button>
            </div>
          </div>
        </div>

        <div class="items-card mt-4">
          <div class="items-card-header">
            <h3>Target Weight</h3>
          </div>

          <div class="target-weight-content">
            <div class="weight-input-container">
              <div class="weight-input-field">
                <input
                    type="number"
                    v-model.number="targetWeight"
                    min="1"
                    max="99999999"
                    class="target-weight-input"
                    @input="limitTargetWeight"
                />
              </div>
            </div>
          </div>
        </div>

        <h2>Algorithm Parameters</h2>

        <div class="form-group flex items-center mb-3">
          <label class="mr-2" style="width: 180px">Population Size:</label>
          <input type="number" v-model.number="populationSize" min="10" max="1000"/>
        </div>

        <div class="form-group flex items-center mb-3">
          <label class="mr-2" style="width: 180px">Generations:</label>
          <input type="number" v-model.number="generations" min="1" max="1000"/>
        </div>

        <div class="form-group flex items-center mb-3">
          <label class="mr-2" style="width: 180px">Crossover Probability:</label>
          <div class="flex items-center w-full">
            <input type="range" v-model.number="crossoverProbability" min="0" max="1" step="0.05" class="mr-2"/>
            <span class="font-mono slider-value">{{ (crossoverProbability * 100).toFixed(0) }}%</span>
          </div>
        </div>

        <div class="form-group flex items-center mb-3">
          <label class="mr-2" style="width: 180px">Mutation Rate:</label>
          <div class="flex items-center w-full">
            <input type="range" v-model.number="mutationRate" min="0" max="0.1" step="0.005" class="mr-2"/>
            <span class="font-mono slider-value">{{ (mutationRate * 100).toFixed(1) }}%</span>
          </div>
        </div>

        <div class="control-panel">
          <div class="primary-control">
            <button
                @click="controlAction"
                class="control-button"
                :class="[
                  isRunning && isPaused ? 'btn-primary' : 
                  isRunning ? 'btn-warning' : 'btn-secondary'
                ]"
            >
              <div class="control-icon">
                <div v-if="!isRunning" class="play-icon"></div>
                <div v-else-if="isPaused" class="play-icon"></div>
                <div v-else class="pause-icon"></div>
              </div>
              <span>{{ !isRunning ? 'Start' : (isPaused ? 'Resume' : 'Pause') }}</span>
            </button>

            <button
                v-if="isRunning"
                @click="stopVisualization"
                class="control-button btn-danger"
            >
              <div class="control-icon">
                <div class="stop-icon"></div>
              </div>
              <span>Stop</span>
            </button>
          </div>
        </div>
      </div>

      <div
          v-if="isRunning || history.length > 0"
          ref="algorithmProgressPanel"
          class="panel algorithm-panel"
      >
        <div class="panel-header">
          <h2 class="mb-0">Algorithm Progress</h2>
        </div>

        <div class="progress-container mb-3">
          <div class="progress-bar" :style="{ width: `${progressPercent}%` }"></div>
        </div>

        <div class="stats-container">
          <div class="stat-card animate-fadeIn" style="animation-delay: 0.3s">
            <div class="stat-icon"><span>🏁</span></div>
            <div class="stat-label">Generation</div>
            <div class="stat-value">{{ currentGeneration }} / {{ generations }}</div>
          </div>

          <div class="stat-card animate-fadeIn" style="animation-delay: 0.4s">
            <div class="stat-icon"><span class="scale-icon">⚖️</span></div>
            <div class="stat-label">Best Fitness</div>
            <div class="stat-value" :class="{ 'text-success': foundExactSolution }">
              {{ currentBestFitness }}
            </div>
          </div>

          <div class="stat-card animate-fadeIn" style="animation-delay: 0.5s">
            <div class="stat-icon"><span>🎯</span></div>
            <div class="stat-label">Found Solution</div>
            <div class="stat-badge">
              <span
                  :class="foundExactSolution ? 'badge-success' : 'badge-warning'"
                  class="badge"
              >
                {{ foundExactSolution ? 'Yes!' : 'Not yet' }}
              </span>
            </div>
          </div>
        </div>

        <KnapsackChart
            v-if="visibleHistory.length > 0"
            :history="visibleHistory"
            class="mt-4 mb-4 chart-animation"
        />

        <div class="section-divider">
          <div class="divider-line"></div>
          <span class="divider-text">Population Analysis</span>
          <div class="divider-line"></div>
        </div>

        <FitnessDistribution
            v-if="currentPopulation.length > 0"
            :population="currentPopulation"
            :generationNumber="currentGeneration"
            class="mt-4 mb-4 chart-animation"
        />

        <div v-if="currentBestChromosome.length > 0" class="mt-4 animate-fadeIn">
          <div class="section-divider">
            <div class="divider-line"></div>
            <span class="divider-text optimal-solution-text">Current Best Solution</span>
            <div class="divider-line"></div>
          </div>

          <ChromosomeVisualizer
              :chromosome="currentBestChromosome"
              :items="items.map(item => item.value !== undefined ? item : {id: 0, value: item})"
              :targetWeight="targetWeight"
              class="solution-card mt-2"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import 'KnapsackVisualizer.css';
</style> 