import { api } from './api.js';

// Configuración global de Chart.js
Chart.defaults.font.family = 'Inter, sans-serif';
Chart.defaults.color = '#6b7280';
Chart.defaults.font.size = 14;

// Tooltips y ejes más legibles (aplica a todos los gráficos)
Chart.defaults.plugins.tooltip.padding = 12;
Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 23, 42, 0.92)';
Chart.defaults.plugins.tooltip.cornerRadius = 8;
Chart.defaults.plugins.tooltip.titleFont = { size: 14, weight: '600' };
Chart.defaults.plugins.tooltip.bodyFont = { size: 13 };
Chart.defaults.scale.ticks.font = { size: 13, color: '#64748b' };
Chart.defaults.scale.grid.color = 'rgba(148, 163, 184, 0.25)';

// Formato compacto para los valores de los ejes (K = miles, M = millones, B = mil-millones)
function ejeCLP(valor) {
  const abs = Math.abs(valor);
  const n = (v) => v.toLocaleString('es-CL', { maximumFractionDigits: 1 });
  if (abs >= 1e9) return `$${n(valor / 1e9)}B`;
  if (abs >= 1e6) return `$${n(valor / 1e6)}M`;
  if (abs >= 1e3) return `$${n(valor / 1e3)}k`;
  return `$${Math.round(valor)}`;
}

function ejeKG(valor) {
  const abs = Math.abs(valor);
  if (abs >= 1e6) return `${(valor / 1e6).toLocaleString('es-CL', { maximumFractionDigits: 1 })}M kg`;
  if (abs >= 1e3) return `${(valor / 1e3).toLocaleString('es-CL', { maximumFractionDigits: 0 })}k kg`;
  return `${Math.round(valor)} kg`;
}

