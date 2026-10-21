const API_URL = "https://script.google.com/macros/s/AKfycbwVgqv7Ob9YQcSun5o_8Dpx8sK34BRAzNYv3U0bDGWv_UiHy6oIJwfvavIK3RCjcPle/exec";
let urlFormularioActual = "https://carsanab.github.io/Formulario-Torneos/";

let db = {
  Gimnastas: [],
  BaseGimnastas: [],
  Categorias: [],
  MontosPorNivel: [],
  Datos: {}
};

window.onload = function() {
  document.querySelectorAll('.sidebar-menu li').forEach(li => {
    li.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        document.querySelector('.sidebar').classList.remove('open');
      }
    });
  });

  const cachedDb = localStorage.getItem('cache_db');
  if (cachedDb) {
    db = JSON.parse(cachedDb);
    renderAllViews();
  }
  cargarTodoServidor();
};

function formatearFechaDDMMYYYY(fechaStr) {
  if (!fechaStr) return '';
  const limpia = fechaStr.split('T')[0];
  const partes = limpia.split('-');
  if (partes.length === 3) {
    return `${partes[2].padStart(2, '0')}/${partes[1].padStart(2, '0')}/${partes[0]}`;
  }
  return fechaStr;
}

function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('open');
}

function cargarTodoServidor() {
  fetch(`${API_URL}?action=getTodo`)
    .then(res => res.json())
    .then(data => {
      db.Gimnastas = data.gimnastas || [];
      db.Categorias = data.categorias || [];
      db.Datos = data.datos || {};
      db.BaseGimnastas = data.baseGimnastas || [];
      db.MontosPorNivel = data.montosPorNivel || [];

      localStorage.setItem('cache_db', JSON.stringify(db));
      renderAllViews();
    })
    .catch(err => console.error("Error al cargar datos:", err));
}

function renderAllViews() {
  document.getElementById('lbl-torneo').innerText = db.Datos.titulo_torneo || 'Torneo Sin Título';
  document.getElementById('lbl-club').innerText = db.Datos.club ? 'Club: ' + db.Datos.club : '';

  let badgesHtml = '';
  if (db.Datos.fecha_evento) {
    badgesHtml += `<span class="torneo-badge">Fecha: ${formatearFechaDDMMYYYY(db.Datos.fecha_evento)}</span>`;
  }
  document.getElementById('header-badges').innerHTML = badgesHtml;

  if (db.Datos.url_formulario && db.Datos.url_formulario.trim() !== "") {
    urlFormularioActual = db.Datos.url_formulario;
  }
  document.getElementById('btnFormulario').href = urlFormularioActual;

  if (document.getElementById('edit_titulo_torneo')) {
    document.getElementById('edit_titulo_torneo').value = db.Datos.titulo_torneo || '';
    document.getElementById('edit_club').value = db.Datos.club || '';
    document.getElementById('edit_titulo3').value = db.Datos.titulo3 || '';
    document.getElementById('edit_titulo4').value = db.Datos.titulo4 || '';
    document.getElementById('edit_fecha_evento').value = db.Datos.fecha_evento || '';
    document.getElementById('edit_fechalimite').value = db.Datos.fechalimite || '';
    document.getElementById('edit_url_formulario').value = urlFormularioActual;
  }

  renderTablaGimnastas(db.Gimnastas);
  renderTablaBaseGimnastas(db.BaseGimnastas);
  renderTablaCategorias(db.Categorias);
  renderTablaMontos(db.MontosPorNivel);
}

function cambiarVista(vista) {
  document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.sidebar-menu li').forEach(el => el.classList.remove('active'));

  document.getElementById('view-' + vista).classList.add('active');
  document.getElementById('menu-' + vista).classList.add('active');
}

