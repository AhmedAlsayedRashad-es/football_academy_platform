import "dotenv/config";
// Database helper functions for Role-Based Access Control (RBAC)

import { eq, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  customRoles, 
  permissions, 
  rolePermissions, 
  tabs, 
  roleTabs, 
  userRoles,
  permissionAuditLog,
  type CustomRole,
  type Permission,
  type Tab
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== ROLE MANAGEMENT ====================

export async function getAllRoles() {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(customRoles).where(eq(customRoles.isActive, true));
}

export async function getRoleById(roleId: number) {
  const db = (await getDb())!;
  if (!db) return null;
  const [role] = await db.select().from(customRoles).where(eq(customRoles.id, roleId));
  return role;
}

export async function createRole(data: {
  name: string;
  displayName: string;
  description?: string;
  color?: string;
  isSystemRole?: boolean;
  priority?: number;
  createdBy: number;
}) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  const [role] = await db.insert(customRoles).values(data).$returningId();
  return role;
}

export async function updateRole(roleId: number, data: {
  displayName?: string;
  description?: string;
  color?: string;
  priority?: number;
}) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  await db.update(customRoles).set(data).where(eq(customRoles.id, roleId));
  return { success: true };
}

export async function deleteRole(roleId: number) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  
  const role = await getRoleById(roleId);
  if (role?.isSystemRole) {
    throw new Error("Cannot delete system roles");
  }
  
  await db.update(customRoles).set({ isActive: false }).where(eq(customRoles.id, roleId));
  return { success: true };
}

export async function getRoleWithPermissionsAndTabs(roleId: number) {
  const db = (await getDb())!;
  if (!db) return null;
  
  const role = await getRoleById(roleId);
  if (!role) return null;
  
  const rolePerms = await db
    .select({ permission: permissions })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, roleId));
  
  const roleTabsList = await db
    .select({ tab: tabs, displayOrder: roleTabs.displayOrder })
    .from(roleTabs)
    .innerJoin(tabs, eq(roleTabs.tabId, tabs.id))
    .where(eq(roleTabs.roleId, roleId))
    .orderBy(roleTabs.displayOrder);
  
  return {
    ...role,
    permissions: rolePerms.map(rp => rp.permission),
    tabs: roleTabsList.map(rt => ({ ...rt.tab, displayOrder: rt.displayOrder }))
  };
}

// ==================== PERMISSION MANAGEMENT ====================

export async function getAllPermissions() {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(permissions).where(eq(permissions.isActive, true));
}

export async function getPermissionsByCategory() {
  const allPermissions = await getAllPermissions();
  
  const grouped: Record<string, Permission[]> = {};
  for (const perm of allPermissions) {
    if (!grouped[perm.category]) {
      grouped[perm.category] = [];
    }
    grouped[perm.category].push(perm);
  }
  
  return grouped;
}

export async function createPermission(data: {
  code: string;
  name: string;
  description?: string;
  category: string;
  resource: string;
  action: "view" | "create" | "edit" | "delete" | "export" | "assign" | "approve" | "manage";
}) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  const [permission] = await db.insert(permissions).values(data).$returningId();
  return permission;
}

// ==================== ROLE-PERMISSION ASSIGNMENT ====================

export async function assignPermissionsToRole(roleId: number, permissionIds: number[], grantedBy: number) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  
  await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
  
  if (permissionIds.length > 0) {
    await db.insert(rolePermissions).values(
      permissionIds.map(permissionId => ({
        roleId,
        permissionId,
        grantedBy
      }))
    );
  }
  
  return { success: true };
}

export async function getRolePermissions(roleId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  
  const perms = await db
    .select({ permission: permissions })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, roleId));
  
  return perms.map(p => p.permission);
}

// ==================== TAB MANAGEMENT ====================

export async function getAllTabs() {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(tabs).where(eq(tabs.isActive, true)).orderBy(tabs.displayOrder);
}

export async function getTabById(tabId: number) {
  const db = (await getDb())!;
  if (!db) return null;
  const [tab] = await db.select().from(tabs).where(eq(tabs.id, tabId));
  return tab;
}

export async function createTab(data: {
  code: string;
  name: string;
  description?: string;
  icon?: string;
  path: string;
  category?: string;
  displayOrder?: number;
}) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  const [tab] = await db.insert(tabs).values(data).$returningId();
  return tab;
}

// ==================== ROLE-TAB ASSIGNMENT ====================

