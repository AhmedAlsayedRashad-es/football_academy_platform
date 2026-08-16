import { useRef, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { PasskeyManager } from "@/components/BiometricLogin";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  User, Phone, Mail, MessageCircle, Camera, Save, Shield,
  CheckCircle, Clock, XCircle, Edit2, Loader2, Award, GraduationCap, Star,
  Bell, BellOff, Target, BookOpen, Apple, Image, Globe, Calendar, Flag,
  CheckSquare, Play, Video, Tag, Trash2, ChevronRight, Activity, Heart
, ArrowLeft } from "lucide-react";

const ROLE_LABELS: Record<string, { en: string; ar: string }> = {
  admin: { en: "Administrator", ar: "مدير" },
  coach: { en: "Coach", ar: "مدرب" },
  nutritionist: { en: "Nutritionist", ar: "أخصائي تغذية" },
  mental_coach: { en: "Mental Coach", ar: "مدرب ذهني" },
  physical_trainer: { en: "Physical Trainer", ar: "مدرب لياقة" },
  parent: { en: "Parent", ar: "ولي أمر" },
  player: { en: "Player", ar: "لاعب" },
};

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle; color: string; en: string; ar: string }> = {
  approved: { icon: CheckCircle, color: "text-green-700 dark:text-green-500", en: "Approved", ar: "معتمد" },
  pending: { icon: Clock, color: "text-amber-700 dark:text-amber-500", en: "Pending Approval", ar: "في انتظار الموافقة" },
  rejected: { icon: XCircle, color: "text-red-500", en: "Rejected", ar: "مرفوض" },
};

const NATIONALITIES = [
  "Egyptian", "Saudi", "Emirati", "Qatari", "Kuwaiti", "Bahraini", "Omani", "Jordanian",
  "Lebanese", "Syrian", "Iraqi", "Moroccan", "Tunisian", "Algerian", "Libyan", "Sudanese",
  "British", "American", "French", "German", "Spanish", "Italian", "Brazilian", "Argentine",
  "Nigerian", "Ghanaian", "Senegalese", "Ivorian", "Cameroonian", "South African", "Other"
];

const TABS = [
  { id: "profile", en: "Profile", ar: "الملف الشخصي", icon: User },
  { id: "goals", en: "Goals", ar: "الأهداف", icon: Target },
  { id: "development", en: "Development Plan", ar: "خطة التطوير", icon: BookOpen },
  { id: "nutrition", en: "Nutrition Plan", ar: "الخطة الغذائية", icon: Apple },
  { id: "media", en: "Tagged Media", ar: "الوسائط المُعلَّمة", icon: Video },
  { id: "notifications", en: "Notifications", ar: "الإشعارات", icon: Bell },
];

