import type { Metadata } from "next";
import { Geist, Inter, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Monitra - Real-time Configuration Intelligence",
  description: "Monitor your SaaS configuration and webhooks for unexpected drift and changes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    var t = localStorage.getItem('theme');
                    if (t === 'light') { document.documentElement.classList.remove('dark'); }
                    else { document.documentElement.classList.add('dark'); }
                  } catch(e) { document.documentElement.classList.add('dark'); }
                })();
              `,
            }}
          />
        </head>
        <body
          className={`${geistSans.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}
          suppressHydrationWarning
        >
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
