import { supabase } from './supabase.js';

// Configuración global de Chart.js
Chart.defaults.font.family = 'Inter, sans-serif';
Chart.defaults.color = '#6b7280';

// 1. Gráfico de Ventas Mensuales
async function renderVentasChart() {
  const { data, error } = await supabase
    .from('v_ventas_por_mes')
    .select('*')
    .order('mes', { ascending: true });

  if (error) {
    console.error('Error cargando ventas:', error);
    return;
  }

  const ctx = document.getElementById('ventasChart').getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
  gradient.addColorStop(1, 'rgba(59, 130, 246, 0.1)');

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(row =>
        new Date(row.mes).toLocaleDateString('es-CL', { month: 'short', year: 'numeric' })
      ),
      datasets: [{
        label: 'Ventas (CLP)',
        data: data.map(row => row.total_mensual),
        backgroundColor: gradient,
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `$${ctx.raw.toLocaleString('es-CL')}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => `$${value.toLocaleString('es-CL')}`
          },
          grid: { color: 'rgba(229, 231, 235, 0.5)' }
        },
        x: { grid: { display: false } }
      }
    }
  });
}

// 2. Gráfico de Calidad (Doughnut)
async function renderCalidadChart() {
  const { data, error } = await supabase
    .from('vista_distribucion_por_calidad')
    .select('*');

  if (error) {
    console.error('Error cargando calidad:', error);
    return;
  }

  const colores = {
    premium: 'rgba(16, 185, 129, 0.8)',
    exportacion: 'rgba(59, 130, 246, 0.8)',
    mercado_local: 'rgba(245, 158, 11, 0.8)',
    descarte: 'rgba(239, 68, 68, 0.8)'
  };

  new Chart(document.getElementById('calidadChart'), {
    type: 'doughnut',
    data: {
      labels: data.map(row => `${row.calidad.toUpperCase()} (${row.cantidad_cosechas})`),
      datasets: [{
        data: data.map(row => row.cantidad_cosechas),
        backgroundColor: data.map(row => colores[row.calidad] || 'gray'),
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      cutout: '70%',
      plugins: {
        legend: { position: 'right' },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${ctx.raw} unidades`
          }
        }
      }
    }
  });
}

// 3. Gráfico de Mortalidad (Línea)
async function renderMortalidadChart() {
  const { data, error } = await supabase
    .from('vista_mortalidad_acumulada')
    .select('*')
    .order('lote_codigo', { ascending: true });

  if (error) {
    console.error('Error cargando mortalidad:', error);
    return;
  }

  new Chart(document.getElementById('mortalidadChart'), {
    type: 'line',
    data: {
      labels: data.map(row => row.lote_codigo),
      datasets: [{
        label: 'Mortalidad acumulada',
        data: data.map(row => row.mortalidad_total),
        borderColor: 'rgba(127, 37, 37, 0.8)',
        backgroundColor: 'rgba(185, 37, 37, 0.33)',
        borderWidth: 3,
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.raw} peces muertos`
          }
        }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

// 4. Gráfico de Rentabilidad (Barras Horizontales)
async function renderRentabilidadChart() {
  const { data, error } = await supabase
    .from('vista_rentabilidad_por_centro')
    .select('*');

  if (error) {
    console.error('Error cargando rentabilidad:', error);
    return;
  }

  new Chart(document.getElementById('rentabilidadChart'), {
    type: 'bar',
    data: {
      labels: data.map(row => row.centro_nombre),
      datasets: [{
        label: 'Ingresos (CLP)',
        data: data.map(row => row.total_ingresos_clp),
        backgroundColor: 'rgba(85, 238, 118, 0.8)',
        borderColor: 'rgba(48, 174, 97, 1)',
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `$${ctx.raw.toLocaleString('es-CL')}`
          }
        }
      }
    }
  });
}

// Inicializar todos los gráficos al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  renderVentasChart();
  renderCalidadChart();
  renderMortalidadChart();
  renderRentabilidadChart();
});
