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
  description: "Course scheduling for Learn To Sail Cleveland",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={nunitoSans.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider>
          <NavProgress>{children}</NavProgress>
        </ThemeProvider>
      </body>
    </html>
  );
}
