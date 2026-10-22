import "./globals.css";
import Providers from "@/store/Providers";
import Navbar from "@/components/navigation/Navbar";
import LiquidCanvas from "@/components/ui/LiquidCanvas";

export const metadata = {
  title: "Gatify — Gate Pass & Visitor Access",
  description: "QR guest passes, delivery logging, and live gate registers for societies, offices, and campuses.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col ambient-canvas antialiased" suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('gatify_theme');
                  if (saved === 'light') {
                    document.documentElement.classList.add('light');
                    document.documentElement.classList.remove('dark');
                    document.documentElement.setAttribute('data-theme', 'light');
                  } else {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                    document.documentElement.setAttribute('data-theme', 'dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <LiquidCanvas />
        <Providers>
          <Navbar />
          <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-9 relative z-10">
            {children}
          </main>
          <footer className="mt-auto py-4 sm:py-6 text-sm text-[var(--text-muted)] px-2 sm:px-4">
            <div className="glass-panel liquid-glass-surface max-w-6xl mx-auto px-4 sm:px-6 py-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-2">
              <span className="font-semibold text-[var(--text-primary)]">Gatify</span>
              <p>© {new Date().getFullYear()} Visitor access for communities and campuses.</p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
