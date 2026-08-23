"use client";

import Link from "next/link";
import { 
  ShieldCheck, 
  QrCode, 
  Truck, 
  Building2, 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  Lock, 
  FileText, 
  Clock, 
  Users, 
  Layers,
  Sparkles,
  Smartphone,
  Check
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-6 sm:py-12 space-y-20 text-center max-w-6xl mx-auto px-4">
      {/* Hero Section */}
      <div className="max-w-4xl space-y-6 pt-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-pill text-cyan-300 text-xs font-semibold shadow-lg shadow-cyan-500/10">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Spatial Access & Intelligent Visitor OS</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.1]">
          The Next-Gen{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Spatial Gate & Visitor OS
          </span>
        </h1>

        <p className="text-slate-300 text-base sm:text-xl leading-relaxed max-w-3xl mx-auto font-normal">
          Instant encrypted QR credentials, 2-tap delivery logging, and live streaming security registers for residential societies, commercial corporate campuses, and modern gated communities.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/onboarding"
            className="btn-liquid-primary py-4 px-8 rounded-2xl text-white font-extrabold text-sm sm:text-base flex items-center gap-2.5 shadow-xl shadow-cyan-600/30 spring-press"
          >
            <span>Deploy Your Organization</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/login"
            className="btn-liquid-secondary py-4 px-8 rounded-2xl text-slate-200 font-semibold text-sm sm:text-base flex items-center gap-2 spring-press"
          >
            <Lock className="w-4 h-4 text-cyan-400" />
            <span>Organization Sign In</span>
          </Link>
        </div>
      </div>

      {/* 3 Core Spatial Glass Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {/* Feature 1: Instant QR Guest Passes */}
        <div className="glass-elevated rounded-3xl p-8 text-left space-y-4 relative overflow-hidden group hover:border-cyan-500/40 transition-all duration-300">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <QrCode className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">Instant QR Guest Passes</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Members generate pre-approved visitor passes with time-bounded, encrypted QR tokens. Gatekeepers scan and grant verified entry in under 2 seconds.
          </p>
        </div>

        {/* Feature 2: Rapid 2-Tap Delivery Logging */}
        <div className="glass-elevated rounded-3xl p-8 text-left space-y-4 relative overflow-hidden group hover:border-blue-500/40 transition-all duration-300">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-400/30 flex items-center justify-center text-blue-300 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Truck className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">Rapid 2-Tap Delivery Entry</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Delivery agents need zero apps. Gatekeepers quickly tag delivery companies and select multiple flats/departments as interactive frosted pills in seconds.
          </p>
        </div>

        {/* Feature 3: Real-Time Spatial Register */}
        <div className="glass-elevated rounded-3xl p-8 text-left space-y-4 relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">Live Activity Register & Export</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Live stream of active visitors and delivery arrivals with spring entrance physics. Filter custom date ranges and export audit logs to PDF & Excel with full tenant isolation.
          </p>
        </div>
      </div>

      {/* Target Ecosystems Section */}
      <div className="w-full space-y-6 pt-4 text-left glass-sheet rounded-3xl p-8 border-t border-white/15">
        <h2 className="text-2xl font-extrabold text-white text-center tracking-tight">
          Engineered for Modern Residential & Commercial Ecosystems
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-center">
          <div className="p-5 rounded-2xl glass-pill flex flex-col items-center justify-center">
            <Building2 className="w-7 h-7 text-cyan-400 mb-2" />
            <span className="text-xs sm:text-sm font-bold text-slate-200">Residential Societies</span>
          </div>
          <div className="p-5 rounded-2xl glass-pill flex flex-col items-center justify-center">
            <Users className="w-7 h-7 text-blue-400 mb-2" />
            <span className="text-xs sm:text-sm font-bold text-slate-200">Corporate Offices</span>
          </div>
          <div className="p-5 rounded-2xl glass-pill flex flex-col items-center justify-center">
            <Layers className="w-7 h-7 text-emerald-400 mb-2" />
            <span className="text-xs sm:text-sm font-bold text-slate-200">Warehouses & Logistics</span>
          </div>
          <div className="p-5 rounded-2xl glass-pill flex flex-col items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-indigo-400 mb-2" />
            <span className="text-xs sm:text-sm font-bold text-slate-200">Campuses & Colleges</span>
          </div>
        </div>
      </div>

      {/* Transparent SaaS Subscription Pricing */}
      <div className="w-full space-y-8 pt-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Flexible Commercial Plans</h2>
          <p className="text-slate-400 text-sm">Select the plan tailored for your community scale.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {/* Starter Plan */}
          <div className="glass-elevated rounded-3xl p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/15 px-3 py-1 rounded-full border border-cyan-500/30">Starter</span>
              <h3 className="text-3xl font-black text-white font-mono">₹299 <span className="text-xs font-normal text-slate-400 font-sans">/ mo ($9)</span></h3>
              <p className="text-xs text-slate-400 leading-relaxed">Ideal for small societies, bungalow communities & boutique offices.</p>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-cyan-400 shrink-0" /> Up to 50 Members / Units</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-cyan-400 shrink-0" /> Unlimited Visitor QR Passes</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-cyan-400 shrink-0" /> Multi-Destination Delivery Entry</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-cyan-400 shrink-0" /> Live Register & Reports</li>
              </ul>
            </div>
            <Link href="/onboarding" className="btn-liquid-secondary w-full py-3.5 rounded-2xl text-white text-center font-bold text-xs spring-press">
              Deploy Starter
            </Link>
          </div>

          {/* Growth Plan (Featured) */}
          <div className="glass-floating rounded-3xl p-8 border-2 border-cyan-400/60 flex flex-col justify-between space-y-6 relative shadow-2xl shadow-cyan-500/20">
            <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">
              Most Popular
            </div>
            <div className="space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 bg-cyan-500/20 px-3 py-1 rounded-full border border-cyan-500/40">Growth</span>
              <h3 className="text-3xl font-black text-white font-mono">₹499 <span className="text-xs font-normal text-slate-400 font-sans">/ mo ($15)</span></h3>
              <p className="text-xs text-slate-300 leading-relaxed">Designed for medium residential complexes & corporate hubs.</p>
              <ul className="space-y-2.5 text-xs text-slate-200">
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-cyan-300 shrink-0" /> Up to 250 Members / Units</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-cyan-300 shrink-0" /> Multi-Gate Gatekeeper Access</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-cyan-300 shrink-0" /> Export PDF & Excel Reports</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-cyan-300 shrink-0" /> Guided Setup Wizard</li>
              </ul>
            </div>
            <Link href="/onboarding" className="btn-liquid-primary w-full py-3.5 rounded-2xl text-white text-center font-extrabold text-xs spring-press">
              Deploy Growth Plan
            </Link>
          </div>

          {/* Enterprise Plan */}
          <div className="glass-elevated rounded-3xl p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/15 px-3 py-1 rounded-full border border-indigo-500/30">Enterprise</span>
              <h3 className="text-3xl font-black text-white font-mono">₹799 <span className="text-xs font-normal text-slate-400 font-sans">/ mo ($25)</span></h3>
              <p className="text-xs text-slate-400 leading-relaxed">For large high-rise apartments, IT business parks & industrial gates.</p>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Unlimited Members & Gates</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Dedicated Account Manager</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Priority API & Audit Logs</li>
              </ul>
            </div>
            <Link href="/onboarding" className="btn-liquid-secondary w-full py-3.5 rounded-2xl text-white text-center font-bold text-xs spring-press">
              Contact Enterprise Sales
            </Link>
          </div>
        </div>
      </div>

      {/* Preserved RFID Section at the Bottom (Lowest Priority Tier Teaser) */}
      <div className="w-full border-t border-white/5 pt-10 pb-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-pill text-slate-400 text-xs font-medium">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>RFID Automated Gate Access — <strong className="text-cyan-400">Coming Soon</strong></span>
        </div>
        <p className="text-[11px] text-slate-500 mt-2 max-w-xl mx-auto">
          Hardware automation modules for long-range RFID vehicle barrier integration will be available as an add-on expansion package.
        </p>
      </div>
    </div>
  );
}
