import { supabase } from './supabase.js'

// 1. Gráfico de Ventas Mensuales (mejorado)
async function renderVentasChart() {
  const { data, error } = await supabase.from('v_ventas_por_mes').select();
  
  if (error) {
    console.error("Error cargando ventas:", error);
    document.getElementById('ventasChart').closest('.dashboard-card').innerHTML = `
      <div class="h-80 flex flex-col items-center justify-center text-center p-4">
        <i class="fas fa-exclamation-triangle text-yellow-500 text-4xl mb-3"></i>
        <h3 class="text-lg font-medium text-gray-800">Datos no disponibles</h3>
        <p class="text-gray-600 mt-1">No se pudieron cargar los datos de ventas</p>
      </div>
    `;
    return;
  }
  
  // Formatear datos para Chart.js
  const months = data.map(row => new Date(row.mes).toLocaleDateString('es-CL', { month: 'short' }));
  const amounts = data.map(row => row.total_mensual);
  
  // Crear gradiente para el gráfico
  const ctx = document.getElementById('ventasChart').getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, 'rgba(59, 130, 246, 0.7)');
  gradient.addColorStop(1, 'rgba(59, 130, 246, 0.1)');
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [{
        label: 'Ventas Mensuales (CLP)',
        data: amounts,
        backgroundColor: gradient,
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        borderRadius: 8,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          titleColor: '#1e293b',
          bodyColor: '#1e293b',
          borderColor: '#e2e8f0',
          borderWidth: 1,
          padding: 12,
          boxPadding: 6,
          usePointStyle: true,
          callbacks: {
            label: function(context) {
              return `$${context.raw.toLocaleString('es-CL')}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(226, 232, 240, 0.5)'
          },
          ticks: {
            callback: (value) => '$' + value.toLocaleString('es-CL')
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });
}

// 2. Gráfico de Calidad (mejorado)
async function renderCalidadChart() {
  const { data, error } = await supabase
    .from('cosechas')
    .select('calidad, count')
    .groupBy('calidad');
  
  if (error) {
    console.error("Error cargando calidad:", error);
    document.getElementById('calidadChart').closest('.dashboard-card').innerHTML = `
      <div class="h-80 flex flex-col items-center justify-center text-center p-4">
        <i class="fas fa-exclamation-triangle text-yellow-500 text-4xl mb-3"></i>
        <h3 class="text-lg font-medium text-gray-800">Datos no disponibles</h3>
        <p class="text-gray-600 mt-1">No se pudieron cargar los datos de calidad</p>
      </div>
    `;
    return;
  }
  
  const calidadLabels = {
    premium: 'Premium',
    exportacion: 'Exportación',
    mercado_local: 'Mercado Local',
    descarte: 'Descarte'
  };
  
  const backgroundColors = [
    'rgba(16, 185, 129, 0.8)', // verde
    'rgba(59, 130, 246, 0.8)', // azul
    'rgba(245, 158, 11, 0.8)', // amarillo
    'rgba(239, 68, 68, 0.8)'  // rojo
  ];
  
  const borderColors = [
    'rgba(16, 185, 129, 1)',
    'rgba(59, 130, 246, 1)',
    'rgba(245, 158, 11, 1)',
    'rgba(239, 68, 68, 1)'
  ];
  
  const labels = data.map(row => calidadLabels[row.calidad]);
  const counts = data.map(row => row.count);
  
  new Chart(document.getElementById('calidadChart'), {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        label: 'Cantidad',
        data: counts,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 12,
            padding: 20,
            font: {
              size: 13
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          titleColor: '#1e293b',
          bodyColor: '#1e293b',
          borderColor: '#e2e8f0',
          borderWidth: 1,
          padding: 12,
          boxPadding: 6,
          usePointStyle: true
        }
      }
    }
  });
}

// Inicializar gráficos al cargar
document.addEventListener('DOMContentLoaded', () => {
  renderVentasChart();
  renderCalidadChart();
});