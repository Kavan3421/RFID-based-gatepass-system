import "./globals.css";
import Providers from "@/store/Providers";
import Navbar from "@/components/navigation/Navbar";

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
                  var saved = localStorage.getItem('gatify_theme') || localStorage.getItem('surveileye_theme');
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
        <Providers>
          <Navbar />
          <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-8 relative z-10">
            {children}
          </main>
          <footer className="mt-auto border-t border-[var(--border)] py-6 text-sm text-[var(--text-muted)]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span className="font-semibold text-[var(--text-primary)]">Gatify</span>
              <p>© {new Date().getFullYear()} Visitor access for communities and campuses.</p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
