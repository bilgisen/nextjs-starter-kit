"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import type { TiptapEditorProps } from "./TiptapEditor";

const TiptapEditor = dynamic(() => import("./TiptapEditor"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[300px] border rounded-lg p-4 text-muted-foreground text-md">
      Loading editor...
    </div>
  ),
});

export interface SimpleEditorProps extends TiptapEditorProps {
  className?: string;
}

export function SimpleEditor({ className, ...props }: SimpleEditorProps) {
  return (
    <div className={cn("min-h-[300px] border rounded-md p-4 text-md", className)}>
      <TiptapEditor {...props} />
    </div>
  );
}

export default SimpleEditor