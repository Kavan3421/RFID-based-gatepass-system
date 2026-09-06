"use client";

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
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center py-6 sm:py-10 space-y-14 max-w-5xl mx-auto">
      <section className="glass-floating rounded-[30px] text-center space-y-5 pt-8 pb-7 px-5 sm:px-10 w-full border-[1.2px]">
        <p className="ui-kicker">For societies, offices & campuses</p>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.06]">
          Liquid intelligence
          <span className="block text-cyan-300">for every gate</span>
        </h1>
        <p className="text-[var(--text-secondary)] text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
          Create QR guest passes, log deliveries in two taps, and keep a live register of who is inside with an interface that feels fast, calm, and premium.
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-2">
          <Link href="/onboarding" className="btn-liquid-primary py-3.5 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
            Get started
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/login" className="btn-liquid-secondary py-3.5 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" />
            Sign in
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        <div className="glass-elevated rounded-2xl p-6 text-left space-y-3">
          <div className="w-11 h-11 rounded-xl bg-cyan-300/15 flex items-center justify-center text-cyan-300">
            <QrCode className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold">QR guest passes</h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Residents generate a time-limited pass. Security scans it and lets the guest in within seconds.
          </p>
        </div>
        <div className="glass-elevated rounded-2xl p-6 text-left space-y-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-300/15 flex items-center justify-center text-emerald-300">
            <Truck className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold">Fast delivery logging</h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Couriers do not need an app. Gatekeepers tag the company and flats, then record the visit.
          </p>
        </div>
        <div className="glass-elevated rounded-2xl p-6 text-left space-y-3">
          <div className="w-11 h-11 rounded-xl bg-blue-300/15 flex items-center justify-center text-blue-300">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold">Live register</h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            See who is inside, filter by date, and export reports for the committee or admin office.
          </p>
        </div>
      </section>

      <section className="w-full glass-sheet rounded-[28px] p-6 sm:p-8 border-[1.2px]">
        <h2 className="text-xl font-semibold text-center mb-6">Built for everyday gate operations</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Building2, label: "Societies" },
            { icon: Users, label: "Offices" },
            { icon: Layers, label: "Warehouses" },
            { icon: ShieldCheck, label: "Campuses" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="rounded-xl border border-[var(--border)] bg-white/5 p-4 text-center">
              <Icon className="w-6 h-6 text-cyan-300 mx-auto mb-2" />
              <span className="text-sm font-medium">{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="w-full space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl sm:text-3xl font-bold">Simple plans</h2>
          <p className="text-sm text-[var(--text-secondary)]">Pick a size that matches your community.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          <div className="glass-elevated rounded-2xl p-6 flex flex-col justify-between gap-6 border-[1.2px]">
            <div className="space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Starter</span>
              <h3 className="text-3xl font-bold">₹299 <span className="text-sm font-normal text-[var(--text-muted)]">/ month</span></h3>
              <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                <li className="flex gap-2"><Check className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" /> Up to 50 members</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" /> Unlimited guest QR passes</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" /> Delivery logging</li>
              </ul>
            </div>
            <Link href="/onboarding" className="btn-liquid-secondary w-full py-3 rounded-xl text-center text-sm font-semibold">Choose Starter</Link>
          </div>
          <div className="glass-elevated rounded-2xl p-6 flex flex-col justify-between gap-6 border-cyan-300/50 border-[1.2px]">
            <div className="space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-cyan-200">Growth</span>
              <h3 className="text-3xl font-bold">₹499 <span className="text-sm font-normal text-[var(--text-muted)]">/ month</span></h3>
              <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                <li className="flex gap-2"><Check className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" /> Up to 250 members</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" /> Multi-gate access</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" /> PDF & Excel export</li>
              </ul>
            </div>
            <Link href="/onboarding" className="btn-liquid-primary w-full py-3 rounded-xl text-center text-sm font-semibold">Choose Growth</Link>
          </div>
          <div className="glass-elevated rounded-2xl p-6 flex flex-col justify-between gap-6 border-[1.2px]">
            <div className="space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Enterprise</span>
              <h3 className="text-3xl font-bold">₹799 <span className="text-sm font-normal text-[var(--text-muted)]">/ month</span></h3>
              <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" /> Unlimited members & gates</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" /> Priority support</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" /> Audit logs</li>
              </ul>
            </div>
            <Link href="/onboarding" className="btn-liquid-secondary w-full py-3 rounded-xl text-center text-sm font-semibold">Contact sales</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
