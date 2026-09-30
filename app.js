const API_URL = "https://script.google.com/macros/s/AKfycbwVgqv7Ob9YQcSun5o_8Dpx8sK34BRAzNYv3U0bDGWv_UiHy6oIJwfvavIK3RCjcPle/exec";

// URL por defecto definida aquí
let urlFormularioActual = "https://carsanab.github.io/Formulario-Torneos/";
let gimnastasData = [];
let datosTorneoData = {};

window.onload = function() {
  // Asignar URL por defecto al cargar
  const btnForm = document.getElementById('btnFormulario');
  if(btnForm) btnForm.href = urlFormularioActual;

  cargarDatosTorneo();
  cargarGimnastas();
};

function cambiarVista(vista) {
  document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.sidebar-menu li').forEach(el => el.classList.remove('active'));

  document.getElementById('view-' + vista).classList.add('active');
  document.getElementById('menu-' + vista).classList.add('active');
}

function cargarDatosTorneo() {
  fetch(`${API_URL}?action=getDatos`)
    .then(res => res.json())
    .then(datos => {
      datosTorneoData = datos;
      document.getElementById('lbl-torneo').innerText = datos.titulo_torneo || 'Torneo Sin Título';
      document.getElementById('lbl-club').innerText = datos.club ? 'Club: ' + datos.club : '';

      let badgesHtml = '';
      if(datos.fecha_evento) badgesHtml += `<span class="torneo-badge">Fecha: ${datos.fecha_evento}</span>`;
      if(datos.Monto) badgesHtml += `<span class="torneo-badge">Monto: $${datos.Monto}</span>`;
      document.getElementById('header-badges').innerHTML = badgesHtml;

      // Si viene una URL desde Google Sheets, la actualiza; de lo contrario usa la asignada por defecto
      if (datos.url_formulario && datos.url_formulario.trim() !== "") {
        urlFormularioActual = datos.url_formulario;
      }
      
      const btnForm = document.getElementById('btnFormulario');
      btnForm.href = urlFormularioActual;

      document.getElementById('edit_titulo_torneo').value = datos.titulo_torneo || '';
      document.getElementById('edit_club').value = datos.club || '';
      document.getElementById('edit_fecha_evento').value = datos.fecha_evento || '';
      document.getElementById('edit_fechalimite').value = datos.fechalimite || '';
      document.getElementById('edit_Monto').value = datos.Monto || '';
      document.getElementById('edit_url_formulario').value = urlFormularioActual;
    })
    .catch(err => console.error("Error al cargar datos:", err));
}

function copiarUrlFormulario() {
  if (!urlFormularioActual || urlFormularioActual === "#") {
    alert("No hay una URL configurada aún.");
    return;
  }
  navigator.clipboard.writeText(urlFormularioActual).then(() => {
    alert("¡URL copiada al portapapeles!");
  }).catch(err => {
    alert("Error al copiar URL");
  });
}

function cargarGimnastas() {
  fetch(`${API_URL}?action=getGimnastas`)
    .then(res => res.json())
    .then(data => {
      gimnastasData = data;
      poblarFiltros();
      renderTabla(gimnastasData);
    })
    .catch(err => console.error("Error al cargar gimnastas:", err));
}

function renderTabla(lista) {
  const tbody = document.getElementById('tabla-gimnastas');
  tbody.innerHTML = '';

  if (lista.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--texto-secundario);">No se encontraron registros.</td></tr>';
    return;
  }

  lista.forEach(g => {
    const docVal = g.Documento || 'S/D';
    const estadoPago = (g.EstadoPago || '').toString().trim();
    const esPagado = estadoPago.toLowerCase() === 'pagado';
    const pagoBadgeClass = esPagado ? 'status-pagado' : 'status-pendiente';

    tbody.innerHTML += `
      <tr>
        <td><strong>${docVal}</strong></td>
        <td>${g.Nombre || ''} ${g.Apellido || ''}</td>
        <td>${g.Categoria || ''}</td>
        <td>${g.PuedeAsistir || ''}</td>
        <td>${g.Consentimiento || ''}</td>
        <td><span class="status-badge ${pagoBadgeClass}">${estadoPago || 'Pendiente'}</span></td>
        <td>
          <div class="acciones-cell">
            <button class="btn btn-gold" style="padding: 6px 10px; font-size: 0.8rem;" onclick='abrirModalEditar(${JSON.stringify(g)})'>Editar</button>
            <button class="btn btn-danger" style="padding: 6px 10px; font-size: 0.8rem;" onclick="eliminarGimnasta(${g.rowIndex})">Borrar</button>
          </div>
        </td>
      </tr>
    `;
  });
}

