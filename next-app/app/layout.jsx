import "./globals.css";
import Providers from "@/store/Providers";
import Navbar from "@/components/navigation/Navbar";

export const metadata = {
  title: "SurveilEye - RFID & QR Gate Pass Surveillance System",
  description: "Advanced vehicle access control, RFID surveillance logging, and automated visitor pass generation.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col selection:bg-blue-500 selection:text-white transition-colors duration-200" suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('surveileye_theme');
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
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
          <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg py-6 text-center text-xs text-slate-600 dark:text-slate-400 transition-colors">
            <p>Created by Team SurveilEye • Advanced RFID Vehicle Surveillance & Gate Pass Solution</p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
