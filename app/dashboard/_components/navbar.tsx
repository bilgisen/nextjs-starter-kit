"use client";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import UserProfile from "@/components/user-profile";
import Link from "next/link";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  locale: "en" | "tr";
  setLocale: (locale: "en" | "tr") => void;
};

export default function DashboardTopNav({ children, locale, setLocale }: Props) {


  return (
    <div className="flex flex-col min-h-screen">
      <header className="w-full border-b bg-background">
        <div className="container flex h-16 items-center px-8 justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <span className="font-bold text-lg">Booksleek</span>
            </Link>
          </div>

          {/* User Controls */}
          <div className="flex items-center space-x-4">
            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocale(locale === "en" ? "tr" : "en")}
              className="font-medium"
            >
              {locale === "en" ? "TR" : "EN"}
            </Button>
            
            <UserProfile mini={true} />

            <ModeToggle />
          </div>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
      
      <footer className="border-t py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © {new Date().getFullYear()} Pixpubli. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
