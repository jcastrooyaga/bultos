'use strict';

const { applyUniquenessRule } = require('../utils/unicidad');

// Helper to build a mock pg client that tracks queries
function makeMockClient(insertResult, updateResult) {
  const queries = [];

  const client = {
    queries,
    query: jest.fn(async (sql, params) => {
      queries.push({ sql: sql.trim().replace(/\s+/g, ' '), params });

      if (/^INSERT/i.test(sql.trim())) {
        return { rows: [insertResult || { id: 'new-id', ...params }] };
      }
      if (/^UPDATE/i.test(sql.trim())) {
        return { rows: [updateResult || { id: 'existing-id' }] };
      }
      return { rows: [] };
    }),
  };

  return client;
}

const BASE_INCOMING = {
  codigo_barras: 'ABC123',
  alto_cm: 10,
  ancho_cm: 20,
  largo_cm: 30,
  volumen_m3: 0.006,
  peso_kg: 5,
  user_id: 'user-1',
  plataforma: 'MAD',
  fecha_hora_utc: '2024-01-15T10:00:00Z',
};

describe('applyUniquenessRule', () => {
  describe('Rule 1: No existing record', () => {
    it('inserts a new record when no existing record', async () => {
      const client = makeMockClient({ id: 'new-id', ...BASE_INCOMING });
      const result = await applyUniquenessRule(client, null, BASE_INCOMING);

      expect(result.action).toBe('inserted');
      expect(client.query).toHaveBeenCalledTimes(1);
      expect(client.queries[0].sql).toMatch(/^INSERT/i);
    });
  });

  describe('Rule 2: Same user', () => {
    it('updates the record when same user sends correction', async () => {
      const existing = {
        id: 'existing-id',
        user_id: 'user-1',
        volumen_m3: 0.004,
        fecha_hora_utc: '2024-01-15T08:00:00Z',
      };
      const client = makeMockClient(null, { id: 'existing-id' });
      const result = await applyUniquenessRule(client, existing, BASE_INCOMING);

      expect(result.action).toBe('updated');
      expect(client.query).toHaveBeenCalledTimes(1);
      expect(client.queries[0].sql).toMatch(/^UPDATE/i);
    });
  });

  describe('Rule 3: Different user', () => {
    describe('3a: New volume greater', () => {
      it('replaces when new volume > existing volume', async () => {
        const existing = {
          id: 'existing-id',
          user_id: 'user-2',
          volumen_m3: 0.003, // smaller
          fecha_hora_utc: '2024-01-15T08:00:00Z',
        };
        const client = makeMockClient(null, { id: 'existing-id' });
        const result = await applyUniquenessRule(client, existing, {
          ...BASE_INCOMING,
          volumen_m3: 0.006, // larger
        });

        expect(result.action).toBe('replaced');
        expect(client.query).toHaveBeenCalledTimes(1);
        expect(client.queries[0].sql).toMatch(/^UPDATE/i);
      });

      it('replaces when new has volume but existing does not', async () => {
        const existing = {
          id: 'existing-id',
          user_id: 'user-2',
          volumen_m3: null,
          fecha_hora_utc: '2024-01-15T08:00:00Z',
        };
        const client = makeMockClient(null, { id: 'existing-id' });
        const result = await applyUniquenessRule(client, existing, {
          ...BASE_INCOMING,
          volumen_m3: 0.006,
        });

        expect(result.action).toBe('replaced');
      });
    });

    describe('3b: New volume less than or equal', () => {
      it('discards when new volume < existing volume', async () => {
        const existing = {
          id: 'existing-id',
          user_id: 'user-2',
          volumen_m3: 0.010, // larger
          fecha_hora_utc: '2024-01-15T08:00:00Z',
        };
        const client = makeMockClient(null, { id: 'existing-id' });
        const result = await applyUniquenessRule(client, existing, {
          ...BASE_INCOMING,
          volumen_m3: 0.006, // smaller
        });

        expect(result.action).toBe('discarded');
        expect(client.query).not.toHaveBeenCalled();
      });

      it('discards when new volume equals existing volume', async () => {
        const existing = {
          id: 'existing-id',
          user_id: 'user-2',
          volumen_m3: 0.006,
          fecha_hora_utc: '2024-01-15T08:00:00Z',
        };
        const client = makeMockClient(null, { id: 'existing-id' });
        const result = await applyUniquenessRule(client, existing, {
          ...BASE_INCOMING,
          volumen_m3: 0.006,
        });

        expect(result.action).toBe('discarded');
        expect(client.query).not.toHaveBeenCalled();
      });

      it('discards when new has no volume but existing does', async () => {
        const existing = {
          id: 'existing-id',
          user_id: 'user-2',
          volumen_m3: 0.010,
          fecha_hora_utc: '2024-01-15T08:00:00Z',
        };
        const client = makeMockClient(null, { id: 'existing-id' });
        const result = await applyUniquenessRule(client, existing, {
          ...BASE_INCOMING,
          volumen_m3: null,
        });

        expect(result.action).toBe('discarded');
        expect(client.query).not.toHaveBeenCalled();
      });
    });

    describe('3c: Neither has volume → newest timestamp wins', () => {
      it('replaces when incoming is newer', async () => {
        const existing = {
          id: 'existing-id',
          user_id: 'user-2',
          volumen_m3: null,
          fecha_hora_utc: '2024-01-15T08:00:00Z', // older
        };
        const client = makeMockClient(null, { id: 'existing-id' });
        const result = await applyUniquenessRule(client, existing, {
          ...BASE_INCOMING,
          volumen_m3: null,
          fecha_hora_utc: '2024-01-15T10:00:00Z', // newer
        });

        expect(result.action).toBe('replaced');
      });

      it('discards when incoming is older', async () => {
        const existing = {
          id: 'existing-id',
          user_id: 'user-2',
          volumen_m3: null,
          fecha_hora_utc: '2024-01-15T12:00:00Z', // newer
        };
        const client = makeMockClient(null, { id: 'existing-id' });
        const result = await applyUniquenessRule(client, existing, {
          ...BASE_INCOMING,
          volumen_m3: null,
          fecha_hora_utc: '2024-01-15T10:00:00Z', // older
        });

        expect(result.action).toBe('discarded');
        expect(client.query).not.toHaveBeenCalled();
      });

      it('discards when incoming has same timestamp as existing', async () => {
        const ts = '2024-01-15T10:00:00Z';
        const existing = {
          id: 'existing-id',
          user_id: 'user-2',
          volumen_m3: null,
          fecha_hora_utc: ts,
        };
        const client = makeMockClient(null, { id: 'existing-id' });
        const result = await applyUniquenessRule(client, existing, {
          ...BASE_INCOMING,
          volumen_m3: null,
          fecha_hora_utc: ts,
        });

        expect(result.action).toBe('discarded');
        expect(client.query).not.toHaveBeenCalled();
      });
    });
  });
});
