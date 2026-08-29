import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { StoreProvider } from "@/lib/store";
import { Toaster } from "sonner";
import SupportChat from "@/components/chat/SupportChat";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://ratingpulse.co'),
  title: 'RatingPulse - Automated Review Management & Growth',
  description: 'Turn customer interactions into 5-star Google reviews automatically with AI.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'RatingPulse',
    description: 'Turn customer interactions into 5-star Google reviews automatically with AI.',
    url: 'https://ratingpulse.co',
    siteName: 'RatingPulse',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'RatingPulse Platform Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
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
      <body className="min-h-full flex flex-col bg-[#0d1317] text-slate-50 font-sans selection:bg-[#00d2c4]/30 selection:text-white">
        <AuthProvider>
          <StoreProvider>
            {children}
            <Toaster position="top-right" richColors />
            <SupportChat />
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
