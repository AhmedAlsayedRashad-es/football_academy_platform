import { SignJWT } from "jose";
import mysql from "mysql2/promise";

const COOKIE_NAME = "app_session_id";
const ROLES = new Set([
  "admin",
  "coach",
  "parent",
  "player",
  "nutritionist",
  "mental_coach",
  "physical_trainer",
]);

function sessionSecret() {
  return new TextEncoder().encode(process.env.JWT_SECRET || "dev-auth-secret");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  const data = raw ? JSON.parse(raw) : {};

  const email = String(data.email || "demo@ahlyacademy.com").trim().toLowerCase() || "demo@ahlyacademy.com";
  const role = ROLES.has(data.role) ? data.role : "admin";
  const name = String(data.name || "").trim() || email.split("@")[0] || "Demo User";
  const openId = `demo_${email.replace(/[^a-z0-9]+/g, "_")}`.slice(0, 64);

  if (process.env.DATABASE_URL) {
    const uri = process.env.DATABASE_URL.replace(/[?&]ssl-mode=[^&]*/gi, "");
    const connection = await mysql.createConnection({
      uri,
      ssl: { rejectUnauthorized: false },
    });
    await connection.execute(
      `INSERT INTO users (openId, name, email, role, accountStatus, loginMethod, lastSignedIn)
       VALUES (?, ?, ?, ?, 'approved', 'demo', NOW())
       ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role), accountStatus = 'approved', lastSignedIn = NOW()`,
      [openId, name, email, role]
    );
    await connection.end();
  }

  const token = await new SignJWT({
    openId,
    appId: process.env.VITE_APP_ID || "football-academy-local",
    name,
    role,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(Math.floor(Date.now() / 1000) + 60 * 60 * 24)
    .sign(sessionSecret());

  const forwarded = req.headers["x-forwarded-proto"] || "";
  const secure = forwarded.includes("https");
  const cookie = [
    `${COOKIE_NAME}=${token}`,
    "Path=/",
    "HttpOnly",
    "Max-Age=86400",
    secure ? "SameSite=None" : "SameSite=Lax",
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");

  res.setHeader("Set-Cookie", cookie);
  res.setHeader("Content-Type", "application/json");
  res.statusCode = 200;
  res.end(JSON.stringify({ success: true, role }));
}
