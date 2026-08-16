import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Plus, Edit, Trash2, Users, Key, Layout, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from "sonner";
import { useLanguage } from '@/contexts/LanguageContext';

export function RoleManagement() {
  const { t, language } = useLanguage();
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [userRoleAssignId, setUserRoleAssignId] = useState<string>("");

  // Queries
  const { data: roles, refetch: refetchRoles, isLoading: rolesLoading } = trpc.permissions.getAllRoles.useQuery();
  const { data: selectedRole, refetch: refetchSelectedRole } = trpc.permissions.getRoleById.useQuery(
    { roleId: selectedRoleId! },
    { enabled: !!selectedRoleId }
  );
  const { data: allPermissions } = trpc.permissions.getPermissionsByCategory.useQuery();
  const { data: allTabs } = trpc.permissions.getAllTabs.useQuery();
  const { data: allUsers } = trpc.users.getAll.useQuery();

  // Mutations
  const createRoleMutation = trpc.permissions.createRole.useMutation({
    onSuccess: () => {
      toast.success("Role created successfully");
      refetchRoles();
      setIsCreateDialogOpen(false);
    },
    onError: (error) => toast.error(`Error creating role: ${error.message}`),
  });

  const updateRoleMutation = trpc.permissions.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Role updated successfully");
      refetchRoles();
      refetchSelectedRole();
      setIsEditDialogOpen(false);
    },
    onError: (error) => toast.error(`Error updating role: ${error.message}`),
  });

  const deleteRoleMutation = trpc.permissions.deleteRole.useMutation({
    onSuccess: () => {
      toast.success("Role deleted successfully");
      refetchRoles();
      setSelectedRoleId(null);
    },
    onError: (error) => toast.error(`Error deleting role: ${error.message}`),
  });

  const assignPermissionsMutation = trpc.permissions.assignPermissionsToRole.useMutation({
    onSuccess: () => {
      toast.success("Permissions updated");
      refetchSelectedRole();
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const assignTabsMutation = trpc.permissions.assignTabsToRole.useMutation({
    onSuccess: () => {
      toast.success("Tab access updated");
      refetchSelectedRole();
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const assignRoleToUserMutation = trpc.permissions.assignRoleToUser.useMutation({
    onSuccess: () => {
      toast.success("Role assigned to user successfully");
      setUserRoleAssignId("");
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const handleCreateRole = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createRoleMutation.mutate({
      name: formData.get("name") as string,
      displayName: formData.get("displayName") as string,
      description: formData.get("description") as string,
      color: formData.get("color") as string,
      priority: parseInt(formData.get("priority") as string) || 0,
    });
  };

  const handleUpdateRole = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedRoleId) return;
    const formData = new FormData(e.currentTarget);
    updateRoleMutation.mutate({
      roleId: selectedRoleId,
      displayName: formData.get("displayName") as string,
      description: formData.get("description") as string,
      color: formData.get("color") as string,
      priority: parseInt(formData.get("priority") as string) || 0,
    });
  };

  const handleDeleteRole = (roleId: number) => {
    if (confirm("Are you sure you want to delete this role? This cannot be undone.")) {
      deleteRoleMutation.mutate({ roleId });
    }
  };

  const handlePermissionToggle = (permissionId: number, checked: boolean) => {
    if (!selectedRoleId || !selectedRole) return;
    const currentPermissionIds = selectedRole.permissions.map(p => p.id);
    const newPermissionIds = checked
      ? [...currentPermissionIds, permissionId]
      : currentPermissionIds.filter(id => id !== permissionId);
    assignPermissionsMutation.mutate({ roleId: selectedRoleId, permissionIds: newPermissionIds });
  };

  const handleTabToggle = (tabId: number, checked: boolean) => {
    if (!selectedRoleId || !selectedRole) return;
    const currentTabIds = selectedRole.tabs.map(t => t.id);
    const newTabIds = checked
      ? [...currentTabIds, tabId]
      : currentTabIds.filter(id => id !== tabId);
    assignTabsMutation.mutate({ roleId: selectedRoleId, tabIds: newTabIds });
  };

  const handleAssignRoleToUser = () => {
    if (!selectedRoleId || !userRoleAssignId) return;
    assignRoleToUserMutation.mutate({
      userId: parseInt(userRoleAssignId),
      roleId: selectedRoleId,
      isPrimary: false,
    });
  };

  return (
    <>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              Role &amp; Permission Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Create custom roles, assign permissions, control tab visibility, and assign roles to users
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Role
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Role</DialogTitle>
                <DialogDescription>Create a custom role with specific permissions and tab access</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateRole} className="space-y-4">
                <div>
                  <Label htmlFor="name">Role Code (no spaces, e.g. load_trainer)</Label>
                  <Input id="name" name="name" placeholder="load_trainer" required />
                </div>
                <div>
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input id="displayName" name="displayName" placeholder="Load Trainer" required />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" placeholder="Manages player load and fitness data" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="color">Color</Label>
                    <Input id="color" name="color" type="color" defaultValue="#3b82f6" />
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority (0-100)</Label>
                    <Input id="priority" name="priority" type="number" defaultValue="50" min="0" max="100" />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={createRoleMutation.isPending}>
                  {createRoleMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Create Role
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Status summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4 flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{roles?.length ?? 0}</p>
              <p className="text-sm text-muted-foreground">Total Roles</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <Key className="h-8 w-8 text-amber-700 dark:text-amber-500" />
            <div>
              <p className="text-2xl font-bold">{allPermissions ? Object.values(allPermissions).flat().length : 0}</p>
              <p className="text-sm text-muted-foreground">Permissions</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <Layout className="h-8 w-8 text-green-700 dark:text-green-500" />
            <div>
              <p className="text-2xl font-bold">{allTabs?.length ?? 0}</p>
              <p className="text-sm text-muted-foreground">Navigable Tabs</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Roles List */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Roles</CardTitle>
              <CardDescription>Click a role to manage its settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {rolesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : roles?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No roles found. Create one to get started.</p>
              ) : (
                roles?.map((role) => (
                  <div
                    key={role.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedRoleId === role.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedRoleId(role.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color || "#3b82f6" }} />
                        <span className="font-medium">{role.displayName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {role.isSystemRole && <Badge variant="secondary" className="text-xs">System</Badge>}
                        {selectedRoleId === role.id && <CheckCircle2 className="h-4 w-4 text-primary" />}
                      </div>
                    </div>
                    {role.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{role.description}</p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Role Details */}
          <Card className="md:col-span-2">
            {selectedRole ? (
              <>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedRole.color || "#3b82f6" }} />
                        {selectedRole.displayName}
                        {selectedRole.isSystemRole && <Badge variant="secondary" className="text-xs">System Role</Badge>}
                      </CardTitle>
                      <CardDescription>{selectedRole.description || "No description provided"}</CardDescription>
                    </div>
                    {!selectedRole.isSystemRole && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
                          <Edit className="h-4 w-4 mr-1" /> Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteRole(selectedRole.id)}
                          disabled={deleteRoleMutation.isPending}
                        >
                          {deleteRoleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="permissions">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="permissions"><Key className="h-4 w-4 mr-2" />Permissions ({selectedRole.permissions.length})</TabsTrigger>
                      <TabsTrigger value="tabs"><Layout className="h-4 w-4 mr-2" />Tab Access ({selectedRole.tabs.length})</TabsTrigger>
                      <TabsTrigger value="users"><Users className="h-4 w-4 mr-2" />Assign Users</TabsTrigger>
                    </TabsList>

                    <TabsContent value="permissions" className="mt-4 space-y-4 max-h-96 overflow-y-auto pr-1">
                      {selectedRole.isSystemRole && (
                        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                          <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                          <p className="text-sm text-amber-700 dark:text-amber-400">System roles have fixed permissions and cannot be modified.</p>
                        </div>
                      )}
                      {allPermissions && Object.entries(allPermissions).map(([category, perms]) => (
                        <div key={category} className="space-y-2">
                          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">{category}</h3>
                          <div className="space-y-2 pl-2">
                            {(perms as any[]).map((perm) => {
                              const isChecked = selectedRole.permissions.some(p => p.id === perm.id);
                              return (
                                <div key={perm.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`perm-${perm.id}`}
                                    checked={isChecked}
                                    disabled={selectedRole.isSystemRole || assignPermissionsMutation.isPending}
                                    onCheckedChange={(checked) => handlePermissionToggle(perm.id, checked as boolean)}
                                  />
                                  <label htmlFor={`perm-${perm.id}`} className="text-sm font-medium leading-none cursor-pointer">
                                    {perm.name}
                                    {perm.description && <span className="text-xs text-muted-foreground block">{perm.description}</span>}
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </TabsContent>

                    <TabsContent value="tabs" className="mt-4 space-y-2 max-h-96 overflow-y-auto pr-1">
                      <p className="text-sm text-muted-foreground mb-3">Select which navigation tabs this role can access:</p>
                      {allTabs?.map((tab) => {
                        const isChecked = selectedRole.tabs.some(t => t.id === tab.id);
                        return (
                          <div key={tab.id} className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50">
                            <Checkbox
                              id={`tab-${tab.id}`}
                              checked={isChecked}
                              disabled={selectedRole.isSystemRole || assignTabsMutation.isPending}
                              onCheckedChange={(checked) => handleTabToggle(tab.id, checked as boolean)}
                            />
                            <label htmlFor={`tab-${tab.id}`} className="text-sm font-medium cursor-pointer flex-1">
                              {tab.name}
                              {tab.description && <span className="text-xs text-muted-foreground block">{tab.description}</span>}
                            </label>
                            <Badge variant="outline" className="text-xs font-mono">{(tab as any).path}</Badge>
                          </div>
                        );
                      })}
                    </TabsContent>

                    <TabsContent value="users" className="mt-4 space-y-4">
                      <p className="text-sm text-muted-foreground">Assign this role to a platform user:</p>
                      <div className="flex gap-2">
                        <Select value={userRoleAssignId} onValueChange={setUserRoleAssignId}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select a user..." />
                          </SelectTrigger>
                          <SelectContent>
                            {allUsers?.map((user: any) => (
                              <SelectItem key={user.id} value={String(user.id)}>
                                {user.name} ({user.email}) — {user.role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={handleAssignRoleToUser}
                          disabled={!userRoleAssignId || assignRoleToUserMutation.isPending}
                        >
                          {assignRoleToUserMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assign"}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Note: This adds a custom role on top of the user's existing system role. To change a user's primary role, use the User Management page.
                      </p>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center">
                  <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground font-medium">Select a role to manage</p>
                  <p className="text-sm text-muted-foreground mt-1">Click any role on the left to view and edit its permissions</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Edit Role Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Role</DialogTitle>
              <DialogDescription>Update role display information</DialogDescription>
            </DialogHeader>
            {selectedRole && (
              <form onSubmit={handleUpdateRole} className="space-y-4">
                <div>
                  <Label htmlFor="edit-displayName">Display Name</Label>
                  <Input id="edit-displayName" name="displayName" defaultValue={selectedRole.displayName} required />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea id="edit-description" name="description" defaultValue={selectedRole.description || ""} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-color">Color</Label>
                    <Input id="edit-color" name="color" type="color" defaultValue={selectedRole.color || "#3b82f6"} />
                  </div>
                  <div>
                    <Label htmlFor="edit-priority">Priority</Label>
                    <Input id="edit-priority" name="priority" type="number" defaultValue={selectedRole.priority ?? 50} />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={updateRoleMutation.isPending}>
                  {updateRoleMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Update Role
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

export default RoleManagement;
