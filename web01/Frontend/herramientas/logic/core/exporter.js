/**
 * SmartCut Exporter - (v1.0)
 * Generación de archivos técnicos para Lepton Optimizer (.ped).
 */

export class SmartCutExporter {
    static generatePED(project, optimizedData) {
        let content = "METAV2\n";
        content += `${project.brand}.ppp\n`;
        content += "LEPTON OPTIMIZER\n";
        content += "5\n"; // Versión del formato

        // Listado de piezas en formato Lepton
        project.pieces.forEach(p => {
            // Formato: Cantidad, Largo, Alto, Rotar, Material, Tapacantos...
            content += `${p.q},${p.l},${p.h},${p.canRotate ? 1 : 0},,0,,,0,0,0,0,0,0,0,0,0,0,0,0,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,\n`;
        });

        content += "----------TAPACANTOS\n";
        // Espacios para definiciones de tapacantos (simplificado)
        for(let i=0; i<15; i++) content += "      \n";
        
        content += "eof\n";
        content += `${project.brand}.stk\neof\n`;
        
        // Configuración de la placa
        content += `${project.brand}.cfg\n_LEPTON_\n5\n`;
        content += `${project.brand.padEnd(70)}\n`;
        content += "1     \n1     \n168\nNO USADO\n";
        content += `${project.w * 10}\n${project.h * 10}\n`; // Lepton usa 1/10 mm
        content += " 40.0\n      1.00\n900\n2\n";
        
        content += "eof\n";
        return content;
    }

    static download(filename, text) {
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }
}
