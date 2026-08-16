import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, UserPlus } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLanguage } from '@/contexts/LanguageContext';

export default function UserRegistration() {
  const [, setLocation] = useLocation();
  const { t, language } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<{
    requestedRole: "admin" | "coach" | "nutritionist" | "mental_coach" | "physical_trainer" | "parent" | "player" | "";
    name: string;
    email: string;
    phone: string;
  }>({
    requestedRole: "",
    name: "",
    email: "",
    phone: "",
  });

  const registerMutation = trpc.userRegistration.register.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Registration submitted! Please wait for admin approval.");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit registration");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.requestedRole) {
      toast.error("Please select a role");
      return;
    }

    registerMutation.mutate({
      ...formData,
      requestedRole: formData.requestedRole as "admin" | "coach" | "nutritionist" | "mental_coach" | "physical_trainer" | "parent" | "player",
    });
  };

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-card border-border">
          <CardContent className="pt-12 pb-12 text-center">
            <CheckCircle className="h-20 w-20 text-green-700 dark:text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-foreground mb-4">Registration Submitted!</h1>
            <p className="text-muted-foreground text-lg mb-8">
              Your registration request has been submitted successfully. An administrator will review your request and approve your account shortly. You'll receive a notification once your account is approved.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/">
                <Button variant="outline" className="border-border text-muted-foreground">
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div >
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="container py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo-transparent.png" alt="Future Stars Academy" className="h-12 w-auto" />
            <span className="text-xl font-bold text-foreground">Future Stars Academy</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </header>

      <div className="container py-12">
        <Card className="max-w-2xl mx-auto bg-card border-border">
          <CardHeader>
            <CardTitle className="text-3xl text-foreground flex items-center gap-2">
              <UserPlus className="w-8 h-8" />
              User Registration
            </CardTitle>
            <CardDescription className="text-muted-foreground text-base">
              Register for an account. Your request will be reviewed by an administrator before you can access the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Role Selection */}
              <div className="space-y-2">
                <Label htmlFor="role" className="text-foreground">I am a *</Label>
                <Select
                  value={formData.requestedRole}
                  onValueChange={(value) => setFormData({ ...formData, requestedRole: value as typeof formData.requestedRole })}
                >
                  <SelectTrigger className="bg-muted border-border text-foreground">
                    <SelectValue placeholder="Select your role..." />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-border">
                    <SelectItem value="parent" className="text-foreground">Parent</SelectItem>
                    <SelectItem value="coach" className="text-foreground">Coach</SelectItem>
                    <SelectItem value="player" className="text-foreground">Player</SelectItem>
                    <SelectItem value="nutritionist" className="text-foreground">Nutritionist</SelectItem>
                    <SelectItem value="mental_coach" className="text-foreground">Mental Coach</SelectItem>
                    <SelectItem value="physical_trainer" className="text-foreground">Physical Trainer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-muted border-border text-foreground"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-muted border-border text-foreground"
                  placeholder="your.email@example.com"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-foreground">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-muted border-border text-foreground"
                  placeholder="+20 XXX XXX XXXX"
                />
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? "Submitting..." : "Submit Registration"}
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <a href={getLoginUrl()} target="_top" className="text-emerald-700 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400">
                  Sign in here
                </a>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
