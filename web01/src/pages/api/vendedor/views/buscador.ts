/**
 * API Endpoint: Vista Parcial de Buscador de Facturas
 * Retorna HTML puro para ser inyectado en el canvas central del Workspace SPA.
 * GET /api/vendedor/views/buscador
 */
import type { APIRoute } from 'astro';
import { query } from '../../../../../Backend/conexiones/lib/db.js';

export const GET: APIRoute = async () => {
    let recentDocs: any[] = [];
    let statsToday = { count: 0, total: 0 };
    try {
        // Fetch 15 most recent documents to display on initial view load
        const dbResult = await query(`
            SELECT id, filename, doc_type, pos_number, doc_number, doc_date,
                   client_cta, client_name, client_cuit, total_amount, seller_code
            FROM documentos_facturacion
            ORDER BY created_at DESC, doc_date DESC
            LIMIT 10;
        `, []);
        recentDocs = dbResult.rows;

        // Fetch today's stats for invoices (FA-%)
        const todayStr = new Date().toISOString().split('T')[0];
        const statsResult = await query(`
            SELECT COUNT(*) as count, SUM(total_amount) as total
            FROM documentos_facturacion
            WHERE doc_type LIKE 'FA-%'
              AND DATE(doc_date) = $1
        `, [todayStr]);
        if (statsResult.rows.length > 0) {
            statsToday = {
                count: parseInt(statsResult.rows[0].count) || 0,
                total: parseFloat(statsResult.rows[0].total) || 0
            };
        }
    } catch (e: any) {
        console.error('Error fetching docs or stats:', e.message);
    }

    const html = `
<div class="view-panel" id="view-buscador">
  <div class="view-header">
    <div>
      <h2 class="view-title">Buscador Inteligente de <span class="text-accent-red">Documentos</span></h2>
      <p class="view-subtitle">Full-Text Search impulsado por PostgreSQL v16. Busca al instante por cliente, CUIT, número o contenido interno del PDF.</p>
    </div>
    <div class="view-stats-header" style="display:flex; gap:16px; align-items:center;">
      <div class="view-count" id="docs-count-badge">${recentDocs.length} recientes</div>
      <div class="view-count stats-today" style="background:#10b98122; border-color:#10b981; color:#10b981;">
        <i class="fas fa-chart-line" style="margin-right:4px;"></i>
        Hoy: ${statsToday.count} facturas emitidas ($${statsToday.total.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits:2})})
      </div>
    </div>
  </div>

  <!-- SEARCH INTERFACE -->
  <div class="search-box-wrap" style="display:flex; gap:12px;">
    <div class="search-input-container" style="flex:1;">
      <i class="fas fa-search search-field-icon"></i>
      <input type="text" id="doc-search-input" class="search-input" placeholder="Buscar por cliente, CUIT, número de factura o texto del cuerpo del PDF (ej: Faplac Sahara)..." autocomplete="off"/>
      <button id="doc-search-btn" class="search-btn">
        <i class="fas fa-arrow-right"></i>
      </button>
    </div>
    <button id="doc-search-order-btn" class="search-btn" style="width:auto; padding:0 16px; position:static;">
      <i class="fas fa-sort-amount-down" style="margin-right:6px;"></i> Más nuevos
    </button>
  </div>

  <!-- LOADER SPINNER -->
  <div id="doc-search-loader" class="loader-container hidden">
    <div class="spinner"></div>
    <p>Indexando y buscando en base de datos...</p>
  </div>

  <!-- RESULTS CONTAINER -->
  <div id="search-results-table-wrap" class="docs-table-wrap">
    <table class="docs-table">
      <thead>
        <tr>
          <th>Tipo</th>
          <th>Número</th>
          <th>Fecha</th>
          <th>Cliente / Cta</th>
          <th>Total</th>
          <th>Vendedor</th>
          <th style="text-align:right;">Acciones</th>
        </tr>
      </thead>
      <tbody id="docs-table-body">
        ${recentDocs.length === 0 ? `
        <tr>
          <td colspan="7" class="empty-table-row">
            <i class="fas fa-folder-open empty-row-icon"></i>
            <p>No hay documentos indexados en el sistema.</p>
          </td>
        </tr>` : recentDocs.map(doc => {
            const formatTotal = doc.total_amount > 0 
                ? `$${parseFloat(doc.total_amount).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : '—';
            const formatDate = doc.doc_date ? new Date(doc.doc_date).toLocaleDateString('es-AR') : '—';
            return `
        <tr class="doc-row">
          <td><span class="doc-badge badge-${(doc.doc_type || 'X').toLowerCase()}">${doc.doc_type || 'X'}</span></td>
          <td><span class="doc-number">${doc.pos_number || '0000'} - ${doc.doc_number || '00000000'}</span></td>
          <td class="doc-date">${formatDate}</td>
          <td>
            <div class="client-info">
              <span class="client-name">${doc.client_name || 'Consumidor Final'}</span>
              <span class="client-cta">Cta #${doc.client_cta || '00000'} | CUIT ${doc.client_cuit || '—'}</span>
            </div>
          </td>
          <td class="doc-total">${formatTotal}</td>
          <td class="doc-seller"><i class="fas fa-user-tag text-muted"></i> ${doc.seller_code || '—'}</td>
          <td style="text-align:right;">
            <div class="action-buttons-container">
              <button class="action-btn preview-btn" onclick="previewDoc('${doc.id}', '${doc.filename}')" title="Previsualizar PDF">
                <i class="fas fa-eye"></i>
              </button>
              <a href="/api/documentos/download?id=${doc.id}" class="action-btn download-btn" download="${doc.filename}" title="Descargar PDF">
                <i class="fas fa-download"></i>
              </a>
            </div>
          </td>
        </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>

  <!-- PAGINATION CONTROLS -->
  <div id="pagination-controls" style="display:flex; justify-content:center; align-items:center; margin-top:20px; gap:16px;" class="hidden">
    <button id="page-prev-btn" class="search-btn" style="width:auto; padding:0 16px; position:static;">Anterior</button>
    <span id="page-info" style="color:#aaa; font-size:13px; font-weight:600;">Página 1</span>
    <button id="page-next-btn" class="search-btn" style="width:auto; padding:0 16px; position:static;">Siguiente</button>
  </div>

  <!-- PDF PREVIEW LIGHTBOX MODAL -->
  <div id="pdf-preview-modal" class="pdf-modal-overlay">
    <div class="pdf-modal-window">
      <div class="pdf-modal-header">
        <div class="pdf-modal-title">
          <i class="fas fa-file-pdf pdf-header-icon"></i>
          <span id="pdf-modal-filename">Factura.pdf</span>
        </div>
        <button id="pdf-modal-close-btn" class="pdf-modal-close">&times;</button>
      </div>
      <div class="pdf-modal-body">
        <iframe id="pdf-iframe-loader" src="" class="pdf-iframe"></iframe>
      </div>
    </div>
  </div>

</div>

<style>
  /* Base Layout Styles */
  .view-panel { animation: fadeIn .25s ease-out; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  
  .view-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; }
  .view-title { font-size: 22px; font-weight: 900; color: #fff; text-transform: uppercase; letter-spacing: -.5px; }
  .view-subtitle { font-size: 12px; color: #777; margin-top: 4px; line-height: 1.4; }
  .view-count { font-size: 11px; font-weight: 700; color: #888; background: #222; border: 1px solid #333; padding: 4px 10px; border-radius: 20px; }
  .text-accent-red { color: #ef4444; }

  /* Premium Search Box */
  .search-box-wrap { margin-bottom: 24px; }
  .search-input-container {
    display: flex;
    align-items: center;
    background: #181818;
    border: 1px solid #333;
    border-radius: 12px;
    padding: 2px 8px;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
    transition: all .2s;
  }
  .search-input-container:focus-within {
    border-color: #ef4444;
    box-shadow: 0 0 10px rgba(239, 68, 68, 0.2), inset 0 2px 4px rgba(0,0,0,0.5);
  }
  .search-field-icon { color: #555; font-size: 16px; margin: 0 12px; }
  .search-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: #fff;
    font-size: 14px;
    padding: 14px 0;
  }
  .search-input::placeholder { color: #555; }
  .search-btn {
    background: #ef4444;
    border: none;
    color: #fff;
    width: 38px;
    height: 38px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all .2s;
  }
  .search-btn:hover { background: #dc2626; transform: scale(1.05); }

  /* Loader */
  .loader-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: #888;
    font-size: 12px;
    gap: 16px;
  }
  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(239, 68, 68, 0.1);
    border-top: 3px solid #ef4444;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  .hidden { display: none !important; }

  /* Premium Invoices Table */
  .docs-table-wrap {
    background: #161616;
    border: 1px solid #282828;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  }
  .docs-table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .docs-table thead tr { background: rgba(0,0,0,.3); border-bottom: 1px solid #282828; }
  .docs-table th {
    padding: 14px 18px;
    text-align: left;
    color: #666;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .05em;
  }
  .doc-row { border-top: 1px solid #202020; transition: background .15s; }
  .doc-row:hover { background: rgba(255,255,255,.02); }
  .docs-table td { padding: 12px 18px; vertical-align: middle; }

  /* Doc Badges */
  .doc-badge {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 10px;
    font-weight: 900;
    text-align: center;
    min-width: 44px;
    text-transform: uppercase;
  }
  .badge-fa-a { background: rgba(59, 130, 246, 0.15); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3); }
  .badge-fa-b { background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); }
  .badge-re { background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); }
  .badge-x { background: rgba(139, 92, 246, 0.15); color: #8b5cf6; border: 1px solid rgba(139, 92, 246, 0.3); }

  .doc-number { font-family: monospace; color: #fff; font-weight: 700; font-size: 12px; }
  .doc-date { color: #777; font-size: 11px; }

  /* Client Info */
  .client-info { display: flex; flex-direction: column; gap: 2px; }
  .client-name { color: #fff; font-weight: 700; font-size: 12px; }
  .client-cta { font-size: 10px; color: #555; }

  .doc-total { color: #fff; font-weight: 900; font-size: 13px; }
  .doc-seller { color: #888; font-size: 11px; font-weight: 500; }
  .text-muted { color: #444; margin-right: 4px; }

  /* Actions */
  .action-buttons-container { display: flex; justify-content: flex-end; gap: 8px; }
  .action-btn {
    background: #202020;
    border: 1px solid #333;
    color: #aaa;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all .2s;
    text-decoration: none;
  }
  .action-btn:hover { color: #fff; border-color: #555; background: #2a2a2a; }
  .preview-btn:hover { color: #ef4444; border-color: rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.05); }

  /* Empty state */
  .empty-table-row { padding: 80px 20px; text-align: center; color: #444; }
  .empty-row-icon { font-size: 40px; margin-bottom: 12px; opacity: .3; }

  /* Lightbox Modal PDF */
  .pdf-modal-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.85);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    backdrop-filter: blur(8px);
  }
  .pdf-modal-overlay.show { display: flex; }
  .pdf-modal-window {
    background: #181818;
    border: 1px solid #333;
    border-radius: 16px;
    width: 1000px;
    max-width: 95%;
    height: 90vh;
    box-shadow: 0 20px 50px rgba(0,0,0,0.8);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: zoomUp .3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes zoomUp {
    from { transform: scale(0.92); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  .pdf-modal-header {
    height: 54px;
    background: #202020;
    border-bottom: 1px solid #333;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
  }
  .pdf-modal-title { display: flex; align-items: center; gap: 10px; font-weight: 700; color: #fff; font-size: 13px; }
  .pdf-header-icon { color: #ef4444; font-size: 16px; }
  .pdf-modal-close {
    background: transparent;
    border: none;
    color: #888;
    font-size: 28px;
    cursor: pointer;
    transition: color .2s;
  }
  .pdf-modal-close:hover { color: #fff; }
  .pdf-modal-body { flex: 1; background: #2e2e2e; }
  .pdf-iframe { width: 100%; height: 100%; border: none; }
</style>
` + '<script>' + `
  (function() {
    let currentPage = 1;
    const currentLimit = 10;
    let currentOrder = 'desc';

    const input = document.getElementById('doc-search-input');
    const btn = document.getElementById('doc-search-btn');
    const orderBtn = document.getElementById('doc-search-order-btn');
    const loader = document.getElementById('doc-search-loader');
    const tableWrap = document.getElementById('search-results-table-wrap');
    const tableBody = document.getElementById('docs-table-body');
    const badge = document.getElementById('docs-count-badge');
    
    const pagControls = document.getElementById('pagination-controls');
    const prevBtn = document.getElementById('page-prev-btn');
    const nextBtn = document.getElementById('page-next-btn');
    const pageInfo = document.getElementById('page-info');

    // Trigger search
    async function executeSearch(resetPage = true) {
      if (resetPage) currentPage = 1;
      const queryVal = input.value.trim();
      
      loader.classList.remove('hidden');
      tableWrap.classList.add('hidden');
      pagControls.classList.add('hidden');

      try {
        const res = await fetch('/api/documentos/search?q=' + encodeURIComponent(queryVal) + '&page=' + currentPage + '&limit=' + currentLimit + '&order=' + currentOrder);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        
        // Update badge
        badge.textContent = data.count + (queryVal ? ' encontrados' : ' documentos');

        if (data.count === 0) {
          tableBody.innerHTML = \`
            <tr>
              <td colspan="7" class="empty-table-row">
                <i class="fas fa-search-minus empty-row-icon"></i>
                <p>No se encontraron documentos para tu búsqueda.</p>
                <span style="font-size:10px;color:#444;">Intenta buscar por palabras clave diferentes.</span>
              </td>
            </tr>\`;
        } else {
          tableBody.innerHTML = data.results.map(doc => {
            const formatTotal = doc.total_amount > 0 
                ? '$' + parseFloat(doc.total_amount).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : '—';
            const formatDate = doc.doc_date ? new Date(doc.doc_date).toLocaleDateString('es-AR') : '—';
            return \`
              <tr class="doc-row">
                <td><span class="doc-badge badge-\${(doc.doc_type || 'X').toLowerCase()}">\${doc.doc_type || 'X'}</span></td>
                <td><span class="doc-number">\${doc.pos_number || '0000'} - \${doc.doc_number || '00000000'}</span></td>
                <td class="doc-date">\${formatDate}</td>
                <td>
                  <div class="client-info">
                    <span class="client-name">\${doc.client_name || 'Consumidor Final'}</span>
                    <span class="client-cta">Cta #\${doc.client_cta || '00000'} | CUIT \${doc.client_cuit || '—'}</span>
                  </div>
                </td>
                <td class="doc-total">\${formatTotal}</td>
                <td class="doc-seller"><i class="fas fa-user-tag text-muted"></i> \${doc.seller_code || '—'}</td>
                <td style="text-align:right;">
                  <div class="action-buttons-container">
                    <button class="action-btn preview-btn" onclick="previewDoc('\${doc.id}', '\${doc.filename}')" title="Previsualizar PDF">
                      <i class="fas fa-eye"></i>
                    </button>
                    <a href="/api/documentos/download?id=\${doc.id}" class="action-btn download-btn" download="\${doc.filename}" title="Descargar PDF">
                      <i class="fas fa-download"></i>
                    </a>
                  </div>
                </td>
              </tr>\`;
          }).join('');
          
          // Setup pagination UI
          const totalPages = data.totalPages || 1;
          if (totalPages > 1 || currentPage > 1) {
            pageInfo.textContent = 'Página ' + currentPage + ' de ' + totalPages;
            prevBtn.disabled = currentPage <= 1;
            prevBtn.style.opacity = currentPage <= 1 ? '0.5' : '1';
            prevBtn.style.pointerEvents = currentPage <= 1 ? 'none' : 'auto';
            
            nextBtn.disabled = currentPage >= totalPages;
            nextBtn.style.opacity = currentPage >= totalPages ? '0.5' : '1';
            nextBtn.style.pointerEvents = currentPage >= totalPages ? 'none' : 'auto';
            pagControls.classList.remove('hidden');
          }
        }
      } catch (err) {
        console.error('Error during search:', err);
        tableBody.innerHTML = \`
          <tr>
            <td colspan="7" class="empty-table-row">
              <i class="fas fa-exclamation-circle empty-row-icon" style="color:#ef4444;"></i>
              <p style="color:#ef4444;">Error al conectar con la base de datos.</p>
            </td>
          </tr>\`;
      } finally {
        loader.classList.add('hidden');
        tableWrap.classList.remove('hidden');
      }
    }

    // Input event handlers
    btn.addEventListener('click', () => executeSearch(true));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        executeSearch(true);
      }
    });
    
    orderBtn.addEventListener('click', () => {
      currentOrder = currentOrder === 'desc' ? 'asc' : 'desc';
      orderBtn.innerHTML = currentOrder === 'desc' 
        ? '<i class="fas fa-sort-amount-down" style="margin-right:6px;"></i> Más nuevos'
        : '<i class="fas fa-sort-amount-up" style="margin-right:6px;"></i> Más viejos';
      executeSearch(true);
    });
    
    // Pagination event handlers
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        executeSearch(false);
      }
    });
    nextBtn.addEventListener('click', () => {
      currentPage++;
      executeSearch(false);
    });

    // Run initial search to show pagination if there are more than 10 total docs
    // (We wrap it in setTimeout to allow initial fade-in animation)
    setTimeout(() => {
       executeSearch(true);
    }, 100);

    // Close preview modal handlers
    const modal = document.getElementById('pdf-preview-modal');
    const closeBtn = document.getElementById('pdf-modal-close-btn');
    const iframe = document.getElementById('pdf-iframe-loader');

    closeBtn.addEventListener('click', () => {
      modal.classList.remove('show');
      iframe.src = '';
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('show');
        iframe.src = '';
      }
    });

    // Expose PDF preview function globally
    window.previewDoc = function(id, filename) {
      document.getElementById('pdf-modal-filename').textContent = filename;
      iframe.src = '/api/documentos/download?id=' + id;
      modal.classList.add('show');
    };

  })();
` + '</script>';

    return new Response(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
};