/* RENDERIZADO DE TABLA GIMNASTAS (Muestra Importe y PagoID) */
function renderTablaGimnastas(lista) {
  const tbody = document.getElementById('tbody-Gimnastas');
  tbody.innerHTML = lista.map(g => {
    const estado = (g.EstadoPago || 'PENDIENTE').toUpperCase();
    const badgeClass = estado === 'PAGADO' ? 'status-pagado' : 'status-pendiente';
    const fechaFormateada = formatearFechaDDMMYYYY(g.FechaNacimiento);
    
    // Obtener importe guardado o buscarlo automáticamente
    let montoVal = g.Monto;
    if (!montoVal || montoVal.toString().trim() === '') {
      montoVal = buscarMontoEnBase(g.Nivel, g.Categoria);
    }
    const montoDisplay = montoVal ? `$${montoVal}` : '-';

    return `<tr>
      <td style="text-align: center;">
        <input type="checkbox" class="select-checkbox row-select-gimnasta" data-row="${g.rowIndex}">
      </td>
      <td><strong>${g.IDDocumento || g.Documento || ''}</strong></td>
      <td>${g.Nombres || ''}</td>
      <td>${fechaFormateada}</td>
      <td>${g.Categoria || ''}</td>
      <td>${g.Nivel || ''}</td>
      <td>${g.PuedeAsistir || ''}</td>
      <td><strong>${montoDisplay}</strong></td>
      <td><span class="status-badge ${badgeClass}">${estado}</span></td>
      <td><small style="color:var(--texto-secundario);">${g.PagoID || '-'}</small></td>
      <td><div class="acciones-cell">
        <button class="btn btn-gold" style="padding:4px 8px;font-size:0.8rem;" onclick='abrirModalEditar("Gimnastas", ${JSON.stringify(g)})'>Editar</button>
        <button class="btn btn-danger" style="padding:4px 8px;font-size:0.8rem;" onclick='eliminarRegistro("Gimnastas", ${g.rowIndex})'>Borrar</button>
      </div></td>
    </tr>`;
  }).join('') || '<tr><td colspan="11" style="text-align:center;">Sin registros.</td></tr>';
}

function buscarMontoEnBase(nivel, categoria) {
  if (!nivel || !categoria) return "";
  const nVal = nivel.toString().trim().toLowerCase();
  const cVal = categoria.toString().trim().toLowerCase();
  const reg = db.MontosPorNivel.find(m => 
    (m.nivel || '').toString().trim().toLowerCase() === nVal && 
    (m.categoria || '').toString().trim().toLowerCase() === cVal
  );
  return reg ? reg.monto : "";
}

function renderTablaBaseGimnastas(lista) {
  const tbody = document.getElementById('tbody-BaseGimnastas');
  tbody.innerHTML = lista.map(b => {
    const fechaFormateada = formatearFechaDDMMYYYY(b.fecha_de_nacimiento);
    return `<tr>
      <td><strong>${b.documento || ''}</strong></td>
      <td>${b.nombres || ''}</td>
      <td>${fechaFormateada}</td>
      <td>${b.categoria || ''}</td>
      <td>${b.nivel || ''}</td>
      <td><div class="acciones-cell">
        <button class="btn btn-gold" style="padding:4px 8px;font-size:0.8rem;" onclick='abrirModalEditar("BaseGimnastas", ${JSON.stringify(b)})'>Editar</button>
        <button class="btn btn-danger" style="padding:4px 8px;font-size:0.8rem;" onclick='eliminarRegistro("Base de Gimnastas", ${b.rowIndex})'>Borrar</button>
      </div></td>
    </tr>`;
  }).join('') || '<tr><td colspan="6" style="text-align:center;">Sin registros.</td></tr>';
}

function renderTablaCategorias(lista) {
  const tbody = document.getElementById('tbody-Categorias');
  tbody.innerHTML = lista.map(c => `<tr>
    <td>${c.Edad || ''}</td>
    <td><strong>${c['Categoría'] || c.Categoria || ''}</strong></td>
    <td><div class="acciones-cell">
      <button class="btn btn-gold" style="padding:4px 8px;font-size:0.8rem;" onclick='abrirModalEditar("Categorias", ${JSON.stringify(c)})'>Editar</button>
      <button class="btn btn-danger" style="padding:4px 8px;font-size:0.8rem;" onclick='eliminarRegistro("Categorias", ${c.rowIndex})'>Borrar</button>
    </div></td>
  </tr>`).join('') || '<tr><td colspan="3" style="text-align:center;">Sin registros.</td></tr>';
}

