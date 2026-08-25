import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { StoreProvider } from "@/lib/store";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RatingPulse.co | Get More 5-Star Google Reviews. Automatically.",
  description:
    "Automate 5-star Google review collection with instant SMS invites and 1-tap AI-drafted replies. Boost local Google Maps rankings for $25/mo.",
  keywords: [
    "Google reviews automation",
    "Google Maps SEO",
    "AI review replies",
    "SMS review invites",
    "local business reviews",
    "RatingPulse",
  ],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}
    >
      <head>
        <script
          src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDdAZozLUaoBAoemqT38_bdE3QBNoFuOpY&libraries=places"
          async
          defer
        ></script>
      </head>
      <body className="min-h-full flex flex-col bg-[#0B0F17] text-white font-sans">
        <AuthProvider>
          <StoreProvider>
            {children}
            <Toaster position="top-right" richColors />
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
