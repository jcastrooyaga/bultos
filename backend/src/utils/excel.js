const ExcelJS = require('exceljs');
const { toMadridTime } = require('./timezone');

/**
 * Generates an Excel workbook buffer from bultos records.
 * @param {Array} rows - Array of bulto records from DB
 * @returns {Promise<Buffer>}
 */
async function generateBultosExcel(rows) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Bultos';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Bultos');

  sheet.columns = [
    { header: 'Fecha', key: 'fecha', width: 14 },
    { header: 'Hora', key: 'hora', width: 10 },
    { header: 'Código de barras', key: 'codigo_barras', width: 22 },
    { header: 'Plataforma', key: 'plataforma', width: 16 },
    { header: 'Operario', key: 'operario', width: 20 },
    { header: 'Alto (cm)', key: 'alto_cm', width: 12 },
    { header: 'Ancho (cm)', key: 'ancho_cm', width: 12 },
    { header: 'Largo (cm)', key: 'largo_cm', width: 12 },
    { header: 'Volumen (m³)', key: 'volumen_m3', width: 14 },
    { header: 'Peso (kg)', key: 'peso_kg', width: 12 },
  ];

  // Style header row
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9E1F2' },
  };

  const decimalFmt = '#.##0,00';

  for (const row of rows) {
    const madridDate = toMadridTime(row.fecha_hora_utc, 'DD/MM/YYYY');
    const madridTime = toMadridTime(row.fecha_hora_utc, 'HH:mm');

    const dataRow = sheet.addRow({
      fecha: madridDate,
      hora: madridTime,
      codigo_barras: row.codigo_barras,
      plataforma: row.plataforma,
      operario: row.nombre || '',
      alto_cm: row.alto_cm != null ? Number(row.alto_cm) : null,
      ancho_cm: row.ancho_cm != null ? Number(row.ancho_cm) : null,
      largo_cm: row.largo_cm != null ? Number(row.largo_cm) : null,
      volumen_m3: row.volumen_m3 != null ? Number(row.volumen_m3) : null,
      peso_kg: row.peso_kg != null ? Number(row.peso_kg) : null,
    });

    // Apply Spanish decimal format to numeric columns
    ['alto_cm', 'ancho_cm', 'largo_cm', 'volumen_m3', 'peso_kg'].forEach((key) => {
      const cell = dataRow.getCell(key);
      if (cell.value != null) {
        cell.numFmt = decimalFmt;
      }
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

module.exports = { generateBultosExcel };
