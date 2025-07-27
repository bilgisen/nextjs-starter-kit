"use client";

import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/app/dashboard/_components/mode-toggle";
import { ReactNode } from "react";

type Props = {
  children?: ReactNode;
  locale: "en" | "tr";
  setLocale: (locale: "en" | "tr") => void;
};

export default function TopNav({ children, locale, setLocale }: Props) {
  return (
    <div className="flex flex-col">
      <header className="flex h-14 items-center justify-between border-b px-2">
        {/* Sol: Site adı */}
        <div className="text-lg font-semibold tracking-tight">Booksleek</div>

        {/* Sağ: Dil ve tema switcher */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocale(locale === "en" ? "tr" : "en")}
            className="text-xs font-medium px-2"
          >
            {locale === "en" ? "TR" : "EN"}
          </Button>
          <ModeToggle />
        </div>
      </header>
      {children}
    </div>
  );
}
