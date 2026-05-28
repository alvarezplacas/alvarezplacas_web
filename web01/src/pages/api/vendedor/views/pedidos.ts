/**
 * API Endpoint: Vista Parcial de Pedidos
 * Retorna HTML puro para ser inyectado en el canvas central del Workspace SPA.
 * GET /api/vendedor/views/pedidos
 */
import type { APIRoute } from 'astro';
import { directus, readItems } from '@conexiones/directus.js';

export const GET: APIRoute = async ({ cookies }) => {
    const sellerId = cookies.get('seller_session')?.value || '1';
    let pedidos: any[] = [];

    try {
        pedidos = await directus.request(readItems('pedidos', {
            filter: { vendedor_id: { _eq: sellerId } },
            sort: ['-fecha_pedido'],
            limit: 50,
            fields: ['id', 'status', 'total_m2', 'total_precio', 'fecha_pedido', 'datos_optimizacion', { cliente_id: ['name', 'nombre_empresa'] }]
        })) as any[];
    } catch (e: any) {
        console.error('Error cargando pedidos:', e.message);
    }

    const statusConfig: Record<string, { label: string; color: string }> = {
        presupuesto:   { label: 'Presupuesto',    color: '#6366f1' },
        en_produccion: { label: 'En Producción',   color: '#f59e0b' },
        en_corte:      { label: 'En Corte',        color: '#3b82f6' },
        terminado:     { label: 'Listo',           color: '#22c55e' },
        en_reparto:    { label: 'En Reparto',      color: '#a855f7' },
        entregado:     { label: 'Entregado',       color: '#10b981' },
    };

    const statusOptions = Object.entries(statusConfig).map(([val, cfg]) =>
        `<option value="${val}">${cfg.label}</option>`
    ).join('');

    const html = `
<div class="view-panel" id="view-pedidos">
  <div class="view-header">
    <div>
      <h2 class="view-title">Gestión de <span class="text-accent-blue">Pedidos</span></h2>
      <p class="view-subtitle">Seguimiento en tiempo real de las órdenes de tus clientes.</p>
    </div>
    <div class="view-count">${pedidos.length} pedidos</div>
  </div>

  ${pedidos.length === 0 ? `
  <div class="empty-state">
    <i class="fas fa-clipboard-list empty-icon"></i>
    <p class="empty-title">Sin pedidos registrados</p>
    <p class="empty-sub">Los pedidos de tus clientes aparecerán aquí cuando sean creados.</p>
  </div>` : `
  <div class="pedidos-table-wrap">
    <table class="pedidos-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Cliente</th>
          <th>Fecha</th>
          <th>Total</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        ${pedidos.map(p => {
            const sc = statusConfig[p.status] || { label: p.status, color: '#666' };
            const cliente = p.cliente_id?.nombre_empresa || p.cliente_id?.name || 'Cliente Particular';
            const fecha = p.fecha_pedido ? new Date(p.fecha_pedido).toLocaleDateString('es-AR') : '—';
            
            // Extraer la fecha solicitada de entrega desde el JSON de optimización
            const reqDate = p.datos_optimizacion?.fecha_entrega_requerida
                ? new Date(p.datos_optimizacion.fecha_entrega_requerida).toLocaleDateString('es-AR')
                : 'A CONFIRMAR';
            
            const opts = Object.entries(statusConfig).map(([val, cfg]) =>
                `<option value="${val}" ${p.status === val ? 'selected' : ''}>${cfg.label}</option>`
            ).join('');
            return `
        <tr class="pedido-row">
          <td><span class="pedido-id">#${p.id}</span></td>
          <td>
            <p class="pedido-cliente">${cliente}</p>
            <p class="pedido-sub">Interno #${p.id}</p>
          </td>
          <td class="pedido-date">
            ${fecha}
            <span style="display:block; font-size:9px; color:#ff2800; font-weight:900; margin-top:3px; text-transform:uppercase; white-space:nowrap;">Entrega: ${reqDate}</span>
          </td>
          <td class="pedido-total">${p.total_m2 || 0} m²</td>
          <td>
            <select class="status-select" data-id="${p.id}" style="--sc: ${sc.color}">
              ${opts}
            </select>
          </td>
        </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>`}
</div>
<style>
  .view-panel { animation: fadeIn .25s ease; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .view-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
  .view-title { font-size: 22px; font-weight: 900; color: #fff; text-transform: uppercase; letter-spacing: -.5px; }
  .view-subtitle { font-size: 12px; color: #666; margin-top: 4px; }
  .view-count { font-size: 11px; font-weight: 700; color: #555; background: #222; border: 1px solid #333; padding: 4px 10px; border-radius: 20px; }
  .text-accent-blue { color: #3b82f6; }
  .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; color: #444; }
  .empty-icon { font-size: 48px; margin-bottom: 16px; opacity: .3; }
  .empty-title { font-size: 14px; font-weight: 700; color: #555; }
  .empty-sub { font-size: 11px; color: #444; margin-top: 4px; text-align: center; max-width: 280px; }
  .pedidos-table-wrap { background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 16px; overflow: hidden; }
  .pedidos-table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .pedidos-table thead tr { background: rgba(0,0,0,.4); }
  .pedidos-table th { padding: 14px 20px; text-align: left; color: #555; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; }
  .pedidos-table th:last-child { text-align: center; }
  .pedido-row { border-top: 1px solid #222; transition: background .15s; }
  .pedido-row:hover { background: rgba(255,255,255,.03); }
  .pedidos-table td { padding: 12px 20px; }
  .pedido-id { font-family: monospace; color: #3b82f6; font-weight: 700; font-size: 11px; }
  .pedido-cliente { color: #fff; font-weight: 700; font-size: 12px; }
  .pedido-sub { font-size: 9px; color: #444; text-transform: uppercase; margin-top: 2px; }
  .pedido-date { color: #555; font-size: 11px; }
  .pedido-total { color: #fff; font-weight: 900; font-size: 13px; }
  .status-select { background: #111; border: 1px solid #333; border-radius: 8px; padding: 5px 8px; font-size: 10px; font-weight: 700; text-transform: uppercase; color: var(--sc, #666); outline: none; cursor: pointer; transition: border-color .2s; width: 100%; }
  .status-select:focus { border-color: var(--sc, #3b82f6); }
</style>
<script>
  (function() {
    document.querySelectorAll('.status-select').forEach(sel => {
      sel.addEventListener('change', async (e) => {
        const target = e.target;
        const pedidoId = target.getAttribute('data-id');
        const status = target.value;
        const origColor = target.style.color;
        target.style.opacity = '0.5';
        try {
          const res = await fetch('/api/admin/update-order-status', {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ pedidoId, status })
          });
          if (res.ok) {
            target.style.opacity = '1';
            target.style.outline = '2px solid currentColor';
            setTimeout(() => { target.style.outline = ''; }, 1500);
          }
        } catch(e) { console.error(e); target.style.opacity = '1'; }
      });
    });
  })();
</script>`;

    return new Response(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
};
