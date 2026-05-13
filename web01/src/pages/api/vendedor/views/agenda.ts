/**
 * API Endpoint: Vista Parcial de Agenda
 * Retorna HTML puro para inyectar en el canvas central del Workspace SPA.
 * GET /api/vendedor/views/agenda
 */
import type { APIRoute } from 'astro';
import { directus, readItems } from '../../../../Backend/conexiones/directus.js';

export const GET: APIRoute = async ({ cookies }) => {
    const sellerId = cookies.get('seller_session')?.value || '1';
    let recordatorios: any[] = [];
    let notas: any[] = [];

    try {
        [recordatorios, notas] = await Promise.all([
            directus.request(readItems('vendedor_notas', {
                filter: { vendedor_id: { _eq: sellerId }, completada: { _eq: false }, es_recordatorio: { _eq: true } },
                sort: ['fecha_vencimiento'], limit: 20
            })) as Promise<any[]>,
            directus.request(readItems('vendedor_notas', {
                filter: { vendedor_id: { _eq: sellerId }, completada: { _eq: false }, es_recordatorio: { _eq: false } },
                sort: ['-date_created'], limit: 10
            })) as Promise<any[]>
        ]);
    } catch (e: any) {
        console.error('Error cargando agenda:', e.message);
    }

    const formatFecha = (d: string) => {
        if (!d) return 'Sin fecha';
        const date = new Date(d);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        if (date.toDateString() === today.toDateString()) return '📅 Hoy';
        if (date.toDateString() === tomorrow.toDateString()) return '📅 Mañana';
        return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
    };

    const isOverdue = (d: string) => d && new Date(d) < new Date();

    const html = `
<div class="view-panel" id="view-agenda">
  <div class="view-header">
    <div>
      <h2 class="view-title">Agenda & <span style="color:#f59e0b">Recordatorios</span></h2>
      <p class="view-subtitle">Tus recordatorios y notas pendientes ordenados por urgencia.</p>
    </div>
    <div class="view-count">${recordatorios.length} recordatorios</div>
  </div>

  <div class="agenda-layout">
    <!-- RECORDATORIOS -->
    <div class="agenda-col">
      <div class="agenda-col-header">
        <i class="fas fa-clock" style="color:#f59e0b"></i>
        <span>Recordatorios</span>
        <span class="agenda-badge">${recordatorios.length}</span>
      </div>
      ${recordatorios.length === 0 ? `
      <div class="agenda-empty">
        <i class="fas fa-calendar-check agenda-empty-icon"></i>
        <p>Sin recordatorios pendientes</p>
        <small>Creá uno desde el panel de Notas Rápidas (derecha) marcando "Recordatorio".</small>
      </div>` :
      recordatorios.map(r => {
        const overdue = isOverdue(r.fecha_vencimiento);
        const urgClass = r.urgencia === 'alta' ? 'urg-alta' : r.urgencia === 'media' ? 'urg-media' : 'urg-baja';
        return `
      <div class="agenda-item ${overdue ? 'overdue' : ''}">
        <div class="agenda-item-left">
          <div class="agenda-urg ${urgClass}"></div>
          <div>
            <p class="agenda-item-text">${r.contenido}</p>
            <p class="agenda-item-date ${overdue ? 'overdue-text' : ''}">${formatFecha(r.fecha_vencimiento)}</p>
          </div>
        </div>
        <button class="agenda-complete-btn" data-id="${r.id}" title="Marcar como completado">
          <i class="fas fa-check"></i>
        </button>
      </div>`;
      }).join('')}
    </div>

    <!-- NOTAS RÁPIDAS -->
    <div class="agenda-col">
      <div class="agenda-col-header">
        <i class="fas fa-sticky-note" style="color:#3b82f6"></i>
        <span>Notas Activas</span>
        <span class="agenda-badge">${notas.length}</span>
      </div>
      ${notas.length === 0 ? `
      <div class="agenda-empty">
        <i class="fas fa-pen agenda-empty-icon"></i>
        <p>Sin notas pendientes</p>
        <small>Usá el ícono + en "Notas Rápidas" del panel derecho para crear una.</small>
      </div>` :
      notas.map(n => {
        const urgClass = n.urgencia === 'alta' ? 'urg-alta' : n.urgencia === 'media' ? 'urg-media' : 'urg-baja';
        return `
      <div class="agenda-item">
        <div class="agenda-item-left">
          <div class="agenda-urg ${urgClass}"></div>
          <div>
            <p class="agenda-item-text">${n.contenido}</p>
            <p class="agenda-item-date">${new Date(n.date_created).toLocaleDateString('es-AR')}</p>
          </div>
        </div>
        <button class="agenda-complete-btn" data-id="${n.id}" title="Completar nota">
          <i class="fas fa-check"></i>
        </button>
      </div>`;
      }).join('')}
    </div>
  </div>
</div>

<style>
  .view-panel { animation: fadeIn .25s ease; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .view-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; }
  .view-title { font-size: 22px; font-weight: 900; color: #fff; text-transform: uppercase; letter-spacing: -.5px; }
  .view-subtitle { font-size: 12px; color: #666; margin-top: 4px; }
  .view-count { font-size: 11px; font-weight: 700; color: #555; background: #222; border: 1px solid #333; padding: 4px 10px; border-radius: 20px; white-space: nowrap; }
  .agenda-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .agenda-col { background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 14px; overflow: hidden; }
  .agenda-col-header { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-bottom: 1px solid #222; font-size: 11px; font-weight: 700; color: #aaa; text-transform: uppercase; letter-spacing: .08em; }
  .agenda-badge { margin-left: auto; background: #222; border: 1px solid #333; border-radius: 10px; padding: 1px 7px; font-size: 10px; color: #666; }
  .agenda-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; gap: 8px; text-align: center; }
  .agenda-empty-icon { font-size: 32px; opacity: .15; }
  .agenda-empty p { font-size: 12px; color: #555; font-weight: 600; }
  .agenda-empty small { font-size: 10px; color: #444; max-width: 200px; line-height: 1.4; }
  .agenda-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-bottom: 1px solid #1f1f1f; transition: background .15s; }
  .agenda-item:last-child { border-bottom: none; }
  .agenda-item:hover { background: rgba(255,255,255,.03); }
  .agenda-item.overdue { background: rgba(239,68,68,.04); }
  .agenda-item-left { display: flex; align-items: flex-start; gap: 10px; flex: 1; min-width: 0; }
  .agenda-urg { width: 3px; height: 100%; min-height: 32px; border-radius: 2px; flex-shrink: 0; }
  .urg-alta { background: #ef4444; }
  .urg-media { background: #f59e0b; }
  .urg-baja { background: #22c55e; }
  .agenda-item-text { font-size: 12px; color: #ccc; line-height: 1.4; }
  .agenda-item-date { font-size: 10px; color: #555; margin-top: 3px; }
  .overdue-text { color: #ef4444 !important; font-weight: 700; }
  .agenda-complete-btn { width: 26px; height: 26px; border-radius: 50%; border: 1px solid #333; background: transparent; color: #555; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 10px; transition: all .2s; flex-shrink: 0; margin-left: 8px; }
  .agenda-complete-btn:hover { background: #22c55e; border-color: #22c55e; color: #000; }
</style>
<script>
(function() {
  document.querySelectorAll('.agenda-complete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      try {
        const res = await fetch('/api/vendedor/notes?id=' + id, { method: 'PATCH' });
        if (res.ok) {
          btn.innerHTML = '<i class="fas fa-check" style="color:#22c55e"></i>';
          setTimeout(() => {
            const item = btn.closest('.agenda-item');
            if (item) { item.style.opacity = '0'; item.style.transition = 'opacity .3s'; setTimeout(() => item.remove(), 300); }
          }, 600);
        }
      } catch(e) { console.error(e); btn.innerHTML = '<i class="fas fa-check"></i>'; }
    });
  });
})();
</script>`;

    return new Response(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
};
