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
  Layers 
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-6 lg:py-12 space-y-16 text-center max-w-6xl mx-auto px-4">
      {/* Hero Section */}
      <div className="max-w-4xl space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 text-xs font-semibold shadow-sm">
          <Zap className="w-3.5 h-3.5 text-cyan-500" />
          Multi-Tenant Visitor & Gate Security Platform
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
          Digital Gate Pass &{" "}
          <span className="bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 dark:from-cyan-400 dark:via-blue-400 dark:to-emerald-400 bg-clip-text text-transparent">
            Visitor & Delivery Management SaaS
          </span>
        </h1>

        <p className="text-slate-600 dark:text-slate-300 text-base sm:text-xl leading-relaxed max-w-3xl mx-auto">
          Fast, contactless gate entry logging for residential societies, commercial complexes, offices, and gated communities. Eliminate paper registers with instant QR guest passes and 2-tap delivery logging.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/onboarding"
            className="py-4 px-8 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-base flex items-center gap-2 shadow-xl shadow-cyan-600/30 transition-all transform hover:-translate-y-0.5"
          >
            Get Your System
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/login"
            className="py-4 px-8 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-base flex items-center gap-2 border border-slate-700 transition-all"
          >
            <Lock className="w-4 h-4 text-cyan-400" />
            Organization Sign In
          </Link>
        </div>
      </div>

      {/* Commercial Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {/* Feature 1: Digital QR Gate Pass */}
        <div className="glass-panel rounded-3xl p-8 text-left space-y-4 border border-slate-800/60 bg-slate-900/40 relative overflow-hidden group">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <QrCode className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Instant QR Guest Passes</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Members generate pre-approved guest passes with encrypted, short-lived QR tokens. Gatekeepers scan and verify entry in under 2 seconds.
          </p>
        </div>

        {/* Feature 2: Multi-Destination Delivery Entry */}
        <div className="glass-panel rounded-3xl p-8 text-left space-y-4 border border-slate-800/60 bg-slate-900/40 relative overflow-hidden group">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Rapid 2-Tap Delivery Logging</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Delivery boys need no app. Gatekeepers quickly tag delivery companies and select multiple flats/departments (e.g. A-203, B-104) in seconds.
          </p>
        </div>

        {/* Feature 3: Digital Register & Reports */}
        <div className="glass-panel rounded-3xl p-8 text-left space-y-4 border border-slate-800/60 bg-slate-900/40 relative overflow-hidden group">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Real-Time Register & Reports</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Live dashboard stream of active visitors and deliveries. Export custom date-range activity logs to PDF & Excel with full tenant isolation.
          </p>
        </div>
      </div>

      {/* Target Verticals Section */}
      <div className="w-full space-y-6 pt-4 text-left glass-panel rounded-3xl p-8 border border-slate-800 bg-slate-950/60">
        <h2 className="text-2xl font-bold text-white text-center">Built for Gated Communities & Commercial Workspaces</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-center">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <Building2 className="w-6 h-6 mx-auto text-cyan-400 mb-2" />
            <span className="text-sm font-medium text-slate-200">Residential Societies</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <Users className="w-6 h-6 mx-auto text-blue-400 mb-2" />
            <span className="text-sm font-medium text-slate-200">Corporate Offices</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <Layers className="w-6 h-6 mx-auto text-emerald-400 mb-2" />
            <span className="text-sm font-medium text-slate-200">Warehouses & Factories</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <ShieldCheck className="w-6 h-6 mx-auto text-indigo-400 mb-2" />
            <span className="text-sm font-medium text-slate-200">Schools & Colleges</span>
          </div>
        </div>
      </div>

      {/* Transparent SaaS Subscription Pricing */}
      <div className="w-full space-y-8 pt-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-white">Flexible Commercial Plans</h2>
          <p className="text-slate-400 text-sm">Choose the pricing plan tailored to your organization size.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {/* Starter Plan */}
          <div className="glass-panel rounded-3xl p-8 border border-slate-800 bg-slate-900/50 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">Starter</span>
              <h3 className="text-2xl font-extrabold text-white">₹299 <span className="text-xs font-normal text-slate-400">/ mo ($9)</span></h3>
              <p className="text-xs text-slate-400">Ideal for small societies, bungalow communities & small offices.</p>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Up to 50 Members / Units</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Unlimited Visitor QR Passes</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Multi-Destination Delivery Entry</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Live Register & Reports</li>
              </ul>
            </div>
            <Link href="/onboarding" className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-center font-bold text-sm border border-slate-700 transition-all">Get Started</Link>
          </div>

          {/* Growth Plan (Featured) */}
          <div className="glass-panel rounded-3xl p-8 border-2 border-cyan-500 bg-slate-900/80 flex flex-col justify-between space-y-6 relative shadow-xl shadow-cyan-500/10">
            <div className="absolute -top-3 right-6 bg-cyan-500 text-slate-950 font-bold text-[10px] uppercase tracking-wider px-3 py-0.5 rounded-full">Popular</div>
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 bg-cyan-500/20 px-3 py-1 rounded-full border border-cyan-500/30">Growth</span>
              <h3 className="text-3xl font-extrabold text-white">₹499 <span className="text-xs font-normal text-slate-400">/ mo ($15)</span></h3>
              <p className="text-xs text-slate-400">Designed for medium residential complexes & corporate offices.</p>
              <ul className="space-y-2 text-xs text-slate-200">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Up to 250 Members / Units</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Multi-Gate Gatekeeper Access</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Export PDF & Excel Reports</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Guided Setup Wizard</li>
              </ul>
            </div>
            <Link href="/onboarding" className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-center font-bold text-sm shadow-lg shadow-cyan-600/30 transition-all">Choose Plan</Link>
          </div>

          {/* Enterprise Plan */}
          <div className="glass-panel rounded-3xl p-8 border border-slate-800 bg-slate-900/50 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">Enterprise</span>
              <h3 className="text-2xl font-extrabold text-white">₹799 <span className="text-xs font-normal text-slate-400">/ mo ($25)</span></h3>
              <p className="text-xs text-slate-400">For large high-rise apartments, IT parks & industrial units.</p>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> Unlimited Members & Gates</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> Dedicated Account Manager</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> Priority API & Audit Logs</li>
              </ul>
            </div>
            <Link href="/onboarding" className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-center font-bold text-sm border border-slate-700 transition-all">Contact Sales</Link>
          </div>
        </div>
      </div>

      {/* Preserved RFID Section at the Bottom */}
      <div className="w-full border-t border-slate-800/80 pt-10 pb-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs font-medium">
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
