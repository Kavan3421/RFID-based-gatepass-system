"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "@/store/userSlice";
import { adminLogout } from "@/store/adminSlice";
import { useTheme } from "@/components/theme/ThemeContext";
import {
  ShieldCheck,
  Car,
  Calendar,
  FileText,
  QrCode,
  Mail,
  User,
  Users,
  LogOut,
  Lock,
  Sun,
  Moon,
  Menu,
  X,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const { theme, toggleTheme } = useTheme();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { currentUser } = useSelector((state) => state.user);
  const { currentAdmin } = useSelector((state) => state.admin);

  const isAdminRoute = pathname.startsWith("/admin");

  // Handle user or admin logout action
  const handleLogout = () => {
    if (isAdminRoute) {
      dispatch(adminLogout());
      router.push("/admin/auth");
    } else {
      dispatch(logout());
      router.push("/auth");
    }
  };

  // User navigation links
  const userNavItems = [
    { label: "Dashboard", href: "/dashboard", icon: Car },
    { label: "Gate Pass & QR", href: "/gatepass", icon: QrCode },
    { label: "RFID History", href: "/databydate", icon: Calendar },
    { label: "Contact Us", href: "/contact", icon: Mail },
    { label: "Profile", href: "/profile", icon: User },
  ];

  // Admin navigation links
  const adminNavItems = [
    { label: "Command Center", href: "/admin/dashboard", icon: ShieldCheck },
    { label: "User Management", href: "/admin/users", icon: Users },
    { label: "RFID Logs", href: "/admin/databydate", icon: Calendar },
    { label: "Visitor Passes", href: "/admin/passbydate", icon: FileText },
    { label: "Admin Profile", href: "/admin/profile", icon: User },
  ];

  const navItems = isAdminRoute ? adminNavItems : userNavItems;
  const activeUser = isAdminRoute ? currentAdmin : currentUser;

  return (
    <header className="sticky top-0 z-50 glass-nav-bar px-4 lg:px-8 py-3 flex items-center justify-between">
      {/* Brand Logo & Title */}
      <Link
        href={isAdminRoute ? "/admin/dashboard" : "/dashboard"}
        className="flex items-center gap-3 group shrink-0"
      >
        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm group-hover:scale-105 transition-transform border border-slate-200 dark:border-slate-800 bg-white flex items-center justify-center shrink-0">
          <img
            src="/logo.png"
            alt="SurveilEye Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 dark:from-blue-400 dark:via-cyan-400 dark:to-emerald-400 tracking-tight whitespace-nowrap">
            SurveilEye
          </span>
          <span className="text-[11px] block font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
            {isAdminRoute ? "Admin Console" : "Vehicle Pass Portal"}
          </span>
        </div>
      </Link>

      {/* Desktop Navigation Links */}
      {activeUser && (
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/40"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}

      {/* Right Utility Buttons (Theme Switcher, Auth & User Info) */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-sm dark:shadow-none"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>

        {!activeUser ? (
          <div className="hidden sm:flex items-center gap-2">
            <Link
              href="/auth"
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                !isAdminRoute
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 hover:bg-blue-700"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              User Login
            </Link>
            <Link
              href="/admin/auth"
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                isAdminRoute
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30 hover:bg-cyan-700"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Admin Access
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="hidden xl:flex flex-col items-end text-right">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                {activeUser.name || "User"}
              </span>
              <span className="text-[10px] text-blue-600 dark:text-cyan-400 font-mono font-medium whitespace-nowrap">
                {isAdminRoute
                  ? "Master Admin"
                  : `RFID: ${activeUser.rfid_tag || "Assigned"}`}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Mobile Navigation Menu Button */}
        {activeUser && (
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            aria-label="Open Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && activeUser && (
        <div className="lg:hidden fixed top-16 left-0 w-full glass-panel border-b p-4 space-y-2 z-50">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
