<script setup lang="ts">
import {Line} from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import {computed} from 'vue';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const props = defineProps({
  history: {
    type: Array,
    required: true
  }
});

const chartData = computed(() => {
  return {
    labels: props.history.map(point => point.generation),
    datasets: [
      {
        label: 'Best Fitness',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
        data: props.history.map(point => point.bestFitness),
        pointBackgroundColor: 'rgba(16, 185, 129, 1)',
        pointBorderColor: '#fff',
      },
      {
        label: 'Average Fitness',
        borderColor: 'rgba(79, 70, 229, 1)',
        borderWidth: 2,
        data: props.history.map(point => point.averageFitness),
        pointBackgroundColor: 'rgba(79, 70, 229, 1)',
        pointBorderColor: '#fff',
      }
    ]
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Fitness Value',
        color: '#64748b',
        font: {
          size: 13,
          weight: 500
        }
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
        borderDash: [5, 5]
      },
      ticks: {
        color: '#64748b'
      }
    },
    x: {
      title: {
        display: true,
        text: 'Generation',
        color: '#64748b',
        font: {
          size: 13,
          weight: 500
        }
      },
      grid: {
        display: false
      },
      ticks: {
        color: '#64748b'
      }
    }
  },
  plugins: {
    legend: {
      position: 'top',
      labels: {
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 15,
        font: {
          size: 12
        }
      }
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
      caretPadding: 5,
      caretSize: 6,
      cornerRadius: 8,
      displayColors: true,
      boxWidth: 8,
      boxHeight: 8,
      titleFont: {
        size: 14,
        weight: 'bold'
      },
      bodyFont: {
        size: 13
      }
    },
    title: {
      display: true,
      text: 'Genetic Algorithm Progress',
      font: {
        size: 16,
        weight: 'bold'
      },
      color: '#1e293b'
    }
  }
};
</script>

<style scoped>
@import 'KnapsackChart.css';
</style>

<template>
  <div class="chart-container">
    <Line
        :data="chartData"
        :options="chartOptions"
    />
  </div>
</template>