export default function Profile() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { language } = useLanguage();
  const ar = language === "ar";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const profileQuery = trpc.auth.profile.useQuery();
  const updateProfile = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      toast.success(ar ? "تم حفظ الملف الشخصي بنجاح" : "Profile saved successfully");
      profileQuery.refetch();
      setEditing(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const notificationsQuery = trpc.auth.getNotifications.useQuery();
  const markRead = trpc.auth.markNotificationRead.useMutation({ onSuccess: () => notificationsQuery.refetch() });
  const markAllRead = trpc.auth.markAllNotificationsRead.useMutation({ onSuccess: () => notificationsQuery.refetch() });
  const taggedMediaQuery = trpc.mediaTagging.getTaggedMediaForUser.useQuery({ userId: user?.id });

  // Player-specific queries
  const isPlayer = user?.role === 'player';
  const playerQuery = trpc.players.getByUserId.useQuery({ userId: user?.id || 0 }, { enabled: isPlayer && !!user?.id });
  const player = playerQuery.data;

  const devGoalsQuery = trpc.playerDevelopmentGoals.getByPlayer.useQuery(
    { playerId: player?.id || 0 },
    { enabled: isPlayer && !!player?.id }
  );
  const devPlanQuery = trpc.development.getMyPlan.useQuery(
    { playerId: player?.id || 0 },
    { enabled: isPlayer && !!player?.id }
  );
  const nutritionQuery = trpc.development.getMyMealPlans.useQuery(
    { playerId: player?.id || 0 },
    { enabled: isPlayer && !!player?.id }
  );

  const [activeTab, setActiveTab] = useState("profile");
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    whatsappPhone: "",
    whatsappNotifications: false,
    bio: "",
    nationality: "",
    dateOfBirth: "",
  });

  const profile = profileQuery.data;

  const initForm = () => {
    if (!profile) return;
    setForm({
      name: (profile as any).name || "",
      email: (profile as any).email || "",
      phone: (profile as any).phone || "",
      whatsappPhone: (profile as any).whatsappPhone || "",
      whatsappNotifications: (profile as any).whatsappNotifications || false,
      bio: (profile as any).bio || "",
      nationality: (profile as any).nationality || "",
      dateOfBirth: (profile as any).dateOfBirth ? new Date((profile as any).dateOfBirth).toISOString().split('T')[0] : "",
    });
    setEditing(true);
  };

  const handleSave = () => {
    updateProfile.mutate({
      name: form.name || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      whatsappPhone: form.whatsappPhone || undefined,
      whatsappNotifications: form.whatsappNotifications,
      bio: form.bio || null,
      nationality: form.nationality || null,
      dateOfBirth: form.dateOfBirth || null,
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(ar ? "حجم الصورة يجب أن يكون أقل من 5 ميجابايت" : "Image must be under 5MB");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await fetch("/api/upload-avatar", { method: "POST", credentials: "include", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      toast.success(ar ? "تم تحديث الصورة الشخصية" : "Profile photo updated");
      profileQuery.refetch();
    } catch {
      toast.error(ar ? "فشل رفع الصورة" : "Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error(ar ? "حجم الصورة يجب أن يكون أقل من 10 ميجابايت" : "Image must be under 10MB");
      return;
    }
    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append("cover", file);
      const res = await fetch("/api/upload-cover", { method: "POST", credentials: "include", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      toast.success(ar ? "تم تحديث صورة الغلاف" : "Cover photo updated");
      profileQuery.refetch();
    } catch {
      toast.error(ar ? "فشل رفع صورة الغلاف" : "Failed to upload cover photo");
    } finally {
      setUploadingCover(false);
    }
  };

  const openWhatsApp = () => {
    const phone = (import.meta.env.VITE_ACADEMY_WHATSAPP || "+201099822203").replace(/\D/g, "");
    const msg = ar
      ? `مرحباً، أنا ${(profile as any)?.name || ""} وأحتاج إلى مساعدة`
      : `Hello, I'm ${(profile as any)?.name || ""} and I need help`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  if (profileQuery.isLoading) {
    return (
      <>

      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Dashboard
      </button>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  const statusCfg = STATUS_CONFIG[(profile as any)?.accountStatus || "pending"];
  const StatusIcon = statusCfg.icon;
  const roleLabel = ROLE_LABELS[(profile as any)?.role || "player"];
  const notifications = (notificationsQuery.data as any[]) || [];
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;
  const taggedMedia = (taggedMediaQuery.data as any[]) || [];

  return (
    <>
      <div className={`max-w-4xl mx-auto space-y-0 ${ar ? "rtl" : "ltr"}`}>
        {/* ── Cover Photo ── */}
        <div className="relative h-48 sm:h-64 rounded-t-xl overflow-hidden bg-gradient-to-br from-primary/30 via-primary/10 to-muted">
          {(profile as any)?.coverPhotoUrl ? (
            <img src={(profile as any).coverPhotoUrl} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Image className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm opacity-60">{ar ? "صورة الغلاف" : "Cover Photo"}</p>
              </div>
            </div>
          )}
          <button
            onClick={() => coverInputRef.current?.click()}
            disabled={uploadingCover}
            className="absolute top-3 right-3 bg-black/50 text-white rounded-lg px-3 py-1.5 text-xs flex items-center gap-1.5 hover:bg-black/70 transition-colors"
          >
            {uploadingCover ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
            {ar ? "تغيير الغلاف" : "Change Cover"}
          </button>
          <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
        </div>

        {/* ── Avatar + Name Row ── */}
        <div className="bg-card border-x border-b rounded-b-xl px-6 pb-4">
          <div className={`flex flex-col sm:flex-row gap-4 items-start sm:items-end -mt-12 mb-4 ${ar ? "sm:flex-row-reverse" : ""}`}>
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-muted border-4 border-background shadow-lg">
                {(profile as any)?.avatarUrl ? (
                  <img src={(profile as any).avatarUrl} alt={(profile as any)?.name || ""} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                    <User className="h-10 w-10 text-primary/50" />
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 shadow-md hover:bg-primary/90 transition-colors"
              >
                {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div className={`flex-1 pt-14 sm:pt-0 ${ar ? "text-right" : ""}`}>
              <div className={`flex items-center gap-2 flex-wrap ${ar ? "flex-row-reverse" : ""}`}>
                <h1 className="text-xl font-bold">{(profile as any)?.name || (ar ? "بدون اسم" : "No name set")}</h1>
                <Badge variant="outline" className="capitalize">{ar ? roleLabel.ar : roleLabel.en}</Badge>
                <div className={`flex items-center gap-1 text-sm ${statusCfg.color}`}>
                  <StatusIcon className="h-4 w-4" />
                  <span>{ar ? statusCfg.ar : statusCfg.en}</span>
                </div>
              </div>
              {(profile as any)?.bio && (
                <p className="text-sm text-muted-foreground mt-1 max-w-lg">{(profile as any).bio}</p>
              )}
              <div className={`flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap ${ar ? "flex-row-reverse" : ""}`}>
                {(profile as any)?.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{(profile as any).email}</span>}
                {(profile as any)?.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{(profile as any).phone}</span>}
                {(profile as any)?.nationality && <span className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" />{(profile as any).nationality}</span>}
              </div>
            </div>
            <div className={`flex gap-2 flex-wrap ${ar ? "flex-row-reverse" : ""}`}>
              <Button size="sm" onClick={editing ? handleSave : initForm} disabled={updateProfile.isPending}>
                {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : editing ? <Save className="h-4 w-4 mr-2" /> : <Edit2 className="h-4 w-4 mr-2" />}
                {editing ? (ar ? "حفظ" : "Save") : (ar ? "تعديل" : "Edit Profile")}
              </Button>
              {editing && <Button size="sm" variant="outline" onClick={() => setEditing(false)}>{ar ? "إلغاء" : "Cancel"}</Button>}
              <Button size="sm" variant="outline" onClick={openWhatsApp} className="text-green-600 border-green-600 hover:bg-green-50">
                <MessageCircle className="h-4 w-4 mr-2" />{ar ? "واتساب" : "WhatsApp"}
              </Button>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className={`flex gap-1 overflow-x-auto border-t pt-3 ${ar ? "flex-row-reverse" : ""}`}>
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isNotif = tab.id === "notifications";
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors relative ${
                    activeTab === tab.id ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {ar ? tab.ar : tab.en}
                  {isNotif && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Tab Content ── */}
        <div className="mt-4 space-y-4">

          {/* ── PROFILE TAB ── */}
          {activeTab === "profile" && (
            <div className="space-y-4">
              {editing ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Edit2 className="h-4 w-4" />
                      {ar ? "تعديل المعلومات الشخصية" : "Edit Personal Information"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{ar ? "الاسم الكامل" : "Full Name"}</Label>
                        <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder={ar ? "أدخل اسمك الكامل" : "Enter your full name"} />
                      </div>
                      <div className="space-y-2">
                        <Label>{ar ? "البريد الإلكتروني" : "Email Address"}</Label>
                        <Input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" dir="ltr" />
                      </div>
                      <div className="space-y-2">
                        <Label>{ar ? "رقم الهاتف" : "Phone Number"}</Label>
                        <Input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+201234567890" dir="ltr" />
                      </div>
                      <div className="space-y-2">
                        <Label>{ar ? "رقم واتساب" : "WhatsApp Number"}</Label>
                        <Input value={form.whatsappPhone} onChange={(e) => setForm(f => ({ ...f, whatsappPhone: e.target.value }))} placeholder="+201234567890" dir="ltr" />
                      </div>
                      <div className="space-y-2">
                        <Label>{ar ? "الجنسية" : "Nationality"}</Label>
                        <Select value={form.nationality} onValueChange={(v) => setForm(f => ({ ...f, nationality: v }))}>
                          <SelectTrigger><SelectValue placeholder={ar ? "اختر الجنسية" : "Select nationality"} /></SelectTrigger>
                          <SelectContent>
                            {NATIONALITIES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{ar ? "تاريخ الميلاد" : "Date of Birth"}</Label>
                        <Input type="date" value={form.dateOfBirth} onChange={(e) => setForm(f => ({ ...f, dateOfBirth: e.target.value }))} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{ar ? "نبذة شخصية" : "Bio"}</Label>
                      <Textarea
                        value={form.bio}
                        onChange={(e) => setForm(f => ({ ...f, bio: e.target.value }))}
                        placeholder={ar ? "اكتب نبذة قصيرة عن نفسك..." : "Write a short bio about yourself..."}
                        rows={3}
                      />
                    </div>
                    <Separator />
                    <div className={`flex items-center justify-between ${ar ? "flex-row-reverse" : ""}`}>
                      <div>
                        <p className="font-medium text-sm">{ar ? "إشعارات واتساب" : "WhatsApp Notifications"}</p>
                        <p className="text-xs text-muted-foreground">{ar ? "استقبال تحديثات الأكاديمية عبر واتساب" : "Receive academy updates via WhatsApp"}</p>
                      </div>
                      <Switch checked={form.whatsappNotifications} onCheckedChange={(v) => setForm(f => ({ ...f, whatsappNotifications: v }))} />
                    </div>
                    <div className={`flex gap-2 pt-2 ${ar ? "flex-row-reverse" : ""}`}>
                      <Button onClick={handleSave} disabled={updateProfile.isPending}>
                        {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        {ar ? "حفظ التغييرات" : "Save Changes"}
                      </Button>
                      <Button variant="outline" onClick={() => setEditing(false)}>{ar ? "إلغاء" : "Cancel"}</Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {ar ? "المعلومات الشخصية" : "Personal Information"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      {[
                        { label: ar ? "الاسم" : "Name", value: (profile as any)?.name },
                        { label: ar ? "البريد الإلكتروني" : "Email", value: (profile as any)?.email },
                        { label: ar ? "الهاتف" : "Phone", value: (profile as any)?.phone },
                        { label: ar ? "واتساب" : "WhatsApp", value: (profile as any)?.whatsappPhone },
                        { label: ar ? "الجنسية" : "Nationality", value: (profile as any)?.nationality },
                        { label: ar ? "تاريخ الميلاد" : "Date of Birth", value: (profile as any)?.dateOfBirth ? new Date((profile as any).dateOfBirth).toLocaleDateString(ar ? "ar-EG" : "en-GB") : null },
                        { label: ar ? "الدور" : "Role", value: ar ? roleLabel.ar : roleLabel.en },
                        { label: ar ? "تاريخ الانضمام" : "Member Since", value: (profile as any)?.createdAt ? new Date((profile as any).createdAt).toLocaleDateString(ar ? "ar-EG" : "en-GB", { year: "numeric", month: "long", day: "numeric" }) : null },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-muted-foreground text-xs mb-0.5">{label}</p>
                          <p className="font-medium">{value || <span className="text-muted-foreground italic text-xs">{ar ? "غير محدد" : "Not set"}</span>}</p>
                        </div>
                      ))}
                    </div>
                    {(profile as any)?.bio && (
                      <>
                        <Separator className="my-4" />
                        <div>
                          <p className="text-muted-foreground text-xs mb-1">{ar ? "نبذة شخصية" : "Bio"}</p>
                          <p className="text-sm">{(profile as any).bio}</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Passkey / Biometric Login */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {ar ? "تسجيل الدخول البيومتري (Face ID / بصمة الإصبع)" : "Biometric Login (Face ID / Fingerprint)"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {ar ? "سجّل بصمتك أو وجهك لتسجيل الدخول بدون كلمة مرور في المرات القادمة." : "Register your face or fingerprint to sign in without a password next time."}
                  </p>
                  <PasskeyManager />
                </CardContent>
              </Card>

              {/* Account Security */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {ar ? "معلومات الحساب" : "Account Information"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">{ar ? "الدور" : "Role"}</p>
                      <p className="font-medium capitalize">{ar ? roleLabel.ar : roleLabel.en}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">{ar ? "حالة الحساب" : "Status"}</p>
                      <div className={`flex items-center gap-1 ${statusCfg.color}`}>
                        <StatusIcon className="h-4 w-4" />
                        <span className="font-medium">{ar ? statusCfg.ar : statusCfg.en}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">{ar ? "تاريخ الانضمام" : "Member Since"}</p>
                      <p className="font-medium">{(profile as any)?.createdAt ? new Date((profile as any).createdAt).toLocaleDateString(ar ? "ar-EG" : "en-GB", { year: "numeric", month: "short" }) : "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">{ar ? "آخر دخول" : "Last Sign In"}</p>
                      <p className="font-medium">{(profile as any)?.lastSignedIn ? new Date((profile as any).lastSignedIn).toLocaleDateString(ar ? "ar-EG" : "en-GB", { month: "short", day: "numeric" }) : "—"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── GOALS TAB ── */}
          {activeTab === "goals" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  {ar ? "أهدافي" : "My Goals"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isPlayer ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p>{ar ? "هذا القسم مخصص للاعبين" : "This section is for players"}</p>
                  </div>
                ) : devGoalsQuery.isLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{ar ? "جارٍ التحميل..." : "Loading..."}</div>
                ) : !devGoalsQuery.data?.length ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p>{ar ? "لا توجد أهداف بعد" : "No goals yet"}</p>
                    <p className="text-xs mt-1">{ar ? "سيضيف مدربك أهدافك قريباً" : "Your coach will add your goals soon"}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(devGoalsQuery.data as any[]).map((goal: any) => (
                      <div key={goal.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                        <div className={`mt-0.5 shrink-0 ${goal.status === 'completed' ? 'text-green-700 dark:text-green-500' : goal.status === 'in_progress' ? 'text-blue-500' : 'text-muted-foreground'}`}>
                          <CheckSquare className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{goal.title || goal.goalText}</p>
                          {goal.description && <p className="text-xs text-muted-foreground mt-0.5">{goal.description}</p>}
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <Badge variant={goal.status === 'completed' ? 'default' : goal.status === 'in_progress' ? 'secondary' : 'outline'} className="text-xs capitalize">
                              {goal.status?.replace('_', ' ') || 'pending'}
                            </Badge>
                            {goal.targetDate && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(goal.targetDate).toLocaleDateString(ar ? "ar-EG" : "en-GB")}
                              </span>
                            )}
                            {goal.progressPercent !== undefined && (
                              <div className="flex items-center gap-1.5 flex-1 min-w-24">
                                <div className="flex-1 bg-muted rounded-full h-1.5">
                                  <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${goal.progressPercent || 0}%` }} />
                                </div>
                                <span className="text-xs text-muted-foreground">{goal.progressPercent || 0}%</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── DEVELOPMENT PLAN TAB ── */}
          {activeTab === "development" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                  {ar ? "خطة التطوير" : "Development Plan"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isPlayer ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p>{ar ? "هذا القسم مخصص للاعبين" : "This section is for players"}</p>
                  </div>
                ) : devPlanQuery.isLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{ar ? "جارٍ التحميل..." : "Loading..."}</div>
                ) : !devPlanQuery.data ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p>{ar ? "لا توجد خطة تطوير بعد" : "No development plan yet"}</p>
                    <p className="text-xs mt-1">{ar ? "سيضيف مدربك خطتك قريباً" : "Your coach will create your plan soon"}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(() => {
                      const plan = devPlanQuery.data as any;
                      return (
                        <>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                              { label: ar ? "المرحلة" : "Phase", value: plan.phase || plan.currentPhase },
                              { label: ar ? "الموسم" : "Season", value: plan.season },
                              { label: ar ? "تاريخ البداية" : "Start Date", value: plan.startDate ? new Date(plan.startDate).toLocaleDateString(ar ? "ar-EG" : "en-GB") : null },
                              { label: ar ? "تاريخ النهاية" : "End Date", value: plan.endDate ? new Date(plan.endDate).toLocaleDateString(ar ? "ar-EG" : "en-GB") : null },
                            ].map(({ label, value }) => value && (
                              <div key={label} className="p-3 rounded-lg bg-muted/50 text-center">
                                <p className="text-xs text-muted-foreground">{label}</p>
                                <p className="font-semibold text-sm mt-0.5">{value}</p>
                              </div>
                            ))}
                          </div>
                          {plan.technicalFocus && (
                            <div className="p-3 rounded-lg border">
                              <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1"><Activity className="h-3.5 w-3.5" />{ar ? "التركيز التقني" : "Technical Focus"}</p>
                              <p className="text-sm">{plan.technicalFocus}</p>
                            </div>
                          )}
                          {plan.physicalFocus && (
                            <div className="p-3 rounded-lg border">
                              <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{ar ? "التركيز البدني" : "Physical Focus"}</p>
                              <p className="text-sm">{plan.physicalFocus}</p>
                            </div>
                          )}
                          {plan.tacticalFocus && (
                            <div className="p-3 rounded-lg border">
                              <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1"><Flag className="h-3.5 w-3.5" />{ar ? "التركيز التكتيكي" : "Tactical Focus"}</p>
                              <p className="text-sm">{plan.tacticalFocus}</p>
                            </div>
                          )}
                          {plan.mentalFocus && (
                            <div className="p-3 rounded-lg border">
                              <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1"><Star className="h-3.5 w-3.5" />{ar ? "التركيز الذهني" : "Mental Focus"}</p>
                              <p className="text-sm">{plan.mentalFocus}</p>
                            </div>
                          )}
                          {plan.coachNotes && (
                            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                              <p className="text-xs font-semibold text-blue-600 mb-1">{ar ? "ملاحظات المدرب" : "Coach Notes"}</p>
                              <p className="text-sm">{plan.coachNotes}</p>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── NUTRITION PLAN TAB ── */}
          {activeTab === "nutrition" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Apple className="h-5 w-5 text-green-700 dark:text-green-500" />
                  {ar ? "الخطة الغذائية" : "Nutrition Plan"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isPlayer ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Apple className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p>{ar ? "هذا القسم مخصص للاعبين" : "This section is for players"}</p>
                  </div>
                ) : nutritionQuery.isLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{ar ? "جارٍ التحميل..." : "Loading..."}</div>
                ) : !nutritionQuery.data?.length ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Apple className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p>{ar ? "لا توجد خطة غذائية بعد" : "No nutrition plan yet"}</p>
                    <p className="text-xs mt-1">{ar ? "سيضيف أخصائي التغذية خطتك قريباً" : "Your nutritionist will create your plan soon"}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(nutritionQuery.data as any[]).map((plan: any) => (
                      <div key={plan.id} className="p-4 rounded-lg border space-y-3">
                        <div className={`flex items-center justify-between ${ar ? "flex-row-reverse" : ""}`}>
                          <h3 className="font-semibold">{plan.title || (ar ? "خطة غذائية" : "Meal Plan")}</h3>
                          <Badge variant="outline">{plan.planType || plan.type || "Standard"}</Badge>
                        </div>
                        {plan.dailyCalories && (
                          <div className="grid grid-cols-4 gap-2 text-center">
                            {[
                              { label: ar ? "سعرات" : "Calories", value: plan.dailyCalories, unit: "kcal", color: "text-orange-700 dark:text-orange-500" },
                              { label: ar ? "بروتين" : "Protein", value: plan.proteinGrams, unit: "g", color: "text-blue-500" },
                              { label: ar ? "كربوهيدرات" : "Carbs", value: plan.carbsGrams, unit: "g", color: "text-yellow-700 dark:text-yellow-500" },
                              { label: ar ? "دهون" : "Fat", value: plan.fatGrams, unit: "g", color: "text-red-500" },
                            ].map(({ label, value, unit, color }) => value && (
                              <div key={label} className="p-2 rounded-lg bg-muted/50">
                                <p className={`font-bold text-lg ${color}`}>{value}</p>
                                <p className="text-xs text-muted-foreground">{unit}</p>
                                <p className="text-xs font-medium">{label}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        {plan.notes && <p className="text-sm text-muted-foreground">{plan.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── TAGGED MEDIA TAB ── */}
          {activeTab === "media" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-purple-500" />
                  {ar ? "الوسائط المُعلَّمة" : "Tagged Media"}
                  {taggedMedia.length > 0 && <Badge variant="secondary">{taggedMedia.length}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {taggedMediaQuery.isLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{ar ? "جارٍ التحميل..." : "Loading..."}</div>
                ) : !taggedMedia.length ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Tag className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p>{ar ? "لم يتم تعليمك في أي وسائط بعد" : "You haven't been tagged in any media yet"}</p>
                    <p className="text-xs mt-1">{ar ? "ستظهر هنا الفيديوهات والصور التي يتم تعليمك فيها" : "Videos and photos you're tagged in will appear here"}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {taggedMedia.map((item: any) => (
                      <div key={item.id} className="rounded-lg overflow-hidden border bg-muted/30 group cursor-pointer hover:border-primary transition-colors">
                        <div className="relative aspect-video bg-muted">
                          {item.thumbnailUrl ? (
                            <img src={item.thumbnailUrl} alt={item.mediaTitle || ""} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="h-8 w-8 text-muted-foreground opacity-50" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Play className="h-8 w-8 text-foreground" />
                          </div>
                          <div className="absolute top-1.5 left-1.5">
                            <Badge variant="secondary" className="text-xs flex items-center gap-1">
                              <Tag className="h-2.5 w-2.5" />{ar ? "مُعلَّم" : "Tagged"}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-2">
                          <p className="text-xs font-medium truncate">{item.mediaTitle || (ar ? "فيديو" : "Video")}</p>
                          {item.mediaDate && <p className="text-xs text-muted-foreground">{new Date(item.mediaDate).toLocaleDateString(ar ? "ar-EG" : "en-GB")}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── NOTIFICATIONS TAB ── */}
          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <div className={`flex items-center justify-between ${ar ? "flex-row-reverse" : ""}`}>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-amber-700 dark:text-amber-500" />
                    {ar ? "الإشعارات" : "Notifications"}
                    {unreadCount > 0 && <Badge variant="destructive">{unreadCount}</Badge>}
                  </CardTitle>
                  {unreadCount > 0 && (
                    <Button size="sm" variant="ghost" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
                      <BellOff className="h-4 w-4 mr-1" />
                      {ar ? "تحديد الكل كمقروء" : "Mark all read"}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {notificationsQuery.isLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{ar ? "جارٍ التحميل..." : "Loading..."}</div>
                ) : !notifications.length ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p>{ar ? "لا توجد إشعارات" : "No notifications yet"}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((notif: any) => {
                      const typeColors: Record<string, string> = {
                        success: "border-green-200 bg-green-50 dark:bg-green-950/20",
                        warning: "border-amber-200 bg-amber-50 dark:bg-amber-950/20",
                        error: "border-red-200 bg-red-50 dark:bg-red-950/20",
                        goal: "border-blue-200 bg-blue-50 dark:bg-blue-950/20",
                        training: "border-purple-200 bg-purple-50 dark:bg-purple-950/20",
                        medical: "border-pink-200 bg-pink-50 dark:bg-pink-950/20",
                        payment: "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20",
                        info: "border-gray-200 bg-gray-50 dark:bg-gray-800/30",
                      };
                      return (
                        <div
                          key={notif.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${typeColors[notif.type] || typeColors.info} ${!notif.isRead ? "font-medium" : "opacity-70"}`}
                        >
                          <Bell className={`h-4 w-4 mt-0.5 shrink-0 ${!notif.isRead ? "text-primary" : "text-muted-foreground"}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">{notif.title}</p>
                            {notif.body && <p className="text-xs text-muted-foreground mt-0.5">{notif.body}</p>}
                            <p className="text-xs text-muted-foreground mt-1">{new Date(notif.createdAt).toLocaleDateString(ar ? "ar-EG" : "en-GB", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                          </div>
                          {!notif.isRead && (
                            <button
                              onClick={() => markRead.mutate({ notificationId: notif.id })}
                              className="shrink-0 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          {notif.link && (
                            <a href={notif.link} className="shrink-0 text-muted-foreground hover:text-foreground">
                              <ChevronRight className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
