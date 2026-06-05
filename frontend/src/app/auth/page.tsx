"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useNexoraStore } from "../../store/useNexoraStore";
import GlassCard from "../../components/GlassCard";
import NexoraLogo from "../../components/NexoraLogo";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ShieldCheck, ArrowRight, Github, Chrome, AlertCircle } from "lucide-react";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginAction = useNexoraStore((s) => s.login);

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [step, setStep] = useState<"credentials" | "mfa">("credentials");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("signup") === "true") {
      setIsSignUp(true);
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Please fill out all credentials.");
      return;
    }

    setLoading(true);

    // Simulate login loading delay
    setTimeout(() => {
      setLoading(false);
      // Let's trigger simulated MFA for admin profile login
      if (email.includes("admin") || email === "alex@nexora.ai") {
        setStep("mfa");
      } else {
        triggerLogin("Collaborator");
      }
    }, 1000);
  };

  const handleMfaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaCode.length !== 6) {
      setErrorMessage("Invalid MFA verification code. Must be 6 digits.");
      return;
    }
    triggerLogin("Administrator");
  };

  const triggerLogin = (role: string) => {
    loginAction(email || "guest@nexora.ai", role);
    router.push("/dashboard");
  };

  const handleOAuthLogin = (provider: "google" | "github") => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      loginAction(`${provider}_user@nexora.ai`, "Collaborator");
      router.push("/dashboard");
    }, 800);
  };

  return (
    <div className="w-full max-w-md">
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-6">
        <NexoraLogo className="w-12 h-12 mb-3" />
        <h1 className="text-xl font-bold tracking-wider text-white">NEXORA GATEWAY</h1>
        <p className="text-xs text-zinc-500 mt-1.5">Sign in to sync your company second brain</p>
      </div>

      <GlassCard className="p-8 border-white/5 shadow-2xl relative overflow-hidden" glowColor="rgba(255,255,255,0.02)">
        {/* Top aesthetic accent line */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-white/20" />

        {errorMessage && (
          <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === "credentials" ? (
            <motion.form 
              key="credentials"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleSubmit} 
              className="space-y-4"
            >
              <div>
                <label className="text-[10px] text-zinc-500 font-bold block mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all font-sans"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">
                    Password
                  </label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => alert("Magic Link sent to your inbox.")}
                      className="text-xs text-zinc-400 hover:text-white transition"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all font-sans"
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-3 bg-white text-black hover:bg-neutral-200 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(255,255,255,0.05)] transition disabled:opacity-50 mt-6"
              >
                {loading ? "Verifying..." : isSignUp ? "Create Account" : "Access Workspace"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </motion.button>

              <div className="relative my-6 flex items-center">
                <div className="flex-1 border-t border-white/5"></div>
                <span className="px-3 text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Or login with</span>
                <div className="flex-1 border-t border-white/5"></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleOAuthLogin("google")}
                  className="flex items-center justify-center gap-2 py-2.5 bg-white/5 border border-white/5 rounded-xl text-xs font-semibold hover:bg-white/10 hover:border-white/10 transition"
                >
                  <Chrome className="w-4 h-4 text-white" />
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => handleOAuthLogin("github")}
                  className="flex items-center justify-center gap-2 py-2.5 bg-white/5 border border-white/5 rounded-xl text-xs font-semibold hover:bg-white/10 hover:border-white/10 transition"
                >
                  <Github className="w-4 h-4 text-white" />
                  GitHub
                </button>
              </div>

              <div className="text-center mt-6">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-xs text-zinc-400 hover:text-white transition"
                >
                  {isSignUp ? "Already have a workspace? Sign In" : "Need to set up a workspace? Sign Up"}
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.form 
              key="mfa"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleMfaSubmit} 
              className="space-y-5"
            >
              <div className="flex flex-col items-center text-center">
                <ShieldCheck className="w-10 h-10 text-emerald-400 mb-2" />
                <h3 className="text-sm font-semibold">MFA Verification Code</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Enter the 6-digit verification code from your authenticator app.
                </p>
              </div>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="w-full text-center tracking-[0.8em] font-mono text-xl py-3 bg-white/5 border border-white/5 rounded-xl text-white focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all"
                />
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-3 bg-white text-black hover:bg-neutral-200 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(255,255,255,0.05)] transition"
              >
                Verify & Log In
                <ArrowRight className="w-4 h-4" />
              </motion.button>

              <button
                type="button"
                onClick={() => setStep("credentials")}
                className="w-full text-xs text-zinc-400 hover:text-white transition text-center"
              >
                Go back to credentials
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </GlassCard>
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center p-6 relative font-sans">
      {/* Background glow flares */}
      <div className="absolute top-1/4 left-1/3 w-[450px] h-[450px] rounded-full radial-glow opacity-30 blur-[120px] -z-10" />
      <div className="absolute bottom-1/4 right-1/3 w-[450px] h-[450px] rounded-full cyan-glow opacity-20 blur-[120px] -z-10" />

      <Suspense fallback={
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin mb-4" />
          <p className="text-xs text-zinc-500">Initializing connection...</p>
        </div>
      }>
        <AuthForm />
      </Suspense>
    </div>
  );
}
