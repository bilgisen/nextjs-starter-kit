"use client";

import { useState } from 'react';
import FooterSection from "@/components/homepage/footer";
import HeroSection from "@/components/homepage/hero-section";
import TopNav from "@/components/homepage/homehav";
import Integrations from "@/components/homepage/integrations";
import MyCarousel from "@/components/homepage/mycarousel";
import FAQ from "@/components/homepage/faq";
import Cta from "@/components/homepage/cta";
import Pricing from "@/components/homepage/pricing";
import Features2 from "@/components/homepage/feat2";

export default function Home() {
  const [locale, setLocale] = useState<'en' | 'tr'>('en');

  return (
    <>
      <TopNav locale={locale} setLocale={setLocale}>
        {/* Add any children if needed */}
      </TopNav>
      <HeroSection />
      <MyCarousel />
      <Features2/>
      <Integrations />
      <Pricing />
      <FAQ />
      <Cta />
      <FooterSection />
    </>
  );
}
