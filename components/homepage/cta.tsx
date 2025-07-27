"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Cta() {
  return (
    <section
      className="h-screen bg-cover bg-center flex items-center justify-center mt-18"
      style={{
        backgroundImage: "url('https://image.eventmice.com/upload-1752532627522.jpg')", // değiştirilebilir
        filter: 'grayscale(50%)',
        WebkitFilter: 'grayscale(50%)', // For Safari
      }}
    >
      <Card className="w-1/2 sm:w-full p-0 text-center bg-background/60 rounded-lg backdrop-blur-md">
        <CardContent className="p-10 flex flex-col items-center gap-6">
          <h2 className="text-4xl sm:text-2xl font-bold tracking-tight text-foreground">
          Think Global, Publish Smarter
          </h2>
          <p className="text-lg text-muted-foreground">
          Transform your books into high-quality digital editions with our intuitive, AI-driven tools, opening new avenues for your content.          </p>
          <Button asChild className="text-base px-6 py-2">
            <Link href="/sign-in">Publish a book for free!</Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}