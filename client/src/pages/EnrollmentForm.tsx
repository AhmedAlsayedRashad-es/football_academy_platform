import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, User, Phone, Mail, Shield, Star, ArrowLeft, CreditCard, Lock, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from '@/contexts/LanguageContext';

const ACADEMY_LOGO = "/logo-transparent.png";

const PLANS = [
  { id: "beginner", name: "Beginner", age: "", price: 800, sessions: "3 sessions/week", perks: ["Basic coaching", "Attendance tracking", "Parent portal access"] },
  { id: "intermediate", name: "Intermediate", age: "", price: 850, sessions: "4 sessions/week", perks: ["Advanced coaching", "Video analysis", "Performance tracking"] },
  { id: "advanced", name: "Advanced", age: "", price: 900, sessions: "5 sessions/week", perks: ["Elite coaching", "AI analysis", "Match participation"] },
  { id: "elite", name: "Elite", age: "", price: 1000, sessions: "6 sessions/week", perks: ["Pro-level coaching", "Scout exposure", "Full AI suite"] },
];

const schema = z.object({
  studentFirstName: z.string().min(1, "Required"),
  studentLastName: z.string().min(1, "Required"),
  dateOfBirth: z.string().min(1, "Required"),
  gender: z.enum(["male", "female"]),
  parentFirstName: z.string().min(1, "Required"),
  parentLastName: z.string().min(1, "Required"),
  parentEmail: z.string().email("Invalid email"),
  parentPhone: z.string().min(7, "Required"),
  program: z.enum(["beginner", "intermediate", "advanced", "elite"]),
  ageGroup: z.string().min(1, "Required"),
  teamType: z.enum(["main", "academy"]).default("academy"),
  clubTeamId: z.string().optional(),
  preferredPosition: z.enum(["goalkeeper", "defender", "midfielder", "forward", "any"]).default("any"),
  previousExperience: z.string().optional(),
  medicalConditions: z.string().optional(),
  emergencyContact: z.string().optional(),
});

// Fields with .default() make zod's input and output types differ: the form
// holds the input shape, while the submit handler receives the parsed output.
type FormInput = z.input<typeof schema>;
type FormData = z.output<typeof schema>;

type Step = "form" | "payment" | "success";

