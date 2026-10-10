import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { pool } from "../../src/config/db.js";
import { migrateAuthAccounts } from "../../src/config/migrateAuthAccounts.js";

const server = app.listen(0);
await new Promise((resolve) => server.once("listening", resolve));
const baseURL = `http://localhost:${server.address().port}`;
const emails = [];
const headers = {
  "content-type": "application/json",
  origin: "http://localhost:5173",
};
const request = (path, body, cookie) =>
  fetch(`${baseURL}/api/auth/${path}`, {
    method: body ? "POST" : "GET",
    headers: { ...headers, ...(cookie ? { cookie } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
const accountEmail = () => {
  const email = `auth-test-${randomUUID()}@example.test`;
  emails.push(email);
  return email;
};

after(async () => {
  await pool.query("DELETE FROM users WHERE email = ANY($1::citext[])", [
    emails,
  ]);
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

test("Better Auth signs up, hashes passwords, preserves safe roles and issues/revokes a real session", async () => {
  const email = accountEmail();
  const password = `${randomUUID()}aA!`;
  const signup = await request("session/sign-up/email", {
    name: "Authentication Test",
    email,
    password,
    systemRole: "SUPER_ADMIN",
  });
  assert.equal(signup.status, 200, await signup.clone().text());
  const result = await signup.json();
  const cookie = signup.headers.get("set-cookie").split(";")[0];
  assert.match(signup.headers.get("set-cookie"), /httponly/i);
  assert.equal(result.user.systemRole, "STUDENT_USER");
  const stored = await pool.query(
    "SELECT a.password FROM accounts a WHERE a.user_id = $1 AND a.provider_id = 'credential'",
    [result.user.id],
  );
  assert.notEqual(stored.rows[0].password, password);
  assert.equal(await bcrypt.compare(password, stored.rows[0].password), true);
  const session = await request("session/get-session", null, cookie);
  assert.equal((await session.json()).user.id, result.user.id);
  const workspace = await request("workspace", null, cookie);
  assert.equal(workspace.status, 200);
  assert.deepEqual((await workspace.json()).memberships, []);
  const protectedProfile = await request("me", null, cookie);
  assert.equal(protectedProfile.status, 200);
  assert.equal((await protectedProfile.json()).data.user.id, result.user.id);
  const signout = await request("session/sign-out", {}, cookie);
  assert.equal(signout.status, 200);
  assert.equal(
    await (await request("session/get-session", null, cookie)).json(),
    null,
  );
  assert.equal((await request("workspace", null, cookie)).status, 401);
});

test("Better Auth rejects wrong passwords, duplicates and untrusted origins", async () => {
  const email = accountEmail();
  const password = `${randomUUID()}aA!`;
  assert.equal(
    (
      await request("session/sign-up/email", {
        name: "Authentication Test",
        email,
        password,
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await request("session/sign-in/email", {
        email,
        password: "incorrect-password",
      })
    ).status,
    401,
  );
  assert.ok(
    (
      await request("session/sign-up/email", {
        name: "Duplicate Test",
        email,
        password,
      })
    ).status >= 400,
  );
  const blocked = await fetch(`${baseURL}/api/auth/session/sign-in/email`, {
    method: "POST",
    headers: { ...headers, origin: "https://untrusted.example" },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(blocked.status, 403);
});

test("existing bcrypt credential accounts can sign in through Better Auth", async () => {
  const email = accountEmail();
  const userId = randomUUID();
  const password = `${randomUUID()}aA!`;
  await pool.query("INSERT INTO users (id, name, email) VALUES ($1, $2, $3)", [
    userId,
    "Existing Account Test",
    email,
  ]);
  await pool.query(
    "INSERT INTO accounts (id, user_id, account_id, provider_id, password) VALUES ($1, $2, $3, 'credential', $4)",
    [randomUUID(), userId, email, await bcrypt.hash(password, 10)],
  );
  await migrateAuthAccounts();
  const login = await request("session/sign-in/email", { email, password });
  assert.equal(login.status, 200, await login.clone().text());
  assert.equal((await login.json()).user.id, userId);
});
