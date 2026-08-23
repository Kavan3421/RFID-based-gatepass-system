import "./globals.css";
import Providers from "@/store/Providers";
import Navbar from "@/components/navigation/Navbar";

export const metadata = {
  title: "Gatify — Spatial Access & Intelligent Visitor OS",
  description: "Next-generation spatial gate access, instant QR credentials, multi-destination delivery management, and real-time live registers.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col ambient-canvas selection:bg-cyan-500 selection:text-slate-950 transition-colors duration-300" suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('gatify_theme') || localStorage.getItem('surveileye_theme');
                  if (saved === 'light') {
                    document.documentElement.classList.add('light');
                    document.documentElement.classList.remove('dark');
                  } else {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <Providers>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 relative z-10">
            {children}
          </main>
          <footer className="border-t border-white/5 bg-slate-950/60 backdrop-blur-xl py-6 text-center text-xs text-slate-400">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-extrabold bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent tracking-tight">
                  Gatify
                </span>
                <span className="text-slate-600 dark:text-slate-500">•</span>
                <span className="text-[11px] text-slate-400">Spatial Access & Intelligent Visitor OS</span>
              </div>
              <p className="text-[11px] text-slate-500">
                © {new Date().getFullYear()} Gatify Technologies. Multi-Tenant Enterprise Gate Pass & Delivery Suite.
              </p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
