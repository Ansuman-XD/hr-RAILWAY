import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Eye, EyeOff, TrainFront } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";
import type { Session } from "@/lib/types";
import { useSession } from "@/hooks/useAppData";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Login — SBC Coaching Depot Staff & Duty Management" },
      {
        name: "description",
        content:
          "Secure sign-in for HR and Roster managers of the SBC Coaching Depot staff and duty management system.",
      },
      { property: "og:title", content: "SBC Coaching Depot — Staff & Duty Management" },
      {
        property: "og:description",
        content:
          "Manage depot staff records, retirement forecasts, promotions, transfers and disciplinary records.",
      },
    ],
  }),
  component: LoginPage,
});

const ROLES: { value: Session["role"]; label: string }[] = [
  { value: "HR Manager", label: "HR Manager" },
  { value: "Roster Manager", label: "Roster Manager" },
];

const SLIDES: { gradient: string; heading: string[] }[] = [
  {
    gradient: "linear-gradient(180deg, #2b2450 0%, #4a3f7a 32%, #b08a5a 62%, #3a2f1a 100%)",
    heading: ["Every Duty on Time,", "Every Shift in Order."],
  },
  {
    gradient: "linear-gradient(180deg, #1a2a4a 0%, #2f4f7a 35%, #6a8fae 65%, #1a1f2f 100%)",
    heading: ["Rosters Built Around", "the Real Timetable."],
  },
  {
    gradient: "linear-gradient(180deg, #241b3a 0%, #5a3a5f 30%, #a85a4a 65%, #241612 100%)",
    heading: ["One Depot, Every Duty,", "Zero Guesswork."],
  },
  {
    gradient: "linear-gradient(180deg, #10203a 0%, #1f4a4a 35%, #3f8f7a 65%, #0f1f18 100%)",
    heading: ["Overlaps Caught", "Before They Happen."],
  },
  {
    gradient: "linear-gradient(180deg, #2a1830 0%, #6a2f4a 32%, #d9773f 62%, #2a1408 100%)",
    heading: ["Staff Records, Duty Logs,", "One Clear View."],
  },
];

