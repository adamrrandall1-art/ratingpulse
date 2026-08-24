import React from 'react';
import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import SocialProof from '@/components/landing/SocialProof';
import FeatureGrid from '@/components/landing/FeatureGrid';
import InteractiveDemo from '@/components/landing/InteractiveDemo';
import HowItWorks from '@/components/landing/HowItWorks';
import Pricing from '@/components/landing/Pricing';
import Testimonials from '@/components/landing/Testimonials';
import FAQ from '@/components/landing/FAQ';
import Footer from '@/components/landing/Footer';

export const metadata = {
  title: 'RatingPulse.co | Get More 5-Star Google Reviews. Automatically.',
  description:
    'Automate 5-star Google review collection with instant SMS invites and AI-drafted replies. Boost local Google Maps rankings for $25/mo. Start your 14-day free trial.',
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col selection:bg-emerald-500/40 selection:text-white">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <SocialProof />
        <FeatureGrid />
        <HowItWorks />
        <InteractiveDemo />
        <Testimonials />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
