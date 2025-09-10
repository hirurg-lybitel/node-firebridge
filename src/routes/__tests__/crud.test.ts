import request from 'supertest';
import app from '../../app';

describe('CRUD API', () => {
  const testTable = 'TEST_TABLE';
  let createdId: any;

  it('GET /api/crud/:table/count', async () => {
    const res = await request(app).get(`/api/crud/${testTable}/count`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.count).toBe('number');
  });

  it('POST /api/crud/:table', async () => {
    const res = await request(app)
      .post(`/api/crud/${testTable}`)
      .send({ NAME: 'test', VALUE: 123 });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    createdId = res.body.data.id;
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
      .send({ VALUE: 456 });
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
