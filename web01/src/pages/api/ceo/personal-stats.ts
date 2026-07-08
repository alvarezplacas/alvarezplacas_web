import type { APIRoute } from 'astro';
import { query } from '@conexiones/lib/db.js';

export const GET: APIRoute = async ({ url, cookies }) => {
    const adminSession = cookies.get('admin_session')?.value;
    const sellerSession = cookies.get('seller_session')?.value;

    if (!adminSession && !sellerSession) {
        return new Response('No autorizado', { status: 401 });
    }

    try {
        const periodo = url.searchParams.get('periodo') || 'dia';

        // Helper functions for Javier Alvarez (simulated perfect attendance)
        const getWeekdaysCount = (p: string): number => {
            const today = new Date();
            let start = new Date();
            if (p === 'dia') {
                const day = today.getDay();
                return (day !== 0 && day !== 6) ? 1 : 0;
            } else if (p === 'semana') {
                const day = today.getDay();
                const diff = today.getDate() - day + (day === 0 ? -6 : 1);
                start = new Date(today.setDate(diff));
            } else if (p === 'mes') {
                start = new Date(today.getFullYear(), today.getMonth(), 1);
            } else if (p === 'anio') {
                start = new Date(today.getFullYear(), 0, 1);
            }
            const end = new Date();
            let count = 0;
            const curDate = new Date(start);
            while (curDate <= end) {
                const dayOfWeek = curDate.getDay();
                if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                    count++;
                }
                curDate.setDate(curDate.getDate() + 1);
            }
            return count;
        };

        const getPeriodStartDate = (p: string): Date => {
            const today = new Date();
            if (p === 'dia') {
                return new Date(today);
            } else if (p === 'semana') {
                const day = today.getDay();
                const diff = today.getDate() - day + (day === 0 ? -6 : 1);
                return new Date(today.setDate(diff));
            } else if (p === 'mes') {
                return new Date(today.getFullYear(), today.getMonth(), 1);
            } else if (p === 'anio') {
                return new Date(today.getFullYear(), 0, 1);
            }
            return today;
        };

        // Determine date range based on period
        let dateFilter = '';
        switch (periodo) {
            case 'semana':
                dateFilter = `AND DATE(a.timestamp) >= DATE_TRUNC('week', CURRENT_DATE)`;
                break;
            case 'mes':
                dateFilter = `AND DATE(a.timestamp) >= DATE_TRUNC('month', CURRENT_DATE)`;
                break;
            case 'anio':
                dateFilter = `AND DATE(a.timestamp) >= DATE_TRUNC('year', CURRENT_DATE)`;
                break;
            default: // 'dia'
                dateFilter = `AND DATE(a.timestamp) = CURRENT_DATE`;
        }

        // Get hours worked and attendance per employee for the period
        const statsRes = await query(`
            SELECT 
                c.id,
                c.nombre,
                c.funcion,
                c.sueldo_base,
                c.id_reloj,
                c.horas_extras_manual,
                c.indumentaria_entregada,
                c.fecha_entrega_indumentaria,
                c.observaciones,
                c.adelantos,
                c.es_externo,
                c.horas_trabajadas_manual,
                c.basico_recibo,
                c.antiguedad_anos,
                c.no_remunerativo_basico,
                c.es_media_jornada,
                COUNT(DISTINCT a.dia) as dias_presentes,
                SUM(
                    CASE 
                        WHEN a.daily_hours IS NOT NULL THEN a.daily_hours
                        ELSE 0 
                    END
                ) as horas_totales
            FROM control_personal c
            LEFT JOIN (
                SELECT 
                    id_reloj,
                    DATE(timestamp) as dia,
                    EXTRACT(EPOCH FROM (MAX(timestamp) - MIN(timestamp))) / 3600.0 as daily_hours
                FROM control_asistencias
                WHERE 1=1 ${dateFilter.replace('a.timestamp', 'timestamp')}
                GROUP BY id_reloj, DATE(timestamp)
            ) a ON c.id_reloj = a.id_reloj
            GROUP BY c.id, c.nombre, c.funcion, c.sueldo_base, c.id_reloj, c.horas_extras_manual, c.indumentaria_entregada, c.fecha_entrega_indumentaria, c.observaciones, c.adelantos, c.es_externo, c.horas_trabajadas_manual, c.basico_recibo, c.antiguedad_anos, c.no_remunerativo_basico, c.es_media_jornada
            ORDER BY c.nombre ASC
        `);

        // Get absent employees (today specifically for alerts)
        const ausentesRes = await query(`
            SELECT 
                c.id, c.nombre, c.funcion,
                COUNT(DISTINCT DATE(a.timestamp)) as faltas_mes
            FROM control_personal c
            LEFT JOIN control_asistencias a 
                ON c.id_reloj = a.id_reloj 
                AND DATE(a.timestamp) >= DATE_TRUNC('month', CURRENT_DATE)
                AND DATE(a.timestamp) <= CURRENT_DATE
            WHERE c.id_reloj IS NOT NULL
                AND c.es_externo = FALSE
                AND c.id NOT IN (
                    SELECT DISTINCT cp.id 
                    FROM control_personal cp
                    JOIN control_asistencias ca ON cp.id_reloj = ca.id_reloj
                    WHERE DATE(ca.timestamp) = CURRENT_DATE
                )
            GROUP BY c.id, c.nombre, c.funcion
            ORDER BY c.nombre ASC
        `);

        // Get daily detail for the period (for table display)
        const detailRes = await query(`
            SELECT 
                c.id,
                c.nombre,
                c.funcion,
                DATE(a.timestamp) as dia,
                MIN(a.timestamp) as entrada,
                MAX(a.timestamp) as salida,
                ROUND(
                    EXTRACT(EPOCH FROM (MAX(a.timestamp) - MIN(a.timestamp))) / 3600.0, 
                    2
                ) as horas_trabajadas,
                GREATEST(0, ROUND(
                    EXTRACT(EPOCH FROM (MAX(a.timestamp) - MIN(a.timestamp))) / 3600.0 - 8, 
                    2
                )) as horas_extras
            FROM control_personal c
            JOIN control_asistencias a ON c.id_reloj = a.id_reloj
            WHERE 1=1 ${dateFilter.replace('a.timestamp', 'a.timestamp')}
            GROUP BY c.id, c.nombre, c.funcion, DATE(a.timestamp)
            ORDER BY DATE(a.timestamp) DESC, c.nombre ASC
        `);

        // Count work days in period (to calculate expected attendance)
        const workDaysRes = await query(`
            SELECT COUNT(DISTINCT DATE(timestamp)) as dias_con_fichadas
            FROM control_asistencias
            WHERE 1=1 ${dateFilter.replace('a.timestamp', 'timestamp')}
        `);

        const diasConFichadas = parseInt(workDaysRes.rows[0]?.dias_con_fichadas || '0');

        // Build response with faltas_mes for each employee
        const faltasMesRes = await query(`
            SELECT 
                c.id,
                (
                    SELECT COUNT(DISTINCT DATE(a2.timestamp))
                    FROM control_asistencias a2
                    WHERE a2.id_reloj = c.id_reloj
                    AND DATE(a2.timestamp) >= DATE_TRUNC('month', CURRENT_DATE)
                    AND DATE(a2.timestamp) <= CURRENT_DATE
                ) as dias_presentes_mes,
                (
                    SELECT COUNT(*) 
                    FROM generate_series(
                        DATE_TRUNC('month', CURRENT_DATE)::date,
                        CURRENT_DATE,
                        '1 day'::interval
                    ) as gs(day)
                    WHERE EXTRACT(DOW FROM gs.day) NOT IN (0, 6)
                ) - (
                    SELECT COUNT(DISTINCT DATE(a2.timestamp))
                    FROM control_asistencias a2
                    WHERE a2.id_reloj = c.id_reloj
                    AND DATE(a2.timestamp) >= DATE_TRUNC('month', CURRENT_DATE)
                    AND DATE(a2.timestamp) <= CURRENT_DATE
                ) as faltas_mes
            FROM control_personal c
            WHERE c.id_reloj IS NOT NULL
        `);

        const faltasMesMap: Record<number, number> = {};
        faltasMesRes.rows.forEach((r: any) => {
            faltasMesMap[r.id] = Math.max(0, parseInt(r.faltas_mes || '0'));
        });

        // Filter out Javier from today's absent list if today is a weekday
        const today = new Date();
        const isTodayWeekday = today.getDay() !== 0 && today.getDay() !== 6;
        let ausentes = ausentesRes.rows || [];
        if (isTodayWeekday) {
            ausentes = ausentes.filter((r: any) => r.id !== 13 && r.id_reloj !== '999' && !(r.nombre && r.nombre.includes("Alvarez, Javier")));
        }

        // Process details: inject simulated entries for Javier
        let details = detailRes.rows.map((r: any) => ({
            ...r,
            horas_trabajadas: parseFloat(r.horas_trabajadas || '0').toFixed(2),
            horas_extras: parseFloat(r.horas_extras || '0').toFixed(2)
        }));

        const javierPersonal = statsRes.rows.find((r: any) => r.id === 13 || r.id_reloj === '999' || (r.nombre && r.nombre.includes("Alvarez, Javier")));
        if (javierPersonal) {
            const startRange = getPeriodStartDate(periodo);
            const endRange = new Date();
            const curDate = new Date(startRange);
            while (curDate <= endRange) {
                const dayOfWeek = curDate.getDay();
                if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                    const dateStr = curDate.toISOString().split('T')[0];
                    details.push({
                        id: javierPersonal.id,
                        nombre: javierPersonal.nombre,
                        funcion: javierPersonal.funcion,
                        dia: dateStr,
                        entrada: `${dateStr}T08:00:00`,
                        salida: `${dateStr}T17:00:00`,
                        horas_trabajadas: "9.00",
                        horas_extras: "1.00"
                    });
                }
                curDate.setDate(curDate.getDate() + 1);
            }
        }

        // Re-sort details by date DESC, name ASC
        details.sort((a: any, b: any) => {
            const dateA = new Date(a.dia).getTime();
            const dateB = new Date(b.dia).getTime();
            if (dateB !== dateA) return dateB - dateA;
            return a.nombre.localeCompare(b.nombre);
        });

        return new Response(JSON.stringify({
            success: true,
            periodo,
            stats: statsRes.rows.map((r: any) => {
                let diasPresentes = parseInt(r.dias_presentes || '0');
                let horasTotales = parseFloat(r.horas_totales || '0');
                let faltasMes = faltasMesMap[r.id] || 0;

                if (r.es_externo || r.id === 13 || r.id_reloj === '999' || (r.nombre && r.nombre.includes("Alvarez, Javier"))) {
                    const weekdays = getWeekdaysCount(periodo);
                    diasPresentes = weekdays;
                    const dailyHours = (r.id === 13 || r.id_reloj === '999' || (r.nombre && r.nombre.includes("Alvarez, Javier")))
                        ? 9.0
                        : parseFloat(r.horas_trabajadas_manual || '8.0');
                    horasTotales = weekdays * dailyHours;
                    faltasMes = 0;
                }

                return {
                    ...r,
                    faltas_mes: faltasMes,
                    horas_totales: horasTotales.toFixed(1),
                    dias_presentes: diasPresentes
                };
            }),
            ausentes: ausentes,
            detalle: details,
            dias_con_fichadas: diasConFichadas
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e: any) {
        console.error("Error fetching personal stats:", e);
        return new Response(JSON.stringify({ success: false, error: e.message }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
