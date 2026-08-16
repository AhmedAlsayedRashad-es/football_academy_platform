import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

/**
 * Hook to check user permissions and tab access
 * Returns permission checking functions based on current user's roles
 */
export function usePermissions() {
  const { user } = useAuth();
  
  // Get user's permissions
  const { data: userPermissions, isLoading: permissionsLoading } = trpc.permissions.getUserPermissions.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  // Get user's accessible tabs
  const { data: userTabs, isLoading: tabsLoading } = trpc.permissions.getUserTabs.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  /**
   * Check if user has a specific permission
   * @param permissionName - Name of the permission to check
   * @returns true if user has the permission
   */
  const hasPermission = (permissionName: string): boolean => {
    // Admins have all permissions
    if (user?.role === 'admin') return true;
    if (!userPermissions) return false;
    return userPermissions.some(p => p.name === permissionName);
  };

  /**
   * Check if user can access a specific tab
   * @param tabPath - Path of the tab to check (e.g., "/players", "/training")
   * @returns true if user can access the tab
   */
  const canAccessTab = (tabPath: string): boolean => {
    // Admins can access all tabs
    if (user?.role === 'admin') return true;
    if (!userTabs) return false;
    return userTabs.some(t => t.path === tabPath);
  };

  /**
   * Check if user has any of the specified permissions
   * @param permissionNames - Array of permission names
   * @returns true if user has at least one of the permissions
   */
  const hasAnyPermission = (permissionNames: string[]): boolean => {
    if (!userPermissions) return false;
    return permissionNames.some(name => hasPermission(name));
  };

  /**
   * Check if user has all of the specified permissions
   * @param permissionNames - Array of permission names
   * @returns true if user has all of the permissions
   */
  const hasAllPermissions = (permissionNames: string[]): boolean => {
    if (!userPermissions) return false;
    return permissionNames.every(name => hasPermission(name));
  };

  /**
   * Check if user has a specific role
   * @param roleName - Name of the role to check
   * @returns true if user has the role
   */
  const hasRole = (roleName: string): boolean => {
    if (!user?.role) return false;
    // Check if user's primary role matches
    if (user.role === roleName) return true;
    // TODO: Check additional roles from user_roles table
    return false;
  };

  return {
    hasPermission,
    canAccessTab,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    isLoading: permissionsLoading || tabsLoading,
    permissions: userPermissions || [],
    tabs: userTabs || [],
  };
}
