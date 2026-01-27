import type { Metadata } from "next";
import { Geist, Geist_Mono, Fredoka, Poppins } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "@/components/ui/Toast";
import { LocationPickerFab } from "@/components/location/LocationPickerFab";

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
        {children}
        <ToastContainer />
        <LocationPickerFab />
      </body>
    </html>
  );
}
