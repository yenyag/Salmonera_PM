import { api } from './api.js';

// Utilidades del chat
const chatBody = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');

const sujerencias = [
  '¿Qué lote tiene mayor mortalidad?',
  '¿Cómo van las ventas este semestre?',
  '¿Qué centro es más rentable?',
  '¿Qué requisitos debe cumplir el salmón para exportarse?',
];

function formatearRespuesta(texto) {
  // Convierte **negrita** y saltos de línea simples en HTML básico
  return texto
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/  \n/g, '<br>')
    .replace(/\n/g, '<br>');
}

function agregarMensaje(contenido, autor, fuentes = []) {
  const esUsuario = autor === 'usuario';

  const wrap = document.createElement('div');
  wrap.className = 'flex items-start gap-3 mb-4 ' +
    (esUsuario ? 'justify-end' : 'justify-start');

  const burbuja = document.createElement('div');
  burbuja.className = 'max-w-[85%] px-4 py-3 rounded-2xl ' +
    (esUsuario
      ? 'bg-blue-600 text-white rounded-br-md'
      : 'bg-gray-100 text-gray-800 border border-gray-200 rounded-bl-md');

  if (esUsuario) {
    burbuja.textContent = contenido;
  } else {
    burbuja.innerHTML = formatearRespuesta(contenido);
    if (fuentes.length > 0) {
      const pie = document.createElement('div');
      pie.className = 'mt-3 pt-2 border-t border-gray-200 text-xs text-gray-500';
      pie.innerHTML = '<span class="font-semibold">📌 Fuentes:</span> ' +
        fuentes.map((f) => {
          const icono = f.tipo === 'interna' ? '🏢' : '📄';
          return `<span class="inline-flex items-center gap-1 mr-2 px-2 py-0.5 bg-white rounded-md border border-gray-200">${icono} ${f.fuente}</span>`;
        }).join('');
      burbuja.appendChild(pie);
    }
  }

  wrap.appendChild(burbuja);
  chatBody.appendChild(wrap);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function mostrarPensando() {
  const wrap = document.createElement('div');
  wrap.className = 'flex items-start gap-3 mb-4';
  wrap.id = 'pensando';
  const burbuja = document.createElement('div');
  burbuja.className = 'px-4 py-3 rounded-2xl bg-gray-100 text-gray-400 border border-gray-200';
  burbuja.innerHTML = '<i class="fas fa-robot mr-2"></i> Analizando datos...';
  wrap.appendChild(burbuja);
  chatBody.appendChild(wrap);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function quitarPensando() {
  const el = document.getElementById('pensando');
  if (el) el.remove();
}

async function enviarPregunta(textoPregunta) {
  if (!textoPregunta.trim()) return;

  agregarMensaje(textoPregunta, 'usuario');
  chatInput.value = '';
  sendBtn.disabled = true;
  mostrarPensando();

  try {
    const resultado = await api.consultar(textoPregunta.trim());
    quitarPensando();
    agregarMensaje(resultado.respuesta, 'asistente', resultado.fuentes);
  } catch (error) {
    quitarPensando();
    agregarMensaje('⚠️ Ocurrió un error al consultar el asistente. Intenta nuevamente.', 'asistente');
    console.error('Error consultando asistente:', error);
  } finally {
    sendBtn.disabled = false;
    chatInput.focus();
  }
}

// Sugerencias rápidas
function renderSugerencias() {
  const contenedor = document.getElementById('chat-sugerencias');
  if (!contenedor) return;
  contenedor.innerHTML = '';
  sujerencias.forEach((s) => {
    const chip = document.createElement('button');
    chip.className = 'text-xs px-3 py-1.5 mr-2 mb-2 rounded-full bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition';
    chip.textContent = s;
    chip.addEventListener('click', () => enviarPregunta(s));
    contenedor.appendChild(chip);
  });
}

sendBtn.addEventListener('click', () => enviarPregunta(chatInput.value));
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') enviarPregunta(chatInput.value);
});

renderSugerencias();
agregarMensaje(
  'Hola, soy el asistente de SalmoSUR S.A. Puedo responder preguntas sobre ' +
  'ventas, mortalidad, calidad, rentabilidad y normativa del sector. ¿Qué deseas saber?',
  'asistente'
);