function renderTablaMontos(lista) {
  const tbody = document.getElementById('tbody-MontosPorNivel');
  tbody.innerHTML = lista.map(m => `<tr>
    <td><strong>${m.nivel || ''}</strong></td>
    <td>${m.categoria || ''}</td>
    <td>$${m.monto || ''}</td>
    <td><div class="acciones-cell">
      <button class="btn btn-gold" style="padding:4px 8px;font-size:0.8rem;" onclick='abrirModalEditar("MontosPorNivel", ${JSON.stringify(m)})'>Editar</button>
      <button class="btn btn-danger" style="padding:4px 8px;font-size:0.8rem;" onclick='eliminarRegistro("Montos por nivel", ${m.rowIndex})'>Borrar</button>
    </div></td>
  </tr>`).join('') || '<tr><td colspan="4" style="text-align:center;">Sin registros.</td></tr>';
}

/* FUNCIONALIDAD EXPORTAR A EXCEL (CSV) */
function exportarGimnastasExcel() {
  if (db.Gimnastas.length === 0) {
    alert("No hay registros para exportar.");
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
  csvContent += "ID,Documento,Nombres,FechaNacimiento,Categoria,Nivel,PuedeAsistir,Consentimiento,EstadoPago,PagoID,Monto,FechaRegistro\n";

  db.Gimnastas.forEach(g => {
    let montoVal = g.Monto || buscarMontoEnBase(g.Nivel, g.Categoria);
    let row = [
      `"${g.ID || ''}"`,
      `"${g.IDDocumento || g.Documento || ''}"`,
      `"${g.Nombres || ''}"`,
      `"${formatearFechaDDMMYYYY(g.FechaNacimiento)}"`,
      `"${g.Categoria || ''}"`,
      `"${g.Nivel || ''}"`,
      `"${g.PuedeAsistir || ''}"`,
      `"${g.Consentimiento || ''}"`,
      `"${g.EstadoPago || 'PENDIENTE'}"`,
      `"${g.PagoID || ''}"`,
      `"${montoVal || ''}"`,
      `"${formatearFechaDDMMYYYY(g.FechaRegistro)}"`
    ];
    csvContent += row.join(",") + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Gimnastas_Torneo_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/* SELECCIÓN Y ELIMINACIÓN MASIVA */
function toggleSelectAll(source) {
  const checkboxes = document.querySelectorAll('.row-select-gimnasta');
  checkboxes.forEach(cb => cb.checked = source.checked);
}

function borrarGimnastasSeleccionados() {
  const seleccionados = Array.from(document.querySelectorAll('.row-select-gimnasta:checked'))
                            .map(cb => cb.getAttribute('data-row'));

  if (seleccionados.length === 0) {
    alert("Por favor, selecciona al menos un gimnasta.");
    return;
  }

  if (confirm(`¿Estás seguro de eliminar los ${seleccionados.length} registros seleccionados?`)) {
    fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "eliminarVariasFilas", sheetName: "Gimnastas", rowIndices: seleccionados })
    }).then(() => {
      document.getElementById('selectAllGimnastas').checked = false;
      cargarTodoServidor();
    });
  }
}

function borrarTodosGimnastas() {
  if (db.Gimnastas.length === 0) {
    alert("No hay registros para borrar.");
    return;
  }

  const confirmacion = prompt("⚠️ ¡ADVERTENCIA! Se borrarán TODOS los gimnastas.\nEscribe BARRER para confirmar:");
  
  if (confirmacion && confirmacion.trim().toUpperCase() === "BARRER") {
    const todosLosIndices = db.Gimnastas.map(g => g.rowIndex);
    fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "eliminarVariasFilas", sheetName: "Gimnastas", rowIndices: todosLosIndices })
    }).then(() => cargarTodoServidor());
  }
}

