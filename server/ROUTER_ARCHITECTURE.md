# Router Architecture

## Overview
The main application router is defined in `routers.ts` (14,682 lines).

## Already Extracted Into Separate Files
- `performanceRouter.ts` — player performance metrics
- `parentDashboardRouter.ts` — parent portal
- `parentEducation.ts` — parent education content
- `progressReportRouter.ts` — progress reports
- `messagingRouter.ts` — internal messaging
- `routers_new_features.ts` — QR check-in, social media, referral, etc.

## Recommended Next Splits (by priority)
1. **playersRouter.ts** — lines 947–1376 (430 lines): player CRUD, public profile, skill scores
2. **matchesRouter.ts** — lines 3060–3258 (198 lines): match management, stats
3. **trainingRouter.ts** — lines 2465–2605 (140 lines): training sessions
4. **financeRouter.ts** — lines 13926–14293 (367 lines): fees, scholarships, staff costs
5. **mediaRouter.ts** — lines 5861–6078 (217 lines): academy videos, video events
6. **tacticsRouter.ts** — lines 9521–9964 (443 lines): tactical analysis

## How to Extract a Router
1. Copy the inline router body (between `router({` and the closing `}),`)
2. Create `server/{domain}Router.ts` with proper imports
3. Replace the inline body in `routers.ts` with the imported router
4. Run `pnpm dev` and verify no TypeScript errors

## Shared Imports Required
All extracted routers need:
```ts
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { eq, desc, sql, and, or, gte, lte, inArray } from "drizzle-orm";
import { /* relevant schema tables */ } from "../drizzle/schema";
```
