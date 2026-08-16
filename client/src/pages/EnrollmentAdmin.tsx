import { useState } from "react";
import { useLocation } from 'wouter';
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle, XCircle, Clock, Phone, Mail, User, Calendar,
  Search, Filter, Eye, MessageSquare, Users, FileText, ChevronDown, ChevronUp, ArrowLeft,
  Bell, Send, Smartphone, AtSign, Wifi} from 'lucide-react';
import { useAuth } from "@/_core/hooks/useAuth";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { useLanguage } from '@/contexts/LanguageContext';

type EnrollmentStatus = "pending" | "approved" | "rejected" | "contacted";

const STATUS_CONFIG: Record<EnrollmentStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pending", color: "bg-yellow-700 text-white", icon: <Clock className="w-3 h-3" /> },
  approved: { label: "Approved", color: "bg-green-700 text-white", icon: <CheckCircle className="w-3 h-3" /> },
  rejected: { label: "Rejected", color: "bg-red-700 text-white", icon: <XCircle className="w-3 h-3" /> },
  contacted: { label: "Contacted", color: "bg-blue-700 text-white", icon: <Phone className="w-3 h-3" /> },
};

const PROGRAM_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  elite: "Elite",
};

const POSITION_LABELS: Record<string, string> = {
  goalkeeper: "GK",
  defender: "DEF",
  midfielder: "MID",
  forward: "FWD",
  any: "Any",
};

