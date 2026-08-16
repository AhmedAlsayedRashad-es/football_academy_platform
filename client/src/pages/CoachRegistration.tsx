import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/contexts/LanguageContext';
import {
  UserPlus, Upload, CheckCircle, FileText, Award, Phone,
  Mail, MapPin, Calendar, Briefcase, GraduationCap, Shield
, ArrowLeft } from "lucide-react";

const COACHING_LICENSES = [
  "FIFA Pro License", "UEFA Pro License", "UEFA A License", "UEFA B License",
  "CAF A License", "CAF B License", "EFA A License", "EFA B License",
  "EFA C License", "AFC A License", "AFC B License", "No License"
];

const SPECIALIZATIONS = [
  "Head Coach", "Assistant Coach", "Goalkeeper Coach", "Fitness/Conditioning Coach",
  "Technical Director", "Academy Director", "Youth Development Coach",
  "Tactical Analyst", "Strength & Conditioning", "Sports Psychologist"
];

const EXPERIENCE_LEVELS = [
  "0-2 years", "3-5 years", "6-10 years", "11-15 years", "15+ years"
];

export default function CoachRegistration() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [certFiles, setCertFiles] = useState<File[]>([]);

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", dob: "",
    nationality: "Egyptian", address: "", city: "",
    specialization: "", license: "", experience: "",
    currentClub: "", previousClubs: "",
    bio: "", languages: "Arabic, English",
    emergencyContact: "", emergencyPhone: "",
    linkedIn: "", preferredTeamAge: "",
  });

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "File too large", description: "CV must be under 10MB", variant: "destructive" });
        return;
      }
      setCvFile(file);
      toast({ title: "CV uploaded", description: file.name });
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      toast({ title: "Photo uploaded", description: file.name });
    }
  };

  const handleCertUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setCertFiles(prev => [...prev, ...files]);
    toast({ title: `${files.length} certificate(s) uploaded` });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const required = ["firstName", "lastName", "email", "phone", "specialization", "license", "experience"];
    for (const field of required) {
      if (!form[field as keyof typeof form]) {
        toast({ title: "Missing required field", description: `Please fill in: ${field}`, variant: "destructive" });
        return;
      }
    }
    if (!cvFile) {
      toast({ title: "CV required", description: "Please upload your CV/Resume", variant: "destructive" });
      return;
    }
    // In production this would call a tRPC mutation to save the registration
    setSubmitted(true);
    toast({ title: "Registration submitted!", description: "Your application has been received. We will review it within 3-5 business days." });
  };

  if (submitted) {
    return (
      <>

      <button
        onClick={() => navigate("/user-management")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        User Management
      </button>
        <div className="p-6 flex items-center justify-center min-h-96">
          <Card className="max-w-lg w-full text-center">
            <CardContent className="p-8">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
              <p className="text-gray-600 mb-4">
                Thank you, <strong>{form.firstName} {form.lastName}</strong>. Your coaching application has been received.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 text-left text-sm space-y-2 mb-6">
                <div className="flex justify-between"><span className="text-muted-foreground">Specialization:</span><span className="font-medium">{form.specialization}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">License:</span><span className="font-medium">{form.license}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Experience:</span><span className="font-medium">{form.experience}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">CV:</span><span className="font-medium text-green-600">✓ {cvFile?.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Certificates:</span><span className="font-medium">{certFiles.length} file(s)</span></div>
              </div>
              <p className="text-xs text-muted-foreground mb-4">Reference ID: REG-{Date.now().toString().slice(-8)}</p>
              <Button onClick={() => setSubmitted(false)} variant="outline" className="w-full">Submit Another Application</Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-red-600" />
            Coach Registration
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Apply to join the Future Stars Academy coaching staff. All fields marked * are required.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-blue-600" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">First Name *</Label>
                <Input placeholder="e.g. Khaled" value={form.firstName} onChange={e => handleChange("firstName", e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Last Name *</Label>
                <Input placeholder="e.g. Ibrahim" value={form.lastName} onChange={e => handleChange("lastName", e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1"><Mail className="h-3 w-3" /> Email *</Label>
                <Input type="email" placeholder="coach@example.com" value={form.email} onChange={e => handleChange("email", e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1"><Phone className="h-3 w-3" /> Phone *</Label>
                <Input placeholder="+20 100 000 0000" value={form.phone} onChange={e => handleChange("phone", e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1"><Calendar className="h-3 w-3" /> Date of Birth</Label>
                <Input type="date" value={form.dob} onChange={e => handleChange("dob", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Nationality</Label>
                <Input placeholder="Egyptian" value={form.nationality} onChange={e => handleChange("nationality", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1"><MapPin className="h-3 w-3" /> City</Label>
                <Input placeholder="Cairo" value={form.city} onChange={e => handleChange("city", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Languages Spoken</Label>
                <Input placeholder="Arabic, English" value={form.languages} onChange={e => handleChange("languages", e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Professional Qualifications */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-green-600" />
                Professional Qualifications
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Specialization / Role *</Label>
                <Select value={form.specialization} onValueChange={v => handleChange("specialization", v)}>
                  <SelectTrigger><SelectValue placeholder="Select role..." /></SelectTrigger>
                  <SelectContent>
                    {SPECIALIZATIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Coaching License *</Label>
                <Select value={form.license} onValueChange={v => handleChange("license", v)}>
                  <SelectTrigger><SelectValue placeholder="Select license..." /></SelectTrigger>
                  <SelectContent>
                    {COACHING_LICENSES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Years of Experience *</Label>
                <Select value={form.experience} onValueChange={v => handleChange("experience", v)}>
                  <SelectTrigger><SelectValue placeholder="Select experience..." /></SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_LEVELS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Preferred Age Group</Label>
                <Select value={form.preferredTeamAge} onValueChange={v => handleChange("preferredTeamAge", v)}>
                  <SelectTrigger><SelectValue placeholder="Select age group..." /></SelectTrigger>
                  <SelectContent>
                    {["U9", "U11", "U13", "U15", "U17", "U19", "U21", "Senior", "Any"].map(a => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1"><Briefcase className="h-3 w-3" /> Current Club / Organization</Label>
                <Input placeholder="e.g. Future Stars SC" value={form.currentClub} onChange={e => handleChange("currentClub", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">LinkedIn Profile</Label>
                <Input placeholder="https://linkedin.com/in/..." value={form.linkedIn} onChange={e => handleChange("linkedIn", e.target.value)} />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Previous Clubs / Experience</Label>
                <Textarea
                  placeholder="List your previous coaching positions, clubs, and achievements..."
                  value={form.previousClubs}
                  onChange={e => handleChange("previousClubs", e.target.value)}
                  rows={3}
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Professional Bio / Cover Letter</Label>
                <Textarea
                  placeholder="Tell us about your coaching philosophy, methodology, and what you can bring to the academy..."
                  value={form.bio}
                  onChange={e => handleChange("bio", e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Document Uploads */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="h-4 w-4 text-purple-600" />
                Document Uploads
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* CV Upload */}
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 hover:border-red-300 transition-colors">
                <Label className="text-xs font-semibold text-gray-700 block mb-2">
                  CV / Resume * (PDF, DOC, DOCX — max 10MB)
                </Label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer">
                    <input type="file" accept=".pdf,.doc,.docx" onChange={handleCVUpload} className="hidden" />
                    <Button type="button" variant="outline" size="sm" className="gap-2" asChild>
                      <span><Upload className="h-3 w-3" /> {cvFile ? "Change CV" : "Upload CV"}</span>
                    </Button>
                  </label>
                  {cvFile && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600 font-medium">{cvFile.name}</span>
                      <Badge className="bg-green-100 text-green-700 text-xs">✓ Uploaded</Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Photo Upload */}
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <Label className="text-xs font-semibold text-gray-700 block mb-2">
                  Professional Photo (JPG, PNG — max 5MB)
                </Label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    <Button type="button" variant="outline" size="sm" className="gap-2" asChild>
                      <span><Upload className="h-3 w-3" /> {photoFile ? "Change Photo" : "Upload Photo"}</span>
                    </Button>
                  </label>
                  {photoFile && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-green-600 font-medium">{photoFile.name}</span>
                      <Badge className="bg-green-100 text-green-700 text-xs">✓ Uploaded</Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Certificates Upload */}
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 hover:border-yellow-300 transition-colors">
                <Label className="text-xs font-semibold text-gray-700 block mb-2">
                  Coaching Certificates & Licenses (PDF, JPG — multiple files allowed)
                </Label>
                <div className="flex items-center gap-3 flex-wrap">
                  <label className="cursor-pointer">
                    <input type="file" accept=".pdf,image/*" multiple onChange={handleCertUpload} className="hidden" />
                    <Button type="button" variant="outline" size="sm" className="gap-2" asChild>
                      <span><Award className="h-3 w-3" /> Upload Certificates</span>
                    </Button>
                  </label>
                  {certFiles.map((f, i) => (
                    <Badge key={i} className="bg-yellow-100 text-yellow-700 text-xs gap-1">
                      <FileText className="h-3 w-3" /> {f.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
                <Shield className="h-3 w-3 inline mr-1" />
                All documents are stored securely and used only for the application review process. 
                Your data is protected in accordance with GDPR and Egyptian data protection regulations.
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Phone className="h-4 w-4 text-orange-600" />
                Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Emergency Contact Name</Label>
                <Input placeholder="Full name" value={form.emergencyContact} onChange={e => handleChange("emergencyContact", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Emergency Contact Phone</Label>
                <Input placeholder="+20 100 000 0000" value={form.emergencyPhone} onChange={e => handleChange("emergencyPhone", e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              By submitting, you confirm that all information provided is accurate and complete.
            </p>
            <Button type="submit" className="bg-red-700 hover:bg-red-800 text-white gap-2 px-8">
              <UserPlus className="h-4 w-4" />
              Submit Application
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
