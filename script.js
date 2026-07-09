// ---------- Webhook de Discord ----------
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1524645215984550033/jwwThAIic8JD5Ux3xeuquL2Kryd5u6Gh8iVuaecc2Qsgms4qOAauz6Lf6j73UxDA5X2v";

async function enviarADiscord(texto, filesInputId, statusId, btn) {
  const statusEl = document.getElementById(statusId);
  const filesInput = document.getElementById(filesInputId);
  const files = filesInput && filesInput.files ? Array.from(filesInput.files) : [];

  if (!texto || !texto.trim()) {
    statusEl.textContent = "Genera el documento antes de enviarlo.";
    statusEl.className = "send-status error show";
    return;
  }

  // Discord permite max 8MB por archivo en servidores sin boost
  const demasiadoGrande = files.find(f => f.size > 8 * 1024 * 1024);
  if (demasiadoGrande) {
    statusEl.textContent = `"${demasiadoGrande.name}" pesa demasiado (máx. 8MB).`;
    statusEl.className = "send-status error show";
    return;
  }

  const formData = new FormData();
  const contenido = texto.length > 1900 ? texto.slice(0, 1900) + "\n... (recortado)" : texto;
  formData.append("payload_json", JSON.stringify({ content: contenido }));
  files.forEach((file, i) => formData.append(`files[${i}]`, file, file.name));

  statusEl.textContent = "Enviando...";
  statusEl.className = "send-status show";
  btn.disabled = true;

  try {
    const res = await fetch(DISCORD_WEBHOOK_URL, { method: "POST", body: formData });
    if (res.ok || res.status === 204) {
      statusEl.textContent = "Enviado a Discord ✓";
      statusEl.className = "send-status success show";
      if (filesInput) filesInput.value = "";
    } else {
      statusEl.textContent = `Error al enviar (código ${res.status}).`;
      statusEl.className = "send-status error show";
    }
  } catch (err) {
    statusEl.textContent = "No se pudo conectar con Discord.";
    statusEl.className = "send-status error show";
  } finally {
    btn.disabled = false;
  }
}

function enviarOrgADiscord(btn) {
  generarOrg();
  const texto = document.getElementById("org-preview").textContent;
  enviarADiscord(texto, "org-files", "org-status", btn);
}

function enviarAtestadoADiscord(btn) {
  generarAtestado();
  const texto = document.getElementById("at-preview").textContent;
  enviarADiscord(texto, "at-files", "at-status", btn);
}

// ---------- Formularios simples (solicitud de ingreso / propuestas) ----------
async function enviarFormularioSimple(event, formId, statusId, formatearFn) {
  event.preventDefault();
  const form = document.getElementById(formId);
  const statusEl = document.getElementById(statusId);
  const btn = form.querySelector("button[type='submit']");

  const datos = {};
  Array.from(form.elements).forEach(el => {
    if (el.name) datos[el.name] = el.value.trim();
  });

  const contenido = formatearFn(datos);

  statusEl.textContent = "Enviando...";
  statusEl.className = "send-status show";
  btn.disabled = true;

  try {
    const res = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: contenido })
    });
    if (res.ok || res.status === 204) {
      statusEl.textContent = "Solicitud enviada ✓";
      statusEl.className = "send-status success show";
      form.reset();
    } else {
      statusEl.textContent = `Error al enviar (código ${res.status}).`;
      statusEl.className = "send-status error show";
    }
  } catch (err) {
    statusEl.textContent = "No se pudo conectar con Discord.";
    statusEl.className = "send-status error show";
  } finally {
    btn.disabled = false;
  }
}

function enviarSolicitudIngreso(event) {
  enviarFormularioSimple(event, "form-ingreso", "ingreso-status", (d) => (
`NUEVA SOLICITUD DE INGRESO — FBI
――――――――――――――――――――――――――
Nombre de personaje: ${d.nombre || "—"}
Discord: ${d.discord || "—"}
Edad IC: ${d.edad_ic || "—"}

Motivación:
${d.motivacion || "—"}`
  ));
}

function enviarPropuesta(event) {
  enviarFormularioSimple(event, "form-propuesta", "propuesta-status", (d) => (
`PROPUESTA INTERNA — ESCALA CENTRAL
――――――――――――――――――――――――――
Agente: ${d.agente || "—"}
Tipo: ${d.tipo || "—"}

Motivo:
${d.motivo || "—"}`
  ));
}

// ---------- Utilidades ----------
function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function mostrarPreview(id, texto) {
  const box = document.getElementById(id);
  box.textContent = texto;
  box.classList.add("show");
}

function copiarTexto(previewId) {
  const box = document.getElementById(previewId);
  if (!box || !box.textContent.trim()) return;
  navigator.clipboard.writeText(box.textContent).then(() => {
    const msgId = previewId === "org-preview" ? "org-copied" : "at-copied";
    const msg = document.getElementById(msgId);
    msg.classList.add("show");
    setTimeout(() => msg.classList.remove("show"), 1600);
  });
}

// ---------- Expediente de organización ----------
function generarOrg() {
  const texto =
`EXPEDIENTE DE ORGANIZACIÓN
FBI · Gobierno de HispanLife
――――――――――――――――――――――――――

Nombre organización: ${val("org-nombre") || "—"}
Tipo de organización: ${val("org-tipo") || "—"}
Vestimenta: ${val("org-vestimenta") || "—"}
Vehículos: ${val("org-vehiculos") || "—"}
Armamento: ${val("org-armamento") || "—"}
Sede / Barrio: ${val("org-sede") || "—"}
Actividad: ${val("org-actividad") || "—"}
Pruebas pertinentes: ${val("org-pruebas") || "—"}`;
  mostrarPreview("org-preview", texto);
}

// ---------- Atestado ----------
function autoFecha() {
  const ahora = new Date();
  const dd = String(ahora.getDate()).padStart(2, "0");
  const mm = String(ahora.getMonth() + 1).padStart(2, "0");
  const yyyy = ahora.getFullYear();
  const hh = String(ahora.getHours()).padStart(2, "0");
  const min = String(ahora.getMinutes()).padStart(2, "0");
  document.getElementById("at-fecha").value = `${dd}/${mm}/${yyyy} — ${hh}:${min}`;
}

function agregarAgente() {
  const list = document.getElementById("agentes-list");
  const input = document.createElement("input");
  input.placeholder = "Nombre del agente";
  list.appendChild(input);
}

function generarAtestado() {
  const agentes = Array.from(document.querySelectorAll("#agentes-list input"))
    .map(i => i.value.trim())
    .filter(Boolean);
  const listaAgentes = agentes.length
    ? agentes.map(a => `* ${a}`).join("\n")
    : "* ";

  const texto =
`ATESTADO DE INFORMACIÓN Y DETENCIÓN

Agente responsable: ${val("at-agente")}
Nº de Placa: ${val("at-placa")}
Fecha y Hora: ${val("at-fecha")}


RELATO DE LOS HECHOS
${val("at-relato")}


INFORMACIÓN Y DATOS DEL SOSPECHOSO
${val("at-sospechoso")}


CONCLUSIONES GENERALES
${val("at-conclusiones")}


AGENTES INVOLUCRADOS EN LA INVESTIGACIÓN

${listaAgentes}


Fdo: ${val("at-fdo")}
Departamento: FBI
Gobierno de HispanLife`;
  mostrarPreview("at-preview", texto);
}