export async function assignTabsToRole(roleId: number, tabIds: number[], assignedBy: number) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  
  await db.delete(roleTabs).where(eq(roleTabs.roleId, roleId));
  
  if (tabIds.length > 0) {
    await db.insert(roleTabs).values(
      tabIds.map((tabId, index) => ({
        roleId,
        tabId,
        displayOrder: index,
        assignedBy
      }))
    );
  }
  
  return { success: true };
}

export async function getRoleTabs(roleId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  
  const tabsList = await db
    .select({ tab: tabs, displayOrder: roleTabs.displayOrder })
    .from(roleTabs)
    .innerJoin(tabs, eq(roleTabs.tabId, tabs.id))
    .where(eq(roleTabs.roleId, roleId))
    .orderBy(roleTabs.displayOrder);
  
  return tabsList.map(t => ({ ...t.tab, displayOrder: t.displayOrder }));
}

// ==================== USER-ROLE ASSIGNMENT ====================

export async function assignRoleToUser(userId: number, roleId: number, assignedBy: number, isPrimary: boolean = false) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  
  if (isPrimary) {
    await db.update(userRoles).set({ isPrimary: false }).where(eq(userRoles.userId, userId));
  }
  
  const existing = await db
    .select()
    .from(userRoles)
    .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));
  
  if (existing.length > 0) {
    await db.update(userRoles)
      .set({ isPrimary, assignedBy })
      .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));
  } else {
    await db.insert(userRoles).values({ userId, roleId, isPrimary, assignedBy });
  }
  
  return { success: true };
}

export async function removeRoleFromUser(userId: number, roleId: number) {
  const db = (await getDb())!;
  if (!db) throw new Error("Database not available");
  await db.delete(userRoles).where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));
  return { success: true };
}

export async function getUserRoles(userId: number) {
  const db = (await getDb())!;
  if (!db) return [];
  
  const roles = await db
    .select({ 
      role: customRoles,
      isPrimary: userRoles.isPrimary,
      assignedAt: userRoles.assignedAt
    })
    .from(userRoles)
    .innerJoin(customRoles, eq(userRoles.roleId, customRoles.id))
    .where(eq(userRoles.userId, userId));
  
  return roles;
}

export async function getUserPrimaryRole(userId: number) {
  const db = (await getDb())!;
  if (!db) return null;
  
  const [primaryRole] = await db
    .select({ role: customRoles })
    .from(userRoles)
    .innerJoin(customRoles, eq(userRoles.roleId, customRoles.id))
    .where(and(eq(userRoles.userId, userId), eq(userRoles.isPrimary, true)));
  
  return primaryRole?.role;
}

// ==================== PERMISSION CHECKING ====================

export async function userHasPermission(userId: number, permissionCode: string): Promise<boolean> {
  const db = (await getDb())!;
  if (!db) return false;
  
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(userRoles)
    .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(
      and(
        eq(userRoles.userId, userId),
        eq(permissions.code, permissionCode),
        eq(permissions.isActive, true)
      )
    );
  
  return (result[0]?.count ?? 0) > 0;
}

export async function userCanAccessTab(userId: number, tabCode: string): Promise<boolean> {
  const db = (await getDb())!;
  if (!db) return false;
  
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(userRoles)
    .innerJoin(roleTabs, eq(userRoles.roleId, roleTabs.roleId))
    .innerJoin(tabs, eq(roleTabs.tabId, tabs.id))
    .where(
      and(
        eq(userRoles.userId, userId),
        eq(tabs.code, tabCode),
        eq(tabs.isActive, true)
      )
    );
  
  return (result[0]?.count ?? 0) > 0;
}

export async function getUserPermissions(userId: number): Promise<Permission[]> {
  const db = (await getDb())!;
  if (!db) return [];
  
  const perms = await db
    .select({ permission: permissions })
    .from(userRoles)
    .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(and(eq(userRoles.userId, userId), eq(permissions.isActive, true)));
  
  return perms.map(p => p.permission);
}

export async function getUserTabs(userId: number): Promise<Tab[]> {
  const db = (await getDb())!;
  if (!db) return [];
  
  const tabsList = await db
    .select({ tab: tabs, displayOrder: roleTabs.displayOrder })
    .from(userRoles)
    .innerJoin(roleTabs, eq(userRoles.roleId, roleTabs.roleId))
    .innerJoin(tabs, eq(roleTabs.tabId, tabs.id))
    .where(and(eq(userRoles.userId, userId), eq(tabs.isActive, true)))
    .orderBy(roleTabs.displayOrder);
  
  const uniqueTabs = new Map<number, Tab>();
  for (const { tab } of tabsList) {
    if (!uniqueTabs.has(tab.id)) {
      uniqueTabs.set(tab.id, tab);
    }
  }
  
  return Array.from(uniqueTabs.values());
}

