/**
 * Core uniqueness logic for bulto insertion.
 *
 * Business rules (same barcode, same Madrid day):
 * 1. No existing record → insert
 * 2. Same user_id → update (correction)
 * 3. Different user_id:
 *    a. New volume > existing volume → replace
 *    b. New volume ≤ existing volume → discard silently
 *    c. Neither has volume → newest by fecha_hora_utc wins
 */

/**
 * Apply uniqueness rule given an optional existing record and a new record.
 *
 * @param {object} client - pg client with .query()
 * @param {object|null} existing - existing DB row or null
 * @param {object} incoming - new record data
 * @returns {Promise<{ action: string, record: object|null }>}
 */
async function applyUniquenessRule(client, existing, incoming) {
  const {
    codigo_barras,
    alto_cm,
    ancho_cm,
    largo_cm,
    volumen_m3,
    peso_kg,
    user_id,
    plataforma,
    fecha_hora_utc,
  } = incoming;

  if (!existing) {
    // Rule 1: No record today → insert
    const result = await client.query(
      `INSERT INTO bultos (codigo_barras, alto_cm, ancho_cm, largo_cm, volumen_m3, peso_kg, user_id, plataforma, fecha_hora_utc)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        codigo_barras,
        alto_cm,
        ancho_cm,
        largo_cm,
        volumen_m3,
        peso_kg,
        user_id,
        plataforma,
        fecha_hora_utc,
      ]
    );
    return { action: 'inserted', record: result.rows[0] };
  }

  if (existing.user_id === user_id) {
    // Rule 2: Same user → update (correction)
    const result = await client.query(
      `UPDATE bultos
       SET alto_cm = $1, ancho_cm = $2, largo_cm = $3, volumen_m3 = $4, peso_kg = $5,
           plataforma = $6, fecha_hora_utc = $7, updated_at = now()
       WHERE id = $8
       RETURNING *`,
      [
        alto_cm,
        ancho_cm,
        largo_cm,
        volumen_m3,
        peso_kg,
        plataforma,
        fecha_hora_utc,
        existing.id,
      ]
    );
    return { action: 'updated', record: result.rows[0] };
  }

  // Rule 3: Different user
  const existingVol = existing.volumen_m3 != null ? Number(existing.volumen_m3) : null;
  const newVol = volumen_m3 != null ? Number(volumen_m3) : null;

  if (newVol == null && existingVol == null) {
    // Rule 3c: Neither has volume → newest timestamp wins
    const incomingTs = new Date(fecha_hora_utc).getTime();
    const existingTs = new Date(existing.fecha_hora_utc).getTime();

    if (incomingTs <= existingTs) {
      return { action: 'discarded', record: existing };
    }

    const result = await client.query(
      `UPDATE bultos
       SET alto_cm = $1, ancho_cm = $2, largo_cm = $3, volumen_m3 = $4, peso_kg = $5,
           user_id = $6, plataforma = $7, fecha_hora_utc = $8, updated_at = now()
       WHERE id = $9
       RETURNING *`,
      [
        alto_cm,
        ancho_cm,
        largo_cm,
        volumen_m3,
        peso_kg,
        user_id,
        plataforma,
        fecha_hora_utc,
        existing.id,
      ]
    );
    return { action: 'replaced', record: result.rows[0] };
  }

  if (newVol != null && (existingVol == null || newVol > existingVol)) {
    // Rule 3a: New volume is greater → replace
    const result = await client.query(
      `UPDATE bultos
       SET alto_cm = $1, ancho_cm = $2, largo_cm = $3, volumen_m3 = $4, peso_kg = $5,
           user_id = $6, plataforma = $7, fecha_hora_utc = $8, updated_at = now()
       WHERE id = $9
       RETURNING *`,
      [
        alto_cm,
        ancho_cm,
        largo_cm,
        volumen_m3,
        peso_kg,
        user_id,
        plataforma,
        fecha_hora_utc,
        existing.id,
      ]
    );
    return { action: 'replaced', record: result.rows[0] };
  }

  // Rule 3b: New volume ≤ existing volume → discard
  return { action: 'discarded', record: existing };
}

module.exports = { applyUniquenessRule };
