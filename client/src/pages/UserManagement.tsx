import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CheckCircle, XCircle, UserCheck, UserX, Users } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from '@/contexts/LanguageContext';

export default function UserManagement() {
  const utils = trpc.useUtils();
  const { data: allUsers, isLoading } = trpc.users.getAll.useQuery();
  const { t, language } = useLanguage();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const approveMutation = trpc.users.approveUser.useMutation({
    onSuccess: () => {
      toast.success("User approved successfully");
      utils.users.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to approve user");
    },
  });

  const rejectMutation = trpc.users.rejectUser.useMutation({
    onSuccess: () => {
      toast.success("User rejected");
      utils.users.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reject user");
    },
  });

  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Role updated successfully");
      utils.users.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update role");
    },
  });

  const filteredUsers = allUsers?.filter((user) => {
    if (filter === "all") return true;
    return user.accountStatus === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-500 border-yellow-500">Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-500 border-green-500">Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-purple-500/10 text-purple-500 border-purple-500",
      coach: "bg-blue-500/10 text-blue-500 border-blue-500",
      parent: "bg-green-500/10 text-green-700 dark:text-green-500 border-green-500",
      player: "bg-orange-500/10 text-orange-700 dark:text-orange-500 border-orange-500",
      nutritionist: "bg-pink-500/10 text-pink-500 border-pink-500",
      mental_coach: "bg-indigo-500/10 text-indigo-500 border-indigo-500",
      physical_trainer: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-500 border-cyan-500",
    };
    
    return (
      <Badge variant="outline" className={colors[role] || "bg-slate-500/10 text-muted-foreground border-slate-500"}>
        {role.replace("_", " ")}
      </Badge>
    );
  };

  return (
    <>
    <div >
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/settings">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Users className="w-7 h-7" />
                  User Management
                </h1>
                <p className="text-muted-foreground text-sm">Manage user registrations and roles</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-6">
        {/* Filter */}
        <Card className="bg-card border-border mb-6">
          <CardHeader>
            <CardTitle className="text-foreground">Filter Users</CardTitle>
            <CardDescription className="text-muted-foreground">Filter by account status</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
              <SelectTrigger className="w-64 bg-muted border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-muted border-border">
                <SelectItem value="all" className="text-foreground">{t("admin.allUsers")}</SelectItem>
                <SelectItem value="pending" className="text-foreground">Pending Approval</SelectItem>
                <SelectItem value="approved" className="text-foreground">Approved</SelectItem>
                <SelectItem value="rejected" className="text-foreground">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">
              Users ({filteredUsers?.length || 0})
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {filter === "pending" ? "Pending registration requests awaiting approval" : "All registered users"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading users...</div>
            ) : filteredUsers && filteredUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground">Name</TableHead>
                      <TableHead className="text-muted-foreground">Email</TableHead>
                      <TableHead className="text-muted-foreground">Phone</TableHead>
                      <TableHead className="text-muted-foreground">Current Role</TableHead>
                      <TableHead className="text-muted-foreground">Requested Role</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                      <TableHead className="text-muted-foreground">{t("common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} className="border-border">
                        <TableCell className="text-foreground">{user.name || "N/A"}</TableCell>
                        <TableCell className="text-muted-foreground">{user.email || "N/A"}</TableCell>
                        <TableCell className="text-muted-foreground">{user.phone || "N/A"}</TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>
                          {user.requestedRole ? getRoleBadge(user.requestedRole) : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>{getStatusBadge(user.accountStatus)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {user.accountStatus === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-green-600/10 border-green-600 text-green-700 dark:text-green-500 hover:bg-green-600/20"
                                  onClick={() => approveMutation.mutate({ userId: user.id })}
                                  disabled={approveMutation.isPending}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-red-600/10 border-red-600 text-red-500 hover:bg-red-600/20"
                                  onClick={() => rejectMutation.mutate({ userId: user.id })}
                                  disabled={rejectMutation.isPending}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {user.accountStatus === "approved" && (
                              <Select
                                key={`role-select-${user.id}`}
                                value={user.role}
                                onValueChange={(newRole: any) => {
                                  updateRoleMutation.mutate({ userId: user.id, role: newRole });
                                }}
                              >
                                <SelectTrigger className="w-40 h-8 bg-muted border-border text-foreground text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-muted border-border z-[200]" position="popper">
                                  <SelectItem value="admin" className="text-foreground">Admin</SelectItem>
                                  <SelectItem value="coach" className="text-foreground">Coach</SelectItem>
                                  <SelectItem value="parent" className="text-foreground">Parent</SelectItem>
                                  <SelectItem value="player" className="text-foreground">Player</SelectItem>
                                  <SelectItem value="nutritionist" className="text-foreground">Nutritionist</SelectItem>
                                  <SelectItem value="mental_coach" className="text-foreground">Mental Coach</SelectItem>
                                  <SelectItem value="physical_trainer" className="text-foreground">Physical Trainer</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {filter === "pending" ? "No pending registration requests" : "No users found"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}
