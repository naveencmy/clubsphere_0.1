import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../../src/app.js';

test('Express App Integration Test Suite', async (t) => {
  let server;
  let baseUrl;

  t.before(async () => {
    // Start temporary test server on random available port
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  t.after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  await t.test('GET /health returns 200 and healthy gateway payload', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.status, 'UP');
    assert.equal(body.service, 'ClubSphere API Gateway');
  });

  await t.test('GET /unknown-route returns 404 NotFoundError standard envelope', async () => {
    const res = await fetch(`${baseUrl}/api/nonexistent-route`);
    assert.equal(res.status, 404);

    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'NOTFOUNDERROR');
  });
});