// ==================== AUDIT LOGGING ====================

export async function logPermissionAction(data: {
  action: "role_created" | "role_updated" | "role_deleted" | "permission_granted" | "permission_revoked" | "tab_assigned" | "tab_removed" | "user_role_assigned" | "user_role_removed";
  performedBy: number;
  targetUserId?: number;
  targetRoleId?: number;
  targetPermissionId?: number;
  targetTabId?: number;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}) {
  const db = (await getDb())!;
  if (!db) return { success: false };
  await db.insert(permissionAuditLog).values(data);
  return { success: true };
}

export async function getAuditLog(limit: number = 100) {
  const db = (await getDb())!;
  if (!db) return [];
  return db.select().from(permissionAuditLog).orderBy(sql`${permissionAuditLog.createdAt} DESC`).limit(limit);
}

// ==================== INITIALIZATION ====================

export async function initializeDefaultRolesAndPermissions() {
  const existingRoles = await getAllRoles();
  if (existingRoles.length > 0) {
    return { success: true, message: "Already initialized" };
  }
  
  // Create default roles
  const adminRole = await createRole({
    name: "admin",
    displayName: "Administrator",
    description: "Full system access",
    color: "#ef4444",
    isSystemRole: true,
    priority: 100,
    createdBy: 1
  });
  
  const coachRole = await createRole({
    name: "coach",
    displayName: "Coach",
    description: "Training and player management",
    color: "#3b82f6",
    isSystemRole: true,
    priority: 80,
    createdBy: 1
  });
  
  const marketingRole = await createRole({
    name: "marketing",
    displayName: "Marketing",
    description: "Lead and event management",
    color: "#8b5cf6",
    isSystemRole: true,
    priority: 60,
    createdBy: 1
  });
  
  const parentRole = await createRole({
    name: "parent",
    displayName: "Parent",
    description: "View child progress",
    color: "#10b981",
    isSystemRole: true,
    priority: 40,
    createdBy: 1
  });
  
  const playerRole = await createRole({
    name: "player",
    displayName: "Player",
    description: "View own stats and goals",
    color: "#f59e0b",
    isSystemRole: true,
    priority: 20,
    createdBy: 1
  });
  
  // Create default permissions
  const permissionsList = [
    { code: "players.view", name: "View Players", category: "Players", resource: "players", action: "view" as const },
    { code: "players.create", name: "Create Players", category: "Players", resource: "players", action: "create" as const },
    { code: "players.edit", name: "Edit Players", category: "Players", resource: "players", action: "edit" as const },
    { code: "players.delete", name: "Delete Players", category: "Players", resource: "players", action: "delete" as const },
    { code: "training.view", name: "View Training", category: "Training", resource: "training", action: "view" as const },
    { code: "training.create", name: "Create Training", category: "Training", resource: "training", action: "create" as const },
    { code: "training.edit", name: "Edit Training", category: "Training", resource: "training", action: "edit" as const },
    { code: "matches.view", name: "View Matches", category: "Matches", resource: "matches", action: "view" as const },
    { code: "matches.create", name: "Create Matches", category: "Matches", resource: "matches", action: "create" as const },
    { code: "reports.view", name: "View Reports", category: "Reports", resource: "reports", action: "view" as const },
    { code: "reports.export", name: "Export Reports", category: "Reports", resource: "reports", action: "export" as const },
    { code: "users.manage", name: "Manage Users", category: "Users", resource: "users", action: "manage" as const },
  ];
  
  for (const perm of permissionsList) {
    await createPermission(perm);
  }
  
  // Create default tabs
  const defaultTabs = [
    { code: "dashboard", name: "Dashboard", path: "/", icon: "Home", displayOrder: 0 },
    { code: "players", name: "Players", path: "/players", icon: "Users", displayOrder: 1 },
    { code: "training", name: "Training", path: "/training", icon: "Dumbbell", displayOrder: 2 },
    { code: "matches", name: "Matches", path: "/matches", icon: "Trophy", displayOrder: 3 },
    { code: "performance", name: "Performance", path: "/performance", icon: "TrendingUp", displayOrder: 4 },
    { code: "tactical-hub", name: "Tactical Hub", path: "/tactical-hub", icon: "Target", displayOrder: 5 },
    { code: "admin", name: "Admin", path: "/admin", icon: "Settings", displayOrder: 10 },
  ];
  
  for (const tab of defaultTabs) {
    await createTab(tab);
  }
  
  return { success: true, message: "Initialized successfully" };
}