export default function EnrollmentForm() {
  const { t, language } = useLanguage();
  const [step, setStep] = useState<Step>("form");
  const [formData, setFormData] = useState<FormData | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const { data: allTeams } = trpc.teams.getAll.useQuery();
  const [receiptId] = useState(() => "AA-" + Math.random().toString(36).substring(2, 10).toUpperCase());
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormInput, unknown, FormData>({
    resolver: zodResolver(schema),
    defaultValues: { gender: "male", program: "beginner", preferredPosition: "any" },
  });

  const selectedProgram = watch("program") || "beginner";
  const plan = PLANS.find(p => p.id === selectedProgram) || PLANS[0];

  const submitMutation = trpc.enrollments.submit.useMutation({
    onSuccess: () => setStep("success"),
    onError: (err) => {
      setPaymentProcessing(false);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const onFormSubmit = (data: FormData) => {
    setFormData(data);
    setStep("payment");
  };

  const onPaymentConfirm = () => {
    if (!formData) return;
    setPaymentProcessing(true);
    // Simulate payment processing delay then submit enrollment
    setTimeout(() => {
      submitMutation.mutate(formData);
    }, 1800);
  };

  // ─── Step indicator ───────────────────────────────────────────────────
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {(["form", "payment", "success"] as Step[]).map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
            step === s ? "bg-red-700 border-red-500 text-white" :
            (step === "payment" && s === "form") || step === "success" ? "bg-green-700 border-green-500 text-white" :
            "bg-muted border-border text-muted-foreground"
          }`}>{i + 1}</div>
          {i < 2 && <div className={`w-12 h-0.5 ${step === "payment" || step === "success" ? "bg-red-700" : "bg-muted"}`} />}
        </div>
      ))}
    </div>
  );

  // ─── Header ───────────────────────────────────────────────────────────
  const Header = () => (
    <div className="bg-black/60 border-b border-red-900 px-6 py-4">
      <div className="max-w-4xl mx-auto flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => step === "payment" ? setStep("form") : navigate("/")} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" /> {step === "payment" ? "Back" : "Home"}
        </Button>
        <img src={ACADEMY_LOGO} alt="Future Stars FC" className="w-10 h-10 object-contain" />
        <div>
          <h1 className="text-foreground font-bold text-lg">Future Stars Academy</h1>
          <p className="text-red-600 dark:text-red-400 text-xs">Player Enrollment Application</p>
        </div>
      </div>
    </div>
  );

  // ─── Success screen ───────────────────────────────────────────────────
  if (step === "success") {
    return (
      <>
      <div >
        <Header />
        <div className="flex items-center justify-center p-8">
          <Card className="max-w-lg w-full bg-card border-green-800">
            <CardContent className="pt-10 pb-10 text-center">
              <CheckCircle className="w-20 h-20 text-green-700 dark:text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-1">Enrollment Confirmed!</h2>
              <p className="text-muted-foreground mb-4">Welcome to Future Stars Academy. A confirmation email has been sent to {formData?.parentEmail}.</p>
              <div className="bg-muted rounded-lg p-4 text-left mb-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Receipt ID</span>
                  <span className="text-foreground font-mono">{receiptId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Player</span>
                  <span className="text-foreground">{formData?.studentFirstName} {formData?.studentLastName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Program</span>
                  <span className="text-foreground capitalize">{formData?.program}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Monthly Fee</span>
                  <span className="text-green-700 dark:text-green-400 font-bold">{plan.price} EGP</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className="bg-green-700 text-white text-xs">Paid</Badge>
                </div>
              </div>
              <p className="text-muted-foreground text-xs mb-4">Our team will schedule a free evaluation session within 2–3 business days.</p>
              <Button onClick={() => navigate("/")} className="bg-red-700 hover:bg-red-600 w-full">Return to Home</Button>
            </CardContent>
          </Card>
        </div>
      </div>
      </>
    );
  }

  // ─── Payment step ─────────────────────────────────────────────────────
  if (step === "payment") {
    return (
      <>
      <div >
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <StepIndicator />
          <h2 className="text-2xl font-bold text-foreground text-center mb-6">Complete Your Subscription</h2>

          {/* Plan summary */}
          <Card className="bg-card border-red-800 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-foreground font-bold text-lg">{plan.name} Program</h3>
                  <p className="text-muted-foreground text-sm">{plan.sessions}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{plan.price} EGP</div>
                  <div className="text-muted-foreground text-xs">per month</div>
                </div>
              </div>
              <div className="border-t border-border pt-4 space-y-1">
                {plan.perks.map(perk => (
                  <div key={perk} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-700 dark:text-green-400 shrink-0" /> {perk}
                  </div>
                ))}
              </div>
              <div className="border-t border-border mt-4 pt-4 space-y-1">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Player</span>
                  <span className="text-foreground">{formData?.studentFirstName} {formData?.studentLastName}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Age Group</span>
                  <span className="text-foreground">{formData?.ageGroup}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Parent Email</span>
                  <span className="text-foreground">{formData?.parentEmail}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment method */}
          <Card className="bg-card border-border mb-6">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2 text-base">
                <CreditCard className="w-5 h-5 text-red-600 dark:text-red-400" /> Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "card", label: "Credit / Debit Card", icon: "💳" },
                  { id: "vodafone", label: "Vodafone Cash", icon: "📱" },
                  { id: "instapay", label: "InstaPay", icon: "⚡" },
                ].map(method => (
                  <button
                    key={method.id}
                    type="button"
                    className={`border rounded-lg p-3 text-center transition-all ${method.id === "card" ? "border-red-600 bg-red-900/30" : "border-border bg-muted opacity-60 cursor-not-allowed"}`}
                    disabled={method.id !== "card"}
                  >
                    <div className="text-2xl mb-1">{method.icon}</div>
                    <div className="text-xs text-muted-foreground">{method.label}</div>
                    {method.id !== "card" && <div className="text-xs text-muted-foreground mt-1">Coming soon</div>}
                  </button>
                ))}
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-muted-foreground text-sm">Card Number</Label>
                  <Input className="bg-muted border-border text-foreground mt-1 font-mono" placeholder="4242 4242 4242 4242" maxLength={19} value={cardNumber} onChange={e => setCardNumber(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-muted-foreground text-sm">Expiry Date</Label>
                    <Input className="bg-muted border-border text-foreground mt-1" placeholder="MM / YY" maxLength={7} value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">CVV</Label>
                    <Input className="bg-muted border-border text-foreground mt-1" placeholder="•••" maxLength={4} type="password" value={cardCvv} onChange={e => setCardCvv(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Cardholder Name</Label>
                  <Input className="bg-muted border-border text-foreground mt-1" placeholder={`${formData?.parentFirstName} ${formData?.parentLastName}`} value={cardName} onChange={e => setCardName(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order total */}
          <div className="bg-card border border-border rounded-lg p-4 mb-6 space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Monthly Subscription</span>
              <span>{plan.price} EGP</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Registration Fee (one-time)</span>
              <span>200 EGP</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>VAT (14%)</span>
              <span>{Math.round((plan.price + 200) * 0.14)} EGP</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between font-bold">
              <span className="text-foreground">Total Due Today</span>
              <span className="text-red-600 dark:text-red-400 text-lg">{plan.price + 200 + Math.round((plan.price + 200) * 0.14)} EGP</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-4 justify-center">
            <Lock className="w-3 h-3" /> Secured by 256-bit SSL encryption. Your payment data is never stored.
          </div>

          <Button
            onClick={onPaymentConfirm}
            disabled={paymentProcessing}
            className="w-full bg-red-700 hover:bg-red-600 text-white py-3 text-base font-semibold"
          >
            {paymentProcessing ? (
              <span className="flex items-center gap-2"><span className="animate-spin">⏳</span> Processing Payment...</span>
            ) : (
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4" /> Pay {plan.price + 200 + Math.round((plan.price + 200) * 0.14)} EGP & Confirm Enrollment
              </span>
            )}
          </Button>
        </div>
      </div>
      </>
    );
  }

  // ─── Step 1: Enrollment form ──────────────────────────────────────────
  return (
    <>
    <div >
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <StepIndicator />
        <div className="text-center mb-8">
          <Badge className="bg-red-700 text-white mb-3">Open Enrollment 2025/2026</Badge>
          <h2 className="text-3xl font-bold text-foreground mb-2">Join Future Stars Academy</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Register your child for the most prestigious football academy in Egypt. Our UEFA-certified coaches develop the next generation of champions.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {PLANS.map((p) => (
            <div key={p.id} className={`border rounded-lg p-3 text-center cursor-pointer transition-all ${selectedProgram === p.id ? "border-red-500 bg-red-900/40" : "border-border bg-card"}`}
              onClick={() => setValue("program", p.id as any)}>
              <Star className={`w-5 h-5 mx-auto mb-1 ${selectedProgram === p.id ? "text-yellow-700 dark:text-yellow-400" : "text-muted-foreground"}`} />
              <div className="text-foreground font-semibold text-sm">{p.name}</div>

              <div className="text-red-600 dark:text-red-400 text-xs font-bold mt-1">{p.price} EGP/mo</div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)}>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <User className="w-5 h-5 text-red-600 dark:text-red-400" /> Player Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-muted-foreground">First Name *</Label>
                    <Input {...register("studentFirstName")} className="bg-muted border-border text-foreground mt-1" placeholder="Ahmed" />
                    {errors.studentFirstName && <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.studentFirstName.message}</p>}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Last Name *</Label>
                    <Input {...register("studentLastName")} className="bg-muted border-border text-foreground mt-1" placeholder="Mohamed" />
                    {errors.studentLastName && <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.studentLastName.message}</p>}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date of Birth *</Label>
                  <Input {...register("dateOfBirth")} type="date" className="bg-muted border-border text-foreground mt-1" />
                  {errors.dateOfBirth && <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.dateOfBirth.message}</p>}
                </div>
                <div>
                  <Label className="text-muted-foreground">Gender *</Label>
                  <Select onValueChange={(v) => setValue("gender", v as "male" | "female")} defaultValue="male">
                    <SelectTrigger className="bg-muted border-border text-foreground mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-muted-foreground">Preferred Position</Label>
                  <Select onValueChange={(v) => setValue("preferredPosition", v as any)} defaultValue="any">
                    <SelectTrigger className="bg-muted border-border text-foreground mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">No Preference</SelectItem>
                      <SelectItem value="goalkeeper">Goalkeeper</SelectItem>
                      <SelectItem value="defender">Defender</SelectItem>
                      <SelectItem value="midfielder">Midfielder</SelectItem>
                      <SelectItem value="forward">Forward</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-muted-foreground">Previous Experience</Label>
                  <Textarea {...register("previousExperience")} className="bg-muted border-border text-foreground mt-1" placeholder="Any previous clubs or training..." rows={2} />
                </div>
                <div>
                  <Label className="text-muted-foreground">Medical Conditions</Label>
                  <Textarea {...register("medicalConditions")} className="bg-muted border-border text-foreground mt-1" placeholder="Any relevant medical conditions..." rows={2} />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Phone className="w-5 h-5 text-red-600 dark:text-red-400" /> Parent / Guardian
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-muted-foreground">First Name *</Label>
                      <Input {...register("parentFirstName")} className="bg-muted border-border text-foreground mt-1" />
                      {errors.parentFirstName && <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.parentFirstName.message}</p>}
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Last Name *</Label>
                      <Input {...register("parentLastName")} className="bg-muted border-border text-foreground mt-1" />
                      {errors.parentLastName && <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.parentLastName.message}</p>}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> Email *</Label>
                    <Input {...register("parentEmail")} type="email" className="bg-muted border-border text-foreground mt-1" placeholder="parent@email.com" />
                    {errors.parentEmail && <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.parentEmail.message}</p>}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone (with country code) *</Label>
                    <Input {...register("parentPhone")} className="bg-muted border-border text-foreground mt-1" placeholder="+20 100 000 0000" />
                    {errors.parentPhone && <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.parentPhone.message}</p>}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Emergency Contact</Label>
                    <Input {...register("emergencyContact")} className="bg-muted border-border text-foreground mt-1" placeholder="+20 100 000 0000" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Shield className="w-5 h-5 text-red-600 dark:text-red-400" /> Program Selection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">Program Level *</Label>
                    <Select onValueChange={(v) => setValue("program", v as any)} defaultValue="beginner">
                      <SelectTrigger className="bg-muted border-border text-foreground mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner — 800 EGP/mo</SelectItem>
                        <SelectItem value="intermediate">Intermediate — 850 EGP/mo</SelectItem>
                        <SelectItem value="advanced">Advanced — 900 EGP/mo</SelectItem>
                        <SelectItem value="elite">Elite — 1000 EGP/mo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Age Group *</Label>
                    <Select onValueChange={(v) => setValue("ageGroup", v)}>
                      <SelectTrigger className="bg-muted border-border text-foreground mt-1"><SelectValue placeholder="Select age group" /></SelectTrigger>
                      <SelectContent>
                        {["U8","U9","U10","U11","U12","U13","U14","U15","U16","U17","U18","U19"].map(g => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.ageGroup && <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.ageGroup.message}</p>}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Team Type *</Label>
                    <Select onValueChange={(v) => setValue("teamType" as any, v as any)} defaultValue="academy">
                      <SelectTrigger className="bg-muted border-border text-foreground mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="academy">Academy Team</SelectItem>
                        <SelectItem value="main">Main Team</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Preferred Club Team</Label>
                    <Select onValueChange={(v) => setValue("clubTeamId" as any, v)}>
                      <SelectTrigger className="bg-muted border-border text-foreground mt-1"><SelectValue placeholder="Select a team (optional)" /></SelectTrigger>
                      <SelectContent>
                        {(allTeams || []).map((t: any) => (
                          <SelectItem key={t.id} value={String(t.id)}>{t.name} ({t.ageGroup}) — {t.teamType === 'main' ? 'Main' : 'Academy'}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Button type="submit" className="w-full bg-red-700 hover:bg-red-600 text-white py-3 text-base font-semibold flex items-center justify-center gap-2">
                Continue to Payment <ChevronRight className="w-5 h-5" />
              </Button>
              <p className="text-muted-foreground text-xs text-center">Monthly fee: 800–1000 EGP. A free evaluation session will be scheduled after enrollment.</p>
            </div>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}
