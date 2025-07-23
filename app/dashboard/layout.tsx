'use client';

import { ReactNode, useEffect, useState } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { ThemeProvider } from 'next-themes';
import { TooltipProvider } from '@/components/ui/tooltip';
import enMessages from '@/messages/en.json';
import trMessages from '@/messages/tr.json';
import { Toaster } from '@/components/ui/sonner';
import DashboardTopNav from './_components/navbar';

const messagesMap = {
  en: enMessages,
  tr: trMessages
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<'en' | 'tr'>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('adminLocale');
    if (stored === 'tr' || stored === 'en') {
      setLocale(stored);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('adminLocale', locale);
    }
  }, [locale, mounted]);

  const messages = messagesMap[locale];

  if (!mounted) {
    return null;
  }

  return (
    <NextIntlClientProvider key={locale} locale={locale} messages={messages}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <div className="flex min-h-screen flex-col">
            <DashboardTopNav locale={locale} setLocale={setLocale}>
              {children}
            </DashboardTopNav>
            <Toaster position="top-right" />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
