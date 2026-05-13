/**
 * API: save-cubical.ts
 * Guarda proyectos de CubiCal PRO y genera leads de venta.
 */
import { directus } from '@conexiones/directus.js';
import { createItem } from '@directus/sdk';

export const POST = async ({ request }) => {
    try {
        const data = await request.json();
        const { clientId, name, env, modules, results, isQuote } = data;

        if (!clientId) {
            return new Response(JSON.stringify({ success: false, message: 'No session' }), { status: 401 });
        }

        // 1. Guardar Proyecto en CubiCal
        const proyecto = await directus.request(createItem('cubical_proyectos', {
            cliente_id: clientId,
            nombre_proyecto: name,
            tipo_ambiente: env,
            modulos: modules,
            resultado_placas: results.opt,
            resultado_herrajes: results.hw,
            total_m2_placa: parseFloat(results.opt.stats.totalM2),
            status: isQuote ? 'presupuestado' : 'guardado'
        }));

        // 2. Si es presupuesto, crear LEAD en Pedidos
        if (isQuote) {
            await directus.request(createItem('pedidos', {
                cliente_id: clientId,
                status: 'pendiente',
                datos_optimizacion: {
                    tipo: 'cubical',
                    proyecto_id: proyecto.id,
                    resumen: {
                        placas: results.opt.stats.count,
                        m2: results.opt.stats.totalM2,
                        herrajes: results.hw.length
                    }
                },
                resumen_visible: true
            }));
        }

        return new Response(JSON.stringify({ success: true, id: proyecto.id }), { status: 200 });

    } catch (e) {
        console.error("Error saving CubiCal:", e);
        return new Response(JSON.stringify({ success: false, message: e.message }), { status: 500 });
    }
};
