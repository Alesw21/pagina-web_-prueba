/* ============================================================================
 SysConex - CATÁLOGO DE SERVICIOS Y SUBSERVICIOS (VERSIÓN DOCUMENTADA)
 01. DEMO_SERVICES: cuatro tarjetas principales; conserva tus fotografías.
 02. DEMO_SUBSERVICES: opciones detalladas; agrega nuevas aquí en modo demo.
 03. fetchServices / fetchSubservices: lectura pública de Supabase.
 04. renderServices: tarjetas y búsqueda por nombres de subservicios.
 05. openDetail: abre panel al tocar foto, título o cualquier parte de tarjeta.
 06. selectedKeys: guarda selecciones en el navegador (localStorage).
 07. renderCart / sendQuote: resumen detallado para WhatsApp.
 ============================================================================ */
(() => {
  "use strict";
  const config = window.ALEX_CONFIG;
  const $ = (id) => document.getElementById(id);
  const grid = $("servicesGrid");
  const searchInput = $("searchInput");
  const status = $("catalogStatus");
  const filterContainer = $("categoryFilters");

  // 01. TARJETAS PRINCIPALES: cambia nombre, texto o ruta de imagen aquí.
  // Si conectas Supabase, las tarjetas se obtienen de public.servicios.
  const DEMO_SERVICES = [
    { id: 1, nombre: "SOPORTE TÉCNICO", categoria: "Soporte", descripcion: "Diagnóstico, mantenimiento y solución de incidencias en computadoras y laptops.", imagen_url: "assets/Soporte.jpg", destacado: true },
    { id: 2, nombre: "CIRCUITO CERRADO DE TELEVISIÓN (CCTV)", categoria: "Camaras", descripcion: "Instalación, mantenimiento y configuración de cámaras de seguridad.", imagen_url: "assets/Camaras.jpg", destacado: true },
    { id: 3, nombre: "PÁGINA WEB", categoria: "Web", descripcion: "Desarrollo, mantenimiento, dominios y hosting de sitios web.", imagen_url: "assets/Web.jpg", destacado: true },
    { id: 4, nombre: "CABLEADO ESTRUCTURADO", categoria: "Redes", descripcion: "Redes, racks, cableado, Wi-Fi, servidores y acceso remoto.", imagen_url: "assets/Redes.jpg", destacado: false },
  ];

  // 02. SUBSERVICIOS: el campo servicio_id indica a qué tarjeta pertenece.
  // Agrega o quita opciones aquí si todavía NO has conectado Supabase.
  const DEMO_SUBSERVICES = [
    ...[
      "Diagnóstico de computadoras y laptops", "Mantenimiento preventivo de equipos",
      "Mantenimiento correctivo de equipos", "Instalación de programas y software",
      "Instalación y configuración de Windows", "Formateo y optimización de equipos",
      "Configuración de impresoras y periféricos", "Respaldo y recuperación de archivos",
      "Soporte técnico remoto", "Actualización de componentes y equipos",
    ].map((nombre, i) => ({ id: 100 + i, servicio_id: 1, nombre })),
    ...[
      "Instalación de cámaras IP y analógicas", "Mantenimiento de cámaras CCTV",
      "Configuración de DVR", "Configuración de NVR",
      "Monitoreo remoto desde celular", "Auditoría técnica de CCTV",
      "Cotización de cámaras y equipos", "Ampliación y reubicación de cámaras",
      "Diagnóstico de fallas de grabación", "Configuración de almacenamiento y grabaciones",
    ].map((nombre, i) => ({ id: 200 + i, servicio_id: 2, nombre })),
    ...[
      "Creación de página web empresarial", "Mantenimiento de página web",
      "Registro y configuración de dominio", "Configuración de hosting",
      "Certificado SSL y HTTPS", "Rediseño de página web",
      "Creación de catálogo o tienda virtual", "Actualización de contenido web",
      "Configuración de correo corporativo", "Optimización de rendimiento web",
    ].map((nombre, i) => ({ id: 300 + i, servicio_id: 3, nombre })),
    ...[
      "Instalación de cableado estructurado", "Ordenamiento de cableado y racks",
      "Certificación y pruebas de puntos de red", "Configuración de switches y routers",
      "Configuración de red Wi-Fi", "Configuración de FortiClient VPN",
      "Instalación y configuración de servidores", "Configuración de firewall",
      "Diagnóstico de red y conectividad", "Instalación de patch panel y puntos de red",
    ].map((nombre, i) => ({ id: 400 + i, servicio_id: 4, nombre })),
  ];

  let services = [];
  let subservices = [];
  let activeCategory = "Todos";
  let activeService = null;
  let selectedKeys = new Set();
  // Texto libre para la opción «Otros», independiente por cada servicio.
  // Se conserva en este navegador aunque cierres y vuelvas a abrir la página.
  let customRequests = {};
  try {
    customRequests = JSON.parse(localStorage.getItem("alex_ti_otros") || "{}");
    if (!customRequests || typeof customRequests !== "object" || Array.isArray(customRequests)) customRequests = {};
  } catch (_) { customRequests = {}; }
  const customKey = (service) => String(service.id);
  const hasCustom = (service) => Boolean(customRequests[customKey(service)]?.enabled);
  const customText = (service) => String(customRequests[customKey(service)]?.text || "");
  function customCount() { return services.filter(hasCustom).length; }

  try {
    selectedKeys = new Set(JSON.parse(localStorage.getItem("alex_ti_subservicios") || "[]"));
  } catch (_) { /* El almacenamiento local es opcional. */ }

  // Escapar los textos recibidos de Supabase antes de insertarlos en HTML.
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[char]);
  }

  // Rutas locales o URL HTTPS. Si la imagen falla, se muestra la ilustración local.
  function safeImage(url) {
    const value = String(url || "").trim();
    if (value.startsWith("assets/") && !value.includes("..")) return value;
    try { const parsed = new URL(value); if (parsed.protocol === "https:") return parsed.href; }
    catch (_) { /* Imagen no válida. */ }
    return "assets/hero-ti.svg";
  }

  // Clave única compuesta: permite evitar colisiones entre servicios y opciones.
  const keyFor = (item) => `${item.servicio_id}:${item.id}`;
  const optionsFor = (service) => subservices.filter((item) => String(item.servicio_id) === String(service.id));

  function persist() {
    try { localStorage.setItem("alex_ti_subservicios", JSON.stringify([...selectedKeys])); }
    catch (_) { /* Opcional. */ }
    try { localStorage.setItem("alex_ti_otros", JSON.stringify(customRequests)); }
    catch (_) { /* Navegación privada o almacenamiento no disponible. */ }
    $("cartCount").textContent = selectedKeys.size + customCount();
  }

  // 03. CONSULTAS SUPABASE: la web solo lee servicios activos.
  // La tabla subservicios se crea con el SQL adicional incluido en el proyecto.
  async function fetchTable(table, fields) {
    const base = config.supabaseUrl.replace(/\/+$/, "");
    const endpoint = `${base}/rest/v1/${table}?select=${fields}&activo=eq.true&order=id.asc`;
    const response = await fetch(endpoint, {
      headers: { apikey: config.supabaseAnonKey, Authorization: `Bearer ${config.supabaseAnonKey}` },
    });
    if (!response.ok) throw new Error(`${table}: HTTP ${response.status}`);
    return response.json();
  }

  async function loadCatalog() {
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      status.textContent = "Conecta Supabase para administrar servicios y subservicios desde SQL Editor.";
      return [DEMO_SERVICES, DEMO_SUBSERVICES];
    }
    try {
      const [main, details] = await Promise.all([
        fetchTable(config.supabaseTable || "servicios", "id,nombre,categoria,descripcion,imagen_url,destacado"),
        fetchTable("subservicios", "id,servicio_id,nombre"),
      ]);
      status.textContent = "Servicios y subservicios actualizados desde Supabase.";
      return [main, details];
    } catch (error) {
      console.error("Error consultando Supabase:", error);
      status.textContent = config.useDemoOnError
        ? "Error de conexión: se muestran datos de demostración. Revisa la consola y la configuración."
        : "No fue posible cargar el catálogo. Revisa Supabase.";
      return config.useDemoOnError ? [DEMO_SERVICES, DEMO_SUBSERVICES] : [[], []];
    }
  }

  // 04. FILTROS Y BÚSQUEDA: busca también en todos los subservicios.
  // Ejemplo: escribir «programas» encuentra la tarjeta Soporte técnico.
  function renderFilters() {
    const categories = ["Todos", ...new Set(services.map((s) => s.categoria).filter(Boolean))];
    filterContainer.innerHTML = categories.map((category) => `
      <button type="button" class="filter-btn ${category === activeCategory ? "active" : ""}"
        data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>
    `).join("");
  }

  function renderServices() {
    const term = searchInput.value.trim().toLocaleLowerCase("es");
    const filtered = services.filter((service) => {
      const text = [service.nombre, service.descripcion, service.categoria,
        ...optionsFor(service).map((option) => option.nombre)].join(" ").toLocaleLowerCase("es");
      return (activeCategory === "Todos" || service.categoria === activeCategory) && text.includes(term);
    });
    grid.innerHTML = filtered.length ? filtered.map((service) => {
      const matching = term ? optionsFor(service).filter((option) =>
        option.nombre.toLocaleLowerCase("es").includes(term)) : [];
      return `
        <article class="service-card service-card-clickable" data-open-service="${escapeHtml(service.id)}"
          role="button" tabindex="0" aria-label="Ver subservicios de ${escapeHtml(service.nombre)}">
          <div class="service-image">
            <img src="${escapeHtml(safeImage(service.imagen_url))}" alt="${escapeHtml(service.nombre)}"
              loading="lazy" onerror="this.onerror=null;this.src='assets/hero-ti.svg'">
          </div>
          <div class="service-content">
            <span class="service-category">${escapeHtml(service.categoria)}</span>
            <h3>${escapeHtml(service.nombre)}</h3>
            <p>${escapeHtml(service.descripcion)}</p>
            ${matching.length ? `<p class="search-matches">Coincidencias: ${matching.map((m) => escapeHtml(m.nombre)).join(" · ")}</p>` : ""}
            <button type="button" class="select-btn" data-open-service="${escapeHtml(service.id)}">
              Ver opciones y solicitar cotización ↗
            </button>
          </div>
        </article>`;
    }).join("") : '<p class="empty-state">No encontramos servicios con esos filtros.</p>';
  }

  // 05. PANEL DE SUBSERVICIOS.
  // Primero aparecen los seleccionados; después, los pendientes.
  // El orden se recalcula al volver a abrir la categoría, sin perder la selección.
  function renderDetail() {
    if (!activeService) return;
    $("detailTitle").textContent = activeService.nombre;
    $("detailDescription").textContent = "Selecciona el servicio de tu interés";
    const items = [...optionsFor(activeService)].sort((a, b) =>
      Number(selectedKeys.has(keyFor(b))) - Number(selectedKeys.has(keyFor(a)))
    );
    const choices = items.map((item) => `
      <label class="detail-option">
        <input type="checkbox" data-option-key="${escapeHtml(keyFor(item))}"
          ${selectedKeys.has(keyFor(item)) ? "checked" : ""}>
        <span>${escapeHtml(item.nombre)}</span>
      </label>
    `).join("");

    // «Otros» es una opción adicional por categoría, no requiere cambios en SQL.
    const enabled = hasCustom(activeService);
    $("detailItems").innerHTML = `
      ${choices || '<p class="empty-state">No hay tareas predefinidas. Puedes usar «Otros».</p>'}
      <div class="custom-service">
        <label class="detail-option custom-option">
          <input id="customServiceToggle" type="checkbox" ${enabled ? "checked" : ""}>
          <span><strong>Otros</strong> — necesito un servicio diferente</span>
        </label>
        <div id="customServiceFields" ${enabled ? "" : "hidden"}>
          <label class="field-label" for="customServiceText">Describe el trabajo que necesitas</label>
          <textarea id="customServiceText" rows="4" maxlength="1200"
            placeholder="Ej.: instalar un software especializado, revisar un servidor...">${escapeHtml(customText(activeService))}</textarea>
          <small>Este detalle también se incluirá en tu solicitud por WhatsApp.</small>
        </div>
      </div>`;
  }

  function openDetail(id) {
    activeService = services.find((service) => String(service.id) === String(id));
    if (!activeService) return;
    renderDetail();
    $("detailOverlay").hidden = false;
    $("detailPanel").classList.add("open");
    $("detailPanel").setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    $("closeDetail").focus();
  }

  function closeDetail() {
    $("detailOverlay").hidden = true;
    $("detailPanel").classList.remove("open");
    $("detailPanel").setAttribute("aria-hidden", "true");
    if (!$("cartPanel").classList.contains("open")) document.body.classList.remove("no-scroll");
  }

  // 06. MI SOLICITUD: organiza las tareas seleccionadas por categoría.
  function selectedOptions() {
    return subservices.filter((item) => selectedKeys.has(keyFor(item)));
  }

  function renderCart() {
    const items = selectedOptions();
    const hasAnything = items.length > 0 || customCount() > 0;
    $("cartItems").innerHTML = hasAnything ? services.map((service) => {
      const related = items.filter((item) => String(item.servicio_id) === String(service.id));
      if (!related.length && !hasCustom(service)) return "";
      return `
        <div class="request-group">
          <h3>${escapeHtml(service.nombre)}</h3>
          ${related.map((item) => `
            <div class="cart-item">
              <div><strong>${escapeHtml(item.nombre)}</strong></div>
              <button type="button" class="remove-btn" data-remove-key="${escapeHtml(keyFor(item))}">Quitar</button>
            </div>
          `).join("")}
          ${hasCustom(service) ? `
            <div class="cart-item custom-cart-item">
              <div><strong>Otros</strong><p>${escapeHtml(customText(service) || "Sin descripción todavía")}</p></div>
              <button type="button" class="remove-btn" data-remove-custom="${escapeHtml(service.id)}">Quitar</button>
            </div>` : ""}
        </div>`;
    }).join("") : '<p class="empty-state">Selecciona los servicios que deseas cotizar.</p>';
    persist();
  }

  function openCart() {
    closeDetail();
    renderCart();
    $("overlay").hidden = false;
    $("cartPanel").classList.add("open");
    $("cartPanel").setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    $("closeCart").focus();
  }

  function closeCart() {
    $("overlay").hidden = true;
    $("cartPanel").classList.remove("open");
    $("cartPanel").setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
  }

  // 07. WHATSAPP: prepara el mensaje, pero el cliente confirma su envío.
  function whatsappUrl(message) {
    return `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(message)}`;
  }

  function sendQuote() {
    const chosen = selectedOptions();
    if (!chosen.length && !customCount()) {
      alert("Selecciona al menos un servicio");
      return;
    }
    const lines = ["Hola, deseo solicitar una cotización a SysConex.", "", "SERVICIOS REQUERIDOS:"];
    services.forEach((service) => {
      const tasks = chosen.filter((item) => String(item.servicio_id) === String(service.id));
      if (!tasks.length && !hasCustom(service)) return;
      lines.push("", service.nombre);
      tasks.forEach((task) => lines.push(`- ${task.nombre}`));
      if (hasCustom(service)) lines.push(`- Otros: ${customText(service).trim() || "Detalle por confirmar"}`);
    });
    lines.push("", "Quisiera conocer mayor información.");
    window.open(whatsappUrl(lines.join("\n")), "_blank", "noopener,noreferrer");
  }

  // EVENTOS DE NAVEGACIÓN, TECLADO Y SELECCIÓN.
  searchInput.addEventListener("input", renderServices);
  filterContainer.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    activeCategory = button.dataset.category;
    renderFilters();
    renderServices();
  });
  grid.addEventListener("click", (event) => {
    const card = event.target.closest("[data-open-service]");
    if (card) openDetail(card.dataset.openService);
  });
  grid.addEventListener("keydown", (event) => {
    if (event.target.matches("article[data-open-service]") && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      openDetail(event.target.dataset.openService);
    }
  });
  $("detailItems").addEventListener("change", (event) => {
    const checkbox = event.target.closest("[data-option-key]");
    if (!checkbox) return;
    checkbox.checked ? selectedKeys.add(checkbox.dataset.optionKey) : selectedKeys.delete(checkbox.dataset.optionKey);
    persist();
    // Se conserva la posición mientras marcas opciones para evitar saltos visuales.
    // Al reabrir el panel, las seleccionadas aparecerán al principio.
  });
  $("detailItems").addEventListener("change", (event) => {
    if (event.target.id !== "customServiceToggle" || !activeService) return;
    const id = customKey(activeService);
    customRequests[id] = { enabled: event.target.checked, text: customText(activeService) };
    $("customServiceFields").hidden = !event.target.checked;
    persist();
    if (event.target.checked) $("customServiceText").focus();
  });
  $("detailItems").addEventListener("input", (event) => {
    if (event.target.id !== "customServiceText" || !activeService) return;
    const id = customKey(activeService);
    customRequests[id] = { enabled: true, text: event.target.value };
    persist();
  });
  $("cartItems").addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-key], [data-remove-custom]");
    if (!button) return;
    // V6: distinguir la presencia del atributo del valor. Así «Otros»
    // se elimina incluso si el ID es 0 o el texto contiene caracteres especiales.
    if (button.hasAttribute("data-remove-key")) {
      selectedKeys.delete(button.getAttribute("data-remove-key"));
    }
    if (button.hasAttribute("data-remove-custom")) {
      const serviceId = button.getAttribute("data-remove-custom");
      delete customRequests[String(serviceId)];
    }
    renderCart(); // También actualiza el contador y localStorage.

  });
  $("closeDetail").addEventListener("click", closeDetail);
  $("detailOverlay").addEventListener("click", closeDetail);
  $("detailConfirm").addEventListener("click", openCart);
  $("openCart").addEventListener("click", openCart);
  // V7 — LIMPIAR TODO: elimina subservicios y solicitudes personalizadas.
  // Se sincroniza el almacenamiento local, el contador y el resumen.
  $("clearCart").addEventListener("click", () => {
    if (selectedKeys.size === 0 && customCount() === 0) return;
    if (!window.confirm("¿Eliminar todos los servicios de tu solicitud?")) return;
    selectedKeys.clear();
    customRequests = {};
    renderCart();
  });
  $("closeCart").addEventListener("click", closeCart);
  $("overlay").addEventListener("click", closeCart);
  $("sendQuote").addEventListener("click", sendQuote);
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if ($("detailPanel").classList.contains("open")) closeDetail();
    else if ($("cartPanel").classList.contains("open")) closeCart();
  });

  $("year").textContent = new Date().getFullYear();
  const generalUrl = whatsappUrl("Hola, deseo información sobre los servicios de SysConex. ¿Podrían orientarme?");
  $("generalWhatsapp").href = generalUrl;
  $("footerWhatsapp").href = generalUrl;

  (async () => {
    [services, subservices] = await loadCatalog();
    const valid = new Set(subservices.map(keyFor));
    selectedKeys = new Set([...selectedKeys].filter((key) => valid.has(key)));
    persist();
    renderFilters();
    renderServices();
  })();
})();
