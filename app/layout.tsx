import "./globals.css";

import { Fredoka, Geist, Geist_Mono, Poppins } from "next/font/google";

import { LocationPickerFab } from "@/components/location/LocationPickerFab";
import type { Metadata } from "next";
import { MobileRouteGuard } from "@/components/ui/MobileRouteGuard";
import { ToastContainer } from "@/components/ui/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Game fonts for share card
const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Pepsodent Smile Game",
  description: "Show us your brightest smile and compete on the leaderboard!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fredoka.variable} ${poppins.variable} antialiased`}
      >
        <MobileRouteGuard>
          {children}
          <ToastContainer />
          <LocationPickerFab />
        </MobileRouteGuard>
      </body>
    </html>
  );
}
