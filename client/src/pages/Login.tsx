import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, LogIn } from "lucide-react";

const ROLE_REDIRECTS: Record<string, string> = {
  admin: "/dashboard",
  coach: "/coach/my-teams",
  parent: "/parent-dashboard",
  player: "/dashboard",
  nutritionist: "/dashboard",
  mental_coach: "/dashboard",
  physical_trainer: "/dashboard",
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [pending, setPending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    void fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password, role }),
    }).then(async (res) => {
      const text = await res.text();
      if (!text) {
        toast.error("Login failed: empty response from server");
        setPending(false);
        return;
      }
      const data = JSON.parse(text);
      if (!res.ok || !data.success) {
        toast.error(data.error || "Login failed");
        setPending(false);
        return;
      }
      window.location.href = ROLE_REDIRECTS[data.role || role] || "/dashboard";
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="container py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo-transparent.png" alt="Al Ahly Football Academy" className="h-12 w-auto" />
            <span className="text-xl font-bold text-foreground">Al Ahly Football Academy</span>
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
        <Card className="max-w-md mx-auto bg-card border-border">
          <CardHeader>
            <CardTitle className="text-3xl text-foreground flex items-center gap-2">
              <LogIn className="w-8 h-8" />
              Sign In
            </CardTitle>
            <CardDescription className="text-muted-foreground text-base">
              Demo mode is open. Any email and password will sign you in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input
                  id="email"
                  type="text"
                  autoComplete="username"
                  placeholder="anything@demo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-muted border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="anything"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-muted border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-foreground">Enter as</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger id="role" className="bg-muted border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-border">
                    <SelectItem value="admin" className="text-foreground">Admin</SelectItem>
                    <SelectItem value="coach" className="text-foreground">Coach</SelectItem>
                    <SelectItem value="parent" className="text-foreground">Parent</SelectItem>
                    <SelectItem value="player" className="text-foreground">Player</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
