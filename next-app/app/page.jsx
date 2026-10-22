"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  QrCode,
  Truck,
  Building2,
  ArrowRight,
  Lock,
  FileText,
  Users,
  Layers,
  Check,
  Radio,
  Sparkles,
  CheckCircle2,
  Clock,
  ChevronRight
} from "lucide-react";

export default function Home() {
  const [simGuest, setSimGuest] = useState("Alexander Vance");
  const [simUnit, setSimUnit] = useState("Tower B · Flat 402");
  const [simScanned, setSimScanned] = useState(false);

  return (
    <div className="flex flex-col items-center py-6 sm:py-10 space-y-14 max-w-5xl mx-auto">
      {/* Hero Section */}
      <section className="glass-floating liquid-glass-surface rounded-[30px] text-center space-y-5 pt-10 pb-9 px-5 sm:px-10 w-full border-[1.2px]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/25 text-cyan-300 text-xs font-semibold tracking-wide uppercase">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          Spatial Gate Pass & Intelligent Access OS
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08]">
          Liquid intelligence
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-indigo-300">
            for every gate
          </span>
        </h1>
        <p className="text-[var(--text-secondary)] text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
          Create cryptographic QR guest passes, log multi-unit deliveries in two taps, and monitor live headcounts with physical fluid refraction and specular optical glass.
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-2">
          <Link
            href="/onboarding"
            className="btn-liquid-primary liquid-touch-spring py-3.5 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
          >
            Get started with Gatify
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="btn-liquid-secondary liquid-touch-spring py-3.5 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            Sign in
          </Link>
        </div>

        {/* Live Interactive Pass Simulation Preview */}
        <div className="pt-6 max-w-md mx-auto">
          <div className="liquid-glass-surface rounded-2xl p-5 border border-white/20 bg-gradient-to-b from-white/10 to-white/5 shadow-2xl text-left space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-400/20 border border-teal-400/40 flex items-center justify-center">
                  <QrCode className="w-4 h-4 text-teal-300" />
                </div>
                <span className="text-xs font-bold tracking-wider uppercase text-white/90">
                  GATIFY SPATIAL GATE PASS
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                simScanned ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
              }`}>
                {simScanned ? "VERIFIED INSIDE" : "ACTIVE PASS"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-[11px] text-[var(--text-muted)] font-medium">Guest Name</div>
                <div className="text-base font-bold text-[var(--text-primary)]">{simGuest}</div>
                <div className="text-xs text-teal-300 font-semibold">{simUnit}</div>
                <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 pt-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  Valid Today · 12h Access
                </div>
              </div>

              <button
                onClick={() => setSimScanned(!simScanned)}
                className="group relative p-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 transition-all liquid-touch-spring text-center cursor-pointer"
                title="Click to simulate Gatekeeper Scan"
              >
                <div className="w-20 h-20 bg-white p-1.5 rounded-lg flex items-center justify-center shadow-inner">
                  {/* Stylized QR Matrix Pattern */}
                  <div className="w-full h-full bg-slate-900 rounded flex flex-col justify-between p-1">
                    <div className="flex justify-between">
                      <div className="w-4 h-4 bg-teal-400 rounded-sm" />
                      <div className="w-4 h-4 bg-teal-400 rounded-sm" />
                    </div>
                    <div className="text-[7px] text-cyan-200 font-mono text-center font-bold">
                      {simScanned ? "CHECKED" : "TAP SCAN"}
                    </div>
                    <div className="flex justify-between">
                      <div className="w-4 h-4 bg-teal-400 rounded-sm" />
                      <div className="w-2 h-2 bg-white rounded-full self-end" />
                    </div>
                  </div>
                </div>
                <span className="block text-[9px] text-cyan-300 mt-1 font-medium group-hover:underline">
                  {simScanned ? "✓ Scanned" : "Simulate Scan"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Core Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        <div className="glass-elevated liquid-glass-surface rounded-2xl p-6 text-left space-y-3">
          <div className="w-11 h-11 rounded-xl bg-cyan-300/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <QrCode className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold">QR Guest Passes</h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Residents generate cryptographic, time-bound passes. Gate security scans and logs entry or exit in under 2 seconds.
          </p>
        </div>
        <div className="glass-elevated liquid-glass-surface rounded-2xl p-6 text-left space-y-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-300/15 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.25)]">
            <Truck className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold">Fast Delivery Logging</h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Couriers need no app. Gatekeepers quickly select courier company tags and target flats, then instantly log arrival.
          </p>
        </div>
        <div className="glass-elevated liquid-glass-surface rounded-2xl p-6 text-left space-y-3">
          <div className="w-11 h-11 rounded-xl bg-blue-300/15 border border-blue-400/30 flex items-center justify-center text-blue-300 shadow-[0_0_15px_rgba(96,165,250,0.25)]">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold">Live Headcount Register</h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Track real-time campus occupancy with strict INSIDE vs EXITED segregation, automatic audit logs, and PDF/Excel reports.
          </p>
        </div>
      </section>

      {/* Facilities Grid */}
      <section className="w-full glass-sheet liquid-glass-surface rounded-[28px] p-6 sm:p-8 border-[1.2px]">
        <h2 className="text-xl font-semibold text-center mb-6">Engineered for everyday gate operations</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Building2, label: "Gated Societies" },
            { icon: Users, label: "Corporate Offices" },
            { icon: Layers, label: "Industrial Parks" },
            { icon: ShieldCheck, label: "University Campuses" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="rounded-xl border border-[var(--border)] bg-white/5 p-4 text-center liquid-touch-spring">
              <Icon className="w-6 h-6 text-cyan-300 mx-auto mb-2" />
              <span className="text-sm font-medium">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Transparent Pricing Cards */}
      <section className="w-full space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl sm:text-3xl font-bold">Simple, transparent plans</h2>
          <p className="text-sm text-[var(--text-secondary)]">Scale effortlessly as your community grows.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          <div className="glass-elevated liquid-glass-surface rounded-2xl p-6 flex flex-col justify-between gap-6 border-[1.2px]">
            <div className="space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Starter</span>
              <h3 className="text-3xl font-bold">₹299 <span className="text-sm font-normal text-[var(--text-muted)]">/ month</span></h3>
              <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                <li className="flex gap-2"><Check className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" /> Up to 50 members</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" /> Unlimited guest QR passes</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" /> Delivery logging & history</li>
              </ul>
            </div>
            <Link href="/onboarding" className="btn-liquid-secondary liquid-touch-spring w-full py-3 rounded-xl text-center text-sm font-semibold">
              Choose Starter
            </Link>
          </div>
          <div className="glass-elevated liquid-glass-surface rounded-2xl p-6 flex flex-col justify-between gap-6 border-cyan-300/50 border-[1.2px] relative shadow-[0_0_30px_rgba(6,182,212,0.15)]">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-cyan-200">Growth</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-400/20 text-cyan-200 border border-cyan-400/40">Popular</span>
              </div>
              <h3 className="text-3xl font-bold">₹499 <span className="text-sm font-normal text-[var(--text-muted)]">/ month</span></h3>
              <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                <li className="flex gap-2"><Check className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" /> Up to 250 members</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" /> Multi-gate entry & exit lanes</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" /> PDF & Excel audit exports</li>
              </ul>
            </div>
            <Link href="/onboarding" className="btn-liquid-primary liquid-touch-spring w-full py-3 rounded-xl text-center text-sm font-semibold">
              Choose Growth
            </Link>
          </div>
          <div className="glass-elevated liquid-glass-surface rounded-2xl p-6 flex flex-col justify-between gap-6 border-[1.2px]">
            <div className="space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Enterprise</span>
              <h3 className="text-3xl font-bold">₹799 <span className="text-sm font-normal text-[var(--text-muted)]">/ month</span></h3>
              <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" /> Unlimited members & gates</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" /> Priority SLA support</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" /> Comprehensive audit logs</li>
              </ul>
            </div>
            <Link href="/onboarding" className="btn-liquid-secondary liquid-touch-spring w-full py-3 rounded-xl text-center text-sm font-semibold">
              Contact sales
            </Link>
          </div>
        </div>
      </section>

      {/* RFID Automated Gate Access — Coming Soon Teaser */}
      <section className="w-full">
        <div className="liquid-glass-surface glass-elevated rounded-2xl p-6 border border-cyan-500/30 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <Radio className="w-6 h-6 text-cyan-500 dark:text-cyan-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h4 className="text-base font-bold text-white tracking-tight">RFID Automated Gate Access</h4>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-400/15 text-cyan-300 border border-cyan-400/30">
                  Coming Soon
                </span>
              </div>
              <p className="text-xs text-white/70 font-normal mt-0.5 leading-relaxed">
                Hands-free vehicular barrier integration with ultra-high frequency smart tags and automated boom barrier relays.
              </p>
            </div>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl border border-white/15 bg-white/5 text-xs text-white/90 font-mono font-medium whitespace-nowrap">
            Hardware Sensor Ready
          </div>
        </div>
      </section>
    </div>
  );
}
