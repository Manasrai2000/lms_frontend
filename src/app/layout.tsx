import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { cn } from "@/lib/utils";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Knoova - Physical Books Meet Limitless Digital Learning",
  description: "Scan your printed textbook QR code, flip through interactive 3D pages, stream HD educator video lectures, and master concepts at your own pace without pressure.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("h-full", "antialiased", "font-sans", "scroll-smooth", plusJakartaSans.variable)}>
      <body suppressHydrationWarning className="min-h-full flex flex-col font-sans bg-[#fafbfc] text-slate-800">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
