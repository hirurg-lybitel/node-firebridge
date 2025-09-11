import request from 'supertest';
import app from '../../app';

describe('CRUD API', () => {
  const testTable = 'TEST_TABLE';
  let createdId: any;

  beforeAll(async () => {
    // Create test table
    await request(app)
      .post('/api/query/command')
      .send({
        sql: `CREATE TABLE ${testTable} (ID INTEGER NOT NULL PRIMARY KEY, NAME VARCHAR(100), RATE INTEGER)`
      });
  });

  afterAll(async () => {
    // Drop test table
    await request(app)
      .post('/api/query/command')
      .send({
        sql: `DROP TABLE ${testTable}`
      });
  });

  it('POST /api/crud/:table', async () => {
    const res = await request(app)
      .post(`/api/crud/${testTable}`)
      .send({ ID: 1, NAME: 'test', RATE: 123 });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    createdId = res.body.data.id;
  });

  it('GET /api/crud/:table/count', async () => {
    const res = await request(app).get(`/api/crud/${testTable}/count`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.count).toBe('number');
  });

  it('GET /api/crud/:table', async () => {
    const res = await request(app).get(`/api/crud/${testTable}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/crud/:table/:id', async () => {
    const res = await request(app).get(`/api/crud/${testTable}/${createdId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('PUT /api/crud/:table/:id', async () => {
    const res = await request(app)
      .put(`/api/crud/${testTable}/${createdId}`)
      .send({ RATE: 456 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.affectedRows).toBeGreaterThan(0);
  });

  it('DELETE /api/crud/:table/:id', async () => {
    const res = await request(app).delete(`/api/crud/${testTable}/${createdId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.affectedRows).toBeGreaterThan(0);
  });
});