function LoginPage() {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const navigate = useNavigate();
  const [role, setRole] = useState<Session["role"]>("HR Manager");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 2500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    apiClient.getSession().then((existing) => {
      if (existing) {
        navigate({
          to: existing.role === "HR Manager" ? "/app/dashboard" : "/roster",
          replace: true,
        });
      }
    }).catch(() => {});
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const match = await apiClient.login({ role, password });
      setError("");

      toast.success(`Welcome, ${match.name}`);
      queryClient.invalidateQueries({ queryKey: ["session"] });
      navigate({
        to: match.role === "HR Manager" ? "/app/dashboard" : "/roster",
        replace: true,
      });
    } catch (err) {
      setError("Invalid role or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#151220] p-4 md:p-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-[#1c1826] shadow-[0_60px_120px_-40px_rgba(0,0,0,0.7)] md:grid-cols-2">
        {/* Left — image panel */}
        <div className="relative hidden min-h-160 flex-col justify-between overflow-hidden p-6 md:flex">
          <div className="absolute inset-2 overflow-hidden rounded-2xl">
            {SLIDES.map((s, i) => (
              <div
                key={i}
                className="absolute inset-0 transition-opacity duration-1200 ease-in-out"
                style={{ background: s.gradient, opacity: slide === i ? 1 : 0 }}
              />
            ))}
            {/* platform / track silhouette, stays put across slides */}
            <svg
              className="absolute inset-0 h-full w-full opacity-90"
              viewBox="0 0 400 640"
              preserveAspectRatio="none"
            >
              <polygon points="0,640 0,470 400,430 400,640" fill="#0e0c14" />
              <polygon points="0,470 400,430 400,460 0,500" fill="#1a1522" />
              {Array.from({ length: 10 }).map((_, i) => {
                const t = i / 9;
                const y = 500 + t * 140;
                const w = 10 + t * 30;
                return (
                  <rect key={i} x={200 - w / 2} y={y} width={w} height={4} fill="#3a3244" opacity={0.7} />
                );
              })}
            </svg>
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <span className="flex items-center gap-2 text-white">
              <TrainFront className="size-5" />
              <span className="text-sm font-semibold tracking-wide">SBC DEPOT</span>
            </span>
            <span className="rounded-full bg-white/10 px-4 py-2 text-xs text-white/80 backdrop-blur">
              Depot Ops
            </span>
          </div>

          <div className="relative z-10">
            <h2 className="text-[1.6rem] font-semibold leading-tight text-white transition-opacity duration-700">
              {SLIDES[slide]?.heading[0] ?? ""}
              <br />
              {SLIDES[slide]?.heading[1] ?? ""}
            </h2>
            <div className="mt-5 flex gap-1.5">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSlide(i)}
                  aria-label={`Show slide ${i + 1}`}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    slide === i ? "w-8 bg-white" : "w-6 bg-white/25 hover:bg-white/40"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right — form panel */}
        <div className="flex flex-col justify-center px-8 py-10 sm:px-12 md:px-14">
          <div className="mx-auto w-full max-w-md">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/3 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-white/50">
              <TrainFront className="size-3.5" />
              Staff Portal
            </span>

            <h1 className="mt-6 text-[2.1rem] font-semibold leading-tight text-white">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-white/50">
              Sign in with your role and depot password to access your dashboard.
            </p>

            <form onSubmit={submit} noValidate className="mt-9 space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-white/60">Role</Label>
                <div className="grid grid-cols-2 gap-3">
                  {ROLES.map((r) => {
                    const active = role === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRole(r.value)}
                        aria-pressed={active}
                        className={`relative rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-all ${
                          active
                            ? "border-[#6C5CE7] bg-[#6C5CE7]/15 text-white"
                            : "border-white/10 bg-white/3 text-white/45 hover:border-white/20 hover:bg-white/6"
                        }`}
                      >
                        {r.label}
                        {active ? (
                          <span className="absolute right-3 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-[#6C5CE7]" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium text-white/60">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={show ? "text" : "password"}
                    value={password}
                    autoComplete="current-password"
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="h-12 rounded-xl border-white/10 bg-white/3 pr-11 text-white placeholder:text-white/30 focus-visible:border-[#6C5CE7]/60 focus-visible:ring-[#6C5CE7]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute inset-y-0 right-0 grid w-11 place-items-center text-white/35 hover:text-white/70"
                    aria-label={show ? "Hide password" : "Show password"}
                  >
                    {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {error ? (
                <p className="rounded-lg border border-red-500/20 bg-red-500/8 px-3 py-2.5 text-sm text-red-300">
                  {error}
                </p>
              ) : null}

              <Button
                type="submit"
                isLoading={isLoading}
                className="h-12 w-full rounded-xl bg-[#6C5CE7] text-[15px] font-medium text-white shadow-[0_12px_30px_-10px_rgba(108,92,231,0.6)] hover:bg-[#6C5CE7]/90"
              >
                Sign in
                {!isLoading && <ArrowRight className="size-4" />}
              </Button>
            </form>

            <div className="mt-10 flex items-center gap-3">
              <span className="h-px flex-1 bg-white/10" />
              <span className="text-[11px] uppercase tracking-wider text-white/30">Demo credentials</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setRole("HR Manager");
                  setPassword("hr123");
                }}
                className="rounded-xl border border-white/10 bg-white/3 px-4 py-3 text-left text-xs text-white/50 transition-colors hover:border-white/20 hover:bg-white/6"
              >
                <p className="text-white/70">HR Manager</p>
                <p className="mt-0.5 font-mono text-white/40">hr123</p>
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole("Roster Manager");
                  setPassword("roster123");
                }}
                className="rounded-xl border border-white/10 bg-white/3 px-4 py-3 text-left text-xs text-white/50 transition-colors hover:border-white/20 hover:bg-white/6"
              >
                <p className="text-white/70">Roster Manager</p>
                <p className="mt-0.5 font-mono text-white/40">roster123</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}