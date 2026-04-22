import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import { NavProgress } from "@/components/nav-progress";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const nunitoSans = Nunito_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: 'SailBook',
    template: '%s',
  },
  description: "Course scheduling for Simply Sailing",
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={nunitoSans.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed top-0 left-0 right-0 h-0.5 bg-red-500 z-[9999]" />
        )}
        {process.env.VERCEL_ENV === 'preview' && (
          <div className="fixed top-0 left-0 right-0 h-0.5 bg-yellow-400 z-[9999]" />
        )}
        <ThemeProvider>
          <NavProgress>{children}</NavProgress>
        </ThemeProvider>
      </body>
    </html>
  );
}
