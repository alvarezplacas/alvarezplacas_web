/**
 * API Endpoint: Vista Parcial de Buscador de Facturas
 * Retorna HTML puro para ser inyectado en el canvas central del Workspace SPA.
 * GET /api/vendedor/views/buscador
 * 
 * Mejoras v2:
 * - Click en toda la fila/card abre el PDF directamente
 * - Diseño responsive: cards en lugar de tabla con columnas fijas
 * - Botones de acción siempre visibles sin importar el monitor
 * - Búsqueda OCR full-text que encuentra cualquier producto en la factura
 */
import type { APIRoute } from 'astro';
import { query } from '../../../../../Backend/conexiones/lib/db.js';

export const GET: APIRoute = async () => {
    let recentDocs: any[] = [];
    let statsToday = { count: 0, total: 0, remitos: 0 };
    try {
        const dbResult = await query(`
            SELECT id, filename, doc_type, pos_number, doc_number, doc_date,
                   client_cta, client_name, client_cuit, total_amount, seller_code
            FROM documentos_facturacion
            ORDER BY created_at DESC, doc_date DESC
            LIMIT 15;
        `, []);
        recentDocs = dbResult.rows;

        const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
        const statsResult = await query(`
            WITH RankedDocs AS (
                SELECT 
                    *,
                    ROW_NUMBER() OVER(
                        PARTITION BY regexp_replace(doc_number, '_\\d+$', '') 
                        ORDER BY created_at DESC
                    ) as rn
                FROM documentos_facturacion
            )
            SELECT 
                SUM(CASE WHEN doc_type LIKE 'FA-%' THEN 1 ELSE 0 END) as fact_count,
                SUM(CASE WHEN doc_type = 'RE' THEN 1 ELSE 0 END) as rem_count,
                SUM(CASE WHEN doc_type LIKE 'FA-%' THEN total_amount ELSE 0 END) as fact_total
            FROM RankedDocs
            WHERE (doc_type LIKE 'FA-%' OR doc_type = 'RE') AND rn = 1
              AND DATE(doc_date) = $1
        `, [todayStr]);
        if (statsResult.rows.length > 0) {
            statsToday = {
                count: parseInt(statsResult.rows[0].fact_count) || 0,
                total: parseFloat(statsResult.rows[0].fact_total) || 0,
                remitos: parseInt(statsResult.rows[0].rem_count) || 0
            };
        }
    } catch (e: any) {
        console.error('Error fetching docs or stats:', e.message);
    }

    const renderDocCard = (doc: any, queryTerm = '') => {
        const isNC = (doc.doc_type || '').toUpperCase().startsWith('NC');
        const displayAmount = isNC ? -(doc.total_amount) : doc.total_amount;
        const formatTotal = doc.total_amount > 0
            ? `$${parseFloat(displayAmount as string).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : '—';
        const formatDate = doc.doc_date ? new Date(doc.doc_date).toLocaleDateString('es-AR', { timeZone: 'UTC' }) : '—';
        const docTypeClass = (doc.doc_type || 'X').toLowerCase().replace(/[^a-z0-9]/g, '-');
        
        const versionMatch = doc.filename ? doc.filename.match(/_(\d+)\.pdf$/i) : null;
        const versionBadge = versionMatch ? `<span style="color: #eab308; font-size: 0.8em; margin-left: 4px;" title="Versión Modificada">_v${versionMatch[1]}</span>` : '';

        return `
        <div class="doc-card" onclick="previewDoc(this.dataset.id, this.dataset.filename)" data-id="${doc.id}" data-filename="${(doc.filename || '').replace(/'/g, "\\'")}" title="Click para ver factura">
          <div class="doc-card-left">
            <span class="doc-badge badge-${docTypeClass}">${doc.doc_type || 'X'}</span>
          </div>
          <div class="doc-card-body">
            <div class="doc-card-top">
              <span class="doc-number">${doc.pos_number || '0000'}-${doc.doc_number || '00000000'}${versionBadge}</span>
              <span class="doc-date-tag"><i class="fas fa-calendar-alt"></i> ${formatDate}</span>
            </div>
            <div class="doc-card-client">
              <span class="client-name">${doc.client_name || 'Consumidor Final'}</span>
              <span class="client-meta">Cta #${doc.client_cta || '—'} &nbsp;|&nbsp; CUIT: ${doc.client_cuit || '—'}</span>
            </div>
            <div class="doc-card-footer">
              <span class="doc-total-tag" style="color: ${isNC ? '#ef4444' : '#10b981'};"><i class="fas fa-dollar-sign"></i> ${formatTotal}</span>
              ${doc.seller_code ? `<span class="doc-seller-tag"><i class="fas fa-user-tag"></i> Vend. ${doc.seller_code}</span>` : ''}
            </div>
          </div>
          <div class="doc-card-actions" onclick="event.stopPropagation()">
            <button class="act-btn act-preview" onclick="previewDoc(this.parentElement.parentElement.dataset.id, this.parentElement.parentElement.dataset.filename)" title="Ver PDF">
              <i class="fas fa-eye"></i>
              <span>Ver</span>
            </button>
            <a href="/api/documentos/download?id=${doc.id}" class="act-btn act-download" download="${doc.filename || 'factura.pdf'}" title="Descargar PDF">
              <i class="fas fa-download"></i>
              <span>PDF</span>
            </a>
          </div>
        </div>`;
    };

    const html = `
<div class="view-panel" id="view-buscador">
  <!-- HEADER -->
  <div class="buscador-header">
    <div class="buscador-title-block">
      <h2 class="view-title">Buscador Inteligente de <span class="text-accent-red">Facturas</span></h2>
      <p class="view-subtitle">OCR Full-Text — Buscá por cliente, CUIT, número, o cualquier <strong>producto</strong> o texto que aparezca en el PDF.</p>
    </div>
    <div class="buscador-stats-block">
      <div class="stat-pill stat-pill--neutral" id="docs-count-badge">
        <i class="fas fa-file-alt"></i> ${recentDocs.length} recientes
      </div>
      <div class="stat-pill stat-pill--green">
        <i class="fas fa-chart-line"></i>
        Hoy: <strong>${statsToday.count}</strong> fact. &nbsp; <strong>$${statsToday.total.toLocaleString('es-AR', {minimumFractionDigits:2, maximumFractionDigits:2})}</strong>
      </div>
      <div class="stat-pill stat-pill--blue">
        <i class="fas fa-truck"></i>
        Hoy: <strong>${statsToday.remitos}</strong> remitos
      </div>
    </div>
  </div>

  <!-- SEARCH BOX -->
  <div class="search-wrap">
    <div class="search-inner">
      <i class="fas fa-search search-ico"></i>
      <input type="text" id="doc-search-input" class="search-input"
             placeholder="Ej: Faplac Sahara, García, 27-38123456-9, 00010451..." autocomplete="off"/>
      <button id="doc-search-btn" class="search-fire-btn">
        <i class="fas fa-search"></i> Buscar
      </button>
    </div>
    <select id="doc-search-type-select" class="search-order-btn" style="appearance:none; padding-right:10px;">
      <option value="">Todos los Tipos</option>
      <option value="FA">Facturas (FA)</option>
      <option value="FC">Facturas (FC)</option>
      <option value="NC">Notas de Crédito (NC)</option>
      <option value="RE">Remitos (RE)</option>
    </select>
    <button id="doc-search-order-btn" class="search-order-btn">
      <i class="fas fa-sort-amount-down"></i> Más nuevos
    </button>
  </div>

  <!-- SEARCH HINT -->
  <div class="search-hint" id="search-hint">
    <i class="fas fa-lightbulb" style="color:#f59e0b;"></i>
    Tip: Podés buscar por <strong>nombre de producto</strong> (ej: "Faplac Sahara"), <strong>nombre de cliente</strong>, <strong>CUIT</strong>, <strong>número de factura</strong> o cualquier texto que aparezca en el PDF.
  </div>

  <!-- LOADER -->
  <div id="doc-search-loader" class="loader-container hidden">
    <div class="spinner"></div>
    <p>Buscando en todos los documentos...</p>
  </div>

  <!-- RESULTS CONTAINER - CARD LAYOUT -->
  <div id="search-results-wrap">
    ${recentDocs.length === 0
        ? `<div class="empty-state">
             <i class="fas fa-folder-open empty-icon"></i>
             <p>No hay documentos indexados en el sistema.</p>
             <span>Los PDFs se indexan automáticamente al ser cargados via OCR.</span>
           </div>`
        : recentDocs.map(doc => renderDocCard(doc)).join('')
    }
  </div>

  <!-- PAGINATION -->
  <div id="pagination-controls" class="pagination-bar hidden">
    <button id="page-prev-btn" class="page-btn"><i class="fas fa-chevron-left"></i> Anterior</button>
    <span id="page-info" class="page-info">Página 1</span>
    <button id="page-next-btn" class="page-btn">Siguiente <i class="fas fa-chevron-right"></i></button>
  </div>

  <!-- PDF PREVIEW MODAL -->
  <div id="pdf-preview-modal" class="pdf-modal-overlay">
    <div class="pdf-modal-window">
      <div class="pdf-modal-header">
        <div class="pdf-modal-title">
          <i class="fas fa-file-pdf pdf-header-icon"></i>
          <span id="pdf-modal-filename">Factura.pdf</span>
        </div>
        <div style="display:flex; gap:8px; align-items:center;">
          <a id="pdf-modal-download-btn" href="#" download class="pdf-action-btn">
            <i class="fas fa-download"></i> Descargar
          </a>
          <button id="pdf-modal-close-btn" class="pdf-modal-close">&times;</button>
        </div>
      </div>
      <div class="pdf-modal-body">
        <iframe id="pdf-iframe-loader" src="" class="pdf-iframe"></iframe>
      </div>
    </div>
  </div>

</div>

<style>
  /* === BASE === */
  .view-panel { animation: fadeIn .25s ease-out; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .text-accent-red { color: #ef4444; }

  /* === HEADER === */
  .buscador-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 16px;
  }
  .view-title { font-size: 20px; font-weight: 900; color: #fff; letter-spacing: -.5px; }
  .view-subtitle { font-size: 12px; color: #666; margin-top: 4px; line-height: 1.5; }
  .view-subtitle strong { color: #aaa; }
  .buscador-stats-block { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .stat-pill {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 11px; font-weight: 600;
    padding: 5px 12px; border-radius: 20px;
    border: 1px solid #333; background: #1a1a1a; color: #888;
    white-space: nowrap;
  }
  .stat-pill--green { background: rgba(16,185,129,.1); border-color: rgba(16,185,129,.3); color: #10b981; }
  .stat-pill--green strong { color: #34d399; }
  .stat-pill--blue { background: rgba(59,130,246,.1); border-color: rgba(59,130,246,.3); color: #3b82f6; }
  .stat-pill--blue strong { color: #60a5fa; }

  /* === SEARCH === */
  .search-wrap { display: flex; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
  .search-inner {
    flex: 1; min-width: 240px;
    display: flex; align-items: center;
    background: #111; border: 1px solid #2a2a2a; border-radius: 10px;
    padding: 2px 4px 2px 14px;
    box-shadow: inset 0 2px 4px rgba(0,0,0,.4);
    transition: border-color .2s;
  }
  .search-inner:focus-within { border-color: #ef4444; box-shadow: 0 0 0 2px rgba(239,68,68,.15), inset 0 2px 4px rgba(0,0,0,.4); }
  .search-ico { color: #444; font-size: 14px; margin-right: 10px; }
  .search-input {
    flex: 1; background: transparent; border: none; outline: none;
    color: #fff; font-size: 13px; padding: 11px 0; min-width: 0;
  }
  .search-input::placeholder { color: #444; }
  .search-fire-btn {
    background: #ef4444; border: none; color: #fff;
    padding: 8px 16px; border-radius: 7px;
    cursor: pointer; font-size: 12px; font-weight: 700;
    display: flex; align-items: center; gap: 6px;
    transition: all .2s; white-space: nowrap; flex-shrink: 0;
  }
  .search-fire-btn:hover { background: #dc2626; transform: scale(1.03); }
  .search-order-btn {
    background: #1e1e1e; border: 1px solid #333; color: #888;
    padding: 0 14px; border-radius: 8px; cursor: pointer;
    font-size: 12px; font-family: inherit; display: flex; align-items: center;
    gap: 6px; transition: all .2s; white-space: nowrap;
  }
  .search-order-btn:hover { border-color: #555; color: #ccc; }

  /* === HINT === */
  .search-hint {
    background: rgba(245,158,11,.05);
    border: 1px solid rgba(245,158,11,.15);
    border-radius: 8px;
    padding: 8px 14px;
    font-size: 11px; color: #888;
    margin-bottom: 16px;
    line-height: 1.6;
  }
  .search-hint strong { color: #f59e0b; }

  /* === LOADER === */
  .loader-container {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 60px 20px; color: #555; font-size: 12px; gap: 16px;
  }
  .spinner {
    width: 32px; height: 32px;
    border: 3px solid rgba(239,68,68,.1);
    border-top: 3px solid #ef4444;
    border-radius: 50%; animation: spin 1s linear infinite;
  }
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  .hidden { display: none !important; }

  /* === DOC CARDS (responsive, no table) === */
  #search-results-wrap { display: flex; flex-direction: column; gap: 6px; }

  .doc-card {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #161616;
    border: 1px solid #242424;
    border-radius: 10px;
    padding: 12px 14px;
    cursor: pointer;
    transition: background .15s, border-color .15s, transform .1s;
    position: relative;
  }
  .doc-card:hover {
    background: #1c1c1c;
    border-color: rgba(239,68,68,.35);
    transform: translateX(2px);
  }
  .doc-card:hover .doc-number { color: #ef4444; }

  /* LEFT: Badge */
  .doc-card-left { flex-shrink: 0; }
  .doc-badge {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 4px 7px; border-radius: 6px;
    font-size: 9px; font-weight: 900; text-transform: uppercase;
    min-width: 48px; text-align: center; letter-spacing: .03em;
  }
  .badge-fa-a { background: rgba(59,130,246,.15); color: #60a5fa; border: 1px solid rgba(59,130,246,.3); }
  .badge-fa-b { background: rgba(16,185,129,.15); color: #10b981; border: 1px solid rgba(16,185,129,.3); }
  .badge-fa-c { background: rgba(139,92,246,.15); color: #a78bfa; border: 1px solid rgba(139,92,246,.3); }
  .badge-nc-a, .badge-nc-b, .badge-nc-c, .badge-nc-m { background: rgba(239,68,68,.15); color: #f87171; border: 1px solid rgba(239,68,68,.3); }
  .badge-nd-a, .badge-nd-b, .badge-nd-c { background: rgba(239,68,68,.15); color: #ef4444; border: 1px solid rgba(239,68,68,.3); }
  .badge-x, .badge-cert, .badge-re-b, .badge-re-a { background: rgba(99,102,241,.15); color: #818cf8; border: 1px solid rgba(99,102,241,.3); }

  /* CENTER: Body */
  .doc-card-body { flex: 1; min-width: 0; }
  .doc-card-top { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; flex-wrap: wrap; }
  .doc-number { font-family: 'Roboto Mono', monospace; color: #fff; font-weight: 700; font-size: 13px; transition: color .15s; }
  .doc-date-tag { font-size: 10px; color: #555; display: flex; align-items: center; gap: 4px; }
  .doc-card-client { display: flex; flex-direction: column; gap: 1px; margin-bottom: 5px; }
  .client-name { color: #ccc; font-weight: 600; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .client-meta { font-size: 10px; color: #444; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .doc-card-footer { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .doc-total-tag { font-size: 13px; font-weight: 900; color: #fff; display: flex; align-items: center; gap: 5px; }
  .doc-total-tag i { color: #10b981; font-size: 10px; }
  .doc-seller-tag { font-size: 10px; color: #555; display: flex; align-items: center; gap: 4px; }

  /* RIGHT: Actions — always visible */
  .doc-card-actions {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex-shrink: 0;
  }
  .act-btn {
    display: flex; align-items: center; justify-content: center; gap: 5px;
    padding: 7px 14px; border-radius: 7px;
    font-size: 11px; font-weight: 700;
    cursor: pointer; border: 1px solid #333;
    text-decoration: none; transition: all .2s;
    white-space: nowrap; min-width: 72px;
  }
  .act-preview {
    background: rgba(239,68,68,.08);
    border-color: rgba(239,68,68,.25);
    color: #ef4444;
  }
  .act-preview:hover { background: rgba(239,68,68,.2); border-color: #ef4444; transform: scale(1.04); }
  .act-download {
    background: rgba(59,130,246,.08);
    border-color: rgba(59,130,246,.25);
    color: #3b82f6;
  }
  .act-download:hover { background: rgba(59,130,246,.2); border-color: #3b82f6; transform: scale(1.04); }

  /* === EMPTY STATE === */
  .empty-state {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 80px 20px; gap: 10px; color: #444; text-align: center;
  }
  .empty-icon { font-size: 48px; opacity: .2; margin-bottom: 8px; }
  .empty-state p { font-size: 14px; font-weight: 600; color: #555; }
  .empty-state span { font-size: 11px; color: #333; }

  /* === HIGHLIGHT search terms === */
  .hl { background: rgba(239,68,68,.25); color: #fca5a5; border-radius: 2px; padding: 0 2px; }

  /* === PAGINATION === */
  .pagination-bar {
    display: flex; justify-content: center; align-items: center;
    margin-top: 20px; gap: 16px;
  }
  .page-btn {
    background: #1e1e1e; border: 1px solid #333; color: #888;
    padding: 8px 18px; border-radius: 8px; cursor: pointer;
    font-size: 12px; font-family: inherit;
    display: flex; align-items: center; gap: 6px; transition: all .2s;
  }
  .page-btn:hover:not(:disabled) { border-color: #555; color: #ccc; }
  .page-btn:disabled { opacity: .3; pointer-events: none; }
  .page-info { color: #666; font-size: 12px; font-weight: 600; }

  /* === PDF MODAL === */
  .pdf-modal-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,.9);
    display: none; align-items: center; justify-content: center;
    z-index: 9999; backdrop-filter: blur(8px);
  }
  .pdf-modal-overlay.show { display: flex; }
  .pdf-modal-window {
    background: #141414; border: 1px solid #2a2a2a;
    border-radius: 14px;
    width: min(1100px, 96vw);
    height: 92vh;
    box-shadow: 0 24px 60px rgba(0,0,0,.9);
    display: flex; flex-direction: column; overflow: hidden;
    animation: zoomUp .25s cubic-bezier(0.16,1,.3,1);
  }
  @keyframes zoomUp { from { transform: scale(.94); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  .pdf-modal-header {
    height: 52px; background: #1e1e1e;
    border-bottom: 1px solid #2a2a2a;
    display: flex; align-items: center;
    justify-content: space-between; padding: 0 18px;
    flex-shrink: 0;
  }
  .pdf-modal-title { display: flex; align-items: center; gap: 10px; font-weight: 700; color: #fff; font-size: 13px; }
  .pdf-header-icon { color: #ef4444; font-size: 18px; }
  .pdf-action-btn {
    display: flex; align-items: center; gap: 6px;
    background: rgba(59,130,246,.12); border: 1px solid rgba(59,130,246,.3);
    color: #3b82f6; padding: 6px 14px; border-radius: 7px;
    font-size: 12px; font-weight: 700; text-decoration: none;
    cursor: pointer; transition: all .2s;
  }
  .pdf-action-btn:hover { background: rgba(59,130,246,.25); }
  .pdf-modal-close {
    background: transparent; border: none; color: #555;
    font-size: 28px; cursor: pointer; transition: color .2s;
    line-height: 1; padding: 4px 8px;
  }
  .pdf-modal-close:hover { color: #fff; }
  .pdf-modal-body { flex: 1; background: #2a2a2a; overflow: hidden; }
  .pdf-iframe { width: 100%; height: 100%; border: none; }

  /* === RESPONSIVE adjustments for small monitors === */
  @media (max-width: 900px) {
    .buscador-header { flex-direction: column; }
    .doc-card-actions { flex-direction: row; }
    .act-btn { min-width: 60px; padding: 6px 10px; }
  }
  @media (max-width: 600px) {
    .doc-card { flex-wrap: wrap; }
    .doc-card-actions { width: 100%; flex-direction: row; justify-content: flex-end; }
    .search-wrap { flex-direction: column; }
    .search-order-btn { width: 100%; justify-content: center; padding: 10px; }
  }
</style>
` + '<script>' + `
  (function() {
    let currentPage = 1;
    const LIMIT = 12;
    let currentOrder = 'desc';
    let lastQuery = '';

    const input = document.getElementById('doc-search-input');
    const fireBtn = document.getElementById('doc-search-btn');
    const orderBtn = document.getElementById('doc-search-order-btn');
    const loader = document.getElementById('doc-search-loader');
    const resultsWrap = document.getElementById('search-results-wrap');
    const badge = document.getElementById('docs-count-badge');
    const hint = document.getElementById('search-hint');
    const pagControls = document.getElementById('pagination-controls');
    const prevBtn = document.getElementById('page-prev-btn');
    const nextBtn = document.getElementById('page-next-btn');
    const pageInfo = document.getElementById('page-info');

    function highlight(text, term) {
      if (!term || !text) return text || "";
      var lo = text.toLowerCase(), lt = term.toLowerCase(), out = "", idx = 0;
      while (idx < text.length) {
        var p = lo.indexOf(lt, idx);
        if (p < 0) { out += text.slice(idx); break; }
        out += text.slice(idx, p) + '<span class="hl">' + text.slice(p, p + term.length) + '</span>';
        idx = p + term.length;
      }
      return out;
    }

    function renderCards(docs, queryTerm) {
      if (!docs || docs.length === 0) {
        return \`<div class="empty-state">
          <i class="fas fa-search-minus empty-icon"></i>
          <p>No se encontraron documentos.</p>
          <span>Probá buscar con otras palabras clave o verificá el OCR del PDF.</span>
        </div>\`;
      }

      return docs.map(doc => {
        const isNC = (doc.doc_type || '').toUpperCase().startsWith('NC');
        const displayAmount = isNC ? -(doc.total_amount) : doc.total_amount;
        const total = doc.total_amount > 0
          ? '$' + parseFloat(displayAmount).toLocaleString('es-AR', {minimumFractionDigits:2, maximumFractionDigits:2})
          : '—';
        const fecha = doc.doc_date ? new Date(doc.doc_date).toLocaleDateString('es-AR', { timeZone: 'UTC' }) : '—';
        const typeClass = (doc.doc_type || 'X').toLowerCase().replace(/[^a-z0-9]/g, '-');
        const clientName = highlight(doc.client_name || 'Consumidor Final', queryTerm);
        
        const versionMatch = doc.filename ? doc.filename.match(/_(\d+)\.pdf$/i) : null;
        const versionBadge = versionMatch ? \`<span style="color: #eab308; font-size: 0.8em; margin-left: 4px;" title="Versión Modificada">_v\${versionMatch[1]}</span>\` : '';
        
        const docNum = \`\${doc.pos_number || '0000'}-\${doc.doc_number || '00000000'}\${versionBadge}\`;
        const safeFilename = (doc.filename || 'factura.pdf').replace(/'/g, "\\\\'");

        return \`
        <div class="doc-card" onclick="previewDoc(this.dataset.id, this.dataset.filename)" data-id="\${doc.id}" data-filename="\${safeFilename}" title="Click para ver el PDF">
          <div class="doc-card-left">
            <span class="doc-badge badge-\${typeClass}">\${doc.doc_type || 'X'}</span>
          </div>
          <div class="doc-card-body">
            <div class="doc-card-top">
              <span class="doc-number">\${highlight(docNum, queryTerm)}</span>
              <span class="doc-date-tag"><i class="fas fa-calendar-alt"></i> \${fecha}</span>
            </div>
            <div class="doc-card-client">
              <span class="client-name">\${clientName}</span>
              <span class="client-meta">Cta #\${doc.client_cta || '—'} &nbsp;|&nbsp; CUIT: \${doc.client_cuit || '—'}</span>
            </div>
            <div class="doc-card-footer">
              <span class="doc-total-tag" style="color: \${isNC ? '#ef4444' : '#10b981'};"><i class="fas fa-dollar-sign"></i> \${total}</span>
              \${doc.seller_code ? \`<span class="doc-seller-tag"><i class="fas fa-user-tag"></i> Vend. \${doc.seller_code}</span>\` : ''}
            </div>
          </div>
          <div class="doc-card-actions" onclick="event.stopPropagation()">
            <button class="act-btn act-preview" onclick="previewDoc(this.parentElement.parentElement.dataset.id, this.parentElement.parentElement.dataset.filename)" title="Ver PDF">
              <i class="fas fa-eye"></i> <span>Ver</span>
            </button>
            <a href="/api/documentos/download?id=\${doc.id}" class="act-btn act-download" download="\${doc.filename || 'factura.pdf'}" title="Descargar PDF">
              <i class="fas fa-download"></i> <span>PDF</span>
            </a>
          </div>
        </div>\`;
      }).join('');
    }

    async function executeSearch(resetPage = true) {
      if (resetPage) currentPage = 1;
      const q = input.value.trim();
      lastQuery = q;

      /* Hide hint after first search */
      if (q && hint) hint.style.display = 'none';

      loader.classList.remove('hidden');
      resultsWrap.innerHTML = '';
      pagControls.classList.add('hidden');

      try {
        const typeVal = document.getElementById('doc-search-type-select') ? document.getElementById('doc-search-type-select').value : '';
        const res = await fetch(
          '/api/documentos/search?q=' + encodeURIComponent(q) +
          '&page=' + currentPage + '&limit=' + LIMIT + '&order=' + currentOrder + '&type=' + typeVal
        );
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();

        badge.innerHTML = '<i class="fas fa-file-alt"></i> ' + data.count + (q ? ' encontrados' : ' documentos');
        resultsWrap.innerHTML = renderCards(data.results || [], q);

        const totalPages = data.totalPages || 1;
        if (totalPages > 1 || currentPage > 1) {
          pageInfo.textContent = 'Página ' + currentPage + ' de ' + totalPages;
          prevBtn.disabled = currentPage <= 1;
          nextBtn.disabled = currentPage >= totalPages;
          pagControls.classList.remove('hidden');
        }
      } catch (err) {
        console.error('Search error:', err);
        resultsWrap.innerHTML = \`<div class="empty-state">
          <i class="fas fa-exclamation-circle empty-icon" style="color:#ef4444;opacity:.5;"></i>
          <p style="color:#ef4444;">Error al buscar en la base de datos.</p>
          <span>\${err.message}</span>
        </div>\`;
      } finally {
        loader.classList.add('hidden');
      }
    }

    /* Event listeners */
    fireBtn.addEventListener('click', () => executeSearch(true));
    input.addEventListener('keydown', e => { if (e.key === 'Enter') executeSearch(true); });
    /* Instant search after 400ms debounce */
    let debounceTimer;
    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => { if (input.value.length >= 2 || input.value.length === 0) executeSearch(true); }, 400);
    });

    orderBtn.addEventListener('click', () => {
      currentOrder = currentOrder === 'desc' ? 'asc' : 'desc';
      orderBtn.innerHTML = currentOrder === 'desc'
        ? '<i class="fas fa-sort-amount-down"></i> Más nuevos'
        : '<i class="fas fa-sort-amount-up"></i> Más viejos';
      executeSearch(true);
    });

    const typeSelect = document.getElementById('doc-search-type-select');
    if (typeSelect) {
      typeSelect.addEventListener('change', () => executeSearch(true));
    }

    prevBtn.addEventListener('click', () => { if (currentPage > 1) { currentPage--; executeSearch(false); } });
    nextBtn.addEventListener('click', () => { currentPage++; executeSearch(false); });

    /* Initial load */
    setTimeout(() => executeSearch(true), 80);

    /* === PDF PREVIEW MODAL === */
    const modal = document.getElementById('pdf-preview-modal');
    const closeBtn = document.getElementById('pdf-modal-close-btn');
    const iframe = document.getElementById('pdf-iframe-loader');
    const modalFilename = document.getElementById('pdf-modal-filename');
    const modalDownloadBtn = document.getElementById('pdf-modal-download-btn');

    closeBtn.addEventListener('click', () => { modal.classList.remove('show'); iframe.src = ''; });
    modal.addEventListener('click', e => {
      if (e.target === modal) { modal.classList.remove('show'); iframe.src = ''; }
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && modal.classList.contains('show')) {
        modal.classList.remove('show'); iframe.src = '';
      }
    });

    window.previewDoc = function(id, filename) {
      const url = '/api/documentos/download?id=' + id;
      if (window.innerWidth <= 768) {
        window.open(url, '_blank');
        return;
      }
      modalFilename.textContent = filename || 'Factura.pdf';
      if (modalDownloadBtn) {
        modalDownloadBtn.href = url;
        modalDownloadBtn.download = filename || 'factura.pdf';
      }
      iframe.src = url;
      modal.classList.add('show');
    };

  })();
` + '</script>';

    return new Response(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
};
