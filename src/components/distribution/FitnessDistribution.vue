<script setup lang="ts">
import {Bar} from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import {computed, onMounted, ref, watch, nextTick} from 'vue';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const props = defineProps({
  population: {
    type: Array,
    required: true
  },
  generationNumber: {
    type: Number,
    required: true
  }
});

const updatingStats = ref(false);
const chartInstance = ref(null);

const distributionStats = computed(() => {
  if (!props.population || props.population.length === 0) {
    return {
      labels: [],
      data: [],
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
    };
  }

  const fitnessValues = props.population
      .map(individual => individual.fitness);

  const sortedFitness = [...fitnessValues]
      .sort((a, b) => a - b);

  const min = Math.min(...fitnessValues);
  const max = Math.max(...fitnessValues);
  const sum = fitnessValues.reduce((a, b) => a + b, 0);
  const mean = sum / fitnessValues.length;

  let median;
  const mid = Math.floor(sortedFitness.length / 2);
  if (sortedFitness.length % 2 === 0) {
    median = (sortedFitness[mid - 1] + sortedFitness[mid]) / 2;
  } else {
    median = sortedFitness[mid];
  }

  const binCount = Math.min(20, Math.max(5, Math.ceil(Math.sqrt(props.population.length))));
  const range = max - min;
  const binSize = range === 0 ? 1 : range / binCount;

  const bins = Array(binCount).fill(0);
  const binLabels = [];

  for (let i = 0; i < binCount; i++) {
    const start = min + i * binSize;
    const end = min + (i + 1) * binSize;
    binLabels.push(`${start.toFixed(0)}-${end.toFixed(0)}`);
  }

  fitnessValues.forEach(fitness => {
    if (fitness === max) {
      bins[binCount - 1]++;
    } else {
      const binIndex = Math.floor((fitness - min) / binSize);
      bins[binIndex]++;
    }
  });

  return {
    labels: binLabels,
    data: bins,
    min,
    max,
    mean,
    median,
  };
});

const chartData = computed(() => {
  const distribution = distributionStats.value;
  return {
    labels: distribution.labels,
    datasets: [
      {
        label: `Fitness Distribution - Generation ${props.generationNumber}`,
        backgroundColor: generateGradient(),
        borderColor: 'rgba(234, 88, 12, 1)',
        borderWidth: 1,
        data: distribution.data,
        borderRadius: 4,
        minBarLength: 5,
        barPercentage: 0.9,
        categoryPercentage: 0.9,
      }
    ]
  };
});

const chartOptions = computed(() => {
  return {
    scales: {
      y: {
        beginAtZero: true,
        grace: '15%',
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          borderDash: [5, 5]
        },
        ticks: {
          color: '#64748b',
          precision: 0,
          font: {
            weight: 600,
            size: 11
          }
        },
        title: {
          display: true,
          text: 'Number of Chromosomes',
          color: '#64748b',
          font: {
            size: 13,
            weight: 500
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#64748b',
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 10
          }
        },
        title: {
          display: true,
          text: 'Fitness Range',
          color: '#64748b',
          font: {
            size: 13,
            weight: 500
          }
        }
      }
    },
    elements: {
      bar: {
        borderWidth: 1,
        borderRadius: 4,
        borderColor: 'rgba(234, 88, 12, 1)',
        backgroundColor: 'rgba(234, 88, 12, 0.85)'
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1e293b',
        bodyColor: '#334155',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 10,
        boxPadding: 5,
        usePointStyle: true,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: (tooltipItems) => {
            return `Fitness Range: ${tooltipItems[0].label}`;
          },
          label: (tooltipItem) => {
            return `Chromosomes: ${tooltipItem.raw}`;
          }
        }
      }
    }
  };
});

const generateGradient = () => {
  return distributionStats.value.labels.map((_, index) => {
    const ratio = index / (distributionStats.value.labels.length - 1);
    return `rgba(${234 - ratio * 40}, ${88 + ratio * 100}, ${12 + ratio * 60}, 0.85)`;
  });
};

const chartRef = ref(null);

const updateStats = () => {
  updatingStats.value = true;
  setTimeout(() => {
    updatingStats.value = false;
  }, 600);
};

const updateChartData = () => {
  const chart = chartRef.value?.chart;
  if (!chart) return;

  chart.data.labels = chartData.value.labels;
  chart.data.datasets[0].backgroundColor = chartData.value.datasets[0].backgroundColor;
  chart.data.datasets[0].label = chartData.value.datasets[0].label;

  chart.update('none');

  chart.data.datasets[0].data = chartData.value.datasets[0].data;

  chart.update({
    easing: 'easeOutQuad',
    mode: 'active'
  });
};

const updateChart = () => {
  updateStats();

  nextTick(() => {
    updateChartData();
  });
};

onMounted(() => {
  nextTick(() => {
    chartInstance.value = chartRef.value?.chart;
    if (chartInstance.value) {
      chartInstance.value.update();
    }
  });
});

watch(() => props.population, (newPop) => {
  if (newPop.length > 0) {
    nextTick(() => {
      updateChart();
    });
  }
}, {deep: true});

watch(() => props.generationNumber, (newGen, oldGen) => {
  if (newGen !== oldGen) {
    nextTick(() => {
      updateChart();
    });
  }
});
</script>

<style scoped>
@import 'FitnessDistribution.css';
</style>

<template>
  <div class="distribution-container" :class="{ 'updating': updatingStats }">
    <div class="distribution-header">
      <h3 class="distribution-title">Population Fitness Distribution</h3>
      <div class="generation-badge">Generation {{ props.generationNumber }}</div>
    </div>

    <div class="stats-grid" :class="{ 'stats-updating': updatingStats }">
      <div class="stat-item">
        <span class="stat-label">Min Fitness</span>
        <span class="stat-value">{{ distributionStats.min.toFixed(0) }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Max Fitness</span>
        <span class="stat-value">{{ distributionStats.max.toFixed(0) }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Mean</span>
        <span class="stat-value">{{ distributionStats.mean.toFixed(1) }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Median</span>
        <span class="stat-value">{{ distributionStats.median.toFixed(1) }}</span>
      </div>
    </div>

    <div class="chart-container">
      <Bar
          ref="chartRef"
          :data="chartData"
          :options="chartOptions"
      />
    </div>
  </div>
</template>
