import { api } from './api.js';

// Configuración global de Chart.js
Chart.defaults.font.family = 'Inter, sans-serif';
Chart.defaults.color = '#6b7280';

// 1. Gráfico de Ventas Mensuales
async function renderVentasChart() {
  let data;
  try {
    data = await api.ventas();
  } catch (error) {
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
        data: data.map(row => Number(row.total_mensual)),
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
  let data;
  try {
    data = await api.calidad();
  } catch (error) {
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
        data: data.map(row => Number(row.cantidad_cosechas)),
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
  let data;
  try {
    data = await api.mortalidad();
  } catch (error) {
    console.error('Error cargando mortalidad:', error);
    return;
  }

  new Chart(document.getElementById('mortalidadChart'), {
    type: 'line',
    data: {
      labels: data.map(row => row.lote_codigo),
      datasets: [{
        label: 'Mortalidad acumulada',
        data: data.map(row => Number(row.mortalidad_total)),
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
  let data;
  try {
    data = await api.rentabilidad();
  } catch (error) {
    console.error('Error cargando rentabilidad:', error);
    return;
  }

  new Chart(document.getElementById('rentabilidadChart'), {
    type: 'bar',
    data: {
      labels: data.map(row => row.centro_nombre),
      datasets: [{
        label: 'Ingresos (CLP)',
        data: data.map(row => Number(row.total_ingresos_clp)),
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

// 5. Dotación y planilla por cargo (RRHH)
async function renderEmpleadosChart() {
  let data;
  try {
    data = await api.empleadosPlanilla();
  } catch (error) {
    console.error('Error cargando planilla:', error);
    return;
  }

  new Chart(document.getElementById('empleadosChart'), {
    type: 'bar',
    data: {
      labels: data.map(row => row.cargo),
      datasets: [{
        label: 'Planilla mensual (CLP)',
        data: data.map(row => Number(row.planilla_clp)),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(4, 120, 87, 1)',
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

// 5b. Tabla de dotación (top por salario)
async function renderTablaEmpleados() {
  let data;
  try {
    data = await api.empleados();
  } catch (error) {
    console.error('Error cargando empleados:', error);
    return;
  }

  const tbody = document.getElementById('tablaEmpleadosBody');
  tbody.innerHTML = '';
  data.slice(0, 10).forEach(row => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-gray-100 text-sm';
    tr.innerHTML = `
      <td class="px-4 py-2 font-medium text-gray-800">${row.nombre_completo}</td>
      <td class="px-4 py-2 text-gray-600">${row.cargo}</td>
      <td class="px-4 py-2 text-gray-600">${row.centro_nombre}</td>
      <td class="px-4 py-2 text-gray-800 font-semibold">$${Number(row.salario_clp).toLocaleString('es-CL')}</td>`;
    tbody.appendChild(tr);
  });
}

// 6. Biomasa por centro (Lotes)
async function renderBiomasaChart() {
  let data;
  try {
    data = await api.lotesBiomasa();
  } catch (error) {
    console.error('Error cargando biomasa:', error);
    return;
  }

  new Chart(document.getElementById('biomasaChart'), {
    type: 'bar',
    data: {
      labels: data.map(row => row.centro_nombre),
      datasets: [{
        label: 'Biomasa (kg)',
        data: data.map(row => Number(row.biomasa_kg)),
        backgroundColor: 'rgba(59, 130, 246, 0.75)',
        borderColor: 'rgba(37, 99, 235, 1)',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.raw.toLocaleString('es-CL')} kg`
          }
        }
      },
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(229, 231, 235, 0.5)' } },
        x: { grid: { display: false } }
      }
    }
  });
}

// 6b. Tabla de lotes activos
async function renderTablaLotes() {
  let data;
  try {
    data = await api.lotes();
  } catch (error) {
    console.error('Error cargando lotes:', error);
    return;
  }

  const tbody = document.getElementById('tablaLotesBody');
  tbody.innerHTML = '';
  data.filter(row => row.estado === 'activo').forEach(row => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-gray-100 text-sm';
    tr.innerHTML = `
      <td class="px-4 py-2 font-medium text-gray-800">${row.lote_codigo}</td>
      <td class="px-4 py-2 text-gray-600">${row.especie}</td>
      <td class="px-4 py-2 text-gray-600">${row.centro_nombre}</td>
      <td class="px-4 py-2 text-gray-600">${Number(row.biomasa_kg).toLocaleString('es-CL')} kg</td>
      <td class="px-4 py-2 text-gray-600">${Number(row.peso_promedio_kg).toFixed(2)} kg</td>
      <td class="px-4 py-2 text-gray-600">${Number(row.fcr).toFixed(2)}</td>`;
    tbody.appendChild(tr);
  });
}

// 7. Valor de inventario por categoría
async function renderInventarioChart() {
  let data;
  try {
    data = await api.inventario();
  } catch (error) {
    console.error('Error cargando inventario:', error);
    return;
  }

  const paleta = ['rgba(16, 185, 129, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(245, 158, 11, 0.8)', 'rgba(168, 85, 247, 0.8)'];

  new Chart(document.getElementById('inventarioChart'), {
    type: 'doughnut',
    data: {
      labels: data.map(row => `${row.categoria} (${row.n_items})`),
      datasets: [{
        data: data.map(row => Number(row.valor_total_clp)),
        backgroundColor: data.map((_, i) => paleta[i % paleta.length]),
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
            label: (ctx) => `$${ctx.raw.toLocaleString('es-CL')}`
          }
        }
      }
    }
  });
}

// 7b. Tabla de alertas de stock bajo
async function renderTablaStockBajo() {
  let data;
  try {
    data = await api.inventarioBajo();
  } catch (error) {
    console.error('Error cargando stock bajo:', error);
    return;
  }

  const tbody = document.getElementById('tablaStockBody');
  tbody.innerHTML = '';
  data.forEach(row => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-gray-100 text-sm';
    tr.innerHTML = `
      <td class="px-4 py-2 font-medium text-gray-800">${row.nombre}</td>
      <td class="px-4 py-2 text-gray-600">${row.categoria}</td>
      <td class="px-4 py-2 text-red-600 font-semibold">${Number(row.stock).toLocaleString('es-CL')}</td>
      <td class="px-4 py-2 text-gray-600">${Number(row.stock_minimo).toLocaleString('es-CL')}</td>`;
    tbody.appendChild(tr);
  });
}

// 8. Gasto por proveedor (Compras)
async function renderComprasChart() {
  let data;
  try {
    data = await api.compras();
  } catch (error) {
    console.error('Error cargando compras:', error);
    return;
  }

  new Chart(document.getElementById('comprasChart'), {
    type: 'bar',
    data: {
      labels: data.map(row => row.proveedor),
      datasets: [{
        label: 'Compras totales (CLP)',
        data: data.map(row => Number(row.total_clp)),
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
        borderColor: 'rgba(217, 119, 6, 1)',
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

// 8b. Tabla de compras por proveedor
async function renderTablaCompras() {
  let data;
  try {
    data = await api.compras();
  } catch (error) {
    console.error('Error cargando compras:', error);
    return;
  }

  const tbody = document.getElementById('tablaComprasBody');
  tbody.innerHTML = '';
  data.slice(0, 8).forEach(row => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-gray-100 text-sm';
    tr.innerHTML = `
      <td class="px-4 py-2 font-medium text-gray-800">${row.proveedor}</td>
      <td class="px-4 py-2 text-gray-600">${row.rubro}</td>
      <td class="px-4 py-2 text-gray-600">${row.n_compras}</td>
      <td class="px-4 py-2 text-gray-800 font-semibold">$${Number(row.total_clp).toLocaleString('es-CL')}</td>`;
    tbody.appendChild(tr);
  });
}

// 9. Exportaciones por destino
async function renderExportacionesChart() {
  let data;
  try {
    data = await api.exportaciones();
  } catch (error) {
    console.error('Error cargando exportaciones:', error);
    return;
  }

  new Chart(document.getElementById('exportacionesChart'), {
    type: 'bar',
    data: {
      labels: data.map(row => row.pais_destino),
      datasets: [{
        label: 'Valor FOB (CLP)',
        data: data.map(row => Number(row.total_fob_clp)),
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        borderColor: 'rgba(109, 40, 217, 1)',
        borderWidth: 1,
        borderRadius: 4
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
        y: { beginAtZero: true, grid: { color: 'rgba(229, 231, 235, 0.5)' } },
        x: { grid: { display: false } }
      }
    }
  });
}

// 9b. Tabla de exportaciones por destino
async function renderTablaExportaciones() {
  let data;
  try {
    data = await api.exportaciones();
  } catch (error) {
    console.error('Error cargando exportaciones:', error);
    return;
  }

  const tbody = document.getElementById('tablaExportacionesBody');
  tbody.innerHTML = '';
  data.forEach(row => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-gray-100 text-sm';
    tr.innerHTML = `
      <td class="px-4 py-2 font-medium text-gray-800">${row.pais_destino}</td>
      <td class="px-4 py-2 text-gray-600">${row.n_envios} envíos</td>
      <td class="px-4 py-2 text-gray-600">${Number(row.total_kilos).toLocaleString('es-CL')} kg</td>
      <td class="px-4 py-2 text-gray-800 font-semibold">$${Number(row.total_fob_clp).toLocaleString('es-CL')}</td>`;
    tbody.appendChild(tr);
  });
}

// 10. Incidentes por tipo
async function renderIncidentesChart() {
  let data;
  try {
    data = await api.incidentes();
  } catch (error) {
    console.error('Error cargando incidentes:', error);
    return;
  }

  const paleta = ['rgba(239, 68, 68, 0.8)', 'rgba(245, 158, 11, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(139, 92, 246, 0.8)'];

  new Chart(document.getElementById('incidentesChart'), {
    type: 'pie',
    data: {
      labels: data.map(row => `${row.tipo} (${row.n_incidentes})`),
      datasets: [{
        data: data.map(row => Number(row.n_incidentes)),
        backgroundColor: data.map((_, i) => paleta[i % paleta.length]),
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      plugins: {
        legend: { position: 'right' },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.raw} incidentes`
          }
        }
      }
    }
  });
}

// 10b. Tabla de incidentes por severidad
async function renderTablaIncidentes() {
  let data;
  try {
    data = await api.incidentesSeveridad();
  } catch (error) {
    console.error('Error cargando severidad:', error);
    return;
  }

  const tbody = document.getElementById('tablaIncidentesBody');
  tbody.innerHTML = '';
  data.forEach(row => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-gray-100 text-sm';
    tr.innerHTML = `
      <td class="px-4 py-2 font-medium text-gray-800">${row.severidad}</td>
      <td class="px-4 py-2 text-gray-600">${row.n_incidentes} incidentes</td>`;
    tbody.appendChild(tr);
  });
}

// Inicializar todos los gráficos al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  renderVentasChart();
  renderCalidadChart();
  renderMortalidadChart();
  renderRentabilidadChart();
  renderEmpleadosChart();
  renderTablaEmpleados();
  renderBiomasaChart();
  renderTablaLotes();
  renderInventarioChart();
  renderTablaStockBajo();
  renderComprasChart();
  renderTablaCompras();
  renderExportacionesChart();
  renderTablaExportaciones();
  renderIncidentesChart();
  renderTablaIncidentes();
});