function poblarFiltros() {
  const categorias = [...new Set(gimnastasData.map(g => g.Categoria).filter(Boolean))];
  const pagos = [...new Set(gimnastasData.map(g => g.EstadoPago).filter(Boolean))];

  const catSelect = document.getElementById('filterCategoria');
  catSelect.innerHTML = '<option value="">Todas las Categorías</option>';
  categorias.forEach(c => catSelect.innerHTML += `<option value="${c}">${c}</option>`);

  const pagoSelect = document.getElementById('filterPago');
  pagoSelect.innerHTML = '<option value="">Todos los Estados de Pago</option>';
  pagos.forEach(p => pagoSelect.innerHTML += `<option value="${p}">${p}</option>`);
}

function filtrarTabla() {
  const texto = document.getElementById('searchInput').value.toLowerCase();
  const cat = document.getElementById('filterCategoria').value;
  const pago = document.getElementById('filterPago').value;

  const filtrados = gimnastasData.filter(g => {
    const docVal = (g.Documento || '').toString().toLowerCase();
    const coincideTexto = (g.Nombre && g.Nombre.toLowerCase().includes(texto)) ||
                          (g.Apellido && g.Apellido.toLowerCase().includes(texto)) ||
                          docVal.includes(texto);
    const coincideCat = cat === "" || g.Categoria === cat;
    const coincidePago = pago === "" || g.EstadoPago === pago;

    return coincideTexto && coincideCat && coincidePago;
  });

  renderTabla(filtrados);
}

function abrirModalEditar(g) {
  document.getElementById('rowIndex').value = g.rowIndex;
  document.getElementById('Documento').value = g.Documento || '';
  document.getElementById('EstadoPago').value = g.EstadoPago || '';
  document.getElementById('PagoID').value = g.PagoID || '';
  document.getElementById('FechaRegistro').value = g.FechaRegistro || '';
  document.getElementById('FechaActualizacion').value = g.FechaActualizacion || '';

  document.getElementById('Nombre').value = g.Nombre || '';
  document.getElementById('Apellido').value = g.Apellido || '';
  document.getElementById('FechaNacimiento').value = g.FechaNacimiento || '';
  document.getElementById('Categoria').value = g.Categoria || '';
  document.getElementById('PuedeAsistir').value = g.PuedeAsistir || 'Sí';
  document.getElementById('Consentimiento').value = g.Consentimiento || 'Sí';

  document.getElementById('gimnastaModal').style.display = 'flex';
}

function cerrarModal() {
  document.getElementById('gimnastaModal').style.display = 'none';
}

function guardarEdicionGimnasta(e) {
  e.preventDefault();
  const payload = {
    action: "editarGimnasta",
    data: {
      rowIndex: document.getElementById('rowIndex').value,
      Nombre: document.getElementById('Nombre').value,
      Apellido: document.getElementById('Apellido').value,
      FechaNacimiento: document.getElementById('FechaNacimiento').value,
      Categoria: document.getElementById('Categoria').value,
      PuedeAsistir: document.getElementById('PuedeAsistir').value,
      Consentimiento: document.getElementById('Consentimiento').value
    }
  };

  fetch(API_URL, { method: "POST", body: JSON.stringify(payload) })
    .then(res => res.json())
    .then(() => {
      cerrarModal();
      cargarGimnastas();
    });
}

function guardarDatosTorneo(e) {
  e.preventDefault();
  const payload = {
    action: "actualizarDatosTorneo",
    data: {
      titulo_torneo: document.getElementById('edit_titulo_torneo').value,
      club: document.getElementById('edit_club').value,
      fecha_evento: document.getElementById('edit_fecha_evento').value,
      fechalimite: document.getElementById('edit_fechalimite').value,
      Monto: document.getElementById('edit_Monto').value,
      url_formulario: document.getElementById('edit_url_formulario').value
    }
  };

  fetch(API_URL, { method: "POST", body: JSON.stringify(payload) })
    .then(res => res.json())
    .then(() => {
      alert("Información actualizada correctamente.");
      cargarDatosTorneo();
    });
}

function eliminarGimnasta(rowIndex) {
  if(confirm('¿Confirmas que deseas borrar este registro?')) {
    const payload = { action: "eliminarGimnasta", rowIndex: rowIndex };
    fetch(API_URL, { method: "POST", body: JSON.stringify(payload) })
      .then(res => res.json())
      .then(() => {
        cargarGimnastas();
      });
  }
}