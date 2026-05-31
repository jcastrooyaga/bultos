const express = require('express');
const pool = require('../db');
const { getMadridDayBounds } = require('../utils/timezone');
const { applyUniquenessRule } = require('../utils/unicidad');

const router = express.Router();

// GET /api/bultos/hoy
router.get('/hoy', async (req, res) => {
  try {
    const { startUtc, endUtc } = getMadridDayBounds();
    const result = await pool.query(
      `SELECT * FROM bultos
       WHERE user_id = $1
         AND fecha_hora_utc >= $2
         AND fecha_hora_utc <= $3
       ORDER BY fecha_hora_utc DESC`,
      [req.user.id, startUtc, endUtc]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/bultos
router.post('/', async (req, res) => {
  const { codigo_barras, alto_cm, ancho_cm, largo_cm, peso_kg, fecha_hora_utc } = req.body;
  if (!codigo_barras) {
    return res.status(400).json({ error: 'codigo_barras is required' });
  }
  if (!fecha_hora_utc) {
    return res.status(400).json({ error: 'fecha_hora_utc is required' });
  }

  // Compute volumen_m3 if dimensions provided
  let volumen_m3 = null;
  if (alto_cm != null && ancho_cm != null && largo_cm != null) {
    volumen_m3 = (Number(alto_cm) * Number(ancho_cm) * Number(largo_cm)) / 1_000_000;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { startUtc, endUtc } = getMadridDayBounds(fecha_hora_utc);

    // Find existing record for same barcode on same Madrid day
    const existing = await client.query(
      `SELECT * FROM bultos
       WHERE codigo_barras = $1
         AND fecha_hora_utc >= $2
         AND fecha_hora_utc <= $3
       FOR UPDATE`,
      [codigo_barras, startUtc, endUtc]
    );

    const newRecord = {
      codigo_barras,
      alto_cm: alto_cm ?? null,
      ancho_cm: ancho_cm ?? null,
      largo_cm: largo_cm ?? null,
      volumen_m3,
      peso_kg: peso_kg ?? null,
      user_id: req.user.id,
      plataforma: req.user.plataforma,
      fecha_hora_utc,
    };

    const { action, record } = await applyUniquenessRule(
      client,
      existing.rows[0] || null,
      newRecord
    );

    await client.query('COMMIT');
    return res.status(action === 'inserted' ? 201 : 200).json({ action, bulto: record });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// POST /api/bultos/batch
router.post('/batch', async (req, res) => {
  const { records } = req.body;
  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: 'records must be a non-empty array' });
  }

  const results = [];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const item of records) {
      const { codigo_barras, alto_cm, ancho_cm, largo_cm, peso_kg, fecha_hora_utc } = item;
      if (!codigo_barras || !fecha_hora_utc) {
        results.push({ codigo_barras, action: 'error', reason: 'missing required fields' });
        continue;
      }

      let volumen_m3 = null;
      if (alto_cm != null && ancho_cm != null && largo_cm != null) {
        volumen_m3 = (Number(alto_cm) * Number(ancho_cm) * Number(largo_cm)) / 1_000_000;
      }

      const { startUtc, endUtc } = getMadridDayBounds(fecha_hora_utc);

      const existing = await client.query(
        `SELECT * FROM bultos
         WHERE codigo_barras = $1
           AND fecha_hora_utc >= $2
           AND fecha_hora_utc <= $3
         FOR UPDATE`,
        [codigo_barras, startUtc, endUtc]
      );

      const newRecord = {
        codigo_barras,
        alto_cm: alto_cm ?? null,
        ancho_cm: ancho_cm ?? null,
        largo_cm: largo_cm ?? null,
        volumen_m3,
        peso_kg: peso_kg ?? null,
        user_id: req.user.id,
        plataforma: req.user.plataforma,
        fecha_hora_utc,
      };

      const { action, record } = await applyUniquenessRule(
        client,
        existing.rows[0] || null,
        newRecord
      );

      results.push({ codigo_barras, action, id: record?.id });
    }

    await client.query('COMMIT');
    return res.json({ results });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// PUT /api/bultos/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { alto_cm, ancho_cm, largo_cm, peso_kg, fecha_hora_utc } = req.body;

  try {
    const existing = await pool.query(
      'SELECT * FROM bultos WHERE id = $1',
      [id]
    );
    if (!existing.rows.length) {
      return res.status(404).json({ error: 'Bulto not found' });
    }
    const bulto = existing.rows[0];
    if (bulto.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Cannot edit another user\'s record' });
    }

    const newAlto = alto_cm ?? bulto.alto_cm;
    const newAncho = ancho_cm ?? bulto.ancho_cm;
    const newLargo = largo_cm ?? bulto.largo_cm;

    let volumen_m3 = bulto.volumen_m3;
    if (newAlto != null && newAncho != null && newLargo != null) {
      volumen_m3 = (Number(newAlto) * Number(newAncho) * Number(newLargo)) / 1_000_000;
    }

    const result = await pool.query(
      `UPDATE bultos
       SET alto_cm = $1, ancho_cm = $2, largo_cm = $3, volumen_m3 = $4,
           peso_kg = $5, fecha_hora_utc = COALESCE($6, fecha_hora_utc), updated_at = now()
       WHERE id = $7
       RETURNING *`,
      [
        newAlto,
        newAncho,
        newLargo,
        volumen_m3,
        peso_kg ?? bulto.peso_kg,
        fecha_hora_utc || null,
        id,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
