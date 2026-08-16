/**
 * Demo Login Route
 * Allows token-based login for chairman presentation demo accounts.
 * Accessible at: /api/demo-login?token=<jwt>
 * Also provides a guest login endpoint: /api/guest-login?role=<role>
 */
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { upsertUser } from "../db";

// Guest demo accounts with pre-defined roles
const GUEST_ACCOUNTS: Record<string, { openId: string; name: string; role: string }> = {
  admin: { openId: "guest_demo_admin", name: "Demo Admin", role: "admin" },
  coach: { openId: "guest_demo_coach", name: "Demo Coach", role: "coach" },
  parent: { openId: "guest_demo_parent", name: "Demo Parent", role: "parent" },
  player: { openId: "guest_demo_player", name: "Demo Player", role: "player" },
};

export function registerDemoLoginRoute(app: Express) {
  // Guest login endpoint - creates a demo session for quick platform exploration
  app.get("/api/guest-login", async (req: Request, res: Response) => {
    const role = typeof req.query.role === "string" ? req.query.role : "admin";
    const account = GUEST_ACCOUNTS[role] || GUEST_ACCOUNTS.admin;
    
    try {
      // Ensure the guest user exists in the database
      await upsertUser({
        openId: account.openId,
        name: account.name,
        email: `${account.openId}@demo.ahlyacademy.com`,
        role: account.role as any,
        accountStatus: "approved",
        loginMethod: "demo",
        lastSignedIn: new Date(),
      });
      
      // Create a session token for the guest user
      const token = await sdk.createSessionToken(account.openId, {
        name: account.name,
        expiresInMs: 24 * 60 * 60 * 1000, // 24 hours
      });
      
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 24 * 60 * 60 * 1000 });
      // Route each role to their dedicated landing page
      const roleRedirects: Record<string, string> = {
        admin: '/dashboard?demo=true&role=admin',
        coach: '/coach/my-teams?demo=true',
        parent: '/parent-dashboard?demo=true',
        player: '/dashboard?demo=true&role=player',
      };
      const redirectPath = roleRedirects[role] || '/dashboard?demo=true&role=' + role;
      res.redirect(302, redirectPath);
    } catch (error) {
      console.error("[GuestLogin] Error:", error);
      res.status(500).send(`
        <html>
          <body style="font-family: Arial; text-align: center; padding: 50px; background: #1a1a2e; color: white;">
            <h1 style="color: #dc2626;">❌ Guest Login Error</h1>
            <p>An error occurred. Please try again.</p>
            <a href="/" style="color: #3b82f6;">Back to Home</a>
          </body>
        </html>
      `);
    }
  });

  app.get("/api/demo-login", async (req: Request, res: Response) => {
    const token = typeof req.query.token === "string" ? req.query.token : null;

    if (!token) {
      res.status(400).send(`
        <html>
          <body style="font-family: Arial; text-align: center; padding: 50px; background: #1a1a2e; color: white;">
            <h1 style="color: #dc2626;">❌ Demo Login Failed</h1>
            <p>No token provided. Please use the correct demo login URL.</p>
          </body>
        </html>
      `);
      return;
    }

    try {
      // Verify the token is valid
      const session = await sdk.verifySession(token);
      if (!session) {
        res.status(401).send(`
          <html>
            <body style="font-family: Arial; text-align: center; padding: 50px; background: #1a1a2e; color: white;">
              <h1 style="color: #dc2626;">❌ Invalid Token</h1>
              <p>The demo token is invalid or expired. Please contact the administrator.</p>
            </body>
          </html>
        `);
        return;
      }

      // Set the session cookie and redirect to dashboard
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Redirect to dashboard with a welcome message
      res.redirect(302, "/dashboard?demo=true");
    } catch (error) {
      console.error("[DemoLogin] Error:", error);
      res.status(500).send(`
        <html>
          <body style="font-family: Arial; text-align: center; padding: 50px; background: #1a1a2e; color: white;">
            <h1 style="color: #dc2626;">❌ Demo Login Error</h1>
            <p>An error occurred during demo login. Please try again.</p>
          </body>
        </html>
      `);
    }
  });
}