// Plugin para mostrar un total en el centro de los doughnut
const textoCentro = {
  id: 'textoCentro',
  afterDraw(chart, _args, opciones) {
    if (!chart.canvas || !chart.canvas.id) return;
    const meta = chart.getDatasetMeta(0);
    const primerArco = meta.data && meta.data[0];
    if (!primerArco) return;
    const ctx = chart.ctx;
    const cx = primerArco.x;
    const cy = primerArco.y;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.fillText(opciones.linea1, cx, cy - 6);
    ctx.fillStyle = '#64748b';
    ctx.font = '13px Inter, sans-serif';
    if (opciones.arriba) {
      ctx.fillText(opciones.linea2, cx, chart.chartArea.top + 18);
    } else {
      ctx.fillText(opciones.linea2, cx, cy + 18);
    }
    ctx.restore();
  },
};

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
            callback: (value) => ejeCLP(value)
          }
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
    plugins: [textoCentro],
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
      cutout: '60%',
      plugins: {
        textoCentro: {
          linea1: data.reduce((a, r) => a + Number(r.cantidad_cosechas), 0).toLocaleString('es-CL'),
          linea2: 'unidades cosechadas',
          arriba: true,
        },
        legend: {
          position: 'right',
          labels: { font: { size: 16 }, padding: 12, boxWidth: 18, boxHeight: 18 }
        },
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
        fill: true,
        pointRadius: 5,
        pointBackgroundColor: 'rgba(185, 37, 37, 1)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.raw.toLocaleString('es-CL')} peces muertos`
          }
        }
      },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } },
        x: { grid: { display: false } }
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
        borderWidth: 1,
        maxBarThickness: 30
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
      },
      scales: {
        x: { ticks: { callback: (value) => ejeCLP(value) } },
        y: { grid: { display: false } }
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
        borderWidth: 1,
        maxBarThickness: 30
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
      },
      scales: {
        x: { ticks: { callback: (value) => ejeCLP(value) } },
        y: { grid: { display: false } }
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
        borderRadius: 4,
        maxBarThickness: 30
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
        y: { beginAtZero: true, ticks: { callback: (value) => ejeKG(value) } },
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
    plugins: [textoCentro],
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
      cutout: '52%',
      plugins: {
        textoCentro: {
          linea1: ejeCLP(data.reduce((a, r) => a + Number(r.valor_total_clp), 0)),
          linea2: 'valor total',
        },
        legend: {
          position: 'right',
          labels: { font: { size: 17 }, padding: 14, boxWidth: 20, boxHeight: 20 }
        },
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
        borderWidth: 1,
        maxBarThickness: 30
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
      },
      scales: {
        x: { ticks: { callback: (value) => ejeCLP(value) } },
        y: { grid: { display: false } }
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
        borderRadius: 4,
        maxBarThickness: 30
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
        y: { beginAtZero: true, ticks: { callback: (value) => ejeCLP(value) } },
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

// 10. Incidentes por tipo (barras horizontales con conteo visible)
async function renderIncidentesChart() {
  let data;
  try {
    data = await api.incidentes();
  } catch (error) {
    console.error('Error cargando incidentes:', error);
    return;
  }

  const paleta = data.map((_, i) =>
    ['rgba(239, 68, 68, 0.8)', 'rgba(245, 158, 11, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(139, 92, 246, 0.8)'][i % 5]
  );

  new Chart(document.getElementById('incidentesChart'), {
    type: 'bar',
    data: {
      labels: data.map(row => row.tipo),
      datasets: [{
        label: 'N° de incidentes',
        data: data.map(row => Number(row.n_incidentes)),
        backgroundColor: paleta,
        borderColor: '#fff',
        borderWidth: 2,
        borderRadius: 6,
        maxBarThickness: 30
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
            label: (ctx) => `${ctx.raw} incidentes`
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { precision: 0 }
        },
        y: { grid: { display: false } }
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

// Escapado básico para evitar inyección de HTML en las tablas
function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// 11. KPIs del resumen (Estado de la empresa)
async function renderResumenKpis() {
  try {
    const [ventas, exportaciones, calidad, stock] = await Promise.all([
      api.ventas(), api.exportaciones(), api.calidad(), api.inventarioBajo()
    ]);
    const totalVentas = ventas.reduce((a, r) => a + Number(r.total_mensual), 0);
    const totalFob = exportaciones.reduce((a, r) => a + Number(r.total_fob_clp), 0);
    const totalCosecha = calidad.reduce((a, r) => a + Number(r.cantidad_cosechas), 0);
    document.getElementById('kpiVentas').textContent = `$${totalVentas.toLocaleString('es-CL')}`;
    document.getElementById('kpiExportaciones').textContent = `$${totalFob.toLocaleString('es-CL')}`;
    document.getElementById('kpiCosecha').textContent = totalCosecha.toLocaleString('es-CL');
    document.getElementById('kpiStock').textContent = stock.length;
  } catch (error) {
    console.error('Error cargando KPIs:', error);
  }
}

// 12. Tabla de concesiones acuícolas
async function renderTablaConcesiones() {
  let data;
  try {
    data = await api.concesiones();
  } catch (error) {
    console.error('Error cargando concesiones:', error);
    return;
  }

  const tbody = document.getElementById('tablaConcesionesBody');
  tbody.innerHTML = '';
  data.forEach(row => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-gray-100 text-sm';
    tr.innerHTML = `
      <td class="px-4 py-2 font-medium text-gray-800">${esc(row.centro_nombre)}</td>
      <td class="px-4 py-2 text-gray-600">${esc(row.sector)}</td>
      <td class="px-4 py-2 text-gray-600">${esc(row.region)}</td>
      <td class="px-4 py-2 text-gray-600">${Number(row.superficie_ha).toLocaleString('es-CL')} ha</td>
      <td class="px-4 py-2 text-gray-600">${row.n_jaulas}</td>
      <td class="px-4 py-2 text-gray-600">${esc(row.especies_autorizadas)}</td>
      <td class="px-4 py-2 text-gray-600">${esc(row.vigencia)}</td>`;
    tbody.appendChild(tr);
  });
}

// 13. Tabla de clientes
async function renderTablaClientes() {
  let data;
  try {
    data = await api.clientes();
  } catch (error) {
    console.error('Error cargando clientes:', error);
    return;
  }

  const tbody = document.getElementById('tablaClientesBody');
  tbody.innerHTML = '';
  data.forEach(row => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-gray-100 text-sm';
    tr.innerHTML = `
      <td class="px-4 py-2 font-medium text-gray-800">${esc(row.nombre)}</td>
      <td class="px-4 py-2 text-gray-600">${esc(row.pais)}</td>
      <td class="px-4 py-2 text-gray-600">${esc(row.contacto)}</td>
      <td class="px-4 py-2 text-gray-600">${esc(row.producto_principal)}</td>
      <td class="px-4 py-2 text-gray-600">${esc(row.condiciones_pago)}</td>
      <td class="px-4 py-2 text-gray-600">${esc(row.contrato_tipo)}</td>`;
    tbody.appendChild(tr);
  });
}

// 14. Tabla de monitoreo sanitario (con alertas de caligus y oxígeno)
async function renderTablaMonitoreo() {
  let data;
  try {
    data = await api.monitoreo();
  } catch (error) {
    console.error('Error cargando monitoreo:', error);
    return;
  }

  const tbody = document.getElementById('tablaMonitoreoBody');
  tbody.innerHTML = '';
  data.forEach(row => {
    const caligus = Number(row.caligus_hembras_ovigeras_prom);
    const oxigeno = Number(row.oxigeno_mg_l);
    const caligusClass = caligus > 4 ? 'text-red-600 font-bold' : (caligus > 2 ? 'text-amber-600 font-bold' : 'text-gray-600');
    const oxigenoClass = oxigeno < 6 ? 'text-red-600 font-bold' : 'text-gray-600';
    const tr = document.createElement('tr');
    tr.className = 'border-b border-gray-100 text-sm';
    tr.innerHTML = `
      <td class="px-4 py-2 font-medium text-gray-800">${esc(row.lote_codigo)}</td>
      <td class="px-4 py-2 text-gray-600">${esc(row.mes)}</td>
      <td class="px-4 py-2 ${caligusClass}">${caligus.toFixed(2)}</td>
      <td class="px-4 py-2 text-gray-600">${Number(row.temperatura_c).toFixed(1)}</td>
      <td class="px-4 py-2 ${oxigenoClass}">${oxigeno.toFixed(1)}</td>
      <td class="px-4 py-2 text-gray-600">${Number(row.mortalidad_mes).toLocaleString('es-CL')}</td>`;
    tbody.appendChild(tr);
  });
}

// --- Navegación por pestañas ------------------------------------------------

// Renderiza cada sección solo la primera vez que se activa (los gráficos
// Chart.js necesitan un contenedor visible para calcular bien sus dimensiones).
const RENDER_POR_TAB = {
  resumen: [renderResumenKpis, renderVentasChart, renderRentabilidadChart, renderCalidadChart, renderMortalidadChart],
  produccion: [renderBiomasaChart, renderTablaLotes, renderTablaConcesiones],
  rrhh: [renderEmpleadosChart, renderTablaEmpleados],
  suministros: [renderInventarioChart, renderTablaStockBajo, renderComprasChart, renderTablaCompras],
  comercial: [renderExportacionesChart, renderTablaExportaciones, renderTablaClientes],
  seguridad: [renderIncidentesChart, renderTablaIncidentes, renderTablaMonitoreo],
};

const renderizados = new Set();

function mostrarTab(id) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === id);
  });
  document.querySelectorAll('.panel').forEach(panel => {
    panel.classList.toggle('hidden', panel.dataset.panel !== id);
  });
  if (!renderizados.has(id)) {
    renderizados.add(id);
    (RENDER_POR_TAB[id] || []).forEach(fn => fn());
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => mostrarTab(btn.dataset.tab));
  });
  mostrarTab('resumen');
});