function StatusBadge({ status }: { status: EnrollmentStatus }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function EnrollmentRow({ enrollment, onAction }: { enrollment: any; onAction: (id: number, status: EnrollmentStatus, notes?: string, teamId?: number) => void }) {
  const { t, language } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(enrollment.notes || "");
  const [showNotes, setShowNotes] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const { data: teams = [] } = trpc.teams.getAll.useQuery();

  const age = enrollment.dateOfBirth
    ? Math.floor((Date.now() - new Date(enrollment.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : "—";

  const handleWhatsApp = () => {
    const phone = enrollment.parentPhone?.replace(/\D/g, "");
    const msg = encodeURIComponent(
      `Hello ${enrollment.parentFirstName},\n\nThank you for your interest in Future Stars Academy. We have received the enrollment application for ${enrollment.studentFirstName} ${enrollment.studentLastName}.\n\nWe will be in touch shortly.\n\nFuture Stars Academy Team`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  return (
    <div className="bg-card rounded-lg overflow-hidden border border-border">
      {/* Main row */}
      <div className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 rounded-full bg-red-800 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {enrollment.studentFirstName?.[0]}{enrollment.studentLastName?.[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-foreground font-semibold truncate">
            {enrollment.studentFirstName} {enrollment.studentLastName}
            <span className="text-muted-foreground font-normal text-xs ml-2">Age {age}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
            <span>{enrollment.parentFirstName} {enrollment.parentLastName}</span>
            <span>·</span>
            <span>{PROGRAM_LABELS[enrollment.program] || enrollment.program}</span>
            <span>·</span>
            <span>{POSITION_LABELS[enrollment.preferredPosition] || enrollment.preferredPosition}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={enrollment.status as EnrollmentStatus} />
          <span className="text-muted-foreground text-xs hidden md:block">
            {enrollment.createdAt ? new Date(enrollment.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : ""}
          </span>
          <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground p-1" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contact info */}
            <div className="space-y-2">
              <h4 className="text-muted-foreground text-sm font-semibold">Contact Information</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span>{enrollment.parentEmail}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 text-green-700 dark:text-green-400" />
                <span>{enrollment.parentPhone}</span>
              </div>
              {enrollment.emergencyContact && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Emergency: {enrollment.emergencyContact}</span>
                </div>
              )}
            </div>

            {/* Student info */}
            <div className="space-y-2">
              <h4 className="text-muted-foreground text-sm font-semibold">Student Details</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-muted rounded p-2">
                  <div className="text-muted-foreground text-xs">DOB</div>
                  <div className="text-foreground">{enrollment.dateOfBirth ? new Date(enrollment.dateOfBirth).toLocaleDateString("en-GB") : "—"}</div>
                </div>
                <div className="bg-muted rounded p-2">
                  <div className="text-muted-foreground text-xs">Gender</div>
                  <div className="text-foreground capitalize">{enrollment.gender}</div>
                </div>
                <div className="bg-muted rounded p-2">
                  <div className="text-muted-foreground text-xs">Age Group</div>
                  <div className="text-foreground">{enrollment.ageGroup}</div>
                </div>
                <div className="bg-muted rounded p-2">
                  <div className="text-muted-foreground text-xs">Program</div>
                  <div className="text-foreground">{PROGRAM_LABELS[enrollment.program]}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Experience & Medical */}
          {(enrollment.previousExperience || enrollment.medicalConditions) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enrollment.previousExperience && (
                <div>
                  <h4 className="text-muted-foreground text-sm font-semibold mb-1">Previous Experience</h4>
                  <p className="text-muted-foreground text-sm bg-muted rounded p-2">{enrollment.previousExperience}</p>
                </div>
              )}
              {enrollment.medicalConditions && (
                <div>
                  <h4 className="text-muted-foreground text-sm font-semibold mb-1">Medical Conditions</h4>
                  <p className="text-muted-foreground text-sm bg-muted rounded p-2">{enrollment.medicalConditions}</p>
                </div>
              )}
            </div>
          )}

          {/* Admin notes */}
          {showNotes && (
            <div>
              <Label className="text-muted-foreground text-sm">Admin Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-muted border-border text-foreground mt-1 text-sm"
                placeholder="Add internal notes..."
                rows={2}
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              size="sm"
              className="bg-green-700 hover:bg-green-600 text-white"
              onClick={() => setShowApprovalDialog(true)}
              disabled={enrollment.status === "approved"}
            >
              <CheckCircle className="w-3 h-3 mr-1" /> Approve
            </Button>
            <Button
              size="sm"
              className="bg-red-700 hover:bg-red-600 text-white"
              onClick={() => onAction(enrollment.id, "rejected", notes)}
              disabled={enrollment.status === "rejected"}
            >
              <XCircle className="w-3 h-3 mr-1" /> Reject
            </Button>
            <Button
              size="sm"
              className="bg-blue-700 hover:bg-blue-600 text-white"
              onClick={() => onAction(enrollment.id, "contacted", notes)}
              disabled={enrollment.status === "contacted"}
            >
              <Phone className="w-3 h-3 mr-1" /> Mark Contacted
            </Button>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-500 text-white"
              onClick={handleWhatsApp}
            >
              <MessageSquare className="w-3 h-3 mr-1" /> WhatsApp
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setShowNotes(!showNotes)}
            >
              <FileText className="w-3 h-3 mr-1" /> {showNotes ? "Hide Notes" : "Add Notes"}
            </Button>
          </div>

          {/* Approval Dialog */}
          {showApprovalDialog && (
            <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Approve Enrollment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">Select Team</Label>
                    <select
                      value={selectedTeamId || ""}
                      onChange={(e) => setSelectedTeamId(e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full mt-1 px-3 py-2 bg-muted border border-border text-foreground rounded-md"
                    >
                      <option value="">-- Choose a team --</option>
                      {teams.map((team: any) => (
                        <option key={team.id} value={team.id}>
                          {team.name} ({team.ageGroup})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Approval Comments</Label>
                    <Textarea
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      placeholder="Add comments about the approval..."
                      className="bg-muted border-border text-foreground mt-1"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>Cancel</Button>
                    <Button
                      className="bg-green-700 hover:bg-green-600 text-white"
                      onClick={() => {
                        if (selectedTeamId) {
                          onAction(enrollment.id, "approved", approvalNotes, selectedTeamId);
                          setShowApprovalDialog(false);
                          setSelectedTeamId(null);
                          setApprovalNotes("");
                        }
                      }}
                      disabled={!selectedTeamId}
                    >
                      Confirm Approval
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}
    </div>
  );
}

export default function EnrollmentAdmin() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EnrollmentStatus | "all">("all");

  const { data: enrollments = [], refetch, isLoading } = trpc.enrollments.getAll.useQuery();
  const updateStatus = trpc.enrollments.updateStatus.useMutation({
    onSuccess: (_, vars) => {
      toast({
        title: "Status updated",
        description: `Application ${vars.status} successfully.`,
      });
      refetch();
    },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  if (authLoading) return <DashboardLayoutSkeleton />;
  if (!user) { setLocation("/"); return null; }
  if (user.role !== "admin" && user.role !== "coach") {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Access restricted to admins and coaches.</p>
        </div>
      </>
    );
  }

  const filtered = enrollments.filter((e) => {
    const matchesSearch =
      !search ||
      `${e.studentFirstName} ${e.studentLastName} ${e.parentFirstName} ${e.parentLastName} ${e.parentEmail}`
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const counts = {
    all: enrollments.length,
    pending: enrollments.filter((e) => e.status === "pending").length,
    approved: enrollments.filter((e) => e.status === "approved").length,
    rejected: enrollments.filter((e) => e.status === "rejected").length,
    contacted: enrollments.filter((e) => e.status === "contacted").length,
  };

  const handleAction = (id: number, status: EnrollmentStatus, notes?: string, teamId?: number) => {
    updateStatus.mutate({ id, status, notes, teamId }, {
      onSuccess: (result) => {
        const enrollment = enrollments.find(e => e.id === id);
        if (enrollment) {
          if (status === 'approved') {
            // Show notification confirmation
            toast({
              title: "✅ Application Approved",
              description: `Notifications sent: Email ✓ | WhatsApp ${enrollment.parentPhone ? '✓' : '—'} | SMS —`,
            });
            // Open WhatsApp with approval message
            const phone = enrollment.parentPhone?.replace(/\D/g, "");
            if (phone) {
              const msg = encodeURIComponent(
                `Hello ${enrollment.parentFirstName},\n\n🏆 Congratulations! ${enrollment.studentFirstName}'s application to Future Stars Academy has been APPROVED!\n\nWe will contact you shortly to schedule the evaluation session.\n\nWelcome to the Future Stars family! 🔴⚪\n\nFuture Stars Academy Team\n📧 academy@futurestars.com`
              );
              setTimeout(() => window.open(`https://wa.me/${phone}?text=${msg}`, "_blank"), 500);
            }
          } else if (status === 'rejected') {
            toast({
              title: "Application Rejected",
              description: `Rejection notification sent to ${enrollment.parentEmail}`,
            });
          } else {
            toast({
              title: "Status Updated",
              description: `Application marked as ${status}`,
            });
          }
        }
        refetch();
      }
    });
  };

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            
            <button onClick={() => navigate('/enrollment-admin')} className="p-2 hover:bg-muted rounded-lg transition-colors mb-4">

              <ArrowLeft className="w-5 h-5" />

            </button>
<h1 className="text-2xl font-bold text-foreground">Enrollment Applications</h1>
            <p className="text-muted-foreground text-sm">Review and manage academy enrollment submissions</p>
          </div>
          <Button
            className="bg-red-700 hover:bg-red-600 text-white"
            onClick={() => setLocation("/enrollment")}
          >
            <Users className="w-4 h-4 mr-2" /> View Public Form
          </Button>
        </div>

        {/* Notification Status Banner */}
        <div className="brand-gradient-subtle border border-green-700/50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <Bell className="w-5 h-5 text-green-700 dark:text-green-400" />
            <h3 className="text-foreground font-semibold">Automated Notification System</h3>
            <span className="px-2 py-0.5 bg-green-700 text-white text-xs rounded-full">Active</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center gap-2 bg-muted/60 rounded-lg p-3">
              <AtSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-foreground text-xs font-medium">Email</p>
                <p className="text-green-700 dark:text-green-400 text-xs">Auto-send on approval</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-muted/60 rounded-lg p-3">
              <MessageSquare className="w-4 h-4 text-green-700 dark:text-green-400" />
              <div>
                <p className="text-foreground text-xs font-medium">WhatsApp</p>
                <p className="text-green-700 dark:text-green-400 text-xs">Opens pre-filled message</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-muted/60 rounded-lg p-3">
              <Smartphone className="w-4 h-4 text-yellow-700 dark:text-yellow-400" />
              <div>
                <p className="text-foreground text-xs font-medium">SMS</p>
                <p className="text-yellow-700 dark:text-yellow-400 text-xs">Requires Twilio setup</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {(["all", "pending", "approved", "rejected", "contacted"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg p-3 text-center border transition-colors ${statusFilter === s ? "border-red-500 bg-red-900/30" : "border-border bg-muted hover:border-gray-500"}`}
            >
              <div className="text-xl font-bold text-foreground">{counts[s]}</div>
              <div className="text-xs text-muted-foreground capitalize">{s === "all" ? "Total" : s}</div>
            </button>
          ))}
        </div>

        {/* Search & filter */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="pl-9 bg-muted border-border text-foreground"
            />
          </div>
        </div>

        {/* Enrollment list */}
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading applications...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-muted-foreground">No applications found.</p>
              {enrollments.length === 0 && (
                <p className="text-muted-foreground text-sm mt-1">Share the enrollment form link to start receiving applications.</p>
              )}
            </div>
          ) : (
            filtered.map((enrollment) => (
              <EnrollmentRow key={enrollment.id} enrollment={enrollment} onAction={handleAction} />
            ))
          )}
        </div>
      </div>
    </>
  );
}
