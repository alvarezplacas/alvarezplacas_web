import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';
import { parse } from 'csv-parse/sync';
import { Placa } from '../domain/placa.js';
import { logger } from '../core/utils.js';

/**
 * Gestiona la carga y transformación de datos desde fuentes externas (Excel, CSV).
 */
export class DataManager {
    static loadExcel(filePath, sheetName) {
        try {
            const workbook = xlsx.readFile(filePath);
            const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName] || workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
            return data;
        } catch (error) {
            logger.error(`Error cargando Excel ${filePath}: ${error.message}`);
            return [];
        }
    }

    static loadCSV(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return parse(content, { columns: true, skip_empty_lines: true });
        } catch (error) {
            logger.error(`Error cargando CSV ${filePath}: ${error.message}`);
            return [];
        }
    }

    /**
     * Procesa una lista de filas crudas y las convierte en objetos de Dominio (Placa).
     */
    static processToPlacas(rawData, marcaDefault = "") {
        return rawData.map((row, index) => {
            return new Placa({
                id: (index + 1).toString(),
                marca: row.MARCA || marcaDefault,
                nombre: row.NOMBRE || "",
                codigo: row.CODIGO || "",
                linea: row.LINEA || row.GRUPO || "",
                textura: row.TEXTURA || row.ACABADO || "",
                color: row.COLOR || "",
                medida: row.MEDIDA || ""
            });
        });
    }
}