/* FILTRADO DINÁMICO */
function filtrarTabla(tipo) {
  if (tipo === 'Gimnastas') {
    const txt = document.getElementById('searchGimnastas').value.toLowerCase();
    const filtroPago = document.getElementById('filterPagoGimnastas').value.toUpperCase();

    const filtrados = db.Gimnastas.filter(g => {
      const coincideTexto = (g.Nombres && g.Nombres.toLowerCase().includes(txt)) || 
                            (g.IDDocumento && g.IDDocumento.toString().includes(txt)) ||
                            (g.Documento && g.Documento.toString().includes(txt));
      
      const estadoActual = (g.EstadoPago || 'PENDIENTE').toUpperCase();
      const coincidePago = filtroPago === "" || estadoActual === filtroPago;

      return coincideTexto && coincidePago;
    });

    renderTablaGimnastas(filtrados);
  } else if (tipo === 'BaseGimnastas') {
    const txt = document.getElementById('searchBaseGimnastas').value.toLowerCase();
    const filtrados = db.BaseGimnastas.filter(b => 
      (b.nombres && b.nombres.toLowerCase().includes(txt)) || 
      (b.documento && b.documento.toString().includes(txt))
    );
    renderTablaBaseGimnastas(filtrados);
  }
}

/* MODAL DINÁMICO */
function abrirModalNuevo(tipo) {
  document.getElementById('modalRowIndex').value = '';
  document.getElementById('modalSheetName').value = obtenerNombreHoja(tipo);
  document.getElementById('modalTitle').innerText = 'Nuevo Registro';
  generarCamposFormulario(tipo, {});
  document.getElementById('modalDinamico').style.display = 'flex';
}

function abrirModalEditar(tipo, item) {
  document.getElementById('modalRowIndex').value = item.rowIndex;
  document.getElementById('modalSheetName').value = obtenerNombreHoja(tipo);
  document.getElementById('modalTitle').innerText = 'Editar Registro';
  generarCamposFormulario(tipo, item);
  document.getElementById('modalDinamico').style.display = 'flex';
}

function obtenerNombreHoja(tipo) {
  const mapa = {
    'Gimnastas': 'Gimnastas',
    'BaseGimnastas': 'Base de Gimnastas',
    'Categorias': 'Categorias',
    'MontosPorNivel': 'Montos por nivel'
  };
  return mapa[tipo] || tipo;
}

function generarCamposFormulario(tipo, item) {
  const container = document.getElementById('modalFormFields');
  let fieldsHtml = '';

  if (tipo === 'Gimnastas') {
    let montoInicial = item.Monto || buscarMontoEnBase(item.Nivel, item.Categoria);
    fieldsHtml = `
      <div class="form-group"><label>ID Documento</label><input type="text" id="f_IDDocumento" value="${item.IDDocumento || item.Documento || ''}"></div>
      <div class="form-group"><label>Nombres</label><input type="text" id="f_Nombres" value="${item.Nombres || ''}"></div>
      <div class="form-group"><label>Fecha Nacimiento</label><input type="date" id="f_FechaNacimiento" value="${item.FechaNacimiento || ''}"></div>
      <div class="form-group"><label>Categoría</label><input type="text" id="f_Categoria" value="${item.Categoria || ''}" onchange="autocompletarMontoGimnasta()"></div>
      <div class="form-group"><label>Nivel</label><input type="text" id="f_Nivel" value="${item.Nivel || ''}" onchange="autocompletarMontoGimnasta()"></div>
      <div class="form-group"><label>Importe ($)</label><input type="text" id="f_Monto" value="${montoInicial}"></div>
      <div class="form-group"><label>PagoID</label><input type="text" id="f_PagoID" value="${item.PagoID || ''}"></div>
      <div class="form-group"><label>Puede Asistir</label><select id="f_PuedeAsistir"><option value="SI" ${item.PuedeAsistir==='SI'?'selected':''}>SI</option><option value="NO" ${item.PuedeAsistir==='NO'?'selected':''}>NO</option></select></div>
      <div class="form-group"><label>Consentimiento</label><select id="f_Consentimiento"><option value="SI" ${item.Consentimiento==='SI'?'selected':''}>SI</option><option value="NO" ${item.Consentimiento==='NO'?'selected':''}>NO</option></select></div>
      <div class="form-group"><label>Estado Pago</label><select id="f_EstadoPago"><option value="PENDIENTE" ${item.EstadoPago==='PENDIENTE'?'selected':''}>PENDIENTE</option><option value="PAGADO" ${item.EstadoPago==='PAGADO'?'selected':''}>PAGADO</option></select></div>
    `;
  } else if (tipo === 'BaseGimnastas') {
    fieldsHtml = `
      <div class="form-group"><label>Documento</label><input type="text" id="f_documento" value="${item.documento || ''}"></div>
      <div class="form-group"><label>Nombres</label><input type="text" id="f_nombres" value="${item.nombres || ''}"></div>
      <div class="form-group"><label>Fecha de Nacimiento</label><input type="date" id="f_fecha_de_nacimiento" value="${item.fecha_de_nacimiento || ''}"></div>
      <div class="form-group"><label>Categoría</label><input type="text" id="f_categoria" value="${item.categoria || ''}"></div>
      <div class="form-group"><label>Nivel</label><input type="text" id="f_nivel" value="${item.nivel || ''}"></div>
    `;
  } else if (tipo === 'Categorias') {
    fieldsHtml = `
      <div class="form-group"><label>Edad</label><input type="text" id="f_Edad" value="${item.Edad || ''}"></div>
      <div class="form-group"><label>Categoría</label><input type="text" id="f_Categoria" value="${item['Categoría'] || item.Categoria || ''}"></div>
    `;
  } else if (tipo === 'MontosPorNivel') {
    fieldsHtml = `
      <div class="form-group"><label>Nivel</label><input type="text" id="f_nivel" value="${item.nivel || ''}"></div>
      <div class="form-group"><label>Categoría</label><input type="text" id="f_categoria" value="${item.categoria || ''}"></div>
      <div class="form-group"><label>Monto</label><input type="text" id="f_monto" value="${item.monto || ''}"></div>
    `;
  }
  container.innerHTML = fieldsHtml;
}

