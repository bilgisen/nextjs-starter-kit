"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import type { TiptapEditorProps } from "./TiptapEditor";

const TiptapEditor = dynamic(() => import("./TiptapEditor"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[300px] border rounded-lg p-4 text-muted-foreground text-sm">
      Loading editor...
    </div>
  ),
});

export interface SimpleEditorProps extends TiptapEditorProps {
  className?: string;
}

export function SimpleEditor({ className, ...props }: SimpleEditorProps) {
  return (
    <div className={cn("w-full", className)}>
      <TiptapEditor {...props} />
    </div>
  );
}