function autocompletarMontoGimnasta() {
  const nivelInput = document.getElementById('f_Nivel');
  const catInput = document.getElementById('f_Categoria');
  const montoInput = document.getElementById('f_Monto');

  if (!nivelInput || !catInput || !montoInput) return;

  const monto = buscarMontoEnBase(nivelInput.value, catInput.value);
  if (monto) {
    montoInput.value = monto;
  }
}

function cerrarModal() {
  document.getElementById('modalDinamico').style.display = 'none';
}

function guardarModalDinamico(e) {
  e.preventDefault();
  const sheetName = document.getElementById('modalSheetName').value;
  const rowIndex = document.getElementById('modalRowIndex').value;
  let data = {};

  const inputs = document.querySelectorAll('#modalFormFields input, #modalFormFields select');
  inputs.forEach(inp => {
    const key = inp.id.replace('f_', '');
    data[key] = inp.value;
  });

  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ action: "guardarFila", sheetName: sheetName, rowIndex: rowIndex, data: data })
  }).then(() => {
    cerrarModal();
    cargarTodoServidor();
  });
}

function guardarDatosTorneo(e) {
  e.preventDefault();
  const payload = {
    action: "actualizarDatosTorneo",
    data: {
      titulo_torneo: document.getElementById('edit_titulo_torneo').value,
      club: document.getElementById('edit_club').value,
      titulo3: document.getElementById('edit_titulo3').value,
      titulo4: document.getElementById('edit_titulo4').value,
      fecha_evento: document.getElementById('edit_fecha_evento').value,
      fechalimite: document.getElementById('edit_fechalimite').value,
      url_formulario: document.getElementById('edit_url_formulario').value
    }
  };

  fetch(API_URL, { method: "POST", body: JSON.stringify(payload) })
    .then(() => {
      alert("Información actualizada.");
      cargarTodoServidor();
    });
}

function eliminarRegistro(sheetName, rowIndex) {
  if (confirm('¿Eliminar este registro?')) {
    fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "eliminarFila", sheetName: sheetName, rowIndex: rowIndex })
    }).then(() => cargarTodoServidor());
  }
}

function copiarUrlFormulario() {
  navigator.clipboard.writeText(urlFormularioActual).then(() => alert("¡URL copiada!"));
}

function actualizarAppManual() {
  localStorage.clear();
  window.location.reload(true);
}